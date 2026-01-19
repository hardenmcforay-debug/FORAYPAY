import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function DELETE(request: NextRequest) {
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
        { error: 'Only company admins can delete operators' },
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

    // First verify the operator belongs to the user's company and get user_id
    const { data: operator, error: operatorError } = await supabaseAdmin
      .from('park_operators')
      .select('id, company_id, user_id')
      .eq('id', operatorId)
      .single()

    if (operatorError || !operator) {
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 404 }
      )
    }

    if (operator.company_id !== userData.company_id) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this operator' },
        { status: 403 }
      )
    }

    const userIdToDelete = operator.user_id

    // Delete park operator record first (this will cascade to related records if needed)
    const { error: deleteOperatorError } = await supabaseAdmin
      .from('park_operators')
      .delete()
      .eq('id', operatorId)
      .eq('company_id', userData.company_id)

    if (deleteOperatorError) {
      return NextResponse.json(
        { error: `Failed to delete operator record: ${deleteOperatorError.message}` },
        { status: 500 }
      )
    }

    // Delete user record from users table
    const { error: deleteUserError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userIdToDelete)

    if (deleteUserError) {
      console.error('Error deleting user record:', deleteUserError)
      // Continue with auth deletion even if user record deletion fails
    }

    // Delete auth user from Supabase Auth
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete)

    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError)
      // Return error but note that operator record is already deleted
      return NextResponse.json(
        { 
          error: `Operator record deleted but failed to delete auth account: ${deleteAuthError.message}`,
          warning: 'You may need to manually delete the auth account'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Operator account deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting operator:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

