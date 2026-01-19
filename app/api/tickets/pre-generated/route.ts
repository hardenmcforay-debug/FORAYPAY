import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

/**
 * Get pre-generated tickets for the current operator
 */
export async function GET(request: NextRequest) {
  try {
    // Create Supabase client with proper cookie handling
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // Ignore - cookie setting in API routes
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              // Ignore - cookie removal in API routes
            }
          },
        },
      }
    )

    // Get current user (authentication check)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use service role key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
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

    // Get operator info
    const { data: operator, error: operatorError } = await supabaseAdmin
      .from('park_operators')
      .select('id, company_id, route_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (operatorError || !operator) {
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 404 }
      )
    }

    // Get pre-generated tickets (tickets created by this operator, with placeholder transaction ID)
    let query = supabaseAdmin
      .from('tickets')
      .select(`
        id,
        monime_order_number,
        route_id,
        fare_amount,
        status,
        expires_at,
        routes!inner(name, origin, destination)
      `)
      .eq('company_id', operator.company_id)
      .like('monime_transaction_id', 'PRE-%')
      .order('created_at', { ascending: false })
      .limit(500)

    // If operator has assigned route, filter by route
    if (operator.route_id) {
      query = query.eq('route_id', operator.route_id)
    }

    const { data: tickets, error: ticketsError } = await query

    if (ticketsError) {
      return NextResponse.json(
        { error: 'Failed to fetch tickets', details: ticketsError.message },
        { status: 500 }
      )
    }

    // Format tickets for response
    const formattedTickets = (tickets || []).map((ticket: any) => ({
      id: ticket.id,
      order_number: ticket.monime_order_number,
      route_name: ticket.routes
        ? `${ticket.routes.origin} - ${ticket.routes.destination}`
        : 'Unknown Route',
      fare_amount: parseFloat(ticket.fare_amount),
      status: ticket.status,
      expires_at: ticket.expires_at,
    }))

    return NextResponse.json({
      success: true,
      tickets: formattedTickets,
    })
  } catch (error: any) {
    console.error('Error fetching pre-generated tickets:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

