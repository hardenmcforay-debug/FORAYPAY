import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { order_number } = await request.json()

    // Validate order_number is provided
    if (!order_number) {
      return NextResponse.json(
        { error: 'Order number is required' },
        { status: 400 }
      )
    }

    // Create Supabase client with proper cookie handling for API routes
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
    
    if (authError) {
      console.error('Authentication error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!user) {
      console.error('No user found in session')
      return NextResponse.json(
        { error: 'Unauthorized. Please log in and try again.' },
        { status: 401 }
      )
    }

    // Use service role key to bypass RLS when querying park_operators
    // After verifying authentication with the regular client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration for service role')
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

    // Get operator info using service role key (bypasses RLS)
    const { data: operator, error: operatorError } = await supabaseAdmin
      .from('park_operators')
      .select('id, company_id, route_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (operatorError) {
      console.error('Operator query error:', operatorError)
      console.error('User ID:', user.id)
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 404 }
      )
    }

    if (!operator) {
      console.error('Operator record not found for user:', user.id)
      return NextResponse.json(
        { error: 'Operator record not found. Please contact your administrator.' },
        { status: 404 }
      )
    }

    // Find ticket by order number (database is source of truth)
    // Use service role key to bypass RLS
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select(`
        id,
        company_id,
        route_id,
        monime_transaction_id,
        monime_order_number,
        passenger_phone,
        status,
        expires_at,
        routes!inner(name, origin, destination)
      `)
      .eq('monime_order_number', order_number.trim())
      .eq('company_id', operator.company_id)
      .eq('status', 'pending')
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Invalid ticket. Order number not found or ticket already used.' },
        { status: 404 }
      )
    }

    // Check if ticket is expired
    if (ticket.expires_at && new Date(ticket.expires_at) < new Date()) {
      await supabaseAdmin
        .from('tickets')
        .update({ status: 'expired' })
        .eq('id', ticket.id)

      return NextResponse.json(
        { error: 'Ticket has expired' },
        { status: 400 }
      )
    }

    // Check route assignment (if operator has assigned route)
    if (operator.route_id && ticket.route_id !== operator.route_id) {
      return NextResponse.json(
        { error: 'Ticket is not for your assigned route' },
        { status: 403 }
      )
    }

    // Record validation attempt (database is source of truth)
    // Use service role key to bypass RLS
    const { error: validationError } = await supabaseAdmin
      .from('validations')
      .insert({
        ticket_id: ticket.id,
        park_operator_id: operator.id,
        order_number: order_number.trim(),
        is_valid: true,
      })

    if (validationError) {
      console.error('Validation insert error:', validationError)
      return NextResponse.json(
        { error: 'Failed to record validation' },
        { status: 500 }
      )
    }

    // Update ticket status to USED (mark as used after validation)
    // Use service role key to bypass RLS
    const { error: updateError } = await supabaseAdmin
      .from('tickets')
      .update({
        status: 'used',
        validated_at: new Date().toISOString(),
        validated_by: operator.id,
      })
      .eq('id', ticket.id)

    if (updateError) {
      console.error('Ticket update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update ticket status' },
        { status: 500 }
      )
    }

    // Log audit event (all actions are logged)
    // Use service role key to bypass RLS
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        company_id: operator.company_id,
        user_id: user.id,
        action: 'ticket_validated',
        entity_type: 'ticket',
        entity_id: ticket.id,
        details: { 
          order_number: order_number.trim(),
          monime_transaction_id: ticket.monime_transaction_id,
          passenger_phone: ticket.passenger_phone,
        },
      })

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        route_id: ticket.route_id,
        monime_order_number: ticket.monime_order_number,
        passenger_phone: ticket.passenger_phone,
        routes: ticket.routes,
      },
    })
  } catch (error: any) {
    console.error('Ticket validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

