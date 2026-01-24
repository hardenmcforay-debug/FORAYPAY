/**
 * Transaction Processor
 * 
 * Processes queued transactions asynchronously.
 * Handles ticket creation, transaction recording, and commission transfers.
 */

import { getSupabasePool } from '@/lib/supabase/pool'
import { getAuditLogBatcher } from '@/lib/queue/audit-log-batcher'
import { getTransferQueue } from '@/lib/queue/transfer-queue'
import { calculateCommission, calculateNetAmount } from '@/lib/utils'
import { QueuedTransaction } from '@/lib/queue/transaction-queue'
import { createTicket } from '@/lib/processors/ticket-creator'

interface TransactionPayload {
  transaction_id: string
  amount: number
  phone: string
  otp: string
  status: string
}

interface ProcessedTransaction {
  ticket_id: string
  transaction_id: string
  success: boolean
  error?: string
}

export async function processTransaction(
  queuedTransaction: QueuedTransaction
): Promise<ProcessedTransaction> {
  const payload: TransactionPayload = queuedTransaction.payload
  const supabase = getSupabasePool().getAdminClient()
  const auditBatcher = getAuditLogBatcher()
  const circuitBreaker = getMoniMeCircuitBreaker()

  try {
    // 1. Check idempotency (ticket already exists)
    const { data: existingTicket } = await supabase
      .from('tickets')
      .select('id')
      .eq('monime_transaction_id', payload.transaction_id)
      .single()

    if (existingTicket) {
      return {
        ticket_id: existingTicket.id,
        transaction_id: payload.transaction_id,
        success: true,
      }
    }

    // 2. Get payment code (with optimized query)
    const { data: paymentCode } = await supabase
      .from('payment_codes')
      .select('id, monime_code, total_tickets, used_tickets, status, route_id, company_id')
      .eq('monime_code', payload.otp)
      .eq('status', 'active')
      .single()

    if (!paymentCode) {
      throw new Error('Invalid or expired payment code')
    }

    if (paymentCode.used_tickets >= paymentCode.total_tickets) {
      // Mark as expired
      await supabase
        .from('payment_codes')
        .update({ status: 'expired' })
        .eq('id', paymentCode.id)

      throw new Error('Payment code has reached its usage limit')
    }

    const companyId = paymentCode.company_id
    const routeId = paymentCode.route_id

    if (!companyId || !routeId) {
      throw new Error('Invalid payment code configuration')
    }

    // 3. Get company and route in parallel
    const [companyResult, routeResult] = await Promise.all([
      supabase
        .from('companies')
        .select('commission_rate, monime_account_id')
        .eq('id', companyId)
        .single(),
      supabase
        .from('routes')
        .select('fare')
        .eq('id', routeId)
        .eq('company_id', companyId)
        .single(),
    ])

    if (!companyResult.data) {
      throw new Error('Company not found')
    }

    if (!routeResult.data) {
      throw new Error('Route not found')
    }

    const company = companyResult.data
    const route = routeResult.data

    // 4. Calculate commission
    const commission = calculateCommission(payload.amount, company.commission_rate)
    const netAmount = calculateNetAmount(payload.amount, commission)

    // 5. Create ticket using optimized ticket creator (handles conflicts automatically)
    const ticketResult = await createTicket({
      company_id: companyId,
      route_id: routeId,
      passenger_phone: payload.phone,
      monime_transaction_id: payload.transaction_id,
      monime_otp: payload.otp,
      amount: payload.amount,
      commission_rate: company.commission_rate,
    })

    if (!ticketResult.success) {
      throw new Error(`Ticket creation failed: ${ticketResult.error}`)
    }

    const ticketId = ticketResult.ticket_id

    // 6. Update payment code usage (optimistic update)
    const newUsedCount = paymentCode.used_tickets + 1
    await supabase
      .from('payment_codes')
      .update({
        used_tickets: newUsedCount,
        status: newUsedCount >= paymentCode.total_tickets ? 'expired' : 'active',
      })
      .eq('id', paymentCode.id)

    // 7. Batch audit log (non-blocking)
    auditBatcher.add({
      company_id: companyId,
      action: 'ticket_created',
      details: {
        ticket_id: ticketId,
        transaction_id: payload.transaction_id,
        amount: payload.amount,
        otp: payload.otp,
        passenger_phone: payload.phone,
        route_id: routeId,
        source: 'monime_webhook',
      },
    })

    // 8. Queue commission transfer for async processing (non-blocking)
    if (commission > 0 && company.monime_account_id) {
      const platformAccountId = process.env.MONIME_PLATFORM_ACCOUNT_ID

      if (platformAccountId) {
        try {
          const transferQueue = getTransferQueue()
          transferQueue.enqueue({
            ticket_id: ticketId,
            transaction_id: payload.transaction_id,
            company_id: companyId,
            from_account_id: company.monime_account_id,
            to_account_id: platformAccountId,
            amount: commission,
            reference: ticketId,
            description: `Commission for ticket ${ticketId} (Transaction: ${payload.transaction_id})`,
          })
        } catch (error: any) {
          // If queue not initialized, log error but don't fail transaction
          console.error('Failed to queue transfer:', error)
          auditBatcher.add({
            company_id: companyId,
            action: 'commission_transfer_queue_failed',
            details: {
              ticket_id: ticketId,
              transaction_id: payload.transaction_id,
              commission: commission,
              error: error.message || 'Transfer queue not initialized',
            },
          })
        }
      }
    }

    return {
      ticket_id: ticketId,
      transaction_id: payload.transaction_id,
      success: true,
    }
  } catch (error: any) {
    console.error('Transaction processing error:', error)
    return {
      ticket_id: '',
      transaction_id: payload.transaction_id,
      success: false,
      error: error.message || 'Unknown error',
    }
  }
}

