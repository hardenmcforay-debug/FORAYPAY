// Server-side auth utilities (for use in Server Components only)
import { createServerSupabaseClient } from './supabase/server'
import { UserRole } from '@/types/database'
import { redirect } from 'next/navigation'
import { getAdminUrl } from '@/lib/domain'

export async function getCurrentUser() {
  try {
    const supabase = createServerSupabaseClient()
    
    // Use getUser() directly - it validates the session and gets the user in one call
    // This is the recommended approach for server-side auth with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      // Check if it's a JWT expired or invalid token error
      if (authError.message?.includes('JWT') || authError.message?.includes('token') || authError.status === 401) {
        console.log('Authentication token invalid or expired - user needs to re-authenticate')
        return null
      }
      
      console.error('Auth error in getCurrentUser:', authError)
      console.error('Auth error details:', {
        message: authError.message,
        status: authError.status,
        name: authError.name
      })
      return null
    }
    
    if (!user) {
      console.log('No user found in getCurrentUser - user not authenticated')
      return null
    }

    // Get user profile from database
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error in getCurrentUser:', profileError)
      console.error('Profile error details:', {
        message: profileError.message,
        code: profileError.code,
        details: profileError.details,
        hint: profileError.hint
      })
      return null
    }

    if (!userProfile) {
      console.log('User profile not found in database for user:', user.id)
      return null
    }

    return userProfile
  } catch (error: any) {
    // Re-throw redirect errors so Next.js can handle them properly
    if (error?.digest?.startsWith('NEXT_REDIRECT') || error?.message === 'NEXT_REDIRECT') {
      throw error
    }
    
    console.error('Error in getCurrentUser:', error)
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    })
    return null
  }
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }
  return user
}

export function getLoginPathForRole(role?: UserRole): string {
  switch (role) {
    case 'platform_admin':
      // Platform admin login should always be on admin domain
      return getAdminUrl('/admin/login')
    case 'company_admin':
    case 'park_operator':
    default:
      return '/login'
  }
}

export async function requireRole(allowedRoles: UserRole[]) {
  try {
    const user = await requireAuth()
    if (!user) {
      console.error('requireRole: No user returned from requireAuth')
      redirect('/login?error=auth_failed')
    }
    
    console.log('requireRole: User authenticated:', {
      id: user.id,
      email: user.email,
      role: user.role,
      company_id: user.company_id
    })
    
    if (!allowedRoles.includes(user.role)) {
      console.error('requireRole: User role not allowed:', {
        userRole: user.role,
        allowedRoles
      })
      // Redirect platform admins to admin domain for unauthorized
      if (user.role === 'platform_admin') {
        redirect(getAdminUrl('/unauthorized'))
      }
      redirect('/unauthorized')
    }

    // Check if company is suspended (for company_admin and park_operator)
    let companyId = user.company_id
    const supabase = createServerSupabaseClient()
  
    // For park operators, get company_id from park_operators table if not in users table
    if (user.role === 'park_operator' && !companyId) {
      const { data: operator, error: operatorError } = await supabase
        .from('park_operators')
        .select('company_id, status, name')
        .eq('user_id', user.id)
        .single()

      if (operatorError) {
        console.error('Error fetching park operator:', operatorError)
      }

      if (operator) {
        // Check if operator is suspended
        if (operator.status === 'suspended') {
          redirect('/unauthorized?reason=suspended')
        }
        companyId = operator.company_id
      }
    }

    // Check if company is suspended (only if company_id exists)
    if ((user.role === 'company_admin' || user.role === 'park_operator') && companyId) {
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('status, name')
        .eq('id', companyId)
        .single()

      if (companyError) {
        console.error('Error fetching company:', companyError)
        // Don't fail if company lookup fails - just log it
      }

      if (company && company.status === 'suspended') {
        redirect('/unauthorized?reason=suspended')
      }
    }

    // For company_admin, warn if no company_id but don't block (let the page handle it)
    if (user.role === 'company_admin' && !companyId) {
      console.warn('Company admin has no company_id assigned:', user.id)
    }

    return user
  } catch (error: any) {
    // Re-throw redirect errors so Next.js can handle them properly
    // Next.js redirect() throws a special error that should not be caught
    if (error?.digest?.startsWith('NEXT_REDIRECT') || error?.message === 'NEXT_REDIRECT') {
      throw error
    }
    
    console.error('Error in requireRole:', error)
    console.error('Error stack:', error?.stack)
    
    // Provide more specific error information
    const errorMessage = error?.message || 'Unknown error'
    
    // If it's an environment variable error, provide helpful message
    if (errorMessage.includes('NEXT_PUBLIC_SUPABASE_URL') || 
        errorMessage.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
        errorMessage.includes('not set') ||
        errorMessage.includes('environment variables')) {
      console.error('Missing Supabase environment variables. Please configure them in Vercel.')
      console.error('See VERCEL_ENV_SETUP.md for instructions.')
    }
    
    // If there's an error (e.g., missing env vars), redirect to login
    redirect('/login?error=auth_failed')
  }
}

