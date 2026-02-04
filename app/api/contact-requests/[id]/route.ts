import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const body = await request.json()
    const { status, notes } = body

    // Validate status
    if (status && !['pending', 'reviewed', 'contacted', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Build update object
    const updateData: any = {}
    if (status) {
      updateData.status = status
      updateData.reviewed_by = authUser.id
      updateData.reviewed_at = new Date().toISOString()
    }
    if (notes !== undefined) {
      updateData.notes = notes || null
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    // Update contact request using admin client
    const { id } = await params
    const supabaseAdmin = createSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('contact_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating contact request:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to update contact request' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Contact request updated successfully'
    })
  } catch (error: any) {
    console.error('Error in contact request update API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

