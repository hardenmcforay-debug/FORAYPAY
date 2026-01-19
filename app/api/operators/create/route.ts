import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fullName, email, password, location, routeId } = body

    // Validate required fields
    if (!fullName || !email || !password) {
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

    // Get user's company_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.company_id) {
      return NextResponse.json(
        { error: 'No company associated with your account' },
        { status: 403 }
      )
    }

    // Create user in Supabase Auth using service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error: Service role key not found' },
        { status: 500 }
      )
    }

    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const serviceSupabase = createServiceClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Create user in Supabase Auth
    const { data: authData, error: authCreateError } = await serviceSupabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    })

    if (authCreateError) {
      return NextResponse.json(
        { error: `Failed to create user account: ${authCreateError.message}` },
        { status: 500 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    // Create user record in users table using service client (bypasses RLS)
    const { error: userCreateError } = await serviceSupabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: email,
        password_hash: '', // Password is stored in Supabase Auth
        full_name: fullName,
        role: 'park_operator',
        company_id: userData.company_id,
        is_active: true,
      })

    if (userCreateError) {
      // Cleanup: delete auth user if user record creation fails
      await serviceSupabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: `Failed to create user record: ${userCreateError.message}` },
        { status: 500 }
      )
    }

    // Create park operator record using service client (bypasses RLS)
    const { data: operator, error: operatorError } = await serviceSupabase
      .from('park_operators')
      .insert({
        company_id: userData.company_id,
        user_id: authData.user.id,
        route_id: routeId || null,
        location: location || null,
        is_active: true,
      })
      .select()
      .single()

    if (operatorError) {
      // Cleanup: delete auth user and user record
      await serviceSupabase.auth.admin.deleteUser(authData.user.id)
      await serviceSupabase.from('users').delete().eq('id', authData.user.id)
      return NextResponse.json(
        { error: `Failed to create operator record: ${operatorError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      operator: {
        id: operator.id,
        fullName: fullName,
      },
    })
  } catch (error: any) {
    console.error('Error creating operator:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

