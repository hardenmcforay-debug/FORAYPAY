import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { calculateCommission } from '@/lib/utils'
import { createMoniMeClient } from '@/lib/monime/client'

/**
 * MoniMe Webhook Endpoint
 * 
 * Receives payment confirmations from MoniMe when passengers pay for tickets using dedicated codes.
 * 
 * Flow:
 * 1. MoniMe sends webhook with payment confirmation
 * 2. Foray system verifies transaction authenticity
 * 3. Server-side ticket is generated/updated
 * 4. Ticket is linked to MoniMe order #, transaction ID, and passenger phone number
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    // Validate required fields
    const { webhook_id, event_type, transaction_id, order_number, passenger_phone, amount, status } = payload

    if (!webhook_id || !event_type || !transaction_id || !order_number || !passenger_phone || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields in webhook payload' },
        { status: 400 }
      )
    }

    // Only process payment success events
    if (event_type !== 'payment.success' || status !== 'completed') {
      return NextResponse.json(
        { success: true, message: 'Event ignored - not a successful payment' },
        { status: 200 }
      )
    }

    // Initialize Supabase admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createServiceClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Check for duplicate webhook (idempotency)
    const { data: existingWebhook } = await supabaseAdmin
      .from('monime_webhooks')
      .select('id, processed')
      .eq('webhook_id', webhook_id)
      .single()

    if (existingWebhook) {
      if (existingWebhook.processed) {
        // Already processed, return success
        return NextResponse.json(
          { success: true, message: 'Webhook already processed' },
          { status: 200 }
        )
      }
      // Mark as processed but don't reprocess
      await supabaseAdmin
        .from('monime_webhooks')
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq('id', existingWebhook.id)

      return NextResponse.json(
        { success: true, message: 'Webhook marked as processed' },
        { status: 200 }
      )
    }

    // Store webhook for idempotency
    const { data: webhookRecord, error: webhookError } = await supabaseAdmin
      .from('monime_webhooks')
      .insert({
        webhook_id,
        event_type,
        payload,
        processed: false,
      })
      .select()
      .single()

    if (webhookError) {
      console.error('Error storing webhook:', webhookError)
      return NextResponse.json(
        { error: 'Failed to store webhook' },
        { status: 500 }
      )
    }

    // Verify transaction with MoniMe API
    const monimeClient = createMoniMeClient()
    const verifyResult = await monimeClient.verifyTransaction(transaction_id, payload.company_account_id || payload.space_id)

    if (!verifyResult || !verifyResult.success) {
      // Mark webhook as processed with error
      await supabaseAdmin
        .from('monime_webhooks')
        .update({
          processed: true,
          processed_at: new Date().toISOString(),
          error_message: 'Failed to verify transaction with MoniMe',
        })
        .eq('id', webhookRecord.id)

      return NextResponse.json(
        { error: 'Transaction verification failed' },
        { status: 400 }
      )
    }

    // Find ticket by order number (may be pre-generated or need to be created)
    const { data: existingTicket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select(`
        id,
        company_id,
        route_id,
        status,
        fare_amount,
        commission_amount
      `)
      .eq('monime_order_number', order_number)
      .single()

    // Determine company and route
    let companyId: string
    let routeId: string | null = null
    let fareAmount: number = parseFloat(amount)
    let commissionAmount: number = 0

    if (existingTicket) {
      // Pre-generated ticket exists - update it
      companyId = existingTicket.company_id
      routeId = existingTicket.route_id
      fareAmount = parseFloat(existingTicket.fare_amount.toString())
      
      // Use existing commission from pre-generated ticket
      if (existingTicket.commission_amount) {
        commissionAmount = parseFloat(existingTicket.commission_amount.toString())
      } else {
        // Fallback: calculate commission if not found
        const { data: company } = await supabaseAdmin
          .from('companies')
          .select('commission_rate')
          .eq('id', companyId)
          .single()

        if (company && company.commission_rate) {
          commissionAmount = calculateCommission(fareAmount, company.commission_rate)
        }
      }

      // Update ticket with payment information
      const { error: updateError } = await supabaseAdmin
        .from('tickets')
        .update({
          monime_transaction_id: transaction_id,
          passenger_phone: passenger_phone,
          status: 'pending', // Keep as pending until validated by operator
          // Don't update fare_amount or commission_amount - use original values
        })
        .eq('id', existingTicket.id)

      if (updateError) {
        console.error('Error updating ticket:', updateError)
        await supabaseAdmin
          .from('monime_webhooks')
          .update({
            processed: true,
            processed_at: new Date().toISOString(),
            error_message: `Failed to update ticket: ${updateError.message}`,
          })
          .eq('id', webhookRecord.id)

        return NextResponse.json(
          { error: 'Failed to update ticket' },
          { status: 500 }
        )
      }
    } else {
      // Ticket doesn't exist - need route_id and company_id from payload or route lookup
      // Try to get route_id from payload or find by MoniMe route ID
      const monimeRouteId = payload.route_id

      if (!monimeRouteId) {
        await supabaseAdmin
          .from('monime_webhooks')
          .update({
            processed: true,
            processed_at: new Date().toISOString(),
            error_message: 'Route ID not found in payload and ticket does not exist',
          })
          .eq('id', webhookRecord.id)

        return NextResponse.json(
          { error: 'Route ID required but not found' },
          { status: 400 }
        )
      }

      // Find route by MoniMe route ID
      const { data: route, error: routeError } = await supabaseAdmin
        .from('routes')
        .select('id, company_id, fare_amount')
        .eq('monime_route_id', monimeRouteId)
        .single()

      if (routeError || !route) {
        await supabaseAdmin
          .from('monime_webhooks')
          .update({
            processed: true,
            processed_at: new Date().toISOString(),
            error_message: `Route not found for MoniMe route ID: ${monimeRouteId}`,
          })
          .eq('id', webhookRecord.id)

        return NextResponse.json(
          { error: 'Route not found' },
          { status: 404 }
        )
      }

      companyId = route.company_id
      routeId = route.id
      fareAmount = parseFloat(route.fare_amount.toString())
      
      // Get company commission rate
      const { data: company } = await supabaseAdmin
        .from('companies')
        .select('commission_rate')
        .eq('id', companyId)
        .single()

      // Calculate commission
      if (company && company.commission_rate) {
        commissionAmount = calculateCommission(fareAmount, company.commission_rate)
      }

      // Create new ticket (server-side ticket generation)
      const { error: createError } = await supabaseAdmin
        .from('tickets')
        .insert({
          company_id: companyId,
          route_id: routeId,
          monime_order_number: order_number,
          monime_transaction_id: transaction_id,
          passenger_phone: passenger_phone,
          fare_amount: fareAmount,
          commission_amount: commissionAmount,
          status: 'pending', // Pending until validated by operator
        })

      if (createError) {
        console.error('Error creating ticket:', createError)
        await supabaseAdmin
          .from('monime_webhooks')
          .update({
            processed: true,
            processed_at: new Date().toISOString(),
            error_message: `Failed to create ticket: ${createError.message}`,
          })
          .eq('id', webhookRecord.id)

        return NextResponse.json(
          { error: 'Failed to create ticket' },
          { status: 500 }
        )
      }
    }

    // Create transaction record
    const { data: ticketRecord } = await supabaseAdmin
      .from('tickets')
      .select('id')
      .eq('monime_order_number', order_number)
      .single()

    const { error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert({
        company_id: companyId,
        ticket_id: ticketRecord?.id || null,
        monime_transaction_id: transaction_id,
        amount: fareAmount,
        commission_amount: commissionAmount,
        net_amount: fareAmount - commissionAmount,
        status: 'completed',
        payment_method: 'monime',
      })

    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
      // Don't fail the webhook - transaction record is for reporting
    }

    // Mark webhook as processed
    await supabaseAdmin
      .from('monime_webhooks')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
      })
      .eq('id', webhookRecord.id)

    // Log audit event (all actions are logged)
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        company_id: companyId,
        action: 'payment_received',
        entity_type: 'ticket',
        details: {
          webhook_id,
          transaction_id,
          order_number,
          passenger_phone,
          amount: fareAmount,
        },
      })

    return NextResponse.json({
      success: true,
      message: 'Payment processed successfully',
      order_number,
    })
  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
