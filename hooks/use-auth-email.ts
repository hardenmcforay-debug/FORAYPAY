'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

/**
 * Hook to get the current user's email from auth
 * This ensures the email is always up-to-date
 */
export function useAuthEmail(initialEmail?: string) {
  const supabase = createClientComponentClient()
  const [email, setEmail] = useState<string>(initialEmail || '')

  useEffect(() => {
    const fetchEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setEmail(user.email)
      } else if (initialEmail) {
        setEmail(initialEmail)
      }
    }

    fetchEmail()

    // Listen for auth state changes (e.g., email updates)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.email) {
        setEmail(session.user.email)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, initialEmail])

  return email
}

