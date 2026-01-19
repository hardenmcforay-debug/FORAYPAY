import Layout from '@/components/layout/Layout'
import Card from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import RevenueChart from '@/components/features/RevenueChart'

export default async function ReportsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: userData } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!userData?.company_id) {
    return null
  }

  const companyId = userData.company_id

  // Get revenue by route (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: routeRevenue } = await supabase
    .from('tickets')
    .select(`
      route_id,
      fare_amount,
      routes!inner(name, origin, destination)
    `)
    .eq('company_id', companyId)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .eq('status', 'used')

  // Calculate revenue by route
  const revenueByRoute = routeRevenue?.reduce((acc: any, ticket: any) => {
    const routeName = `${ticket.routes.origin} - ${ticket.routes.destination}`
    if (!acc[routeName]) {
      acc[routeName] = { revenue: 0, count: 0 }
    }
    acc[routeName].revenue += ticket.fare_amount || 0
    acc[routeName].count += 1
    return acc
  }, {}) || {}

  // Get total stats
  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, commission_amount')
    .eq('company_id', companyId)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .eq('status', 'completed')

  const totalRevenue = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
  const totalCommission = transactions?.reduce((sum, t) => sum + (t.commission_amount || 0), 0) || 0
  const netRevenue = totalRevenue - totalCommission

  // Get total tickets issued (last 30 days)
  const { count: ticketCount } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .gte('created_at', thirtyDaysAgo.toISOString())

  return (
    <Layout role="company_admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Revenue insights and performance metrics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div>
              <p className="text-sm font-medium text-gray-600">Gross revenue(30d)</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(totalRevenue)}</p>
            </div>
          </Card>
          <Card>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tickets Issued (30d)</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{ticketCount || 0}</p>
            </div>
          </Card>
          <Card>
            <div>
              <p className="text-sm font-medium text-gray-600">Net Revenue (30d)</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(netRevenue)}</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Route (30d)</h2>
            <div className="space-y-3">
              {Object.entries(revenueByRoute).length === 0 ? (
                <p className="text-gray-500 text-center py-8">No revenue data available</p>
              ) : (
                Object.entries(revenueByRoute)
                  .sort(([, a]: any, [, b]: any) => b.revenue - a.revenue)
                  .map(([routeName, data]: [string, any]) => (
                    <div key={routeName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{routeName}</p>
                        <p className="text-sm text-gray-500">{data.count} tickets</p>
                      </div>
                      <p className="font-semibold text-gray-900">{formatCurrency(data.revenue)}</p>
                    </div>
                  ))
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h2>
            <RevenueChart companyId={companyId} />
          </Card>
        </div>
      </div>
    </Layout>
  )
}

