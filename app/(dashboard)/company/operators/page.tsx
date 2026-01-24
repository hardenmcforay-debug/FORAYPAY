'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'
import { Users, Plus, Phone, Edit, Search, RefreshCw, Wifi, WifiOff, Filter, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import SuspendOperatorButton from '@/components/operators/suspend-operator-button'
import DeleteOperatorButton from '@/components/operators/delete-operator-button'

export default function OperatorsPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [fetching, setFetching] = useState(true)
  const [operators, setOperators] = useState<any[]>([])
  const [filteredOperators, setFilteredOperators] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all')
  const [userEmail, setUserEmail] = useState<string>('')
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState({ total: 0, active: 0, suspended: 0 })

  const loadOperators = useCallback(async () => {
    if (!companyId) return

    try {
      const { data, error } = await supabase
        .from('park_operators')
        .select(`
          *,
          users(email)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOperators(data || [])
      setFilteredOperators(data || [])
      
      // Calculate stats
      const total = data?.length || 0
      const active = data?.filter((op: any) => op.status === 'active').length || 0
      const suspended = data?.filter((op: any) => op.status === 'suspended').length || 0
      setStats({ total, active, suspended })
    } catch (err: any) {
      console.error('Error loading operators:', err)
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
      loadOperators()
    }
  }, [companyId, loadOperators])

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

  // Filter operators based on search and status
  useEffect(() => {
    let filtered = operators

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(operator =>
        operator.name?.toLowerCase().includes(query) ||
        operator.phone?.toLowerCase().includes(query) ||
        operator.users?.email?.toLowerCase().includes(query)
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(operator => operator.status === statusFilter)
    }

    setFilteredOperators(filtered)
  }, [operators, searchQuery, statusFilter])

  const handleRefresh = () => {
    setRefreshing(true)
    loadOperators()
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
            <p className="text-gray-600">Loading operators...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Park Operators</h1>
            <p className="text-gray-600 mt-2">Manage park operators for ticket validation</p>
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
            <Link href="/company/operators/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Operator
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Operators</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active</p>
                  <p className="text-3xl font-bold text-success-600">{stats.active}</p>
                </div>
                <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-success-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Suspended</p>
                  <p className="text-3xl font-bold text-error-600">{stats.suspended}</p>
                </div>
                <div className="w-12 h-12 bg-error-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-error-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Search operators by name, phone, or email..."
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
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'suspended')}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
            {searchQuery || statusFilter !== 'all' ? (
              <p className="text-sm text-gray-600 mt-2">
                Showing {filteredOperators.length} of {operators.length} operators
              </p>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOperators.map((operator: any) => (
            <Card key={operator.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{operator.name}</CardTitle>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    operator.status === 'active' 
                      ? 'bg-success-100 text-success-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {operator.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{operator.phone}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {operator.users?.email}
                    </div>
                    <div className="text-sm text-gray-600">
                      Assigned Routes: {operator.assigned_routes?.length || 0}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-200 space-y-2">
                    <Link href={`/company/operators/${operator.id}/edit`}>
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Operator
                      </Button>
                    </Link>
                    <SuspendOperatorButton
                      operatorId={operator.id}
                      operatorName={operator.name}
                      currentStatus={operator.status}
                    />
                    <DeleteOperatorButton
                      operatorId={operator.id}
                      operatorName={operator.name}
                      operatorEmail={operator.users?.email || ''}
                      operatorPhone={operator.phone}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredOperators.length === 0 && operators.length > 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600">No operators match your search criteria.</p>
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

          {operators.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600">No operators yet. Add your first park operator.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
