'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'
import { Route as RouteIcon, Plus, Edit, Search, RefreshCw, Wifi, WifiOff, Filter } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import DeleteRouteButton from '@/components/routes/delete-route-button'

export default function RoutesPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [fetching, setFetching] = useState(true)
  const [routes, setRoutes] = useState<any[]>([])
  const [filteredRoutes, setFilteredRoutes] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [userEmail, setUserEmail] = useState<string>('')
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadRoutes = useCallback(async () => {
    if (!companyId) return

    try {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRoutes(data || [])
      setFilteredRoutes(data || [])
    } catch (err: any) {
      console.error('Error loading routes:', err)
    } finally {
      setFetching(false)
      setRefreshing(false)
    }
  }, [supabase, companyId])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        setUserEmail(user.email || '')

        const { data: profile } = await supabase
          .from('users')
          .select('role, company_id')
          .eq('id', user.id)
          .single()

        if (profile?.role !== 'company_admin') {
          router.push('/unauthorized')
          return
        }

        if (!profile.company_id) {
          setFetching(false)
          return
        }

        setCompanyId(profile.company_id)
      } catch (err: any) {
        console.error('Error fetching data:', err)
      }
    }

    fetchData()
  }, [supabase, router])

  useEffect(() => {
    if (companyId) {
      loadRoutes()
    }
  }, [companyId, loadRoutes])

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    setIsOnline(navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Filter routes based on search and status
  useEffect(() => {
    let filtered = routes

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(route =>
        route.name?.toLowerCase().includes(query) ||
        route.origin?.toLowerCase().includes(query) ||
        route.destination?.toLowerCase().includes(query)
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(route => route.status === statusFilter)
    }

    setFilteredRoutes(filtered)
  }, [routes, searchQuery, statusFilter])

  const handleRefresh = () => {
    setRefreshing(true)
    loadRoutes()
  }

  if (fetching) {
    return (
      <DashboardLayout
        role="company_admin"
        companyId={companyId || undefined}
        userEmail={userEmail}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading routes...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      role="company_admin"
      companyId={companyId || undefined}
      userEmail={userEmail}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Routes</h1>
            <p className="text-gray-600 mt-2">Manage your transport routes</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100">
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4 text-success-600" />
                  <span className="text-sm text-gray-700">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-error-600" />
                  <span className="text-sm text-error-700">Offline</span>
                </>
              )}
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing || !isOnline}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link href="/company/routes/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Route
              </Button>
            </Link>
          </div>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Search routes by name, origin, or destination..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            {searchQuery || statusFilter !== 'all' ? (
              <p className="text-sm text-gray-600 mt-2">
                Showing {filteredRoutes.length} of {routes.length} routes
              </p>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoutes.map((route) => (
            <Card key={route.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{route.name}</CardTitle>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    route.status === 'active' 
                      ? 'bg-success-100 text-success-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {route.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <RouteIcon className="w-4 h-4" />
                      <span>{route.origin} → {route.destination}</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(route.fare)}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-200 space-y-2">
                    <Link href={`/company/routes/${route.id}/edit`}>
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Route
                      </Button>
                    </Link>
                    <DeleteRouteButton
                      routeId={route.id}
                      routeName={route.name}
                      origin={route.origin}
                      destination={route.destination}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredRoutes.length === 0 && routes.length > 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600">No routes match your search criteria.</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            </div>
          )}

          {routes.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600">No routes yet. Create your first route to get started.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
