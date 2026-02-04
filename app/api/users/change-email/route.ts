import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { newEmail, password } = body

    if (!newEmail || !password) {
      return NextResponse.json(
        { error: 'New email and current password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if email is different
    if (newEmail.toLowerCase() === authUser.email?.toLowerCase()) {
      return NextResponse.json(
        { error: 'New email must be different from current email' },
        { status: 400 }
      )
    }

    // Verify current password by attempting to sign in
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    // Create a temporary client to verify password
    const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
    
    const { data: { user: verifyUser }, error: signInError } = await tempSupabase.auth.signInWithPassword({
      email: authUser.email!,
      password: password,
    })

    if (signInError || !verifyUser) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      )
    }

    // Check if new email is already in use
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', newEmail.toLowerCase())
      .single()

    if (existingUser && existingUser.id !== authUser.id) {
      return NextResponse.json(
        { error: 'This email is already in use by another account' },
        { status: 400 }
      )
    }

    // Update email in Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      email: newEmail.toLowerCase(),
    })

    if (updateError) {
      console.error('Error updating email:', updateError)
      return NextResponse.json(
        { error: updateError.message || 'Failed to update email' },
        { status: 400 }
      )
    }

    // Refresh the session to ensure the new email is available immediately
    await supabase.auth.refreshSession()

    // Update email in users table
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ email: newEmail.toLowerCase() })
      .eq('id', authUser.id)

    if (userUpdateError) {
      console.error('Error updating user email in database:', userUpdateError)
      // Note: Auth email was updated, but users table update failed
      // This is not critical as auth.email is the source of truth
    }

    // Get user profile for audit log
    const { data: userProfile } = await supabase
      .from('users')
      .select('id, email, role, company_id')
      .eq('id', authUser.id)
      .single()

    // Log audit action
    if (userProfile) {
      const supabaseAdmin = await import('@/lib/supabase/client').then(m => m.createSupabaseAdmin())
      await supabaseAdmin.from('audit_logs').insert({
        user_id: authUser.id,
        company_id: userProfile.company_id,
        action: 'email_changed',
        details: {
          user_id: authUser.id,
          old_email: authUser.email,
          new_email: newEmail.toLowerCase(),
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Email updated successfully. Please check your new email for verification.',
    })
  } catch (error: any) {
    console.error('Error in change email API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

