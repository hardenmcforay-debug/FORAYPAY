import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is platform admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'platform_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only platform admins can update contact requests' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, status, notes } = body

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Request ID and status are required' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['pending', 'contacted', 'in_progress', 'completed', 'rejected']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Use service role key to bypass RLS
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

    // Prepare update data
    const updateData: any = {
      status,
      notes: notes?.trim() || null,
    }

    // Set contacted_at if status is being changed to 'contacted' and it's not already set
    if (status === 'contacted') {
      const { data: existingRequest } = await supabaseAdmin
        .from('contact_requests')
        .select('contacted_at')
        .eq('id', id)
        .single()

      if (!existingRequest?.contacted_at) {
        updateData.contacted_at = new Date().toISOString()
      }
    }

    const { data, error } = await supabaseAdmin
      .from('contact_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating contact request:', error)
      return NextResponse.json(
        { error: 'Failed to update contact request' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      request: data,
    })
  } catch (error: any) {
    console.error('Contact request update error:', error)
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

