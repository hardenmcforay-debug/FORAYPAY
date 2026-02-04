'use client'

import { ReactNode, useState, useCallback } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { UserRole } from '@/types/database'
import { useSuspensionCheck } from '@/hooks/use-suspension-check'

interface DashboardLayoutProps {
  children: ReactNode
  role: UserRole
  companyId?: string | null
  userEmail?: string
  userName?: string
}

export default function DashboardLayout({
  children,
  role,
  companyId,
  userEmail,
  userName,
}: DashboardLayoutProps) {
  // Check for suspension on every page load and periodically
  useSuspensionCheck(role)
  
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev)
  }, [])

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false)
  }, [])

  // Handle clicking on empty space to open menu (mobile only)
  const handleMainClick = (e: React.MouseEvent<HTMLElement>) => {
    // Only on mobile (lg breakpoint and below)
    // Only if menu is closed
    if (typeof window !== 'undefined' && window.innerWidth < 1024 && !isMenuOpen) {
      const target = e.target as HTMLElement
      
      // Don't open menu if clicking on interactive elements
      const isInteractive = target.closest('button, a, input, select, textarea, label, [role="button"], [onClick]')
      
      if (!isInteractive) {
        // Open menu when clicking on empty space
        toggleMenu()
        e.stopPropagation()
      }
    }
  }

  return (
    <div className="flex h-screen bg-[#0a1929]">
      <Sidebar role={role} companyId={companyId} isMenuOpen={isMenuOpen} onMenuClose={closeMenu} />
      <div className="flex-1 flex flex-col overflow-hidden w-full lg:w-auto">
        <Header 
          userEmail={userEmail} 
          userName={userName} 
          onMenuToggle={toggleMenu}
          isMenuOpen={isMenuOpen}
        />
        <main 
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:cursor-default"
          onClick={handleMainClick}
          style={{ cursor: typeof window !== 'undefined' && window.innerWidth < 1024 && !isMenuOpen ? 'pointer' : 'default' }}
        >
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

