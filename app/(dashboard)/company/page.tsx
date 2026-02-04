'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Route, Users, DollarSign, BarChart3, Ticket } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import Button from '@/components/ui/button'
import RevenueChart from '@/components/analytics/revenue-chart'

export default function CompanyDashboard() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [fetching, setFetching] = useState(true)
  const [userEmail, setUserEmail] = useState<string>('')
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [company, setCompany] = useState<any>(null)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalCommission, setTotalCommission] = useState(0)
  const [netRevenue, setNetRevenue] = useState(0)
  const [routesCount, setRoutesCount] = useState(0)
  const [operatorsCount, setOperatorsCount] = useState(0)
  const [totalTickets, setTotalTickets] = useState(0)
  const [routeRevenueMap1d, setRouteRevenueMap1d] = useState(new Map())
  const [routeRevenueMap7d, setRouteRevenueMap7d] = useState(new Map())
  const [routeRevenueMap30d, setRouteRevenueMap30d] = useState(new Map())
  const [routeTicketsMap1d, setRouteTicketsMap1d] = useState(new Map())
  const [routeTicketsMap7d, setRouteTicketsMap7d] = useState(new Map())
  const [routeTicketsMap30d, setRouteTicketsMap30d] = useState(new Map())
  const [transactions, setTransactions] = useState<any[]>([])

  const loadDashboardData = useCallback(async () => {
    if (!companyId) return

    try {
      // Get company data
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single()
      setCompany(companyData)

      // Get revenue data (last 12 months for analytics)
      const twelveMonthsAgo = new Date()
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
      
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('amount, commission, net_amount, created_at, ticket_id')
        .eq('company_id', companyId)
        .eq('status', 'completed')
        .gte('created_at', twelveMonthsAgo.toISOString())
        .order('created_at', { ascending: false })

      setTransactions(transactionsData || [])
      const revenue = transactionsData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
      const commission = transactionsData?.reduce((sum, t) => sum + (t.commission || 0), 0) || 0
      const net = transactionsData?.reduce((sum, t) => sum + (t.net_amount || 0), 0) || 0
      setTotalRevenue(revenue)
      setTotalCommission(commission)
      setNetRevenue(net)

      // Get routes count
      const { data: routes } = await supabase
        .from('routes')
        .select('id')
        .eq('company_id', companyId)
        .eq('status', 'active')
      setRoutesCount(routes?.length || 0)

      // Get operators count
      const { data: operators } = await supabase
        .from('park_operators')
        .select('id')
        .eq('company_id', companyId)
        .eq('status', 'active')
      setOperatorsCount(operators?.length || 0)

      // Get total tickets issued
      const { count: ticketsCount } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
      setTotalTickets(ticketsCount || 0)

      // Get revenue by route (last 1 day)
      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)
      
      const { data: transactions1d } = await supabase
        .from('transactions')
        .select(`
          amount,
          ticket_id,
          tickets!inner(
            route_id,
            routes!inner(
              id,
              name,
              origin,
              destination
            )
          )
        `)
        .eq('company_id', companyId)
        .eq('status', 'completed')
        .gte('created_at', oneDayAgo.toISOString())

      const map1d = new Map()
      transactions1d?.forEach((transaction: any) => {
        const route = transaction.tickets?.routes
        if (route && transaction.amount) {
          const routeId = route.id
          const current = map1d.get(routeId) || { revenue: 0, name: route.name || 'Unknown Route', origin: route.origin || '', destination: route.destination || '' }
          map1d.set(routeId, {
            ...current,
            revenue: current.revenue + (Number(transaction.amount) || 0)
          })
        }
      })
      setRouteRevenueMap1d(map1d)

      // Get revenue by route (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const { data: transactions7d } = await supabase
        .from('transactions')
        .select(`
          amount,
          ticket_id,
          tickets!inner(
            route_id,
            routes!inner(
              id,
              name,
              origin,
              destination
            )
          )
        `)
        .eq('company_id', companyId)
        .eq('status', 'completed')
        .gte('created_at', sevenDaysAgo.toISOString())

      const map7d = new Map()
      transactions7d?.forEach((transaction: any) => {
        const route = transaction.tickets?.routes
        if (route && transaction.amount) {
          const routeId = route.id
          const current = map7d.get(routeId) || { revenue: 0, name: route.name || 'Unknown Route', origin: route.origin || '', destination: route.destination || '' }
          map7d.set(routeId, {
            ...current,
            revenue: current.revenue + (Number(transaction.amount) || 0)
          })
        }
      })
      setRouteRevenueMap7d(map7d)

      // Get revenue by route (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { data: transactions30d } = await supabase
        .from('transactions')
        .select(`
          amount,
          ticket_id,
          tickets!inner(
            route_id,
            routes!inner(
              id,
              name,
              origin,
              destination
            )
          )
        `)
        .eq('company_id', companyId)
        .eq('status', 'completed')
        .gte('created_at', thirtyDaysAgo.toISOString())

      const map30d = new Map()
      transactions30d?.forEach((transaction: any) => {
        const route = transaction.tickets?.routes
        if (route && transaction.amount) {
          const routeId = route.id
          const current = map30d.get(routeId) || { revenue: 0, name: route.name || 'Unknown Route', origin: route.origin || '', destination: route.destination || '' }
          map30d.set(routeId, {
            ...current,
            revenue: current.revenue + (Number(transaction.amount) || 0)
          })
        }
      })
      setRouteRevenueMap30d(map30d)

      // Get tickets issued by route (last 1 day)
      const { data: tickets1d } = await supabase
        .from('tickets')
        .select(`
          route_id,
          routes!inner(
            id,
            name,
            origin,
            destination
          )
        `)
        .eq('company_id', companyId)
        .gte('created_at', oneDayAgo.toISOString())

      const ticketsMap1d = new Map()
      tickets1d?.forEach((ticket: any) => {
        const route = ticket.routes
        if (route) {
          const routeId = route.id
          const current = ticketsMap1d.get(routeId) || { count: 0, name: route.name || 'Unknown Route', origin: route.origin || '', destination: route.destination || '' }
          ticketsMap1d.set(routeId, {
            ...current,
            count: current.count + 1
          })
        }
      })
      setRouteTicketsMap1d(ticketsMap1d)

      // Get tickets issued by route (last 7 days)
      const { data: tickets7d } = await supabase
        .from('tickets')
        .select(`
          route_id,
          routes!inner(
            id,
            name,
            origin,
            destination
          )
        `)
        .eq('company_id', companyId)
        .gte('created_at', sevenDaysAgo.toISOString())

      const ticketsMap7d = new Map()
      tickets7d?.forEach((ticket: any) => {
        const route = ticket.routes
        if (route) {
          const routeId = route.id
          const current = ticketsMap7d.get(routeId) || { count: 0, name: route.name || 'Unknown Route', origin: route.origin || '', destination: route.destination || '' }
          ticketsMap7d.set(routeId, {
            ...current,
            count: current.count + 1
          })
        }
      })
      setRouteTicketsMap7d(ticketsMap7d)

      // Get tickets issued by route (last 30 days)
      const { data: tickets30d } = await supabase
        .from('tickets')
        .select(`
          route_id,
          routes!inner(
            id,
            name,
            origin,
            destination
          )
        `)
        .eq('company_id', companyId)
        .gte('created_at', thirtyDaysAgo.toISOString())

      const ticketsMap30d = new Map()
      tickets30d?.forEach((ticket: any) => {
        const route = ticket.routes
        if (route) {
          const routeId = route.id
          const current = ticketsMap30d.get(routeId) || { count: 0, name: route.name || 'Unknown Route', origin: route.origin || '', destination: route.destination || '' }
          ticketsMap30d.set(routeId, {
            ...current,
            count: current.count + 1
          })
        }
      })
      setRouteTicketsMap30d(ticketsMap30d)
    } catch (err: any) {
      console.error('Error loading dashboard data:', err)
    } finally {
      setFetching(false)
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
        console.error('Error fetching user data:', err)
        router.push('/login')
      }
    }

    fetchData()
  }, [supabase, router])

  useEffect(() => {
    if (companyId) {
      loadDashboardData()
    }
  }, [companyId, loadDashboardData])

  if (fetching) {
    return (
      <DashboardLayout
        role="company_admin"
        companyId={companyId || undefined}
        userEmail={userEmail}
        userName={company?.name || 'Company Dashboard'}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!companyId) {
    return (
      <DashboardLayout
        role="company_admin"
        userEmail={userEmail}
        userName="Company Dashboard"
      >
        <div className="p-6">
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-warning-900 mb-2">No Company Assigned</h2>
            <p className="text-warning-700">
              Your account is not associated with a company. Please contact the platform administrator to assign you to a company.
            </p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      role="company_admin"
      companyId={companyId}
      userEmail={userEmail}
      userName={company?.name || 'Company Dashboard'}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Revenue Dashboard</h1>
            <p className="text-gray-600 mt-2">Real-time revenue and route performance</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/company/reports">
              <Button>View Reports</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Gross Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Net Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(netRevenue)}</p>
                </div>
                <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-success-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Commission Paid</p>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalCommission)}</p>
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
                  <p className="text-sm text-gray-600 mb-1">Total Tickets Issued</p>
                  <p className="text-3xl font-bold text-gray-900">{totalTickets}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Routes</p>
                  <p className="text-3xl font-bold text-gray-900">{routesCount}</p>
                </div>
                <div className="w-12 h-12 bg-error-100 rounded-lg flex items-center justify-center">
                  <Route className="w-6 h-6 text-error-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Revenue Generated by Route (1d)</CardTitle>
            </CardHeader>
            <CardContent>
              {routeRevenueMap1d.size > 0 ? (
                <div className="space-y-4">
                  {Array.from(routeRevenueMap1d.entries())
                    .sort((a, b) => b[1].revenue - a[1].revenue)
                    .map(([routeId, routeData]: [string, any]) => (
                      <div key={routeId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{routeData.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {routeData.origin} → {routeData.destination}
                          </p>
                        </div>
                        <span className="font-semibold text-gray-900 ml-4">{formatCurrency(routeData.revenue)}</span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-600">No revenue data for the last 24 hours</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Revenue Generated by Route (7d)</CardTitle>
            </CardHeader>
            <CardContent>
              {routeRevenueMap7d.size > 0 ? (
                <div className="space-y-4">
                  {Array.from(routeRevenueMap7d.entries())
                    .sort((a, b) => b[1].revenue - a[1].revenue)
                    .map(([routeId, routeData]: [string, any]) => (
                      <div key={routeId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{routeData.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {routeData.origin} → {routeData.destination}
                          </p>
                        </div>
                        <span className="font-semibold text-gray-900 ml-4">{formatCurrency(routeData.revenue)}</span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-600">No revenue data for the last 7 days</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Total Revenue Generated by Route (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            {routeRevenueMap30d.size > 0 ? (
              <div className="space-y-4">
                {Array.from(routeRevenueMap30d.entries())
                  .sort((a, b) => b[1].revenue - a[1].revenue)
                  .map(([routeId, routeData]: [string, any]) => (
                    <div key={routeId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{routeData.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {routeData.origin} → {routeData.destination}
                        </p>
                      </div>
                      <span className="font-semibold text-gray-900 ml-4">{formatCurrency(routeData.revenue)}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-600">No revenue data for the last 30 days</p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Tickets Issued by Route (1d)</CardTitle>
            </CardHeader>
            <CardContent>
              {routeTicketsMap1d.size > 0 ? (
                <div className="space-y-4">
                  {Array.from(routeTicketsMap1d.entries())
                    .sort((a, b) => b[1].count - a[1].count)
                    .map(([routeId, routeData]: [string, any]) => (
                      <div key={routeId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{routeData.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {routeData.origin} → {routeData.destination}
                          </p>
                        </div>
                        <span className="font-semibold text-gray-900 ml-4">{routeData.count} tickets</span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-600">No tickets issued in the last 24 hours</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Tickets Issued by Route (7d)</CardTitle>
            </CardHeader>
            <CardContent>
              {routeTicketsMap7d.size > 0 ? (
                <div className="space-y-4">
                  {Array.from(routeTicketsMap7d.entries())
                    .sort((a, b) => b[1].count - a[1].count)
                    .map(([routeId, routeData]: [string, any]) => (
                      <div key={routeId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{routeData.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {routeData.origin} → {routeData.destination}
                          </p>
                        </div>
                        <span className="font-semibold text-gray-900 ml-4">{routeData.count} tickets</span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-600">No tickets issued in the last 7 days</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Total Tickets Issued by Route (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            {routeTicketsMap30d.size > 0 ? (
              <div className="space-y-4">
                {Array.from(routeTicketsMap30d.entries())
                  .sort((a, b) => b[1].count - a[1].count)
                  .map(([routeId, routeData]: [string, any]) => (
                    <div key={routeId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{routeData.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {routeData.origin} → {routeData.destination}
                        </p>
                      </div>
                      <span className="font-semibold text-gray-900 ml-4">{routeData.count} tickets</span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-600">No tickets issued in the last 30 days</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              Monthly Revenue Analytics
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">Real-time revenue trends by month (Last 12 months)</p>
          </CardHeader>
          <CardContent>
            <RevenueChart 
              transactions={transactions.map(t => ({
                amount: t.amount || 0,
                created_at: t.created_at
              }))} 
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
