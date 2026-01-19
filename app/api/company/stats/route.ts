import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!userData?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const companyId = userData.company_id

    // Calculate date ranges
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Fetch revenue by route data
    const [routeRevenue30d, routeRevenue7d, routeRevenueToday, tickets7d, ticketsToday, tickets30d, transactions] = await Promise.all([
      supabase
        .from('tickets')
        .select(`
          route_id,
          fare_amount,
          routes!inner(name, origin, destination)
        `)
        .eq('company_id', companyId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .eq('status', 'used'),
      supabase
        .from('tickets')
        .select(`
          route_id,
          fare_amount,
          routes!inner(name, origin, destination)
        `)
        .eq('company_id', companyId)
        .gte('created_at', sevenDaysAgo.toISOString())
        .eq('status', 'used'),
      supabase
        .from('tickets')
        .select(`
          route_id,
          fare_amount,
          routes!inner(name, origin, destination)
        `)
        .eq('company_id', companyId)
        .gte('created_at', today.toISOString())
        .eq('status', 'used'),
      supabase
        .from('tickets')
        .select(`
          route_id,
          routes!inner(name, origin, destination)
        `)
        .eq('company_id', companyId)
        .gte('created_at', sevenDaysAgo.toISOString()),
      supabase
        .from('tickets')
        .select(`
          route_id,
          routes!inner(name, origin, destination)
        `)
        .eq('company_id', companyId)
        .gte('created_at', today.toISOString()),
      supabase
        .from('tickets')
        .select(`
          route_id,
          routes!inner(name, origin, destination)
        `)
        .eq('company_id', companyId)
        .gte('created_at', thirtyDaysAgo.toISOString()),
      supabase
        .from('transactions')
        .select('amount, commission_amount')
        .eq('company_id', companyId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .eq('status', 'completed'),
    ])

    // Calculate revenue by route
    const calculateRevenueByRoute = (data: any[]) => {
      return data?.reduce((acc: any, ticket: any) => {
        const routeName = `${ticket.routes.origin} - ${ticket.routes.destination}`
        if (!acc[routeName]) {
          acc[routeName] = { revenue: 0, count: 0 }
        }
        acc[routeName].revenue += ticket.fare_amount || 0
        acc[routeName].count += 1
        return acc
      }, {}) || {}
    }

    // Calculate tickets by route
    const calculateTicketsByRoute = (data: any[]) => {
      return data?.reduce((acc: any, ticket: any) => {
        const routeName = `${ticket.routes.origin} - ${ticket.routes.destination}`
        if (!acc[routeName]) {
          acc[routeName] = { count: 0 }
        }
        acc[routeName].count += 1
        return acc
      }, {}) || {}
    }

    const revenueByRoute30d = calculateRevenueByRoute(routeRevenue30d.data || [])
    const revenueByRoute7d = calculateRevenueByRoute(routeRevenue7d.data || [])
    const revenueByRouteToday = calculateRevenueByRoute(routeRevenueToday.data || [])
    const ticketsByRoute7d = calculateTicketsByRoute(tickets7d.data || [])
    const ticketsByRouteToday = calculateTicketsByRoute(ticketsToday.data || [])
    const ticketsByRoute30d = calculateTicketsByRoute(tickets30d.data || [])

    // Calculate totals
    const totalRevenue = transactions.data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
    const totalCommission = transactions.data?.reduce((sum, t) => sum + (t.commission_amount || 0), 0) || 0
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

    return NextResponse.json({
      stats: {
        totalRevenue,
        totalCommission,
        netRevenue,
        ticketCount: ticketCount || 0,
        routeCount: routeCount || 0,
      },
      revenueByRoute: {
        today: revenueByRouteToday,
        week: revenueByRoute7d,
        month: revenueByRoute30d,
      },
      ticketsByRoute: {
        today: ticketsByRouteToday,
        week: ticketsByRoute7d,
        month: ticketsByRoute30d,
      },
    })
  } catch (error: any) {
    console.error('Error fetching company stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}

