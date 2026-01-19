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
        { error: 'Forbidden: Only platform admins can delete contact requests' },
        { status: 403 }
      )
    }

    // Get request ID from query parameters
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('id')

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
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

    // First, verify the request exists and get its details
    const { data: contactRequest, error: fetchError } = await supabaseAdmin
      .from('contact_requests')
      .select('id, company_name, status')
      .eq('id', requestId)
      .single()

    if (fetchError || !contactRequest) {
      return NextResponse.json(
        { error: 'Contact request not found' },
        { status: 404 }
      )
    }

    // Delete the contact request
    const { error: deleteError } = await supabaseAdmin
      .from('contact_requests')
      .delete()
      .eq('id', requestId)

    if (deleteError) {
      console.error('Error deleting contact request:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete contact request', details: deleteError.message },
        { status: 500 }
      )
    }

    // Log the deletion in audit logs
    try {
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: 'delete_contact_request',
          entity_type: 'contact_request',
          entity_id: requestId,
          details: {
            company_name: contactRequest.company_name,
            status: contactRequest.status,
          },
        })
    } catch (auditError) {
      // Log error but don't fail the deletion
      console.error('Error logging audit event:', auditError)
    }

    return NextResponse.json({
      success: true,
      message: `Contact request for "${contactRequest.company_name}" has been deleted successfully.`,
    })
  } catch (error: any) {
    console.error('Contact request deletion error:', error)
    return NextResponse.json(
      { error: 'An error occurred while deleting the contact request. Please try again.' },
      { status: 500 }
    )
  }
}

