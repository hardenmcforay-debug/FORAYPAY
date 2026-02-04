'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthRetry() {
  const router = useRouter()

  useEffect(() => {
    // Retry after a short delay to allow cookies to propagate
    const timer = setTimeout(() => {
      router.refresh()
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="p-6">
      <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-warning-900 mb-2">Loading Dashboard...</h2>
        <p className="text-warning-700 mb-2">
          Please wait while we verify your session. If this page doesn't load, please try refreshing.
        </p>
      </div>
    </div>
  )
}

