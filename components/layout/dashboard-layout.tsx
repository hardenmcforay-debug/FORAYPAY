'use client'

import { ReactNode } from 'react'
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

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role={role} companyId={companyId} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userEmail={userEmail} userName={userName} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

