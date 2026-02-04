import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
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

    const { logIds } = await request.json()

    if (!logIds || !Array.isArray(logIds) || logIds.length === 0) {
      return NextResponse.json(
        { error: 'No audit log IDs provided' },
        { status: 400 }
      )
    }

    // Use admin client to delete audit logs (bypasses RLS with service role)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get audit logs details before deletion for logging
    const { data: auditLogs } = await supabaseAdmin
      .from('audit_logs')
      .select('id, action, details')
      .in('id', logIds)

    if (!auditLogs || auditLogs.length === 0) {
      return NextResponse.json(
        { error: 'No audit logs found to delete' },
        { status: 404 }
      )
    }

    // Delete the audit logs
    // Note: Some Supabase client typings don't support `select(columns, { count })` here.
    // We rely on the pre-fetched `auditLogs.length` for the deleted count.
    const { error: deleteError } = await supabaseAdmin
      .from('audit_logs')
      .delete()
      .in('id', logIds)
      .select('id')

    if (deleteError) {
      console.error('Error deleting audit logs:', deleteError)
      return NextResponse.json(
        { error: deleteError.message || 'Failed to delete audit logs' },
        { status: 400 }
      )
    }

    // Log the bulk deletion action
    await supabaseAdmin.from('audit_logs').insert({
      user_id: authUser.id,
      action: 'audit_logs_bulk_deleted',
      details: {
        deleted_count: auditLogs.length,
        deleted_log_ids: logIds,
        deleted_actions: auditLogs.map(log => log.action),
      },
    })

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${auditLogs.length} audit log(s)`,
      deletedCount: auditLogs.length,
    })
  } catch (error: any) {
    console.error('Error in bulk delete audit logs API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

