import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'

interface RouteParams {
  params: {
    id: string
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    // Verify the requester is a platform admin
    const supabase = createServerSupabaseClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single()

    if (!userProfile || userProfile.role !== 'platform_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Platform admin access required' },
        { status: 403 }
      )
    }

    // Get audit log details before deletion for logging
    const { data: auditLog } = await supabase
      .from('audit_logs')
      .select('id, action, details')
      .eq('id', params.id)
      .single()

    if (!auditLog) {
      return NextResponse.json(
        { error: 'Audit log not found' },
        { status: 404 }
      )
    }

    // Use admin client to delete audit log (bypasses RLS with service role)
    const supabaseAdmin = createSupabaseAdmin()

    // First verify the log exists
    const { data: existingLog, error: checkError } = await supabaseAdmin
      .from('audit_logs')
      .select('id')
      .eq('id', params.id)
      .single()

    if (checkError || !existingLog) {
      console.error('Error checking audit log:', checkError)
      return NextResponse.json(
        { error: 'Audit log not found or could not be accessed' },
        { status: 404 }
      )
    }

    // Delete the audit log
    const { data: deleteData, error: deleteError } = await supabaseAdmin
      .from('audit_logs')
      .delete()
      .eq('id', params.id)
      .select()

    if (deleteError) {
      console.error('Error deleting audit log:', deleteError)
      console.error('Delete error details:', JSON.stringify(deleteError, null, 2))
      return NextResponse.json(
        { error: deleteError.message || 'Failed to delete audit log', details: deleteError },
        { status: 400 }
      )
    }

    console.log('Successfully deleted audit log:', params.id)
    console.log('Deleted data:', deleteData)

    // Log the deletion action (optional - you might want to skip this to avoid infinite loops)
    // But it's useful for tracking deletions
    await supabaseAdmin.from('audit_logs').insert({
      user_id: authUser.id,
      action: 'audit_log_deleted',
      details: {
        deleted_log_id: params.id,
        deleted_action: auditLog.action,
        deleted_details: auditLog.details,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Audit log deleted successfully',
    })
  } catch (error: any) {
    console.error('Error in delete audit log API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

