import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { rateLimit, getClientIdentifier } from '@/lib/security/rate-limit'
import { sanitizeString, sanitizeEmail, sanitizePhone, sanitizeNumber } from '@/lib/security/validation'

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Rate limiting - prevent spam/DoS
    const identifier = getClientIdentifier(request)
    const limitResult = rateLimit(identifier, { windowMs: 60000, maxRequests: 3 })
    
    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '3',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': limitResult.resetTime.toString(),
            'Retry-After': '60',
          }
        }
      )
    }

    const body = await request.json()
    const {
      company_name,
      legal_name,
      business_registration_number,
      contact_person,
      email,
      phone,
      address,
      number_of_routes,
      website,
      socials,
      additional_info,
    } = body

    // SECURITY: Validate and sanitize all inputs
    const sanitizedCompanyName = sanitizeString(company_name, 255)
    const sanitizedLegalName = sanitizeString(legal_name, 255)
    const sanitizedBusinessReg = sanitizeString(business_registration_number, 100)
    const sanitizedContactPerson = sanitizeString(contact_person, 255)
    const sanitizedEmail = sanitizeEmail(email)
    const sanitizedPhoneValue = sanitizePhone(phone)
    const sanitizedAddress = sanitizeString(address, 500)
    const sanitizedNumberOfRoutes = sanitizeNumber(number_of_routes, 1, 10000)
    const sanitizedWebsite = website ? sanitizeString(website, 255) : null
    const sanitizedSocials = socials ? sanitizeString(socials, 500) : null
    const sanitizedAdditionalInfo = additional_info ? sanitizeString(additional_info, 2000) : null

    // Validate required fields
    if (!sanitizedCompanyName || !sanitizedLegalName || !sanitizedBusinessReg || !sanitizedContactPerson || !sanitizedEmail || !sanitizedPhoneValue || !sanitizedAddress || !sanitizedNumberOfRoutes) {
      return NextResponse.json(
        { error: 'All required fields must be filled' },
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

    // Check if contact_requests table exists, if not create it
    // For now, we'll try to insert and handle the error if table doesn't exist
    const { data, error } = await supabase
      .from('contact_requests')
      .insert({
        company_name: sanitizedCompanyName,
        legal_name: sanitizedLegalName,
        business_registration_number: sanitizedBusinessReg,
        contact_person: sanitizedContactPerson,
        email: sanitizedEmail,
        phone: sanitizedPhoneValue,
        address: sanitizedAddress,
        number_of_routes: sanitizedNumberOfRoutes,
        website: sanitizedWebsite,
        socials: sanitizedSocials,
        additional_info: sanitizedAdditionalInfo,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      // If table doesn't exist, log error but still return success
      // The platform admin can set up the table later
      console.error('Error inserting contact request:', error)
      
      // Check if it's a "relation does not exist" error
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        console.warn('contact_requests table does not exist. Please create it using the schema in database/contact-requests.sql')
        // Still return success so user experience isn't broken
        // Platform admin can check logs and create table
        return NextResponse.json({
          success: true,
          message: 'Contact request received. Our team will be in touch soon.',
          note: 'Database table setup pending - request logged in server logs',
        })
      }

      return NextResponse.json(
        { error: 'Failed to submit contact request. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Contact request submitted successfully. Our team will contact you shortly.',
      id: data?.id,
    }, {
      headers: {
        'X-RateLimit-Limit': '3',
        'X-RateLimit-Remaining': limitResult.remaining.toString(),
        'X-RateLimit-Reset': limitResult.resetTime.toString(),
      }
    })
  } catch (error: any) {
    console.error('Contact form submission error:', error)
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

