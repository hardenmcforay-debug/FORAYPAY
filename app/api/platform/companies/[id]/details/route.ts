import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase/client'

interface RouteParams {
  params: { id: string }
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: profileError.message || 'Failed to load user profile' }, { status: 400 })
    }

    if (profile?.role !== 'platform_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const companyId = params.id
    const admin = createSupabaseAdmin()

    const { data: company, error: companyError } = await admin
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const [
      ticketsCount,
      routesCount,
      activeRoutesCount,
      operatorsCount,
      activeOperatorsCount,
      usedTicketsCount,
      pendingTicketsCount,
      routes,
      operators,
      admins,
      recentTickets,
    ] = await Promise.all([
      admin.from('tickets').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
      admin.from('routes').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
      admin.from('routes').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'active'),
      admin.from('park_operators').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
      admin.from('park_operators').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'active'),
      admin.from('tickets').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'used'),
      admin.from('tickets').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'pending'),
      admin.from('routes').select('*').eq('company_id', companyId).order('created_at', { ascending: false }),
      admin
        .from('park_operators')
        .select('*, users(email)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false }),
      admin.from('users').select('id, email, created_at').eq('company_id', companyId).eq('role', 'company_admin'),
      admin
        .from('tickets')
        .select('id, passenger_phone, status, created_at, route_id')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: transactions30d } = await admin
      .from('transactions')
      .select('amount, commission')
      .eq('company_id', companyId)
      .eq('status', 'completed')
      .gte('created_at', thirtyDaysAgo.toISOString())

    const platformRevenue30d = transactions30d?.reduce((sum, t) => sum + (Number(t.commission) || 0), 0) || 0
    const companyRevenue30d = transactions30d?.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0

    const { data: allTransactions } = await admin
      .from('transactions')
      .select('commission')
      .eq('company_id', companyId)
      .eq('status', 'completed')

    const totalPlatformRevenue = allTransactions?.reduce((sum, t) => sum + (Number(t.commission) || 0), 0) || 0

    return NextResponse.json({
      company,
      routes: routes.data || [],
      operators: operators.data || [],
      admins: admins.data || [],
      recentTickets: recentTickets.data || [],
      stats: {
        totalTickets: ticketsCount.count || 0,
        totalRoutes: routesCount.count || 0,
        activeRoutes: activeRoutesCount.count || 0,
        totalOperators: operatorsCount.count || 0,
        activeOperators: activeOperatorsCount.count || 0,
        usedTickets: usedTicketsCount.count || 0,
        pendingTickets: pendingTicketsCount.count || 0,
        platformRevenue30d,
        totalPlatformRevenue,
        companyRevenue30d,
      },
    })
  } catch (err: any) {
    console.error('Error loading platform company details:', err)
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}


