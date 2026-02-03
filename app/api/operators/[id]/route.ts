import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify the requester is authenticated
    const supabase = createServerSupabaseClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile to verify role and company
    const { data: userProfile } = await supabase
      .from('users')
      .select('role, company_id')
      .eq('id', authUser.id)
      .single()

    if (!userProfile || userProfile.role !== 'company_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Company admin access required' },
        { status: 403 }
      )
    }

    if (!userProfile.company_id) {
      return NextResponse.json(
        { error: 'No company assigned to your account' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { status } = body

    if (!status || !['active', 'suspended'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "active" or "suspended"' },
        { status: 400 }
      )
    }

    const { id } = await params
    // Get operator details before update for audit log
    const { data: operator } = await supabase
      .from('park_operators')
      .select('id, name, status, company_id')
      .eq('id', id)
      .single()

    if (!operator) {
      return NextResponse.json(
        { error: 'Park operator not found' },
        { status: 404 }
      )
    }

    // Verify the operator belongs to the user's company
    if (operator.company_id !== userProfile.company_id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only update operators from your own company' },
        { status: 403 }
      )
    }

    // Update operator status
    const { error: updateError } = await supabase
      .from('park_operators')
      .update({ status })
      .eq('id', id)
      .eq('company_id', userProfile.company_id)

    if (updateError) {
      console.error('Error updating operator status:', updateError)
      return NextResponse.json(
        { error: updateError.message || 'Failed to update operator status' },
        { status: 400 }
      )
    }

    // Log audit action
    await supabase.from('audit_logs').insert({
      user_id: authUser.id,
      company_id: userProfile.company_id,
      action: `park_operator_${status === 'active' ? 'activated' : 'suspended'}`,
      details: {
        operator_id: operator.id,
        operator_name: operator.name,
        previous_status: operator.status,
        new_status: status,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Park operator ${status === 'active' ? 'activated' : 'suspended'} successfully`,
    })
  } catch (error: any) {
    console.error('Error in update operator status API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify the requester is authenticated
    const supabase = createServerSupabaseClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile to verify role and company
    const { data: userProfile } = await supabase
      .from('users')
      .select('role, company_id')
      .eq('id', authUser.id)
      .single()

    if (!userProfile || userProfile.role !== 'company_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Company admin access required' },
        { status: 403 }
      )
    }

    if (!userProfile.company_id) {
      return NextResponse.json(
        { error: 'No company assigned to your account' },
        { status: 403 }
      )
    }

    const { id } = await params
    // Get operator details before deletion for audit log
    const { data: operator } = await supabase
      .from('park_operators')
      .select('id, name, phone, user_id, company_id')
      .eq('id', id)
      .single()

    if (!operator) {
      return NextResponse.json(
        { error: 'Park operator not found' },
        { status: 404 }
      )
    }

    // Get user email for audit log
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', operator.user_id)
      .single()

    const operatorEmail = userData?.email || ''

    // Verify the operator belongs to the user's company
    if (operator.company_id !== userProfile.company_id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete operators from your own company' },
        { status: 403 }
      )
    }

    // Use admin client to delete operator and associated user
    const supabaseAdmin = createSupabaseAdmin()

    // Delete park operator first (to get details for audit log)
    const { error: deleteOperatorError } = await supabaseAdmin
      .from('park_operators')
      .delete()
      .eq('id', id)
      .eq('company_id', userProfile.company_id)

    if (deleteOperatorError) {
      console.error('Error deleting park operator:', deleteOperatorError)
      return NextResponse.json(
        { error: deleteOperatorError.message || 'Failed to delete park operator' },
        { status: 400 }
      )
    }

    // Delete user from authentication (auth.users)
    if (operator.user_id) {
      try {
        const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(operator.user_id)
        if (deleteAuthError) {
          console.error(`Error deleting auth user ${operator.user_id}:`, deleteAuthError)
          // Continue even if auth deletion fails - the user profile will be cleaned up by cascade
        } else {
          console.log(`Successfully deleted auth user: ${operatorEmail} (${operator.user_id})`)
        }
      } catch (err: any) {
        console.error(`Exception deleting auth user ${operator.user_id}:`, err)
        // Continue even if auth deletion fails
      }
    }

    // Delete user from users table (cascade should handle this, but doing it explicitly)
    if (operator.user_id) {
      const { error: deleteUserError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', operator.user_id)

      if (deleteUserError) {
        console.error('Error deleting user from users table:', deleteUserError)
        // Continue even if user deletion fails - cascade should handle it
      }
    }

    // Log audit action
    await supabaseAdmin.from('audit_logs').insert({
      user_id: authUser.id,
      company_id: userProfile.company_id,
      action: 'park_operator_deleted',
      details: {
        operator_id: operator.id,
        operator_name: operator.name,
        operator_phone: operator.phone,
        operator_email: operatorEmail,
        deleted_user_id: operator.user_id,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Park operator deleted successfully',
    })
  } catch (error: any) {
    console.error('Error in delete operator API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

