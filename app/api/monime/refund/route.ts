import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createMoniMeClient } from '@/lib/monime/client'

/**
 * Process refund through MoniMe
 * POST /api/monime/refund
 * Body: { transaction_id: string, amount?: number, reason?: string }
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

    // Only company admins can process refunds
    if (userData.role !== 'company_admin') {
      return NextResponse.json(
        { error: 'Forbidden. Only company admins can process refunds.' },
        { status: 403 }
      )
    }

    if (!userData.company_id) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    const { transaction_id, amount, reason } = await request.json()

    if (!transaction_id) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      )
    }

    // Verify transaction belongs to company
    const { data: transaction } = await supabase
      .from('transactions')
      .select('id, company_id, status, amount, ticket_id')
      .eq('monime_transaction_id', transaction_id)
      .eq('company_id', userData.company_id)
      .single()

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found or does not belong to your company' },
        { status: 404 }
      )
    }

    // Check if transaction can be refunded
    if (transaction.status === 'refunded') {
      return NextResponse.json(
        { error: 'Transaction has already been refunded' },
        { status: 400 }
      )
    }

    if (transaction.status === 'failed') {
      return NextResponse.json(
        { error: 'Cannot refund a failed transaction' },
        { status: 400 }
      )
    }

    // Check if ticket is already validated
    if (transaction.ticket_id) {
      const { data: ticket } = await supabase
        .from('tickets')
        .select('id, status')
        .eq('id', transaction.ticket_id)
        .single()

      if (ticket && ticket.status === 'used') {
        return NextResponse.json(
          { error: 'Cannot refund transaction for a ticket that has already been validated' },
          { status: 400 }
        )
      }
    }

    // Get company MoniMe account ID
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

    // Process refund through MoniMe
    const monimeClient = createMoniMeClient()
    if (!monimeClient) {
      return NextResponse.json(
        { error: 'MoniMe API not configured' },
        { status: 500 }
      )
    }

    const refundAmount = amount || transaction.amount
    const result = await monimeClient.processRefund(
      {
        transaction_id,
        amount: refundAmount,
        reason: reason || 'Refund requested by company admin',
      },
      company.monime_account_id
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to process refund' },
        { status: 500 }
      )
    }

    // Update transaction status
    await supabase
      .from('transactions')
      .update({ status: 'refunded' })
      .eq('id', transaction.id)

    // Cancel ticket if exists and not validated
    if (transaction.ticket_id) {
      await supabase
        .from('tickets')
        .update({ status: 'cancelled' })
        .eq('id', transaction.ticket_id)
        .eq('status', 'pending')
    }

    // Log audit event
    await supabase
      .from('audit_logs')
      .insert({
        company_id: userData.company_id,
        user_id: user.id,
        action: 'refund_processed',
        entity_type: 'transaction',
        entity_id: transaction.id,
        details: {
          transaction_id,
          refund_id: result.refund_id,
          refund_amount: result.refund_amount || refundAmount,
          reason: reason || null,
        },
      })

    return NextResponse.json({
      success: true,
      refund_id: result.refund_id,
      refund_amount: result.refund_amount || refundAmount,
    })
  } catch (error: any) {
    console.error('Error processing refund:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

