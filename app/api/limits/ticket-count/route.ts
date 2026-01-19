import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { routeIds, date } = body

    if (!routeIds || !Array.isArray(routeIds) || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use service role key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createServiceClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get operator info with route_id using service role key
    const { data: operatorData } = await supabaseAdmin
      .from('park_operators')
      .select('company_id, route_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!operatorData) {
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 403 }
      )
    }

    // Validate that routeIds only include the operator's assigned route
    if (operatorData.route_id) {
      const invalidRoutes = routeIds.filter((id: string) => id !== operatorData.route_id)
      if (invalidRoutes.length > 0) {
        return NextResponse.json(
          { error: 'You can only view ticket counts for your assigned route' },
          { status: 403 }
        )
      }
    } else {
      // If no route assigned, return empty counts
      const counts: Record<string, { early: number; late: number }> = {}
      routeIds.forEach((routeId: string) => {
        counts[routeId] = { early: 0, late: 0 }
      })
      return NextResponse.json({ counts })
    }

    // Get date range
    const dateStart = new Date(date)
    dateStart.setHours(0, 0, 0, 0)
    const dateEnd = new Date(date)
    dateEnd.setHours(23, 59, 59, 999)

    // Get tickets for the routes on the selected date
    const { data: tickets } = await supabaseAdmin
      .from('tickets')
      .select('route_id, created_at')
      .in('route_id', routeIds)
      .eq('company_id', operatorData.company_id)
      .gte('created_at', dateStart.toISOString())
      .lte('created_at', dateEnd.toISOString())

    // Get limits to determine early/late bus counts (sequential counting)
    const { data: limits } = await supabaseAdmin
      .from('route_daily_limits')
      .select('route_id, early_bus_limit, late_bus_limit')
      .in('route_id', routeIds)
      .eq('date', date)
      .eq('is_active', true)

    const limitsMap = new Map(
      (limits || []).map((l: any) => [l.route_id, { earlyLimit: l.early_bus_limit || 0, lateLimit: l.late_bus_limit || 0 }])
    )

    // Count tickets by route and bus type (sequential: first tickets = early bus, then late bus)
    const counts: Record<string, { early: number; late: number }> = {}

    routeIds.forEach((routeId: string) => {
      counts[routeId] = { early: 0, late: 0 }
    })

    if (tickets) {
      // Sort tickets by creation time to count sequentially
      const sortedTickets = [...tickets].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )

      sortedTickets.forEach((ticket: any) => {
        const routeLimits = limitsMap.get(ticket.route_id)
        if (!routeLimits || !counts[ticket.route_id]) return

        const { earlyLimit, lateLimit } = routeLimits
        const currentEarly = counts[ticket.route_id].early
        const currentLate = counts[ticket.route_id].late

        // Count sequentially: early bus first, then late bus
        if (earlyLimit > 0 && currentEarly < earlyLimit) {
          counts[ticket.route_id].early++
        } else if (lateLimit > 0 && currentLate < lateLimit) {
          counts[ticket.route_id].late++
        } else if (earlyLimit === 0 && lateLimit > 0) {
          // If early bus is unlimited (0), count toward late bus
          counts[ticket.route_id].late++
        } else if (earlyLimit > 0 && lateLimit === 0) {
          // If late bus is unlimited (0), count toward early bus
          counts[ticket.route_id].early++
        } else if (earlyLimit === 0 && lateLimit === 0) {
          // Both unlimited, count as early bus
          counts[ticket.route_id].early++
        }
      })
    }

    return NextResponse.json({ counts })
  } catch (error: any) {
    console.error('Error counting tickets:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

