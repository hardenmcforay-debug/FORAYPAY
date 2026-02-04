import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is a park operator
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single()

    if (!userProfile || userProfile.role !== 'park_operator') {
      return NextResponse.json(
        { error: 'Forbidden: Park operator access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, phone } = body

    // Build update object with only allowed fields
    const updateData: { name?: string; phone?: string } = {}
    
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Name is required' },
          { status: 400 }
        )
      }
      updateData.name = name.trim()
    }

    if (phone !== undefined) {
      if (!phone || phone.trim().length === 0) {
        return NextResponse.json(
          { error: 'Phone is required' },
          { status: 400 }
        )
      }
      updateData.phone = phone.trim()
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Get operator info for audit log
    const { data: operator } = await supabase
      .from('park_operators')
      .select('id, name, phone, company_id, status')
      .eq('user_id', authUser.id)
      .single()

    if (!operator) {
      return NextResponse.json(
        { error: 'Operator profile not found' },
        { status: 404 }
      )
    }

    // Check if company is suspended
    if (operator.company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select('status, name')
        .eq('id', operator.company_id)
        .single()

      if (company && company.status === 'suspended') {
        return NextResponse.json(
          { error: `Your company account "${company.name}" has been suspended. You cannot perform this action.` },
          { status: 403 }
        )
      }
    }

    // Check if operator is suspended
    if (operator.status === 'suspended') {
      return NextResponse.json(
        { error: 'Your operator account has been suspended. You cannot perform this action.' },
        { status: 403 }
      )
    }

    // Update operator profile (RLS will enforce permissions)
    const { error: updateError } = await supabase
      .from('park_operators')
      .update(updateData)
      .eq('user_id', authUser.id)

    if (updateError) {
      console.error('Error updating operator profile:', updateError)
      return NextResponse.json(
        { error: updateError.message || 'Failed to update profile' },
        { status: 400 }
      )
    }

    // Log audit action
    const supabaseAdmin = await import('@/lib/supabase/client').then(m => m.createSupabaseAdmin())
    await supabaseAdmin.from('audit_logs').insert({
      user_id: authUser.id,
      company_id: operator.company_id,
      action: 'operator_profile_updated',
      details: {
        operator_id: operator.id,
        updated_fields: updateData,
        previous_name: operator.name,
        previous_phone: operator.phone,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    })
  } catch (error: any) {
    console.error('Error in update operator profile API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

