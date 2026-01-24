'use client'

import { useState, useEffect } from 'react'
import { LogOut, User } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/button'
import { getLoginPath } from '@/lib/auth-client'

interface HeaderProps {
  userEmail?: string
  userName?: string
}

export default function Header({ userEmail: propUserEmail, userName }: HeaderProps) {
  const router = useRouter()
  const supabase = createSupabaseClient()
  const [userEmail, setUserEmail] = useState<string>(propUserEmail || '')

  // Fetch email from auth to always show the latest
  useEffect(() => {
    const fetchEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setUserEmail(user.email)
      } else if (propUserEmail) {
        setUserEmail(propUserEmail)
      }
    }

    fetchEmail()

    // Listen for auth state changes (e.g., email updates)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, propUserEmail])

  const handleLogout = async () => {
    // Get user role before signing out
    const { data: { user } } = await supabase.auth.getUser()
    let userRole: string | undefined
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      userRole = profile?.role
    }
    
    await supabase.auth.signOut()
    
    // Redirect to appropriate login page based on role
    const loginPath = getLoginPath(userRole as any)
    router.push(loginPath)
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-gray-900">
          {userName || 'Dashboard'}
        </h1>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="w-4 h-4" />
          <span>{userEmail}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </header>
  )
}

