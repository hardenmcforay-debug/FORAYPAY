import Layout from '@/components/layout/Layout'
import { createClient } from '@/lib/supabase/server'
import RealtimeDashboard from '@/components/company/RealtimeDashboard'

export default async function CompanyDashboard() {
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

  // Get company info
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single()

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

  // Get revenue by route (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: routeRevenue7d } = await supabase
    .from('tickets')
    .select(`
      route_id,
      fare_amount,
      routes!inner(name, origin, destination)
    `)
    .eq('company_id', companyId)
    .gte('created_at', sevenDaysAgo.toISOString())
    .eq('status', 'used')

  // Calculate revenue by route for last 7 days
  const revenueByRoute7d = routeRevenue7d?.reduce((acc: any, ticket: any) => {
    const routeName = `${ticket.routes.origin} - ${ticket.routes.destination}`
    if (!acc[routeName]) {
      acc[routeName] = { revenue: 0, count: 0 }
    }
    acc[routeName].revenue += ticket.fare_amount || 0
    acc[routeName].count += 1
    return acc
  }, {}) || {}

  // Get revenue by route (last 1 day - today)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: routeRevenueToday } = await supabase
    .from('tickets')
    .select(`
      route_id,
      fare_amount,
      routes!inner(name, origin, destination)
    `)
    .eq('company_id', companyId)
    .gte('created_at', today.toISOString())
    .eq('status', 'used')

  // Calculate revenue by route for today
  const revenueByRouteToday = routeRevenueToday?.reduce((acc: any, ticket: any) => {
    const routeName = `${ticket.routes.origin} - ${ticket.routes.destination}`
    if (!acc[routeName]) {
      acc[routeName] = { revenue: 0, count: 0 }
    }
    acc[routeName].revenue += ticket.fare_amount || 0
    acc[routeName].count += 1
    return acc
  }, {}) || {}

  // Get tickets issued by route (last 7 days)
  const { data: tickets7d } = await supabase
    .from('tickets')
    .select(`
      route_id,
      routes!inner(name, origin, destination)
    `)
    .eq('company_id', companyId)
    .gte('created_at', sevenDaysAgo.toISOString())

  // Calculate tickets issued by route for last 7 days
  const ticketsByRoute7d = tickets7d?.reduce((acc: any, ticket: any) => {
    const routeName = `${ticket.routes.origin} - ${ticket.routes.destination}`
    if (!acc[routeName]) {
      acc[routeName] = { count: 0 }
    }
    acc[routeName].count += 1
    return acc
  }, {}) || {}

  // Get tickets issued by route (last 1 day - today)
  const { data: ticketsToday } = await supabase
    .from('tickets')
    .select(`
      route_id,
      routes!inner(name, origin, destination)
    `)
    .eq('company_id', companyId)
    .gte('created_at', today.toISOString())

  // Calculate tickets issued by route for today
  const ticketsByRouteToday = ticketsToday?.reduce((acc: any, ticket: any) => {
    const routeName = `${ticket.routes.origin} - ${ticket.routes.destination}`
    if (!acc[routeName]) {
      acc[routeName] = { count: 0 }
    }
    acc[routeName].count += 1
    return acc
  }, {}) || {}

  // Get tickets issued by route (last 30 days)
  const { data: tickets30d } = await supabase
    .from('tickets')
    .select(`
      route_id,
      routes!inner(name, origin, destination)
    `)
    .eq('company_id', companyId)
    .gte('created_at', thirtyDaysAgo.toISOString())

  // Calculate tickets issued by route for last 30 days
  const ticketsByRoute30d = tickets30d?.reduce((acc: any, ticket: any) => {
    const routeName = `${ticket.routes.origin} - ${ticket.routes.destination}`
    if (!acc[routeName]) {
      acc[routeName] = { count: 0 }
    }
    acc[routeName].count += 1
    return acc
  }, {}) || {}

  // Get total revenue
  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, commission_amount')
    .eq('company_id', companyId)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .eq('status', 'completed')

  const totalRevenue = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
  const totalCommission = transactions?.reduce((sum, t) => sum + (t.commission_amount || 0), 0) || 0
  const netRevenue = totalRevenue - totalCommission

  // Get ticket count
  const { count: ticketCount } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .gte('created_at', thirtyDaysAgo.toISOString())

  // Get route count
  const { count: routeCount } = await supabase
    .from('routes')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('is_active', true)

  return (
    <Layout role="company_admin">
      <RealtimeDashboard
        companyId={companyId}
        companyName={company?.name}
        initialStats={{
          totalRevenue,
          totalCommission,
          netRevenue,
          ticketCount: ticketCount || 0,
          routeCount: routeCount || 0,
        }}
        initialRevenueByRoute={{
          today: revenueByRouteToday,
          week: revenueByRoute7d,
          month: revenueByRoute,
        }}
        initialTicketsByRoute={{
          today: ticketsByRouteToday,
          week: ticketsByRoute7d,
          month: ticketsByRoute30d,
        }}
      />
    </Layout>
  )
}

