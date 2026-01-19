import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, getClientIdentifier } from '@/lib/security/rate-limit'
import { sanitizePhone } from '@/lib/security/validation'

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Rate limiting - prevent abuse
    const identifier = getClientIdentifier(request)
    const limitResult = rateLimit(identifier, { windowMs: 60000, maxRequests: 10 })
    
    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': limitResult.resetTime.toString(),
            'Retry-After': '60',
          }
        }
      )
    }

    const { phone_number } = await request.json()
    
    // SECURITY: Validate and sanitize phone number
    const sanitizedPhone = sanitizePhone(phone_number)
    if (!sanitizedPhone) {
      return NextResponse.json(
        { error: 'Valid phone number is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Get most recent ticket by phone number
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select(`
        *,
        routes!inner(name, origin, destination, fare_amount)
      `)
      .eq('passenger_phone', sanitizedPhone)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Ticket retrieval error:', error)
      return NextResponse.json(
        { error: 'Unable to retrieve ticket' },
        { status: 500 }
      )
    }

    if (!tickets || tickets.length === 0) {
      return NextResponse.json(
        { error: 'No ticket found for this phone number' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ticket: tickets[0],
    }, {
      headers: {
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': limitResult.remaining.toString(),
        'X-RateLimit-Reset': limitResult.resetTime.toString(),
      }
    })
  } catch (error: any) {
    console.error('Ticket retrieval error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

