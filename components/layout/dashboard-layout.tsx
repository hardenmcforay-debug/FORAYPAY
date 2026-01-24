'use client'

import { ReactNode, useState } from 'react'
import Sidebar from './sidebar'
import Header from './header'
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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role={role} companyId={companyId} isMenuOpen={isMenuOpen} onMenuClose={closeMenu} />
      <div className="flex-1 flex flex-col overflow-hidden w-full lg:w-auto">
        <Header 
          userEmail={userEmail} 
          userName={userName} 
          onMenuToggle={toggleMenu}
          isMenuOpen={isMenuOpen}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

