import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { validateTicket, getOperatorForValidation } from '@/lib/processors/ticket-validator'
import { getWebhookRateLimiter } from '@/lib/utils/rate-limiter'
import { validateOTP } from '@/lib/security/input-validator'
import { createErrorResponse } from '@/lib/security/error-handler'
import { requireCSRF } from '@/lib/security/csrf'

/**
 * Ticket Validation Endpoint (Optimized for High Volume)
 * 
 * Handles 10,000+ concurrent validations from multiple companies.
 * Uses optimistic locking, caching, and non-blocking operations.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 0. CSRF protection (skip for API routes that use token auth)
    // CSRF is handled by Supabase auth tokens, but we can add it for extra security
    // For now, we rely on authentication tokens which provide CSRF protection
    
    // 1. Rate limiting (per user)
    const user = await requireAuth()
    const rateLimiter = getWebhookRateLimiter()
    
    // Use user ID for rate limiting
    if (!rateLimiter.isAllowed(user.id)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment.' },
        { status: 429 }
      )
    }

    // 2. Get operator data (with caching)
    const operator = await getOperatorForValidation(user.id)

    if (!operator) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // 3. Quick validation checks (using cached data)
    if (operator.status === 'suspended') {
      return NextResponse.json(
        { error: 'Your operator account has been suspended. You cannot validate tickets.' },
        { status: 403 }
      )
    }

    if (operator.company_status === 'suspended') {
      return NextResponse.json(
        { error: 'Your company account has been suspended. You cannot validate tickets.' },
        { status: 403 }
      )
    }

    if (!operator.company_id) {
      return NextResponse.json({ error: 'No company assigned to operator' }, { status: 403 })
    }

    // 4. Parse and validate request
    const body = await request.json()
    const { otp } = body

    // Validate OTP format (must be exactly 6 digits)
    const validatedOTP = validateOTP(otp)
    if (!validatedOTP) {
      return NextResponse.json(
        { error: 'Invalid OTP format. OTP must be exactly 6 digits.' },
        { status: 400 }
      )
    }

    // 5. Validate ticket (optimized with optimistic locking)
    const result = await validateTicket({
      operator_id: operator.id,
      company_id: operator.company_id,
      otp: validatedOTP,
      user_id: user.id,
    })

    const processingTime = Date.now() - startTime

    if (result.success) {
      return NextResponse.json({
        success: true,
        ticket_id: result.ticket_id,
        processing_time_ms: processingTime,
      })
    } else {
      // Return appropriate status code based on error type
      const statusCode = result.already_validated ? 409 : 400
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          already_validated: result.already_validated,
          processing_time_ms: processingTime,
        },
        { status: statusCode }
      )
    }
  } catch (error: unknown) {
    return createErrorResponse(error, 500, 'ticket-validation')
  }
}
