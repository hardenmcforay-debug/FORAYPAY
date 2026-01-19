import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

/**
 * Delete a pre-generated ticket (only tickets with PRE- prefix can be deleted)
 * Only the operator who generated it or their company admin can delete
 */
export async function DELETE(request: NextRequest) {
  try {
    const { ticket_id } = await request.json()

    // Validate input
    if (!ticket_id) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
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

    // Get user's role
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get ticket details
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select(`
        id,
        company_id,
        route_id,
        monime_order_number,
        monime_transaction_id,
        status,
        validated_by,
        routes!inner(name, origin, destination)
      `)
      .eq('id', ticket_id)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    // Only allow deletion of pre-generated tickets (with PRE- prefix)
    if (!ticket.monime_transaction_id || !ticket.monime_transaction_id.startsWith('PRE-')) {
      return NextResponse.json(
        { error: 'Only pre-generated tickets can be deleted. This ticket has already been paid for.' },
        { status: 400 }
      )
    }

    // Only allow deletion of pending tickets (not used or expired)
    if (ticket.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot delete ticket with status: ${ticket.status}. Only pending tickets can be deleted.` },
        { status: 400 }
      )
    }

    // Check if user is park operator
    if (userData.role === 'park_operator') {
      // Get operator info
      const { data: operator, error: operatorError } = await supabaseAdmin
        .from('park_operators')
        .select('id, company_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (operatorError || !operator) {
        return NextResponse.json(
          { error: 'Operator not found' },
          { status: 404 }
        )
      }

      // Verify ticket belongs to operator's company
      if (ticket.company_id !== operator.company_id) {
        return NextResponse.json(
          { error: 'Unauthorized. Ticket does not belong to your company.' },
          { status: 403 }
        )
      }

      // Verify operator generated this ticket (validated_by should match operator.id)
      if (ticket.validated_by && ticket.validated_by !== operator.id) {
        return NextResponse.json(
          { error: 'Unauthorized. You can only delete tickets you generated.' },
          { status: 403 }
        )
      }
    } else if (userData.role === 'company_admin') {
      // Get company admin info
      const { data: companyAdmin, error: companyAdminError } = await supabaseAdmin
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (companyAdminError || !companyAdmin) {
        return NextResponse.json(
          { error: 'Company admin not found' },
          { status: 404 }
        )
      }

      // Verify ticket belongs to company admin's company
      if (ticket.company_id !== companyAdmin.company_id) {
        return NextResponse.json(
          { error: 'Unauthorized. Ticket does not belong to your company.' },
          { status: 403 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Unauthorized. Only park operators and company admins can delete tickets.' },
        { status: 403 }
      )
    }

    // Get route info for audit log
    const routeInfo = ticket.routes && typeof ticket.routes === 'object' && !Array.isArray(ticket.routes)
      ? ticket.routes as { name?: string; origin?: string; destination?: string }
      : null

    const routeName = routeInfo
      ? `${routeInfo.origin || ''} - ${routeInfo.destination || ''}`
      : 'Unknown Route'

    // Delete the ticket
    const { error: deleteError } = await supabaseAdmin
      .from('tickets')
      .delete()
      .eq('id', ticket_id)

    if (deleteError) {
      console.error('Error deleting ticket:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete ticket', details: deleteError.message },
        { status: 500 }
      )
    }

    // Log audit event
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        company_id: ticket.company_id,
        user_id: user.id,
        action: 'ticket_deleted',
        entity_type: 'ticket',
        entity_id: ticket_id,
        details: {
          order_number: ticket.monime_order_number,
          route_id: ticket.route_id,
          route_name: routeName,
          status: ticket.status,
          reason: 'Pre-generated ticket deleted by operator/admin',
        },
      })

    return NextResponse.json({
      success: true,
      message: 'Ticket deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting ticket:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

