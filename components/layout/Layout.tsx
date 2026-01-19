import { ReactNode } from 'react'
import AuthedShell from './AuthedShell'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

interface LayoutProps {
  children: ReactNode
  role: 'platform_admin' | 'company_admin' | 'park_operator'
}

export default async function Layout({ children, role }: LayoutProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('full_name, email, role')
    .eq('id', user.id)
    .single()

  if (!userData || userData.role !== role) {
    redirect('/login')
  }

  return (
    <AuthedShell role={role} user={userData}>
      {children}
    </AuthedShell>
  )
}

