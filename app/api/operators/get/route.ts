import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const operatorId = searchParams.get('id')

    if (!operatorId) {
      return NextResponse.json(
        { error: 'Operator ID is required' },
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
        { error: 'Only company admins can view operators' },
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

    // Create admin client for operator fetching (bypasses RLS)
    const supabaseAdmin = createServiceClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get operator with user and route data
    const { data: operator, error: operatorError } = await supabaseAdmin
      .from('park_operators')
      .select(`
        *,
        users!inner(id, email, full_name),
        routes(id, name, origin, destination)
      `)
      .eq('id', operatorId)
      .eq('company_id', userData.company_id)
      .single()

    if (operatorError) {
      if (operatorError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Operator not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: `Failed to fetch operator: ${operatorError.message}` },
        { status: 500 }
      )
    }

    if (!operator) {
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 404 }
      )
    }

    // Format the response
    const operatorData = {
      id: operator.id,
      user_id: operator.user_id,
      company_id: operator.company_id,
      route_id: operator.route_id,
      location: operator.location,
      is_active: operator.is_active,
      full_name: operator.users?.full_name || '',
      email: operator.users?.email || '',
    }

    return NextResponse.json({
      success: true,
      operator: operatorData,
    })
  } catch (error: any) {
    console.error('Error fetching operator:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

