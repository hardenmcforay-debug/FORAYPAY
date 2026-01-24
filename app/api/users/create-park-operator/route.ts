import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // Verify the requester is a company admin
    const supabase = createServerSupabaseClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role, company_id')
      .eq('id', authUser.id)
      .single()

    if (!userProfile || userProfile.role !== 'company_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Company admin access required' },
        { status: 403 }
      )
    }

    if (!userProfile.company_id) {
      return NextResponse.json(
        { error: 'No company assigned to your account' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, password, company_id } = body

    if (!email || !password || !company_id) {
      return NextResponse.json(
        { error: 'Email, password, and company_id are required' },
        { status: 400 }
      )
    }

    // Verify company_id matches the requester's company
    if (company_id !== userProfile.company_id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only create operators for your own company' },
        { status: 403 }
      )
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Use admin client to create user
    const supabaseAdmin = createSupabaseAdmin()

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return NextResponse.json(
        { error: authError.message || 'Failed to create user account' },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    // Check if user profile already exists (created by trigger)
    // Wait a moment for trigger to complete
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', authData.user.id)
      .single()

    let profileError
    if (existingUser) {
      // Update existing user profile (created by trigger)
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          email: email,
          role: 'park_operator',
          company_id: company_id,
        })
        .eq('id', authData.user.id)
      profileError = updateError
    } else {
      // Insert new user profile (trigger didn't fire or failed)
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          email: email,
          role: 'park_operator',
          company_id: company_id,
        })
      profileError = insertError
    }

    if (profileError) {
      console.error('Error creating/updating user profile:', profileError)
      // Try to clean up auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: profileError.message || 'Failed to create user profile' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      user_id: authData.user.id,
      email: email,
    })
  } catch (error: any) {
    console.error('Error in create-park-operator API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

