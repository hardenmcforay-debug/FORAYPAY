import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require authentication - only platform admins can create companies
    const supabaseServer = createServerClient()
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is platform admin
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || !userData || userData.role !== 'platform_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only platform admins can create companies' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      companyName,
      companyEmail,
      companyPhone,
      companyAddress,
      monimeAccountId,
      commissionRate,
      adminFullName,
      adminEmail,
      adminPassword,
    } = body

    // Validate and sanitize required fields
    const sanitizedCompanyName = String(companyName || '').trim().slice(0, 255)
    const sanitizedCompanyEmail = String(companyEmail || '').trim().toLowerCase().slice(0, 255)
    const sanitizedAdminFullName = String(adminFullName || '').trim().slice(0, 255)
    const sanitizedAdminEmail = String(adminEmail || '').trim().toLowerCase().slice(0, 255)
    const sanitizedAdminPassword = String(adminPassword || '').trim()

    // Validate required fields
    if (!sanitizedCompanyName || !sanitizedCompanyEmail || !sanitizedAdminFullName || !sanitizedAdminEmail || !sanitizedAdminPassword) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(sanitizedCompanyEmail) || !emailRegex.test(sanitizedAdminEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength (minimum 8 characters)
    if (sanitizedAdminPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Validate commission rate
    const commissionRateNum = commissionRate ? parseFloat(String(commissionRate)) : 2.5
    if (isNaN(commissionRateNum) || commissionRateNum < 0 || commissionRateNum > 100) {
      return NextResponse.json(
        { error: 'Commission rate must be between 0 and 100' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role key for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseUrl) {
      return NextResponse.json(
        { 
          error: 'Server configuration error: NEXT_PUBLIC_SUPABASE_URL not found. Please check your .env.local file.',
          details: 'Add NEXT_PUBLIC_SUPABASE_URL to your .env.local file. Get it from Supabase Dashboard > Project Settings > API > Project URL'
        },
        { status: 500 }
      )
    }

    if (!supabaseServiceKey) {
      return NextResponse.json(
        { 
          error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY not found',
          details: 'To fix this:\n1. Go to your Supabase Dashboard (https://supabase.com/dashboard)\n2. Select your project\n3. Go to Project Settings > API\n4. Find the "service_role" key (NOT the anon key)\n5. Copy it and add to your .env.local file as: SUPABASE_SERVICE_ROLE_KEY=your_key_here\n6. Restart your development server'
        },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Step 1: Create company in database
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: sanitizedCompanyName,
        email: sanitizedCompanyEmail,
        phone: companyPhone ? String(companyPhone).trim().slice(0, 50) : null,
        address: companyAddress ? String(companyAddress).trim().slice(0, 500) : null,
        monime_account_id: monimeAccountId ? String(monimeAccountId).trim().slice(0, 255) : null,
        commission_rate: commissionRateNum,
        is_active: true,
      })
      .select()
      .single()

    if (companyError) {
      if (companyError.code === '23505') {
        return NextResponse.json(
          { error: 'A company with this email already exists' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to create company' },
        { status: 500 }
      )
    }

    if (!company) {
      return NextResponse.json(
        { error: 'Failed to create company' },
        { status: 500 }
      )
    }

    // Step 2: Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: sanitizedAdminEmail,
      password: sanitizedAdminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: sanitizedAdminFullName,
      },
    })

    if (authError) {
      // Cleanup: delete the company if auth creation fails
      await supabase.from('companies').delete().eq('id', company.id)
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    if (!authData.user) {
      await supabase.from('companies').delete().eq('id', company.id)
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    // Step 3: Create user record in users table
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: sanitizedAdminEmail,
        password_hash: '', // Password is stored in Supabase Auth
        full_name: sanitizedAdminFullName,
        role: 'company_admin',
        company_id: company.id,
        is_active: true,
      })

    if (userError) {
      // Cleanup: delete auth user and company
      await supabase.auth.admin.deleteUser(authData.user.id)
      await supabase.from('companies').delete().eq('id', company.id)
      return NextResponse.json(
        { error: 'Failed to create user record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
      },
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
    })
  } catch (error: any) {
    console.error('Error creating company:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

