import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyId, isActive } = body

    // Validate required fields
    if (!companyId || isActive === undefined) {
      return NextResponse.json(
        { error: 'Company ID and status are required' },
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
        { error: 'Only platform admins can suspend companies' },
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

    // Create admin client for company suspension (bypasses RLS)
    const supabaseAdmin = createServiceClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Verify company exists
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Update company status using admin client
    const { data: updatedCompany, error: updateError } = await supabaseAdmin
      .from('companies')
      .update({
        is_active: Boolean(isActive),
        updated_at: new Date().toISOString(),
      })
      .eq('id', companyId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update company status: ${updateError.message}` },
        { status: 500 }
      )
    }

    if (!updatedCompany) {
      return NextResponse.json(
        { error: 'Failed to update company status' },
        { status: 500 }
      )
    }

    // Suspend/activate all users in the company
    const { error: usersUpdateError } = await supabaseAdmin
      .from('users')
      .update({ is_active: Boolean(isActive) })
      .eq('company_id', companyId)

    if (usersUpdateError) {
      console.error('Error updating users status:', usersUpdateError)
      // Continue even if user update fails - company status is already updated
    }

    return NextResponse.json({
      success: true,
      company: {
        id: updatedCompany.id,
        is_active: updatedCompany.is_active,
      },
    })
  } catch (error: any) {
    console.error('Error suspending company:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

