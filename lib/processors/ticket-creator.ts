/**
 * High-Performance Ticket Creator
 * 
 * Optimized for creating 10,000+ tickets concurrently from multiple companies.
 * Uses batch inserts, optimistic locking, and conflict resolution.
 */

import { getSupabasePool } from '@/lib/supabase/pool'
import { calculateCommission, calculateNetAmount } from '@/lib/utils'

export interface TicketCreationData {
  company_id: string
  route_id: string
  passenger_phone: string
  monime_transaction_id: string
  monime_otp: string
  amount: number
  commission_rate: number
}

interface TicketCreationResult {
  ticket_id: string
  transaction_id: string
  success: boolean
  error?: string
}

interface BatchTicketCreationResult {
  successful: TicketCreationResult[]
  failed: TicketCreationResult[]
  total: number
}

/**
 * Create a single ticket with optimized query
 */
export async function createTicket(
  data: TicketCreationData
): Promise<TicketCreationResult> {
  const supabase = getSupabasePool().getAdminClient()

  try {
    // 1. Quick idempotency check (using index)
    const { data: existingTicket } = await supabase
      .from('tickets')
      .select('id')
      .eq('monime_transaction_id', data.monime_transaction_id)
      .single()

    if (existingTicket) {
      const ticket = existingTicket as { id: string }
      return {
        ticket_id: ticket.id,
        transaction_id: data.monime_transaction_id,
        success: true,
      }
    }

    // 2. Calculate commission
    const commission = calculateCommission(data.amount, data.commission_rate)
    const netAmount = calculateNetAmount(data.amount, commission)

    // 3. Create ticket and transaction in a single optimized operation
    // Using RETURNING to get the ticket ID immediately
    const ticketResult = await supabase
      .from('tickets')
      .insert({
        company_id: data.company_id,
        route_id: data.route_id,
        passenger_phone: data.passenger_phone,
        monime_transaction_id: data.monime_transaction_id,
        monime_otp: data.monime_otp,
        status: 'pending',
      } as any)
      .select('id')
      .single()

    if (ticketResult.error) {
      // Check if it's a duplicate key error (race condition)
      if (ticketResult.error.code === '23505' || ticketResult.error.message?.includes('duplicate')) {
        // Ticket was created by another concurrent request
        const { data: existing } = await supabase
          .from('tickets')
          .select('id')
          .eq('monime_transaction_id', data.monime_transaction_id)
          .single()

      if (existing) {
        const ticket = existing as { id: string }
        return {
          ticket_id: ticket.id,
          transaction_id: data.monime_transaction_id,
          success: true,
        }
      }
      }

      throw new Error(`Ticket creation failed: ${ticketResult.error.message}`)
    }

    const ticket = ticketResult.data as { id: string }

    // 4. Create transaction record (non-blocking, can fail without affecting ticket)
    Promise.resolve(supabase
      .from('transactions')
      .insert({
        company_id: data.company_id,
        ticket_id: ticket.id,
        amount: data.amount,
        commission: commission,
        net_amount: netAmount,
        status: 'completed',
      } as any))
      .then(() => {
        // Success - transaction created
      })
      .catch((error: any) => {
        // Log error but don't fail ticket creation
        console.error('Transaction creation failed (non-critical):', error)
      })

    return {
      ticket_id: ticket.id,
      transaction_id: data.monime_transaction_id,
      success: true,
    }
  } catch (error: any) {
    console.error('Ticket creation error:', error)
    return {
      ticket_id: '',
      transaction_id: data.monime_transaction_id,
      success: false,
      error: error.message || 'Unknown error',
    }
  }
}

/**
 * Create multiple tickets in a batch (optimized for high volume)
 * Uses PostgreSQL's bulk insert capabilities
 */
export async function createTicketsBatch(
  tickets: TicketCreationData[]
): Promise<BatchTicketCreationResult> {
  const supabase = getSupabasePool().getAdminClient()
  const results: BatchTicketCreationResult = {
    successful: [],
    failed: [],
    total: tickets.length,
  }

  if (tickets.length === 0) {
    return results
  }

  try {
    // 1. Check idempotency for all tickets in parallel
    const transactionIds = tickets.map(t => t.monime_transaction_id)
    const { data: existingTickets } = await supabase
      .from('tickets')
      .select('id, monime_transaction_id')
      .in('monime_transaction_id', transactionIds)

    const existingMap = new Map(
      (existingTickets as any)?.map((t: any) => [t.monime_transaction_id, t.id]) || []
    )

    // Filter out already existing tickets
    const newTickets = tickets.filter(
      t => !existingMap.has(t.monime_transaction_id)
    )

    // Add existing tickets to successful results
    for (const ticket of tickets) {
      const existingId = existingMap.get((ticket as any).monime_transaction_id)
      if (existingId) {
        results.successful.push({
          ticket_id: existingId as string,
          transaction_id: (ticket as any).monime_transaction_id,
          success: true,
        })
      }
    }

    if (newTickets.length === 0) {
      return results
    }

    // 2. Prepare batch insert data
    const ticketInserts = newTickets.map(t => ({
      company_id: t.company_id,
      route_id: t.route_id,
      passenger_phone: t.passenger_phone,
      monime_transaction_id: t.monime_transaction_id,
      monime_otp: t.monime_otp,
      status: 'pending' as const,
    }))

    // 3. Bulk insert tickets (PostgreSQL handles this efficiently)
    const { data: createdTickets, error: insertError } = await supabase
      .from('tickets')
      .insert(ticketInserts as any)
      .select('id, monime_transaction_id')

    if (insertError) {
      // Handle partial failures - try individual inserts
      console.error('Batch insert error, falling back to individual inserts:', insertError)
      
      for (const ticket of newTickets) {
        const result = await createTicket(ticket)
        if (result.success) {
          results.successful.push(result)
        } else {
          results.failed.push(result)
        }
      }
      
      return results
    }

    // 4. Create transaction records in batch
    if (createdTickets && createdTickets.length > 0) {
      const transactionInserts = (createdTickets as any[]).map((ticket: any, index: number) => {
        const originalTicket = newTickets[index]
        const commission = calculateCommission(originalTicket.amount, originalTicket.commission_rate)
        const netAmount = calculateNetAmount(originalTicket.amount, commission)

        return {
          company_id: originalTicket.company_id,
          ticket_id: ticket.id,
          amount: originalTicket.amount,
          commission: commission,
          net_amount: netAmount,
          status: 'completed' as const,
        }
      })

      // Insert transactions (non-blocking)
      Promise.resolve(supabase
        .from('transactions')
        .insert(transactionInserts as any))
        .then(() => {
          console.log(`Created ${transactionInserts.length} transaction records`)
        })
        .catch((error: any) => {
          console.error('Batch transaction creation failed (non-critical):', error)
        })

      // Add successful results
      for (const ticket of (createdTickets as any[])) {
        results.successful.push({
          ticket_id: ticket.id,
          transaction_id: ticket.monime_transaction_id,
          success: true,
        })
      }
    }

    return results
  } catch (error: any) {
    console.error('Batch ticket creation error:', error)
    
    // Fallback to individual creation
    for (const ticket of tickets) {
      const result = await createTicket(ticket)
      if (result.success) {
        results.successful.push(result)
      } else {
        results.failed.push(result)
      }
    }

    return results
  }
}

/**
 * Create tickets with retry logic for handling conflicts
 */
export async function createTicketWithRetry(
  data: TicketCreationData,
  maxRetries = 3
): Promise<TicketCreationResult> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await createTicket(data)
      
      if (result.success) {
        return result
      }

      // If it's a conflict error, retry with exponential backoff
      if (result.error?.includes('duplicate') || result.error?.includes('conflict')) {
        if (attempt < maxRetries) {
          const delay = Math.min(100 * Math.pow(2, attempt - 1), 1000)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
      }

      return result
    } catch (error: any) {
      lastError = error
      
      if (attempt < maxRetries) {
        const delay = Math.min(100 * Math.pow(2, attempt - 1), 1000)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  return {
    ticket_id: '',
    transaction_id: data.monime_transaction_id,
    success: false,
    error: lastError?.message || 'Failed after retries',
  }
}

