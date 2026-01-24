/**
 * High-Performance Ticket Validator
 * 
 * Optimized for validating 10,000+ tickets concurrently from multiple companies.
 * Uses optimistic locking, caching, and batch operations.
 */

import { getSupabasePool } from '@/lib/supabase/pool'
import { getAuditLogBatcher } from '@/lib/queue/audit-log-batcher'
import { createClient } from '@supabase/supabase-js'

interface ValidationRequest {
  operator_id: string
  company_id: string
  otp: string
  user_id: string
}

interface ValidationResult {
  success: boolean
  ticket_id?: string
  error?: string
  already_validated?: boolean
}

interface OperatorCache {
  id: string
  company_id: string
  assigned_routes: string[] | null
  status: string
  company_status: string | null
  cached_at: number
}

// In-memory cache for operator data (5 minute TTL)
const operatorCache = new Map<string, OperatorCache>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get operator data with caching
 */
async function getOperatorData(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<OperatorCache | null> {
  // Check cache first
  const cached = operatorCache.get(userId)
  if (cached && Date.now() - cached.cached_at < CACHE_TTL) {
    return cached
  }

  // Fetch operator data
  const { data: operator } = await supabase
    .from('park_operators')
    .select('id, company_id, assigned_routes, status')
    .eq('user_id', userId)
    .single()

  const operatorData = operator as any
  if (!operatorData || !operatorData.company_id) {
    return null
  }

  // Fetch company status separately (can be cached separately if needed)
  const { data: company } = await supabase
    .from('companies')
    .select('status')
    .eq('id', operatorData.company_id)
    .single()

  const operatorCacheData: OperatorCache = {
    id: operatorData.id,
    company_id: operatorData.company_id,
    assigned_routes: operatorData.assigned_routes,
    status: operatorData.status,
    company_status: (company as any)?.status || null,
    cached_at: Date.now(),
  }

  // Cache the result
  operatorCache.set(userId, operatorCacheData)

  return operatorCacheData
}

/**
 * Validate a single ticket with optimistic locking
 */
export async function validateTicket(
  request: ValidationRequest
): Promise<ValidationResult> {
  const supabase = getSupabasePool().getAdminClient()
  const auditBatcher = getAuditLogBatcher()

  try {
    // 1. Quick validation checks
    if (!request.otp || !request.operator_id || !request.company_id) {
      return {
        success: false,
        error: 'Invalid validation request',
      }
    }

    // 2. Find ticket by OTP with company filter (optimized query using index)
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, company_id, route_id, status, validated_by')
      .eq('monime_otp', request.otp)
      .eq('company_id', request.company_id)
      .eq('status', 'pending') // Only get pending tickets
      .single()

    if (ticketError || !ticket) {
      // Check if ticket exists but is already validated
      const { data: existingTicket } = await supabase
        .from('tickets')
        .select('id, status')
        .eq('monime_otp', request.otp)
        .eq('company_id', request.company_id)
        .single()

      if (existingTicket && (existingTicket as any).status === 'used') {
        return {
          success: false,
          error: 'Ticket already validated',
          already_validated: true,
        }
      }

      return {
        success: false,
        error: 'Invalid or expired ticket',
      }
    }

    // 3. Optimistic update with status check (prevents race conditions)
    // This ensures only one validation succeeds even with concurrent requests
    const updateQuery = (supabase
      .from('tickets') as any)
      .update({
        status: 'used',
        used_at: new Date().toISOString(),
        validated_by: request.operator_id,
      })
      .eq('id', (ticket as any).id)
      .eq('status', 'pending') // CRITICAL: Only update if still pending
      .eq('company_id', request.company_id) // Security: Ensure company matches
      .select('id')
      .single()
    
    const { data: updatedTicket, error: updateError } = await updateQuery

    if (updateError || !updatedTicket) {
      // Ticket was already validated by another request (race condition)
      return {
        success: false,
        error: 'Ticket already validated by another operator',
        already_validated: true,
      }
    }

    // 4. Batch audit log (non-blocking)
    auditBatcher.add({
      company_id: request.company_id,
      user_id: request.user_id,
      action: 'ticket_validated',
      details: {
        ticket_id: (ticket as any).id,
        otp: request.otp,
        operator_id: request.operator_id,
      },
    })

    return {
      success: true,
      ticket_id: (ticket as any).id,
    }
  } catch (error: any) {
    console.error('Ticket validation error:', error)
    return {
      success: false,
      error: error.message || 'Validation failed',
    }
  }
}

/**
 * Validate multiple tickets in batch
 */
export async function validateTicketsBatch(
  requests: ValidationRequest[]
): Promise<ValidationResult[]> {
  const results: ValidationResult[] = []

  // Process in parallel (but limit concurrency to avoid overwhelming database)
  const batchSize = 50
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(request => validateTicket(request))
    )
    results.push(...batchResults)
  }

  return results
}

/**
 * Get operator data for validation (with caching)
 */
export async function getOperatorForValidation(
  userId: string
): Promise<OperatorCache | null> {
  const supabase = getSupabasePool().getAdminClient()
  return getOperatorData(supabase, userId)
}

/**
 * Clear operator cache (call when operator data changes)
 */
export function clearOperatorCache(userId?: string): void {
  if (userId) {
    operatorCache.delete(userId)
  } else {
    operatorCache.clear()
  }
}

