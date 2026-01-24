'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'
import { Building2, Plus, CheckCircle2, XCircle, Search, RefreshCw, Wifi, WifiOff, Filter } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

export default function CompaniesPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [fetching, setFetching] = useState(true)
  const [companies, setCompanies] = useState<any[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all')
  const [userEmail, setUserEmail] = useState<string>('')
  const [isOnline, setIsOnline] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState({ total: 0, active: 0, suspended: 0 })

  const loadCompanies = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCompanies(data || [])
      setFilteredCompanies(data || [])
      
      // Calculate stats
      const total = data?.length || 0
      const active = data?.filter((c: any) => c.status === 'active').length || 0
      const suspended = data?.filter((c: any) => c.status === 'suspended').length || 0
      setStats({ total, active, suspended })
    } catch (err: any) {
      console.error('Error loading companies:', err)
    } finally {
      setFetching(false)
      setRefreshing(false)
    }
  }, [supabase])

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
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile?.role !== 'platform_admin') {
          router.push('/unauthorized')
          return
        }

        loadCompanies()
      } catch (err: any) {
        console.error('Error fetching data:', err)
      }
    }

    fetchData()
  }, [supabase, router, loadCompanies])

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

  // Filter companies based on search and status
  useEffect(() => {
    let filtered = companies

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(company =>
        company.name?.toLowerCase().includes(query) ||
        company.monime_account_id?.toLowerCase().includes(query)
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(company => company.status === statusFilter)
    }

    setFilteredCompanies(filtered)
  }, [companies, searchQuery, statusFilter])

  const handleRefresh = () => {
    setRefreshing(true)
    loadCompanies()
  }

  if (fetching) {
    return (
      <DashboardLayout
        role="platform_admin"
        userEmail={userEmail}
        userName="Platform Admin"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading companies...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      role="platform_admin"
      userEmail={userEmail}
      userName="Platform Admin"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
            <p className="text-gray-600 mt-2">Manage transport companies</p>
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
            <Link href="/platform/companies/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Company
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
                  <p className="text-sm text-gray-600 mb-1">Total Companies</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary-600" />
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
                  <CheckCircle2 className="w-6 h-6 text-success-600" />
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
                  <XCircle className="w-6 h-6 text-error-600" />
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
                    placeholder="Search companies by name or MoniMe account ID..."
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
                Showing {filteredCompanies.length} of {companies.length} companies
              </p>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => (
            <Card key={company.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary-600" />
                    </div>
                    <CardTitle>{company.name}</CardTitle>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${
                    company.status === 'active' 
                      ? 'bg-success-100 text-success-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {company.status === 'active' ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    {company.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-gray-600">Commission Rate: </span>
                    <span className="font-semibold text-gray-900">
                      {(company.commission_rate * 100).toFixed(2)}%
                    </span>
                  </div>
                  {company.monime_account_id && (
                    <div className="text-sm">
                      <span className="text-gray-600">MoniMe Account: </span>
                      <span className="font-mono text-xs text-gray-700">
                        {company.monime_account_id.slice(0, 8)}...
                      </span>
                    </div>
                  )}
                  <div className="pt-2">
                    <Link href={`/platform/companies/${company.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredCompanies.length === 0 && companies.length > 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600">No companies match your search criteria.</p>
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

          {companies.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No companies yet. Add your first company to get started.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
