import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { validatePassword } from '@/lib/security/input-validator'
import { createErrorResponse } from '@/lib/security/error-handler'

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    // Validate password strength (strong password requirements)
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error || 'Password does not meet security requirements' },
        { status: 400 }
      )
    }

    // Verify current password by attempting to sign in with a temporary client
    // We need to verify the password without affecting the current session
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    // Create a temporary client to verify password (without cookie persistence)
    const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
    
    const { data: { user: verifyUser }, error: signInError } = await tempSupabase.auth.signInWithPassword({
      email: authUser.email!,
      password: currentPassword,
    })

    if (signInError || !verifyUser) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      )
    }

    // Update password using the original authenticated client
    // The session is still valid from the original client
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json(
        { error: updateError.message || 'Failed to update password' },
        { status: 400 }
      )
    }

    // Refresh session to ensure password change is reflected
    await supabase.auth.refreshSession()

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
        action: 'password_changed',
        details: {
          user_id: authUser.id,
          user_email: userProfile.email,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    })
  } catch (error: unknown) {
    return createErrorResponse(error, 500, 'change-password')
  }
}

