'use client'

import { ReactNode, useEffect, useState } from 'react'
import AuthedShell from './AuthedShell'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Loading from '@/components/ui/Loading'

interface ClientLayoutProps {
  children: ReactNode
  role: 'platform_admin' | 'company_admin' | 'park_operator'
}

export default function ClientLayout({ children, role }: ClientLayoutProps) {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkAuth() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/login')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('full_name, email, role')
        .eq('id', authUser.id)
        .single()

      if (!userData || userData.role !== role) {
        router.push('/login')
        return
      }

      setUser(userData)
      setIsLoading(false)
    }

    checkAuth()
  }, [role, router, supabase])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loading size="lg" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <AuthedShell role={role} user={user}>
      {children}
    </AuthedShell>
  )
}

