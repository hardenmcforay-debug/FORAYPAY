import { NextRequest, NextResponse } from 'next/server'
import { MoniMeWebhookPayload } from '@/types/database'
import { getSupabasePool } from '@/lib/supabase/pool'
import { getTransactionQueue } from '@/lib/queue/transaction-queue'
import { processTransaction } from '@/lib/processors/transaction-processor'
import { getWebhookRateLimiter } from '@/lib/utils/rate-limiter'
import { verifyMoniMeWebhook } from '@/lib/security/webhook-verifier'
import { validateAmount, validatePhone, validateOTP } from '@/lib/security/input-validator'
import { createErrorResponse } from '@/lib/security/error-handler'

/**
 * MoniMe Payment Webhook Handler (Optimized for High Volume)
 * 
 * Flow:
 * 1. Fast validation and idempotency check
 * 2. Queue transaction for async processing
 * 3. Return immediately to MoniMe
 * 
 * This handler is optimized to handle 10,000+ concurrent transactions
 * by processing them asynchronously in batches.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Rate limiting (per IP)
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    
    const rateLimiter = getWebhookRateLimiter()
    if (!rateLimiter.isAllowed(clientIp)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // 2. Get raw body for signature verification
    const bodyText = await request.text()
    
    // 3. Verify webhook signature and secret
    const verification = verifyMoniMeWebhook(request, bodyText)
    if (!verification.valid) {
      console.error('Webhook authentication failed:', verification.error)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 4. Parse and validate payload
    let payload: MoniMeWebhookPayload
    try {
      payload = JSON.parse(bodyText)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    // 5. Validate required fields
    if (!payload.transaction_id || !payload.amount || !payload.phone || !payload.otp) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 6. Validate field formats
    const validatedAmount = validateAmount(payload.amount)
    const validatedPhone = validatePhone(payload.phone)
    const validatedOTP = validateOTP(payload.otp)

    if (!validatedAmount) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    if (!validatedPhone) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 })
    }

    if (!validatedOTP) {
      return NextResponse.json({ error: 'Invalid OTP format' }, { status: 400 })
    }

    // 7. Validate status
    if (payload.status !== 'success') {
      return NextResponse.json({ error: 'Payment not successful' }, { status: 400 })
    }

    // Update payload with validated values
    payload.amount = validatedAmount
    payload.phone = validatedPhone
    payload.otp = validatedOTP

    // 5. Quick idempotency check (using connection pool)
    const supabase = getSupabasePool().getAdminClient()
    const { data: existingTicket } = await supabase
      .from('tickets')
      .select('id')
      .eq('monime_transaction_id', payload.transaction_id)
      .single()

    if (existingTicket) {
      // Already processed - return immediately
      return NextResponse.json({
        success: true,
        ticket_id: existingTicket.id,
        message: 'Ticket already exists',
      })
    }

    // 6. Queue transaction for async processing
    const transactionQueue = getTransactionQueue({
      processBatch: async (batch) => {
        // Process batch in parallel
        await Promise.all(
          batch.map((item) => processTransaction(item))
        )
      },
      batchSize: 50, // Process 50 transactions per batch
      flushInterval: 1000, // Flush every 1 second
    })

    transactionQueue.enqueue({
      payload: payload,
    })

    // 7. Return immediately (transaction will be processed asynchronously)
    const processingTime = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      message: 'Transaction queued for processing',
      queue_size: transactionQueue.getSize(),
      processing_time_ms: processingTime,
    })
  } catch (error: unknown) {
    return createErrorResponse(error, 500, 'monime-webhook')
  }
}
