import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date } = body

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
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

    // Only get limits for the operator's assigned route
    if (!operatorData.route_id) {
      return NextResponse.json({
        limits: [],
      })
    }

    // Get existing limits for selected date and assigned route only
    const { data: limitsData, error: limitsError } = await supabaseAdmin
      .from('route_daily_limits')
      .select('*')
      .eq('park_operator_id', operatorData.id)
      .eq('route_id', operatorData.route_id)
      .eq('date', date)

    if (limitsError) {
      return NextResponse.json(
        { error: 'Failed to load limits' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      limits: limitsData || [],
    })
  } catch (error: any) {
    console.error('Error loading limits:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

