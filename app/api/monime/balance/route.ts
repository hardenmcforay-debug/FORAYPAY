import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createMoniMeClient } from '@/lib/monime/client'

/**
 * Get MoniMe account balance
 * GET /api/monime/balance?company_id=...
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user role and company
    const { data: userData } = await supabase
      .from('users')
      .select('id, role, company_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get company ID from query or user's company
    const searchParams = request.nextUrl.searchParams
    let companyId = searchParams.get('company_id') || userData.company_id

    // Platform admin can query any company
    if (userData.role !== 'platform_admin' && companyId !== userData.company_id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      )
    }

    // Get company MoniMe account ID
    const { data: company } = await supabase
      .from('companies')
      .select('monime_account_id')
      .eq('id', companyId)
      .single()

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    if (!company.monime_account_id) {
      return NextResponse.json(
        { error: 'MoniMe account not configured for this company' },
        { status: 400 }
      )
    }

    // Get balance from MoniMe
    const monimeClient = createMoniMeClient()
    if (!monimeClient) {
      return NextResponse.json(
        { error: 'MoniMe API not configured' },
        { status: 500 }
      )
    }

    const result = await monimeClient.getBalance(company.monime_account_id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to get balance' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      balance: result.balance,
      currency: result.currency,
      available_balance: result.available_balance,
      pending_balance: result.pending_balance,
    })
  } catch (error: any) {
    console.error('Error getting balance:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

