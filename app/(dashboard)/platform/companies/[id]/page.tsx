'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Button from '@/components/ui/button'
import {
  Building2,
  ArrowLeft,
  TrendingUp,
  Ticket,
  Users,
  Route,
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
  Edit,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import DeleteCompanyButton from '@/components/companies/delete-company-button'
import SuspendCompanyButton from '@/components/companies/suspend-company-button'
import RefreshCompanyButton from '@/components/companies/refresh-company-button'

export default function CompanyDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClientComponentClient()
  const companyId = params.id as string

  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [company, setCompany] = useState<any>(null)
  const [routes, setRoutes] = useState<any[]>([])
  const [operators, setOperators] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalTickets: 0,
    totalRoutes: 0,
    activeRoutes: 0,
    totalOperators: 0,
    activeOperators: 0,
    usedTickets: 0,
    pendingTickets: 0,
    platformRevenue30d: 0,
    totalPlatformRevenue: 0,
    companyRevenue30d: 0,
  })
  const [admins, setAdmins] = useState<any[]>([])
  const [recentTickets, setRecentTickets] = useState<any[]>([])

  const loadData = useCallback(async () => {
    if (!companyId) {
      setError('Company ID is missing')
      setFetching(false)
      return
    }

    try {
      setFetching(true)
      setError(null)
      const res = await fetch(`/api/platform/companies/${companyId}/details`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login')
          return
        }
        if (res.status === 403) {
          router.push('/unauthorized')
          return
        }
        if (res.status === 404) {
          router.push('/platform/companies')
          return
        }
        const payload = await res.json().catch(() => null)
        const errorMessage = payload?.error || 'Failed to load company details'
        setError(errorMessage)
        throw new Error(errorMessage)
      }

      const payload = await res.json()
      if (!payload.company) {
        setError('Company data not found in response')
        return
      }
      setCompany(payload.company)
      setRoutes(payload.routes || [])
      setOperators(payload.operators || [])
      setAdmins(payload.admins || [])
      setRecentTickets(payload.recentTickets || [])
      setStats(payload.stats || {
        totalTickets: 0,
        totalRoutes: 0,
        activeRoutes: 0,
        totalOperators: 0,
        activeOperators: 0,
        usedTickets: 0,
        pendingTickets: 0,
        platformRevenue30d: 0,
        totalPlatformRevenue: 0,
        companyRevenue30d: 0,
      })
    } catch (err: any) {
      console.error('Error loading company data:', err)
      setError(err.message || 'Failed to load company details')
    } finally {
      setFetching(false)
    }
  }, [companyId, router])

  useEffect(() => {
    const fetchUser = async () => {
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

        loadData()
      } catch (err: any) {
        console.error('Error fetching user:', err)
        setError(err.message || 'Failed to authenticate user')
        setFetching(false)
      }
    }

    fetchUser()
  }, [supabase, router, loadData])

  if (fetching) {
    return (
      <DashboardLayout
        role="platform_admin"
        userEmail={userEmail}
        userName="Platform Admin"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading company details...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !company) {
    return (
      <DashboardLayout
        role="platform_admin"
        userEmail={userEmail}
        userName="Platform Admin"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Company Details</h2>
            <p className="text-gray-600 mb-4">{error || 'Company not found'}</p>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => router.push('/platform/companies')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Companies
              </Button>
              <Button
                onClick={() => {
                  setFetching(true)
                  setError(null)
                  loadData()
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
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
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/platform/companies">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
                <div className="flex items-center gap-2 mt-1">
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
                  <span className="text-sm text-gray-500">
                    Created {formatDate(company.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <RefreshCompanyButton companyId={companyId} />
            <Link href={`/platform/companies/${companyId}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </Link>
            <SuspendCompanyButton
              companyId={companyId}
              companyName={company.name}
              currentStatus={company.status as 'active' | 'suspended'}
            />
            <DeleteCompanyButton companyId={companyId} companyName={company.name} />
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Platform Revenue (30d)</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.platformRevenue30d)}</p>
                  <p className="text-xs text-gray-500 mt-1">Total: {formatCurrency(stats.totalPlatformRevenue)}</p>
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
                  <p className="text-sm text-gray-600 mb-1">Company Revenue (30d)</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.companyRevenue30d)}</p>
                  <p className="text-xs text-gray-500 mt-1">{(company.commission_rate * 100).toFixed(2)}% commission rate</p>
                </div>
                <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-warning-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Tickets</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTickets}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.usedTickets} used • {stats.pendingTickets} pending
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Routes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalRoutes}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.activeRoutes} active
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Route className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Park Operators</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOperators}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.activeOperators} active
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Company Name</label>
                  <p className="text-gray-900 mt-1">{company.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Company admins can edit this from their settings page
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Commission Rate</label>
                  <p className="text-gray-900 mt-1">
                    {(company.commission_rate * 100).toFixed(2)}%
                  </p>
                </div>
                {company.monime_account_id && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">MoniMe Account ID</label>
                    <p className="text-gray-900 mt-1 font-mono text-sm">
                      {company.monime_account_id}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <p className="mt-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      company.status === 'active'
                        ? 'bg-success-100 text-success-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {company.status}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Created At</label>
                  <p className="text-gray-900 mt-1">{formatDate(company.created_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Admins */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-600" />
                Company Admins ({admins.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {admins.length > 0 ? (
                <div className="space-y-3">
                  {admins.map((admin) => (
                    <div
                      key={admin.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{admin.email}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Joined {formatDate(admin.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-4">No company admins found</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Company Routes and Park Operators */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Routes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="w-5 h-5 text-primary-600" />
                Company Routes ({stats.totalRoutes})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {routes.length > 0 ? (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {routes.map((route) => (
                    <div
                      key={route.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{route.name}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {route.origin} → {route.destination}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm text-gray-600">
                            Fare: {formatCurrency(route.fare)}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            route.status === 'active'
                              ? 'bg-success-100 text-success-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {route.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Created {formatDate(route.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">No routes found</p>
              )}
            </CardContent>
          </Card>

          {/* Park Operators */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-600" />
                Park Operators ({stats.totalOperators})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {operators.length > 0 ? (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {operators.map((operator: any) => (
                    <div
                      key={operator.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{operator.name || 'N/A'}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {operator.users?.email || 'No email'}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm text-gray-600">
                            Phone: {operator.phone || 'N/A'}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            operator.status === 'active'
                              ? 'bg-success-100 text-success-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {operator.status || 'unknown'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Routes: {Array.isArray(operator.assigned_routes) ? operator.assigned_routes.length : 0} assigned
                        </p>
                        <p className="text-xs text-gray-500">
                          Created {operator.created_at ? formatDate(operator.created_at) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">No park operators found</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Tickets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-primary-600" />
              Recent Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTickets.length > 0 ? (
              <div className="table-wrapper overflow-x-auto">
                <table className="w-full min-w-full">
                    <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Phone</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTickets.map((ticket) => (
                      <tr key={ticket.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900">{ticket.passenger_phone}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            ticket.status === 'used'
                              ? 'bg-success-100 text-success-700'
                              : ticket.status === 'pending'
                              ? 'bg-warning-100 text-warning-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {ticket.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(ticket.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">No tickets found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
