import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Route, Users, DollarSign, BarChart3, Ticket } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import Button from '@/components/ui/button'
import RevenueChart from '@/components/analytics/revenue-chart'

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = 'force-dynamic'

export default async function CompanyDashboard() {
  const user = await requireRole(['company_admin'])
  const supabase = createServerSupabaseClient()

  if (!user.company_id) {
    return <div>No company assigned</div>
  }

  // Get company data
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', user.company_id)
    .single()

  // Get revenue data (last 12 months for analytics)
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
  
  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, commission, net_amount, created_at, ticket_id')
    .eq('company_id', user.company_id)
    .eq('status', 'completed')
    .gte('created_at', twelveMonthsAgo.toISOString())
    .order('created_at', { ascending: false })

  const totalRevenue = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
  const totalCommission = transactions?.reduce((sum, t) => sum + (t.commission || 0), 0) || 0
  const netRevenue = transactions?.reduce((sum, t) => sum + (t.net_amount || 0), 0) || 0

  // Get routes count
  const { data: routes } = await supabase
    .from('routes')
    .select('id')
    .eq('company_id', user.company_id)
    .eq('status', 'active')

  // Get operators count
  const { data: operators } = await supabase
    .from('park_operators')
    .select('id')
    .eq('company_id', user.company_id)
    .eq('status', 'active')

  // Get total tickets issued
  const { count: totalTickets } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', user.company_id)

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
    .eq('company_id', user.company_id)
    .eq('status', 'completed')
    .gte('created_at', oneDayAgo.toISOString())

  const routeRevenueMap1d = new Map<string, { revenue: number; name: string; origin: string; destination: string }>()
  transactions1d?.forEach((transaction: any) => {
    const route = transaction.tickets?.routes
    if (route && transaction.amount) {
      const routeId = route.id
      const current = routeRevenueMap1d.get(routeId) || { revenue: 0, name: route.name || 'Unknown Route', origin: route.origin || '', destination: route.destination || '' }
      routeRevenueMap1d.set(routeId, {
        ...current,
        revenue: current.revenue + (Number(transaction.amount) || 0)
      })
    }
  })

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
    .eq('company_id', user.company_id)
    .eq('status', 'completed')
    .gte('created_at', sevenDaysAgo.toISOString())

  const routeRevenueMap7d = new Map<string, { revenue: number; name: string; origin: string; destination: string }>()
  transactions7d?.forEach((transaction: any) => {
    const route = transaction.tickets?.routes
    if (route && transaction.amount) {
      const routeId = route.id
      const current = routeRevenueMap7d.get(routeId) || { revenue: 0, name: route.name || 'Unknown Route', origin: route.origin || '', destination: route.destination || '' }
      routeRevenueMap7d.set(routeId, {
        ...current,
        revenue: current.revenue + (Number(transaction.amount) || 0)
      })
    }
  })

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
    .eq('company_id', user.company_id)
    .eq('status', 'completed')
    .gte('created_at', thirtyDaysAgo.toISOString())

  const routeRevenueMap30d = new Map<string, { revenue: number; name: string; origin: string; destination: string }>()
  transactions30d?.forEach((transaction: any) => {
    const route = transaction.tickets?.routes
    if (route && transaction.amount) {
      const routeId = route.id
      const current = routeRevenueMap30d.get(routeId) || { revenue: 0, name: route.name || 'Unknown Route', origin: route.origin || '', destination: route.destination || '' }
      routeRevenueMap30d.set(routeId, {
        ...current,
        revenue: current.revenue + (Number(transaction.amount) || 0)
      })
    }
  })

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
    .eq('company_id', user.company_id)
    .gte('created_at', oneDayAgo.toISOString())

  const routeTicketsMap1d = new Map<string, { count: number; name: string; origin: string; destination: string }>()
  tickets1d?.forEach((ticket: any) => {
    const route = ticket.routes
    if (route) {
      const routeId = route.id
      const current = routeTicketsMap1d.get(routeId) || { count: 0, name: route.name || 'Unknown Route', origin: route.origin || '', destination: route.destination || '' }
      routeTicketsMap1d.set(routeId, {
        ...current,
        count: current.count + 1
      })
    }
  })

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
    .eq('company_id', user.company_id)
    .gte('created_at', sevenDaysAgo.toISOString())

  const routeTicketsMap7d = new Map<string, { count: number; name: string; origin: string; destination: string }>()
  tickets7d?.forEach((ticket: any) => {
    const route = ticket.routes
    if (route) {
      const routeId = route.id
      const current = routeTicketsMap7d.get(routeId) || { count: 0, name: route.name || 'Unknown Route', origin: route.origin || '', destination: route.destination || '' }
      routeTicketsMap7d.set(routeId, {
        ...current,
        count: current.count + 1
      })
    }
  })

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
    .eq('company_id', user.company_id)
    .gte('created_at', thirtyDaysAgo.toISOString())

  const routeTicketsMap30d = new Map<string, { count: number; name: string; origin: string; destination: string }>()
  tickets30d?.forEach((ticket: any) => {
    const route = ticket.routes
    if (route) {
      const routeId = route.id
      const current = routeTicketsMap30d.get(routeId) || { count: 0, name: route.name || 'Unknown Route', origin: route.origin || '', destination: route.destination || '' }
      routeTicketsMap30d.set(routeId, {
        ...current,
        count: current.count + 1
      })
    }
  })

  return (
    <DashboardLayout
      role="company_admin"
      companyId={user.company_id}
      userEmail={user.email}
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
                  <p className="text-3xl font-bold text-gray-900">{totalTickets || 0}</p>
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
                  <p className="text-3xl font-bold text-gray-900">{routes?.length || 0}</p>
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
                    .map(([routeId, routeData]) => (
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
                    .map(([routeId, routeData]) => (
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
                  .map(([routeId, routeData]) => (
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
                    .map(([routeId, routeData]) => (
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
                    .map(([routeId, routeData]) => (
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
                  .map(([routeId, routeData]) => (
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
              transactions={transactions?.map(t => ({
                amount: t.amount || 0,
                created_at: t.created_at
              })) || []} 
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

