'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { Edit2, Trash2, AlertCircle, Ban, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface Operator {
  id: string
  user_id: string
  location: string | null
  is_active: boolean
  created_at: string
  users?: {
    full_name: string
    email: string
  }
  routes?: {
    name: string
    origin: string
    destination: string
  }
}

interface OperatorsTableProps {
  operators: Operator[]
}

export default function OperatorsTable({ operators: initialOperators }: OperatorsTableProps) {
  const router = useRouter()
  const [operators, setOperators] = useState(initialOperators)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [suspendingId, setSuspendingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
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

  // Fetch operators
  const fetchOperators = useCallback(async () => {
    try {
      const companyId = await getCompanyId()
      if (!companyId) return

      const response = await fetch('/api/operators/list-company', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setOperators(data.operators || [])
      }
    } catch (err) {
      console.error('Error fetching operators:', err)
    }
  }, [getCompanyId])

  // Set up real-time subscription
  useEffect(() => {
    let operatorsChannel: any = null

    const setupSubscription = async () => {
      const companyId = await getCompanyId()
      if (!companyId) return

      operatorsChannel = supabase
        .channel('operators-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'park_operators',
            filter: `company_id=eq.${companyId}`,
          },
          () => {
            fetchOperators()
          }
        )
        .subscribe()
    }

    setupSubscription()

    return () => {
      if (operatorsChannel) {
        supabase.removeChannel(operatorsChannel)
      }
    }
  }, [supabase, getCompanyId, fetchOperators])

  const handleDelete = async (operatorId: string, operatorName: string) => {
    if (showConfirm !== operatorId) {
      setShowConfirm(operatorId)
      return
    }

    setDeletingId(operatorId)
    setError(null)

    try {
      const response = await fetch(`/api/operators/delete?id=${operatorId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete operator')
      }

      // Remove operator from list
      setOperators(operators.filter((op) => op.id !== operatorId))
      setShowConfirm(null)
      
      // Refresh the page to ensure data is in sync
      router.refresh()
    } catch (err: any) {
      console.error('Error deleting operator:', err)
      setError(err.message || 'Failed to delete operator. Please try again.')
      setShowConfirm(null)
    } finally {
      setDeletingId(null)
    }
  }

  const handleSuspend = async (operatorId: string, currentStatus: boolean) => {
    setSuspendingId(operatorId)
    setError(null)

    try {
      const response = await fetch('/api/operators/suspend-company', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operatorId,
          isActive: !currentStatus,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update operator status')
      }

      // Update operator status in local state
      setOperators(operators.map((op) => 
        op.id === operatorId 
          ? { ...op, is_active: !currentStatus }
          : op
      ))
      
      // Refresh the page to ensure data is in sync
      router.refresh()
    } catch (err: any) {
      console.error('Error suspending operator:', err)
      setError(err.message || 'Failed to update operator status. Please try again.')
    } finally {
      setSuspendingId(null)
    }
  }

  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-lg">
          <p className="text-error-700 text-sm">{error}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Operator
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Route
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
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
            {operators.map((operator) => (
              <tr key={operator.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{operator.users?.full_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{operator.users?.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {operator.routes 
                      ? `${operator.routes.origin} - ${operator.routes.destination}`
                      : 'Not assigned'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{operator.location || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={operator.is_active ? 'success' : 'error'}>
                    {operator.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(operator.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <Link href={`/company/operators/${operator.id}`}>
                      <Button variant="ghost" size="sm">
                        <Edit2 className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant={operator.is_active ? "ghost" : "success"}
                      size="sm"
                      onClick={() => handleSuspend(operator.id, operator.is_active)}
                      isLoading={suspendingId === operator.id}
                      disabled={suspendingId === operator.id || deletingId === operator.id}
                    >
                      {operator.is_active ? (
                        <>
                          <Ban className="h-4 w-4 mr-1" />
                          Suspend
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                    {showConfirm === operator.id ? (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="error"
                          size="sm"
                          onClick={() => handleDelete(operator.id, operator.users?.full_name || 'operator')}
                          isLoading={deletingId === operator.id}
                        >
                          <AlertCircle className="h-4 w-4 mr-1" />
                          Confirm
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowConfirm(null)}
                          disabled={deletingId === operator.id}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(operator.id, operator.users?.full_name || 'operator')}
                        disabled={deletingId === operator.id || suspendingId === operator.id}
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

