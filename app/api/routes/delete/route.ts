import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createMoniMeClient } from '@/lib/monime/client'

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const routeId = searchParams.get('id')

    if (!routeId) {
      return NextResponse.json(
        { error: 'Route ID is required' },
        { status: 400 }
      )
    }

    // Create Supabase client with server-side authentication
    const supabase = createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's company_id and verify role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id, role')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.company_id) {
      return NextResponse.json(
        { error: 'No company associated with your account' },
        { status: 403 }
      )
    }

    // Verify user is a company admin
    if (userData.role !== 'company_admin') {
      return NextResponse.json(
        { error: 'Only company admins can delete routes' },
        { status: 403 }
      )
    }

    // Get service role key for bypassing RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseServiceKey) {
      return NextResponse.json(
        { 
          error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY not found',
        },
        { status: 500 }
      )
    }

    // Create admin client for deletion (bypasses RLS)
    const supabaseAdmin = createServiceClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // First verify the route belongs to the user's company and get monime_route_id
    const { data: route, error: routeError } = await supabaseAdmin
      .from('routes')
      .select('id, company_id, name, monime_route_id')
      .eq('id', routeId)
      .single()

    if (routeError || !route) {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      )
    }

    if (route.company_id !== userData.company_id) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this route' },
        { status: 403 }
      )
    }

    // Check if there are any tickets for this route (for warning purposes)
    // Note: The database will cascade delete tickets, but we can check first
    const { count: ticketCount } = await supabaseAdmin
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('route_id', routeId)

    // Check if there are any operators assigned to this route
    const { count: operatorCount } = await supabaseAdmin
      .from('park_operators')
      .select('*', { count: 'exact', head: true })
      .eq('route_id', routeId)

    // Get company's MoniMe account ID (Space ID) for sync
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('id, monime_account_id, name')
      .eq('id', userData.company_id)
      .single()

    // Validate MoniMe Account ID (Space ID) - required for space-scoped endpoints
    const hasValidSpaceId = company?.monime_account_id && typeof company.monime_account_id === 'string' && company.monime_account_id.trim().length > 0
    const normalizedSpaceId = hasValidSpaceId ? company.monime_account_id.trim() : null

    // Sync route deletion with MoniMe if route has monime_route_id and valid Space ID
    if (route.monime_route_id && normalizedSpaceId) {
      const monimeClient = createMoniMeClient()

      if (monimeClient) {
        try {
          const monimeResult = await monimeClient.deleteRoute(
            route.monime_route_id,
            normalizedSpaceId // Pass normalized MoniMe Space ID (trimmed monime_account_id)
          )

          if (!monimeResult.success) {
            // Log error but continue with deletion in ForayPay
            console.error('MoniMe route deletion failed:', monimeResult.error)
            await supabaseAdmin.from('audit_logs').insert({
              company_id: userData.company_id,
              user_id: user.id,
              action: 'route_deleted_monime_sync_failed',
              entity_type: 'route',
              entity_id: route.id,
              details: {
                route_name: route.name,
                monime_route_id: route.monime_route_id,
                error: monimeResult.error || 'Unknown error',
              },
            })
          } else {
            // Log successful sync
            await supabaseAdmin.from('audit_logs').insert({
              company_id: userData.company_id,
              user_id: user.id,
              action: 'route_deleted_from_monime',
              entity_type: 'route',
              entity_id: route.id,
              details: {
                route_name: route.name,
                monime_route_id: route.monime_route_id,
              },
            })
          }
        } catch (error: any) {
          console.error('Error syncing route deletion with MoniMe:', error)
          // Log error but continue with deletion
          await supabaseAdmin.from('audit_logs').insert({
            company_id: userData.company_id,
            user_id: user.id,
            action: 'route_deleted_monime_sync_error',
            entity_type: 'route',
            entity_id: route.id,
            details: {
              route_name: route.name,
              error: error.message || 'Unknown error',
            },
          })
        }
      }
    }

    // Delete the route
    // Note: This will cascade delete all tickets for this route
    // and set route_id to NULL for park operators assigned to this route
    const { error: deleteError } = await supabaseAdmin
      .from('routes')
      .delete()
      .eq('id', routeId)
      .eq('company_id', userData.company_id)

    if (deleteError) {
      return NextResponse.json(
        { error: `Failed to delete route: ${deleteError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: route.monime_route_id 
        ? 'Route deleted successfully and synced with MoniMe'
        : 'Route deleted successfully',
      warning: ticketCount && ticketCount > 0 
        ? `${ticketCount} ticket(s) associated with this route were also deleted.`
        : undefined,
      info: operatorCount && operatorCount > 0
        ? `${operatorCount} operator(s) assigned to this route had their route assignment removed.`
        : undefined,
    })
  } catch (error: any) {
    console.error('Error deleting route:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

