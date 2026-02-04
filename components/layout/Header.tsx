'use client'

import { useState, useEffect } from 'react'
import { LogOut, User, Menu, X } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/button'
import { getLoginPath } from '@/lib/auth-client'

interface HeaderProps {
  userEmail?: string
  userName?: string
  onMenuToggle?: () => void
  isMenuOpen?: boolean
}

export default function Header({ userEmail: propUserEmail, userName, onMenuToggle, isMenuOpen }: HeaderProps) {
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
    <header className="h-14 sm:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-3 sm:px-4 lg:px-6 z-40 relative">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {/* Hamburger Menu Button - Always visible on mobile/tablet screens */}
        {onMenuToggle && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onMenuToggle()
            }}
            className="lg:hidden p-2 -ml-1 sm:-ml-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors flex-shrink-0 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center z-40 relative"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            type="button"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 sm:w-7 sm:h-7 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 sm:w-7 sm:h-7 text-gray-700" />
            )}
          </button>
        )}
        <h1 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 break-words min-w-0 truncate">
          {userName || 'Dashboard'}
        </h1>
      </div>
      
      <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-4 flex-shrink-0">
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
          <User className="w-4 h-4 flex-shrink-0" />
          <span className="truncate max-w-[150px] lg:max-w-none">{userEmail}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-1.5 sm:p-2"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  )
}

