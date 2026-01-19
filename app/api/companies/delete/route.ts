import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is platform admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'platform_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only platform admins can delete companies' },
        { status: 403 }
      )
    }

    // Get company ID from query parameters
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('id')

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      )
    }

    // Use service role key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration')
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

    // First, verify the company exists
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id, name')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Get statistics before deletion for audit log
    const { count: routesCount } = await supabaseAdmin
      .from('routes')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)

    const { count: usersCount } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)

    const { count: ticketsCount } = await supabaseAdmin
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)

    // Get all users associated with this company before deletion
    const { data: companyUsers, error: usersFetchError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('company_id', companyId)

    if (usersFetchError) {
      console.error('Error fetching company users:', usersFetchError)
      return NextResponse.json(
        { error: 'Failed to fetch company users', details: usersFetchError.message },
        { status: 500 }
      )
    }

    // Delete users from Supabase Auth before deleting the company
    const deletedAuthUsers: string[] = []
    const failedAuthDeletions: string[] = []

    if (companyUsers && companyUsers.length > 0) {
      for (const companyUser of companyUsers) {
        try {
          const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(companyUser.id)
          if (authDeleteError) {
            console.error(`Error deleting user ${companyUser.email} from Auth:`, authDeleteError)
            failedAuthDeletions.push(companyUser.email)
          } else {
            deletedAuthUsers.push(companyUser.email)
          }
        } catch (error: any) {
          console.error(`Exception deleting user ${companyUser.email} from Auth:`, error)
          failedAuthDeletions.push(companyUser.email)
        }
      }
    }

    // Delete the company (CASCADE will handle related records in database)
    const { error: deleteError } = await supabaseAdmin
      .from('companies')
      .delete()
      .eq('id', companyId)

    if (deleteError) {
      console.error('Error deleting company:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete company', details: deleteError.message },
        { status: 500 }
      )
    }

    // Log the deletion in audit logs
    try {
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: 'delete_company',
          entity_type: 'company',
          entity_id: companyId,
          details: {
            company_name: company.name,
            deleted_routes: routesCount || 0,
            deleted_users: usersCount || 0,
            deleted_tickets: ticketsCount || 0,
            deleted_auth_users: deletedAuthUsers.length,
            failed_auth_deletions: failedAuthDeletions.length,
          },
        })
    } catch (auditError) {
      // Log error but don't fail the deletion
      console.error('Error logging audit event:', auditError)
    }

    // Build response message
    let message = `Company "${company.name}" and all associated data have been deleted successfully.`
    if (failedAuthDeletions.length > 0) {
      message += ` Warning: ${failedAuthDeletions.length} user(s) could not be deleted from Auth: ${failedAuthDeletions.join(', ')}`
    }

    return NextResponse.json({
      success: true,
      message,
      deleted: {
        company: company.name,
        routes: routesCount || 0,
        users: usersCount || 0,
        tickets: ticketsCount || 0,
        auth_users_deleted: deletedAuthUsers.length,
        auth_users_failed: failedAuthDeletions.length,
      },
    })
  } catch (error: any) {
    console.error('Company deletion error:', error)
    return NextResponse.json(
      { error: 'An error occurred while deleting the company. Please try again.' },
      { status: 500 }
    )
  }
}

