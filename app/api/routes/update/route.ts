import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createMoniMeClient } from '@/lib/monime/client'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, origin, destination, fareAmount, isActive } = body

    // Validate required fields
    if (!id || !name || !origin || !destination || fareAmount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
        { error: 'Only company admins can update routes' },
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

    // Create admin client for route update (bypasses RLS)
    const supabaseAdmin = createServiceClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // First verify the route belongs to the user's company and get monime_route_id
    const { data: existingRoute, error: checkError } = await supabaseAdmin
      .from('routes')
      .select('id, company_id, monime_route_id')
      .eq('id', id)
      .single()

    if (checkError || !existingRoute) {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      )
    }

    if (existingRoute.company_id !== userData.company_id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this route' },
        { status: 403 }
      )
    }

    // Update route using admin client
    const { data: route, error: routeError } = await supabaseAdmin
      .from('routes')
      .update({
        name: name,
        origin: origin,
        destination: destination,
        fare_amount: parseFloat(fareAmount),
        is_active: isActive !== undefined ? Boolean(isActive) : true,
      })
      .eq('id', id)
      .eq('company_id', userData.company_id)
      .select()
      .single()

    if (routeError) {
      if (routeError.code === '23505') {
        return NextResponse.json(
          { error: 'A route with this name already exists for your company' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: `Failed to update route: ${routeError.message}` },
        { status: 500 }
      )
    }

    if (!route) {
      return NextResponse.json(
        { error: 'Failed to update route' },
        { status: 500 }
      )
    }

    // Get company's MoniMe account ID (Space ID)
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('id, monime_account_id, name')
      .eq('id', userData.company_id)
      .single()

    // Validate MoniMe Account ID (Space ID) - required for space-scoped endpoints
    const hasValidSpaceId = company?.monime_account_id && typeof company.monime_account_id === 'string' && company.monime_account_id.trim().length > 0
    const normalizedSpaceId = hasValidSpaceId ? company.monime_account_id.trim() : null

    // Sync route update with MoniMe if route has monime_route_id and valid Space ID
    if (existingRoute.monime_route_id && normalizedSpaceId) {
      const monimeClient = createMoniMeClient()

      if (monimeClient) {
        try {
          const monimeResult = await monimeClient.updateRoute(
            existingRoute.monime_route_id,
            {
              route_id: route.id,
              route_name: route.name,
              origin: route.origin,
              destination: route.destination,
              fare_amount: parseFloat(fareAmount),
              company_account_id: normalizedSpaceId, // Payment destination - routes payments to company account space
              is_active: isActive !== undefined ? Boolean(isActive) : true,
              available_offline: true, // Enable offline route viewing for passengers in MoniMe app
              offline_payment: true, // Enable offline payment via MoniMe offline payment - passenger can pay without internet
              currency: 'SLE', // Sierra Leone currency
              route_description: `${route.name}: ${route.origin} to ${route.destination}`, // Route description for offline viewing
            },
            normalizedSpaceId // Pass normalized MoniMe Space ID (trimmed monime_account_id)
          )

          if (monimeResult.success) {
            // Log sync success
            await supabaseAdmin.from('audit_logs').insert({
              company_id: userData.company_id,
              user_id: user.id,
              action: 'route_updated_in_monime',
              entity_type: 'route',
              entity_id: route.id,
              details: {
                route_name: route.name,
                monime_route_id: existingRoute.monime_route_id,
              },
            })

            return NextResponse.json({
              success: true,
              route: {
                id: route.id,
                name: route.name,
                monime_route_id: existingRoute.monime_route_id,
              },
              message: 'Route updated and synced with MoniMe successfully',
            })
          } else {
            // Route updated but MoniMe sync failed
            await supabaseAdmin.from('audit_logs').insert({
              company_id: userData.company_id,
              user_id: user.id,
              action: 'route_updated_monime_sync_failed',
              entity_type: 'route',
              entity_id: route.id,
              details: {
                route_name: route.name,
                error: monimeResult.error || 'Unknown error',
              },
            })

            return NextResponse.json({
              success: true,
              route: {
                id: route.id,
                name: route.name,
                monime_route_id: existingRoute.monime_route_id,
              },
              warning: `Route updated but MoniMe sync failed: ${monimeResult.error || 'Unknown error'}. You can sync manually later.`,
            })
          }
        } catch (error: any) {
          console.error('Error syncing route update with MoniMe:', error)
          await supabaseAdmin.from('audit_logs').insert({
            company_id: userData.company_id,
            user_id: user.id,
            action: 'route_updated_monime_sync_error',
            entity_type: 'route',
            entity_id: route.id,
            details: {
              route_name: route.name,
              error: error.message || 'Unknown error',
            },
          })

          return NextResponse.json({
            success: true,
            route: {
              id: route.id,
              name: route.name,
              monime_route_id: existingRoute.monime_route_id,
            },
            warning: `Route updated but MoniMe sync error: ${error.message || 'Unknown error'}. You can sync manually later.`,
          })
        }
      }
    } else if (normalizedSpaceId && !existingRoute.monime_route_id) {
      // Route doesn't have MoniMe route ID yet - try to create it
      const monimeClient = createMoniMeClient()

      if (monimeClient) {
        try {
          const monimeResult = await monimeClient.createRoute(
            {
              route_id: route.id,
              route_name: route.name,
              origin: route.origin,
              destination: route.destination,
              fare_amount: parseFloat(fareAmount),
              company_account_id: normalizedSpaceId, // Payment destination - routes payments to company account space
              is_active: isActive !== undefined ? Boolean(isActive) : true,
              available_offline: true, // Enable offline route viewing for passengers in MoniMe app
              offline_payment: true, // Enable offline payment via MoniMe offline payment - passenger can pay without internet
              currency: 'SLE', // Sierra Leone currency
              route_description: `${route.name}: ${route.origin} to ${route.destination}`, // Route description for offline viewing
            },
            normalizedSpaceId // Pass normalized MoniMe Space ID (trimmed monime_account_id)
          )

          if (monimeResult.success && monimeResult.monime_route_id) {
            // Update route with MoniMe route ID
            await supabaseAdmin
              .from('routes')
              .update({ monime_route_id: monimeResult.monime_route_id })
              .eq('id', route.id)

            await supabaseAdmin.from('audit_logs').insert({
              company_id: userData.company_id,
              user_id: user.id,
              action: 'route_synced_to_monime_on_update',
              entity_type: 'route',
              entity_id: route.id,
              details: {
                route_name: route.name,
                monime_route_id: monimeResult.monime_route_id,
              },
            })

            return NextResponse.json({
              success: true,
              route: {
                id: route.id,
                name: route.name,
                monime_route_id: monimeResult.monime_route_id,
              },
              message: 'Route updated and synced with MoniMe successfully',
            })
          }
        } catch (error: any) {
          console.error('Error creating route in MoniMe on update:', error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      route: {
        id: route.id,
        name: route.name,
        monime_route_id: existingRoute.monime_route_id || null,
      },
    })
  } catch (error: any) {
    console.error('Error updating route:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

