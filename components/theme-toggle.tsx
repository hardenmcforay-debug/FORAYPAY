'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/contexts/theme-context'
import Button from '@/components/ui/button'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return a placeholder during SSR to prevent hydration mismatch
    return (
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2"
        aria-label="Theme toggle"
        disabled
      >
        <Sun className="w-4 h-4 opacity-0" />
        <span className="hidden sm:inline opacity-0">Theme</span>
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="w-4 h-4" />
      ) : (
        <Sun className="w-4 h-4" />
      )}
      <span className="hidden sm:inline">
        {theme === 'light' ? 'Dark' : 'Light'}
      </span>
    </Button>
  )
}

