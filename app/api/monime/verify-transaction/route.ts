import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createMoniMeClient } from '@/lib/monime/client'

/**
 * Verify transaction status with MoniMe
 * POST /api/monime/verify-transaction
 * Body: { transaction_id: string }
 */
export async function POST(request: NextRequest) {
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

    // Only company admins and platform admins can verify transactions
    if (userData.role !== 'company_admin' && userData.role !== 'platform_admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { transaction_id } = await request.json()

    if (!transaction_id) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      )
    }

    // Get company MoniMe account ID
    let monimeAccountId = ''
    if (userData.role === 'company_admin' && userData.company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select('monime_account_id')
        .eq('id', userData.company_id)
        .single()

      if (!company?.monime_account_id) {
        return NextResponse.json(
          { error: 'MoniMe account not configured for this company' },
          { status: 400 }
        )
      }
      monimeAccountId = company.monime_account_id
    } else if (userData.role === 'platform_admin') {
      // Platform admin might verify for any company - get from transaction
      const { data: transaction } = await supabase
        .from('transactions')
        .select('company_id, companies(monime_account_id)')
        .eq('monime_transaction_id', transaction_id)
        .single()

      if (!transaction) {
        return NextResponse.json(
          { error: 'Transaction not found' },
          { status: 404 }
        )
      }

      const company = transaction.companies as any
      if (!company?.monime_account_id) {
        return NextResponse.json(
          { error: 'MoniMe account not configured for this company' },
          { status: 400 }
        )
      }
      monimeAccountId = company.monime_account_id
    }

    // Verify transaction with MoniMe
    const monimeClient = createMoniMeClient()
    if (!monimeClient) {
      return NextResponse.json(
        { error: 'MoniMe API not configured' },
        { status: 500 }
      )
    }

    const result = await monimeClient.verifyTransaction(transaction_id, monimeAccountId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to verify transaction' },
        { status: 500 }
      )
    }

    // Update local transaction status if different
    if (result.transaction) {
      const { data: localTransaction } = await supabase
        .from('transactions')
        .select('id, status')
        .eq('monime_transaction_id', transaction_id)
        .single()

      if (localTransaction && localTransaction.status !== result.transaction.status) {
        // Status mismatch - update local status
        await supabase
          .from('transactions')
          .update({ status: result.transaction.status })
          .eq('id', localTransaction.id)
      }
    }

    return NextResponse.json({
      success: true,
      transaction: result.transaction,
    })
  } catch (error: any) {
    console.error('Error verifying transaction:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

