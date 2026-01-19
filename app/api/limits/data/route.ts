import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get operator info using service role key to bypass RLS
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

    // Get operator info
    const { data: operatorData, error: operatorError } = await supabaseAdmin
      .from('park_operators')
      .select('id, company_id, route_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (operatorError || !operatorData) {
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 404 }
      )
    }

    // Only get the route assigned to the operator
    let routesData: any[] = []
    
    if (operatorData.route_id) {
      // Get only the assigned route
      const { data: routeData, error: routeError } = await supabaseAdmin
        .from('routes')
        .select('id, name, origin, destination')
        .eq('id', operatorData.route_id)
        .eq('is_active', true)
        .single()

      if (routeError) {
        return NextResponse.json(
          { error: 'Failed to load assigned route' },
          { status: 500 }
        )
      }

      if (routeData) {
        routesData = [routeData]
      }
    }
    // If no route assigned, return empty array (operator can't set limits)

    return NextResponse.json({
      operator: operatorData,
      routes: routesData,
    })
  } catch (error: any) {
    console.error('Error loading limits data:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

