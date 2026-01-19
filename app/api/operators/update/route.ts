import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, fullName, email, password, location, routeId, isActive } = body

    // Validate required fields
    if (!id || !fullName || !email) {
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
        { error: 'Only company admins can update operators' },
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

    // Create admin client for operator update (bypasses RLS)
    const supabaseAdmin = createServiceClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // First verify the operator belongs to the user's company
    const { data: existingOperator, error: checkError } = await supabaseAdmin
      .from('park_operators')
      .select('id, company_id, user_id')
      .eq('id', id)
      .single()

    if (checkError || !existingOperator) {
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 404 }
      )
    }

    if (existingOperator.company_id !== userData.company_id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this operator' },
        { status: 403 }
      )
    }

    // Update user record in users table
    const { error: userUpdateError } = await supabaseAdmin
      .from('users')
      .update({
        full_name: fullName,
        email: email,
      })
      .eq('id', existingOperator.user_id)

    if (userUpdateError) {
      return NextResponse.json(
        { error: `Failed to update user record: ${userUpdateError.message}` },
        { status: 500 }
      )
    }

    // Update password if provided
    if (password && password.trim().length > 0) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters' },
          { status: 400 }
        )
      }

      const { error: passwordUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingOperator.user_id,
        { password: password }
      )

      if (passwordUpdateError) {
        return NextResponse.json(
          { error: `Failed to update password: ${passwordUpdateError.message}` },
          { status: 500 }
        )
      }
    }

    // Update park operator record
    const { data: operator, error: operatorUpdateError } = await supabaseAdmin
      .from('park_operators')
      .update({
        route_id: routeId || null,
        location: location || null,
        is_active: isActive !== undefined ? Boolean(isActive) : true,
      })
      .eq('id', id)
      .eq('company_id', userData.company_id)
      .select()
      .single()

    if (operatorUpdateError) {
      return NextResponse.json(
        { error: `Failed to update operator record: ${operatorUpdateError.message}` },
        { status: 500 }
      )
    }

    if (!operator) {
      return NextResponse.json(
        { error: 'Failed to update operator' },
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
    console.error('Error updating operator:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

