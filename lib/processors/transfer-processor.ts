/**
 * Commission Transfer Processor
 * 
 * Processes commission transfers from company MoniMe accounts to platform account.
 * Optimized for high-volume concurrent transfers (10,000+ simultaneous transfers).
 * 
 * Features:
 * - Idempotency checks (prevents duplicate transfers)
 * - Retry logic with exponential backoff
 * - Circuit breaker protection
 * - Batch processing
 * - Database tracking
 */

import { getSupabasePool } from '@/lib/supabase/pool'
import { initiateInternalTransfer } from '@/lib/monime/transfer'
import { getMoniMeCircuitBreaker } from '@/lib/utils/circuit-breaker'
import { getAuditLogBatcher } from '@/lib/queue/audit-log-batcher'
import { QueuedTransfer } from '@/lib/queue/transfer-queue'

interface TransferResult {
  success: boolean
  transfer_id?: string
  error?: string
  retryable?: boolean
}

interface ProcessedTransfer {
  queuedTransfer: QueuedTransfer
  result: TransferResult
}

/**
 * Process a single transfer with idempotency check
 */
export async function processTransfer(
  queuedTransfer: QueuedTransfer
): Promise<ProcessedTransfer> {
  const supabase = getSupabasePool().getAdminClient()
  const circuitBreaker = getMoniMeCircuitBreaker()
  const auditBatcher = getAuditLogBatcher()

  try {
    // 1. Check idempotency - has this transfer already been processed?
    const { data: existingTransfer } = await supabase
      .from('commission_transfers')
      .select('id, status, transfer_id')
      .eq('ticket_id', queuedTransfer.ticket_id)
      .eq('transaction_id', queuedTransfer.transaction_id)
      .single()

    if (existingTransfer) {
      // Transfer already exists
      if (existingTransfer.status === 'completed') {
        return {
          queuedTransfer,
          result: {
            success: true,
            transfer_id: existingTransfer.transfer_id || undefined,
          },
        }
      }

      // If pending or failed, we can retry
      if (existingTransfer.status === 'pending' || existingTransfer.status === 'failed') {
        // Check if we should retry based on retry count
        if (queuedTransfer.retries >= 5) {
          return {
            queuedTransfer,
            result: {
              success: false,
              error: 'Max retries exceeded',
              retryable: false,
            },
          }
        }
      }
    }

    // 2. Create or update transfer record (pending status)
    const transferRecord = {
      ticket_id: queuedTransfer.ticket_id,
      transaction_id: queuedTransfer.transaction_id,
      company_id: queuedTransfer.company_id,
      from_account_id: queuedTransfer.from_account_id,
      to_account_id: queuedTransfer.to_account_id,
      amount: queuedTransfer.amount,
      reference: queuedTransfer.reference,
      description: queuedTransfer.description,
      status: 'pending' as const,
      retry_count: queuedTransfer.retries,
    }

    let transferDbId: string

    if (existingTransfer) {
      // Update existing record
      const { data: updated, error: updateError } = await supabase
        .from('commission_transfers')
        .update({
          ...transferRecord,
          retry_count: queuedTransfer.retries,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingTransfer.id)
        .select('id')
        .single()

      if (updateError) {
        throw new Error(`Failed to update transfer record: ${updateError.message}`)
      }

      transferDbId = updated.id
    } else {
      // Create new record
      const { data: created, error: createError } = await supabase
        .from('commission_transfers')
        .insert(transferRecord)
        .select('id')
        .single()

      if (createError) {
        throw new Error(`Failed to create transfer record: ${createError.message}`)
      }

      transferDbId = created.id
    }

    // 3. Execute transfer using circuit breaker
    const transferResult = await circuitBreaker.execute(async () => {
      return await initiateInternalTransfer(
        queuedTransfer.from_account_id,
        queuedTransfer.to_account_id,
        queuedTransfer.amount,
        queuedTransfer.reference,
        queuedTransfer.description
      )
    })

    // 4. Update transfer record with result
    if (transferResult.success) {
      await supabase
        .from('commission_transfers')
        .update({
          status: 'completed',
          transfer_id: transferResult.transfer_id,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', transferDbId)

      // Audit log
      auditBatcher.add({
        company_id: queuedTransfer.company_id,
        action: 'commission_transfer_success',
        details: {
          ticket_id: queuedTransfer.ticket_id,
          transaction_id: queuedTransfer.transaction_id,
          transfer_id: transferResult.transfer_id,
          amount: queuedTransfer.amount,
          from_account: queuedTransfer.from_account_id,
          to_account: queuedTransfer.to_account_id,
        },
      })

      return {
        queuedTransfer,
        result: {
          success: true,
          transfer_id: transferResult.transfer_id,
        },
      }
    } else {
      // Transfer failed
      const isRetryable = transferResult.error?.includes('rate limit') ||
                         transferResult.error?.includes('timeout') ||
                         transferResult.error?.includes('network') ||
                         queuedTransfer.retries < 5

      await supabase
        .from('commission_transfers')
        .update({
          status: 'failed',
          error_message: transferResult.error,
          retry_count: queuedTransfer.retries + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', transferDbId)

      // Audit log
      auditBatcher.add({
        company_id: queuedTransfer.company_id,
        action: 'commission_transfer_failed',
        details: {
          ticket_id: queuedTransfer.ticket_id,
          transaction_id: queuedTransfer.transaction_id,
          amount: queuedTransfer.amount,
          error: transferResult.error,
          from_account: queuedTransfer.from_account_id,
          to_account: queuedTransfer.to_account_id,
          retryable: isRetryable,
        },
      })

      return {
        queuedTransfer,
        result: {
          success: false,
          error: transferResult.error,
          retryable: isRetryable,
        },
      }
    }
  } catch (error: any) {
    console.error('Transfer processing error:', error)

    // Update transfer record as failed
    try {
      const { data: existingTransfer } = await supabase
        .from('commission_transfers')
        .select('id')
        .eq('ticket_id', queuedTransfer.ticket_id)
        .eq('transaction_id', queuedTransfer.transaction_id)
        .single()

      if (existingTransfer) {
        await supabase
          .from('commission_transfers')
          .update({
            status: 'failed',
            error_message: error.message || 'Unknown error',
            retry_count: queuedTransfer.retries + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingTransfer.id)
      }
    } catch (dbError) {
      console.error('Failed to update transfer record:', dbError)
    }

    // Audit log
    auditBatcher.add({
      company_id: queuedTransfer.company_id,
      action: 'commission_transfer_failed',
      details: {
        ticket_id: queuedTransfer.ticket_id,
        transaction_id: queuedTransfer.transaction_id,
        amount: queuedTransfer.amount,
        error: error.message || 'Unknown error',
      },
    })

    return {
      queuedTransfer,
      result: {
        success: false,
        error: error.message || 'Unknown error',
        retryable: queuedTransfer.retries < 5,
      },
    }
  }
}

/**
 * Process a batch of transfers in parallel
 */
export async function processTransferBatch(
  transfers: QueuedTransfer[]
): Promise<ProcessedTransfer[]> {
  // Process transfers in parallel (with concurrency limit)
  const concurrencyLimit = 100 // Process up to 100 transfers concurrently
  const results: ProcessedTransfer[] = []

  for (let i = 0; i < transfers.length; i += concurrencyLimit) {
    const batch = transfers.slice(i, i + concurrencyLimit)
    const batchResults = await Promise.all(
      batch.map((transfer) => processTransfer(transfer))
    )
    results.push(...batchResults)
  }

  return results
}

