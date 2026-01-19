import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, monimeAccountId } = body

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Company name and email are required' },
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
        { error: 'Only company admins can update company information' },
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

    // Create admin client for company update (bypasses RLS)
    const supabaseAdmin = createServiceClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // First verify the company exists and belongs to the user
    const { data: existingCompany, error: checkError } = await supabaseAdmin
      .from('companies')
      .select('id, email')
      .eq('id', userData.company_id)
      .single()

    if (checkError || !existingCompany) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Check if email is being changed and if it's already taken by another company
    if (email !== existingCompany.email) {
      const { data: emailCheck } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('email', email)
        .neq('id', userData.company_id)
        .single()

      if (emailCheck) {
        return NextResponse.json(
          { error: 'This email is already associated with another company' },
          { status: 400 }
        )
      }
    }

    // Normalize monimeAccountId: trim whitespace and convert empty string to null
    const normalizedMonimeAccountId = monimeAccountId 
      ? monimeAccountId.trim() || null 
      : null

    // Update company using admin client
    const { data: company, error: companyUpdateError } = await supabaseAdmin
      .from('companies')
      .update({
        name: name,
        email: email,
        phone: phone ? phone.trim() || null : null,
        monime_account_id: normalizedMonimeAccountId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userData.company_id)
      .select()
      .single()

    if (companyUpdateError) {
      console.error('Error updating company:', companyUpdateError)
      if (companyUpdateError.code === '23505') {
        return NextResponse.json(
          { error: 'This email is already associated with another company' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: `Failed to update company: ${companyUpdateError.message}` },
        { status: 500 }
      )
    }

    if (!company) {
      return NextResponse.json(
        { error: 'Failed to update company' },
        { status: 500 }
      )
    }

    // Return updated company data including monime_account_id
    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        email: company.email,
        phone: company.phone,
        monime_account_id: company.monime_account_id,
        updated_at: company.updated_at,
      },
    })
  } catch (error: any) {
    console.error('Error updating company:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

