'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function useSuspensionCheck(role: string) {
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (role !== 'park_operator') return

    let checkInterval: NodeJS.Timeout | null = null

    const checkSuspension = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get user profile
        const { data: profile } = await supabase
          .from('users')
          .select('role, company_id')
          .eq('id', user.id)
          .single()

        if (!profile || profile.role !== 'park_operator') return

        // Get company_id from profile or operator table
        let companyId = profile.company_id

        // Get operator info
        const { data: operator } = await supabase
          .from('park_operators')
          .select('id, status, company_id')
          .eq('user_id', user.id)
          .single()

        if (!operator) return

        // Use company_id from operator if not in profile
        if (!companyId) {
          companyId = operator.company_id
        }

        // Check if company is suspended
        if (companyId) {
          const { data: company } = await supabase
            .from('companies')
            .select('status, name')
            .eq('id', companyId)
            .single()

          if (company && company.status === 'suspended') {
            // Immediately sign out and redirect
            await supabase.auth.signOut()
            // Use window.location for immediate redirect (can't use router if component is unmounting)
            window.location.href = '/login?reason=suspended&message=' + encodeURIComponent(`Your company account "${company.name}" has been suspended.`)
            return
          }
        }

        // Check if operator is suspended
        if (operator.status === 'suspended') {
          // Immediately sign out and redirect
          await supabase.auth.signOut()
          // Use window.location for immediate redirect (can't use router if component is unmounting)
          window.location.href = '/login?reason=suspended&message=' + encodeURIComponent('Your operator account has been suspended.')
          return
        }
      } catch (error) {
        console.error('Error checking suspension status:', error)
      }
    }

    // Check immediately on mount
    checkSuspension()

    // Check every 30 seconds to catch suspensions that happen while logged in
    checkInterval = setInterval(checkSuspension, 30000)

    // Also check when page becomes visible (user switches tabs/windows)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSuspension()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (checkInterval) {
        clearInterval(checkInterval)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [role, router, supabase])
}

