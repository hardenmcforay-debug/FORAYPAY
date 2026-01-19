'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { Edit2, Trash2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface Route {
  id: string
  name: string
  origin: string
  destination: string
  fare_amount: number
  is_active: boolean
  monime_route_id: string | null
  created_at: string
}

interface RoutesTableProps {
  routes: Route[]
}

export default function RoutesTable({ routes: initialRoutes }: RoutesTableProps) {
  const router = useRouter()
  const [routes, setRoutes] = useState(initialRoutes)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState<string | null>(null)
  const supabase = createClient()

  // Get company_id for filtering
  const getCompanyId = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const response = await fetch('/api/company/info', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        return data.company_id
      }
    } catch (err) {
      console.error('Error fetching company ID:', err)
    }
    return null
  }, [supabase])

  // Fetch routes
  const fetchRoutes = useCallback(async () => {
    try {
      const companyId = await getCompanyId()
      if (!companyId) return

      const response = await fetch('/api/routes/list', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setRoutes(data.routes || [])
      }
    } catch (err) {
      console.error('Error fetching routes:', err)
    }
  }, [getCompanyId])

  // Set up real-time subscription
  useEffect(() => {
    let routesChannel: any = null

    const setupSubscription = async () => {
      const companyId = await getCompanyId()
      if (!companyId) return

      routesChannel = supabase
        .channel('routes-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'routes',
            filter: `company_id=eq.${companyId}`,
          },
          () => {
            fetchRoutes()
          }
        )
        .subscribe()
    }

    setupSubscription()

    return () => {
      if (routesChannel) {
        supabase.removeChannel(routesChannel)
      }
    }
  }, [supabase, getCompanyId, fetchRoutes])

  const handleDelete = async (routeId: string, routeName: string) => {
    if (showConfirm !== routeId) {
      setShowConfirm(routeId)
      return
    }

    setDeletingId(routeId)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/routes/delete?id=${routeId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete route')
      }

      // Remove route from list
      setRoutes(routes.filter((route) => route.id !== routeId))
      setShowConfirm(null)
      
      // Refresh the page to ensure data is in sync
      router.refresh()
    } catch (err: any) {
      console.error('Error deleting route:', err)
      setError(err.message || 'Failed to delete route. Please try again.')
      setShowConfirm(null)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-lg">
          <p className="text-error-700 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-success-50 border border-success-200 rounded-lg">
          <p className="text-success-700 text-sm">{success}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Route
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Origin
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Destination
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fare
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {routes.map((route) => (
              <tr key={route.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{route.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{route.origin}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{route.destination}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{formatCurrency(route.fare_amount)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={route.is_active ? 'success' : 'error'}>
                    {route.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(route.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <Link href={`/company/routes/${route.id}`}>
                      <Button variant="ghost" size="sm">
                        <Edit2 className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    {showConfirm === route.id ? (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="error"
                          size="sm"
                          onClick={() => handleDelete(route.id, route.name)}
                          isLoading={deletingId === route.id}
                        >
                          <AlertCircle className="h-4 w-4 mr-1" />
                          Confirm
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowConfirm(null)}
                          disabled={deletingId === route.id}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(route.id, route.name)}
                        disabled={deletingId === route.id}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
