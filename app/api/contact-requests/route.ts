import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      legalName,
      businessRegistrationNumber,
      phone,
      address,
      website,
      socials,
      message
    } = body

    // Validate required fields
    if (!name || !email || !legalName || !businessRegistrationNumber || !phone || !address || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Use admin client to bypass RLS for public form submissions
    const supabaseAdmin = createSupabaseAdmin()

    // Insert contact request
    const { data, error } = await supabaseAdmin
      .from('contact_requests')
      .insert({
        name: name.trim(),
        email: email.trim(),
        legal_name: legalName.trim(),
        business_registration_number: businessRegistrationNumber.trim(),
        phone: phone.trim(),
        address: address.trim(),
        website: website?.trim() || null,
        socials: socials?.trim() || null,
        message: message.trim(),
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating contact request:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to submit contact request' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Contact request submitted successfully'
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error in contact request API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is platform admin
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single()

    if (!userProfile || userProfile.role !== 'platform_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Platform admin access required' },
        { status: 403 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('contact_requests')
      .select('*, reviewed_by_user:users!contact_requests_reviewed_by_fkey(id, email)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching contact requests:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to fetch contact requests' },
        { status: 500 }
      )
    }

    // Get total count
    let countQuery = supabase
      .from('contact_requests')
      .select('*', { count: 'exact', head: true })

    if (status) {
      countQuery = countQuery.eq('status', status)
    }

    const { count } = await countQuery

    return NextResponse.json({
      success: true,
      data: data || [],
      count: count || 0
    })
  } catch (error: any) {
    console.error('Error in contact requests GET API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

