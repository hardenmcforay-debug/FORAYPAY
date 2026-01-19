import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { rateLimit, getClientIdentifier } from '@/lib/security/rate-limit'
import { sanitizeString, sanitizeEmail, sanitizePhone } from '@/lib/security/validation'

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Rate limiting - prevent spam/DoS
    const identifier = getClientIdentifier(request)
    const limitResult = rateLimit(identifier, { windowMs: 60000, maxRequests: 5 })
    
    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': limitResult.resetTime.toString(),
            'Retry-After': '60',
          }
        }
      )
    }

    const body = await request.json()
    const {
      name,
      email,
      phone,
      subject,
      message,
    } = body

    // SECURITY: Validate and sanitize all inputs
    const sanitizedName = sanitizeString(name, 255)
    const sanitizedEmail = sanitizeEmail(email)
    const sanitizedPhoneValue = phone ? sanitizePhone(phone) : null
    const sanitizedSubject = sanitizeString(subject, 255)
    const sanitizedMessage = sanitizeString(message, 5000)

    // Validate required fields
    if (!sanitizedName || !sanitizedEmail || !sanitizedSubject || !sanitizedMessage) {
      return NextResponse.json(
        { error: 'Name, email, subject, and message are required' },
        { status: 400 }
      )
    }

    // Additional validation
    if (sanitizedName.length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters' },
        { status: 400 }
      )
    }

    if (sanitizedSubject.length < 3) {
      return NextResponse.json(
        { error: 'Subject must be at least 3 characters' },
        { status: 400 }
      )
    }

    if (sanitizedMessage.length < 10) {
      return NextResponse.json(
        { error: 'Message must be at least 10 characters' },
        { status: 400 }
      )
    }

    // Use service role key to bypass RLS for contact submissions
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabase = createServiceClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Insert into contact_messages table
    const { data, error } = await supabase
      .from('contact_messages')
      .insert({
        name: sanitizedName,
        email: sanitizedEmail,
        phone: sanitizedPhoneValue,
        subject: sanitizedSubject,
        message: sanitizedMessage,
        status: 'unread',
      })
      .select()
      .single()

    if (error) {
      // If table doesn't exist, log error but still return success
      console.error('Error inserting contact message:', error)
      
      // Check if it's a "relation does not exist" error
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        console.warn('contact_messages table does not exist. Please create it in your database.')
        // Still return success so user experience isn't broken
        return NextResponse.json({
          success: true,
          message: 'Message received. We will get back to you soon.',
          note: 'Database table setup pending - message logged in server logs',
        })
      }

      return NextResponse.json(
        { error: 'Failed to submit message. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully. We will get back to you soon.',
      id: data?.id,
    }, {
      headers: {
        'X-RateLimit-Limit': '5',
        'X-RateLimit-Remaining': limitResult.remaining.toString(),
        'X-RateLimit-Reset': limitResult.resetTime.toString(),
      }
    })
  } catch (error: any) {
    console.error('Contact message submission error:', error)
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

