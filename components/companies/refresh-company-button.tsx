'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

interface RefreshCompanyButtonProps {
  companyId: string
}

export default function RefreshCompanyButton({ companyId }: RefreshCompanyButtonProps) {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Refresh the router to reload server components
      router.refresh()
      
      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 500))
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="flex items-center gap-2"
    >
      <RefreshCw 
        className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
      />
      {isRefreshing ? 'Refreshing...' : 'Refresh'}
    </Button>
  )
}

