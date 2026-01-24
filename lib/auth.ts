// Server-side auth utilities (for use in Server Components only)
import { createServerSupabaseClient } from './supabase/server'
import { UserRole } from '@/types/database'
import { redirect } from 'next/navigation'

export async function getCurrentUser() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return userProfile
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
      return '/admin/login'
    case 'company_admin':
    case 'park_operator':
    default:
      return '/login'
  }
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role)) {
    redirect('/unauthorized')
  }

  // Check if company is suspended (for company_admin and park_operator)
  let companyId = user.company_id
  const supabase = createServerSupabaseClient()
  
  // For park operators, get company_id from park_operators table if not in users table
  if (user.role === 'park_operator' && !companyId) {
    const { data: operator } = await supabase
      .from('park_operators')
      .select('company_id, status, name')
      .eq('user_id', user.id)
      .single()

    if (operator) {
      // Check if operator is suspended
      if (operator.status === 'suspended') {
        redirect('/unauthorized?reason=suspended')
      }
      companyId = operator.company_id
    }
  }

  // Check if company is suspended
  if ((user.role === 'company_admin' || user.role === 'park_operator') && companyId) {
    const { data: company } = await supabase
      .from('companies')
      .select('status, name')
      .eq('id', companyId)
      .single()

    if (company && company.status === 'suspended') {
      redirect('/unauthorized?reason=suspended')
    }
  }

  return user
}

