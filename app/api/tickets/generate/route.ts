import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { calculateCommission } from '@/lib/utils'

/**
 * Generate multiple tickets with dedicated order numbers for offline USSD use case
 * Park operators can create tickets in advance, and passengers can use these codes to pay
 */
export async function POST(request: NextRequest) {
  try {
    const { quantity, route_id } = await request.json()

    // Validate input
    if (!quantity || quantity < 1 || quantity > 100) {
      return NextResponse.json(
        { error: 'Quantity must be between 1 and 100' },
        { status: 400 }
      )
    }

    if (!route_id) {
      return NextResponse.json(
        { error: 'Route ID is required' },
        { status: 400 }
      )
    }

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

    // Verify route belongs to operator's company and is assigned to operator (if route_id is set)
    const { data: route, error: routeError } = await supabaseAdmin
      .from('routes')
      .select('id, company_id, fare_amount, name, origin, destination')
      .eq('id', route_id)
      .eq('company_id', operator.company_id)
      .eq('is_active', true)
      .single()

    if (routeError || !route) {
      return NextResponse.json(
        { error: 'Route not found or not accessible' },
        { status: 404 }
      )
    }

    // Check if operator has route assignment - if so, verify it matches
    if (operator.route_id && operator.route_id !== route_id) {
      return NextResponse.json(
        { error: 'Route is not assigned to you' },
        { status: 403 }
      )
    }

    // Get company info for commission calculation
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id, commission_rate')
      .eq('id', operator.company_id)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Calculate commission once
    const commissionAmount = calculateCommission(route.fare_amount, company.commission_rate)

    // Generate tickets with unique order numbers locally
    // For offline USSD use case, we generate order numbers in format: ORD-YYYYMMDD-XXXXXX
    const tickets = []
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '') // YYYYMMDD
    const expiresAt = new Date(now)
    expiresAt.setHours(expiresAt.getHours() + 24) // Valid for 24 hours

    for (let i = 0; i < quantity; i++) {
      // Generate unique order number: ORD-YYYYMMDD-RANDOM6DIGITS
      const randomSuffix = Math.floor(100000 + Math.random() * 900000).toString()
      const orderNumber = `ORD-${dateStr}-${randomSuffix}`

      // Create ticket record (pre-generated, waiting for payment)
      // Status: 'pending' - will be activated when payment is received via webhook
      // passenger_phone: will be updated when payment is received
      // monime_transaction_id: will be updated when payment is received
      const { data: ticket, error: ticketError } = await supabaseAdmin
        .from('tickets')
        .insert({
          company_id: operator.company_id,
          route_id: route.id,
          monime_order_number: orderNumber,
          monime_transaction_id: `PRE-${orderNumber}`, // Placeholder, will be updated on payment
          passenger_phone: 'PENDING', // Placeholder, will be updated on payment
          fare_amount: route.fare_amount,
          commission_amount: commissionAmount,
          status: 'pending',
          expires_at: expiresAt.toISOString(),
          // Mark as pre-generated by operator
          validated_by: operator.id, // Store operator ID who generated it
        })
        .select()
        .single()

      if (ticketError) {
        // If duplicate order number (unlikely but possible), retry with new random
        if (ticketError.code === '23505') { // Unique violation
          i-- // Retry this iteration
          continue
        }
        console.error('Error creating ticket:', ticketError)
        return NextResponse.json(
          { error: 'Failed to create tickets', details: ticketError.message },
          { status: 500 }
        )
      }

      tickets.push({
        id: ticket.id,
        order_number: orderNumber,
        route_name: `${route.origin} - ${route.destination}`,
        fare_amount: route.fare_amount,
        status: ticket.status,
        expires_at: ticket.expires_at,
      })
    }

    // Log audit event
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        company_id: operator.company_id,
        user_id: user.id,
        action: 'tickets_generated',
        entity_type: 'ticket',
        details: {
          quantity,
          route_id: route.id,
          route_name: `${route.origin} - ${route.destination}`,
          order_numbers: tickets.map(t => t.order_number),
        },
      })

    return NextResponse.json({
      success: true,
      tickets,
      message: `Successfully generated ${quantity} ticket(s) with order numbers`,
    })
  } catch (error: any) {
    console.error('Error generating tickets:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

