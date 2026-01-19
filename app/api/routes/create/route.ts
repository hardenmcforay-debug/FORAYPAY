import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createMoniMeClient } from '@/lib/monime/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, origin, destination, fareAmount } = body

    // Validate required fields
    if (!name || !origin || !destination || !fareAmount) {
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
        { error: 'Only company admins can create routes' },
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
          details: 'Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file. See ENV-SETUP.md for instructions.'
        },
        { status: 500 }
      )
    }

    // Create admin client for route creation (bypasses RLS)
    const supabaseAdmin = createServiceClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Create route using admin client
    const { data: route, error: routeError } = await supabaseAdmin
      .from('routes')
      .insert({
        company_id: userData.company_id,
        name: name,
        origin: origin,
        destination: destination,
        fare_amount: parseFloat(fareAmount),
        is_active: true,
      })
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
        { error: `Failed to create route: ${routeError.message}` },
        { status: 500 }
      )
    }

    if (!route) {
      return NextResponse.json(
        { error: 'Failed to create route' },
        { status: 500 }
      )
    }

    // Sync route with MoniMe if company has MoniMe account ID configured
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('id, monime_account_id, name')
      .eq('id', userData.company_id)
      .single()

    // Validate MoniMe Account ID (Space ID) - required for space-scoped endpoints
    if (company?.monime_account_id && typeof company.monime_account_id === 'string' && company.monime_account_id.trim().length > 0) {
      // Normalize the Space ID (trim whitespace)
      const normalizedSpaceId = company.monime_account_id.trim()

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
              is_active: route.is_active,
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

            // Log sync success
            await supabaseAdmin.from('audit_logs').insert({
              company_id: userData.company_id,
              user_id: user.id,
              action: 'route_created_and_synced_to_monime',
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
              message: 'Route created and synced with MoniMe successfully',
            })
          } else {
            // Route created but MoniMe sync failed - log but don't fail
            console.error('MoniMe route creation failed:', monimeResult.error)
            await supabaseAdmin.from('audit_logs').insert({
              company_id: userData.company_id,
              user_id: user.id,
              action: 'route_created_monime_sync_failed',
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
              },
              warning: `Route created but MoniMe sync failed: ${monimeResult.error || 'Unknown error'}. You can sync manually later.`,
            })
          }
        } catch (error: any) {
          console.error('Error syncing route with MoniMe:', error)
          // Route created but MoniMe sync error - log but don't fail
          await supabaseAdmin.from('audit_logs').insert({
            company_id: userData.company_id,
            user_id: user.id,
            action: 'route_created_monime_sync_error',
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
            },
            warning: `Route created but MoniMe sync error: ${error.message || 'Unknown error'}. You can sync manually later.`,
          })
        }
      }
    }

    // If no MoniMe account ID configured, still return success
    return NextResponse.json({
      success: true,
      route: {
        id: route.id,
        name: route.name,
      },
      info: company && !company.monime_account_id
        ? 'Route created. Configure MoniMe Account ID in company settings to enable automatic sync.'
        : undefined,
    })
  } catch (error: any) {
    console.error('Error creating route:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

