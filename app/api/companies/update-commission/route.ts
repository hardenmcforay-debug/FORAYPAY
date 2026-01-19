import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyId, commissionRate } = body

    // Validate required fields
    if (!companyId || commissionRate === undefined) {
      return NextResponse.json(
        { error: 'Company ID and commission rate are required' },
        { status: 400 }
      )
    }

    // Validate commission rate
    const rateNum = parseFloat(commissionRate)
    if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
      return NextResponse.json(
        { error: 'Commission rate must be between 0 and 100' },
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
        { error: 'Only platform admins can update commission rates' },
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

    // Create admin client for commission update (bypasses RLS)
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

    // Update commission rate using admin client
    const { data: updatedCompany, error: updateError } = await supabaseAdmin
      .from('companies')
      .update({
        commission_rate: rateNum,
        updated_at: new Date().toISOString(),
      })
      .eq('id', companyId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update commission rate: ${updateError.message}` },
        { status: 500 }
      )
    }

    if (!updatedCompany) {
      return NextResponse.json(
        { error: 'Failed to update commission rate' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      company: {
        id: updatedCompany.id,
        commission_rate: updatedCompany.commission_rate,
      },
    })
  } catch (error: any) {
    console.error('Error updating commission rate:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

