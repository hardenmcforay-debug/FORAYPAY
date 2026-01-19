import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If user is logged in, redirect to their dashboard
  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData) {
      if (userData.role === 'platform_admin') {
        redirect('/platform/dashboard')
      } else if (userData.role === 'company_admin') {
        redirect('/company/dashboard')
      } else if (userData.role === 'park_operator') {
        redirect('/operator/dashboard')
      }
    }
    redirect('/login')
  }

  // If not logged in, show landing page
  redirect('/landing')
}

