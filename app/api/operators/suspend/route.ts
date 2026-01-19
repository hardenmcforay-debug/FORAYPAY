import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { operatorId, isActive } = body

    // Validate required fields
    if (!operatorId || isActive === undefined) {
      return NextResponse.json(
        { error: 'Operator ID and status are required' },
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

    // Get user's role and verify it's platform admin
    const { data: userData, error: userError } = await supabase
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

    // Verify user is a platform admin
    if (userData.role !== 'platform_admin') {
      return NextResponse.json(
        { error: 'Only platform admins can suspend operators' },
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

    // Create admin client for operator suspension (bypasses RLS)
    const supabaseAdmin = createServiceClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get operator to find user_id
    const { data: operator, error: operatorError } = await supabaseAdmin
      .from('park_operators')
      .select('id, user_id')
      .eq('id', operatorId)
      .single()

    if (operatorError || !operator) {
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 404 }
      )
    }

    // Update operator status using admin client
    const { data: updatedOperator, error: updateError } = await supabaseAdmin
      .from('park_operators')
      .update({
        is_active: Boolean(isActive),
      })
      .eq('id', operatorId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update operator status: ${updateError.message}` },
        { status: 500 }
      )
    }

    if (!updatedOperator) {
      return NextResponse.json(
        { error: 'Failed to update operator status' },
        { status: 500 }
      )
    }

    // Also update the user account status
    if (operator.user_id) {
      const { error: userUpdateError } = await supabaseAdmin
        .from('users')
        .update({ is_active: Boolean(isActive) })
        .eq('id', operator.user_id)

      if (userUpdateError) {
        console.error('Error updating user status:', userUpdateError)
        // Continue even if user update fails - operator status is already updated
      }
    }

    return NextResponse.json({
      success: true,
      operator: {
        id: updatedOperator.id,
        is_active: updatedOperator.is_active,
      },
    })
  } catch (error: any) {
    console.error('Error suspending operator:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

