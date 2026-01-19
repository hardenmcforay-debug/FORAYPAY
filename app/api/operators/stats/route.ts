import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseServiceKey) {
      return NextResponse.json({ error: 'Service key not configured' }, { status: 500 })
    }

    const supabaseAdmin = createServiceClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get operator
    const { data: operator } = await supabaseAdmin
      .from('park_operators')
      .select('id, company_id, route_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!operator) {
      return NextResponse.json({ error: 'Operator not found' }, { status: 404 })
    }

    // Calculate date ranges
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const monthAgo = new Date()
    monthAgo.setDate(1)
    monthAgo.setHours(0, 0, 0, 0)

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)

    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    // Build ticket filters
    const baseTicketFilter = { company_id: operator.company_id }
    const routeTicketFilter = operator.route_id
      ? { ...baseTicketFilter, route_id: operator.route_id }
      : baseTicketFilter

    // Fetch all stats in parallel
    const [
      todayValidations,
      weekValidations,
      monthValidations,
      todayGenerated,
      weekGenerated,
      monthGenerated,
      pendingGenerated,
      totalGenerated,
      usedGenerated,
    ] = await Promise.all([
      supabaseAdmin
        .from('validations')
        .select('*', { count: 'exact', head: true })
        .eq('park_operator_id', operator.id)
        .eq('is_valid', true)
        .gte('validated_at', today.toISOString()),
      supabaseAdmin
        .from('validations')
        .select('*', { count: 'exact', head: true })
        .eq('park_operator_id', operator.id)
        .eq('is_valid', true)
        .gte('validated_at', weekAgo.toISOString()),
      supabaseAdmin
        .from('validations')
        .select('*', { count: 'exact', head: true })
        .eq('park_operator_id', operator.id)
        .eq('is_valid', true)
        .gte('validated_at', monthAgo.toISOString()),
      supabaseAdmin
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .match(routeTicketFilter)
        .like('monime_transaction_id', 'PRE-%')
        .gte('created_at', todayStart.toISOString()),
      supabaseAdmin
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .match(routeTicketFilter)
        .like('monime_transaction_id', 'PRE-%')
        .gte('created_at', weekStart.toISOString()),
      supabaseAdmin
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .match(routeTicketFilter)
        .like('monime_transaction_id', 'PRE-%')
        .gte('created_at', monthStart.toISOString()),
      supabaseAdmin
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .match({ ...routeTicketFilter, status: 'pending' })
        .like('monime_transaction_id', 'PRE-%'),
      supabaseAdmin
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .match(routeTicketFilter)
        .like('monime_transaction_id', 'PRE-%'),
      supabaseAdmin
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .match({ ...routeTicketFilter, status: 'used' })
        .like('monime_transaction_id', 'PRE-%'),
    ])

    return NextResponse.json({
      stats: {
        todayValidations: todayValidations.count || 0,
        weekValidations: weekValidations.count || 0,
        monthValidations: monthValidations.count || 0,
        todayGeneratedTickets: todayGenerated.count || 0,
        weekGeneratedTickets: weekGenerated.count || 0,
        monthGeneratedTickets: monthGenerated.count || 0,
        pendingGeneratedTickets: pendingGenerated.count || 0,
        totalGeneratedTickets: totalGenerated.count || 0,
        usedGeneratedTickets: usedGenerated.count || 0,
      },
    })
  } catch (error: any) {
    console.error('Error fetching operator stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}

