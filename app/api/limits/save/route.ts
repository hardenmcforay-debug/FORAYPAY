import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { limits } = body

    if (!limits || !Array.isArray(limits)) {
      return NextResponse.json(
        { error: 'Invalid limits data' },
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

    // Get operator info using service role key
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

    // Get operator info with route_id
    const { data: operatorData } = await supabaseAdmin
      .from('park_operators')
      .select('id, route_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!operatorData) {
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 404 }
      )
    }

    // Validate that operator can only set limits for their assigned route
    if (!operatorData.route_id) {
      return NextResponse.json(
        { error: 'No route assigned to operator. Please contact your company administrator.' },
        { status: 403 }
      )
    }

    // Save each limit
    for (const limit of limits) {
      // Verify the route belongs to the operator's assigned route
      if (limit.route_id !== operatorData.route_id) {
        return NextResponse.json(
          { error: 'You can only set limits for your assigned route' },
          { status: 403 }
        )
      }
      // Always save if operator is explicitly configuring limits (including unlimited = 0)
      // This allows operators to set unlimited tickets (0) and stop/start sales at any time
      // Save if:
      // 1. There's an existing record (limit.id exists)
      // 2. Limits are explicitly set (even if 0 for unlimited)
      // 3. Sales stopped status is being set (either true or false)
      const hasExplicitConfig = 
        limit.id || 
        (limit.early_bus_limit !== undefined && limit.early_bus_limit !== null) ||
        (limit.late_bus_limit !== undefined && limit.late_bus_limit !== null) ||
        (limit.sales_stopped !== undefined && limit.sales_stopped !== null)
      
      if (hasExplicitConfig) {
        const limitData = {
          route_id: limit.route_id,
          park_operator_id: operatorData.id,
          date: limit.date,
          early_bus_limit: limit.early_bus_limit || 0,
          late_bus_limit: limit.late_bus_limit || 0,
          is_active: limit.is_active !== false,
          sales_stopped: limit.sales_stopped !== undefined ? Boolean(limit.sales_stopped) : false,
        }

        if (limit.id) {
          // Update existing
          const { error } = await supabaseAdmin
            .from('route_daily_limits')
            .update(limitData)
            .eq('id', limit.id)

          if (error) {
            console.error('Error updating limit:', error)
            return NextResponse.json(
              { error: `Failed to update limit: ${error.message}` },
              { status: 500 }
            )
          }
        } else {
          // Insert new
          const { error } = await supabaseAdmin
            .from('route_daily_limits')
            .insert(limitData)

          if (error) {
            console.error('Error inserting limit:', error)
            return NextResponse.json(
              { error: `Failed to create limit: ${error.message}` },
              { status: 500 }
            )
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Limits saved successfully',
    })
  } catch (error: any) {
    console.error('Error saving limits:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

