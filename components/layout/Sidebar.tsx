'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { getImageUrl } from '@/lib/supabase/storage'
import { 
  LayoutDashboard, 
  Building2, 
  Route, 
  Users, 
  TrendingUp,
  Settings,
  Ticket,
  FileText,
  ClipboardList,
  QrCode,
  Mail,
  Menu,
  X
} from 'lucide-react'
import { UserRole } from '@/types/database'

interface SidebarProps {
  role: UserRole
  companyId?: string | null
  isMenuOpen?: boolean
  onMenuClose?: () => void
}

const platformAdminNav = [
  { name: 'Dashboard', href: '/platform', icon: LayoutDashboard },
  { name: 'Companies', href: '/platform/companies', icon: Building2 },
  { name: 'Contact Requests', href: '/platform/contact-requests', icon: Mail },
  { name: 'Audit Logs', href: '/platform/audit-logs', icon: ClipboardList },
  { name: 'Settings', href: '/platform/settings', icon: Settings },
]

const companyAdminNav = [
  { name: 'Dashboard', href: '/company', icon: LayoutDashboard },
  { name: 'Routes', href: '/company/routes', icon: Route },
  { name: 'Park Operators', href: '/company/operators', icon: Users },
  { name: 'Reports', href: '/company/reports', icon: FileText },
  { name: 'Settings', href: '/company/settings', icon: Settings },
]

const parkOperatorNav = [
  { name: 'Dashboard', href: '/operator', icon: LayoutDashboard },
  { name: 'Generate Tickets', href: '/operator/generate', icon: QrCode },
  { name: 'Validate Tickets', href: '/operator/validate', icon: Ticket },
  { name: 'Trip Dashboard', href: '/operator/trips', icon: TrendingUp },
]

interface SidebarProps {
  role: UserRole
  companyId?: string | null
  isMenuOpen?: boolean
  onMenuClose?: () => void
}

export default function Sidebar({ role, companyId, isMenuOpen = false, onMenuClose }: SidebarProps) {
  const pathname = usePathname()
  
  const navItems = 
    role === 'platform_admin' ? platformAdminNav :
    role === 'company_admin' ? companyAdminNav :
    parkOperatorNav

  // Close mobile menu when route changes
  useEffect(() => {
    if (onMenuClose) {
      onMenuClose()
    }
  }, [pathname, onMenuClose])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen])

  return (
    <>
      {/* Mobile Overlay */}
      {isMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-[45]"
          onClick={onMenuClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-50 w-64 bg-white border-r border-gray-200 h-screen transition-transform duration-300 ease-in-out',
          'lg:translate-x-0',
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden relative flex-shrink-0">
              <Image 
                src={getImageUrl('logo.png')} 
                alt="ForayPay Logo" 
                width={80} 
                height={80} 
                quality={100}
                className="object-contain w-full h-full"
              />
            </div>
            <span className="text-lg lg:text-xl font-bold whitespace-nowrap">
              <span className="text-primary-600">Foray</span>
              <span className="text-success-600">Pay</span>
            </span>
          </div>
        </div>
        
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-80px)]">
          {navItems.map((item) => {
            // For base dashboard routes, only match exactly
            // For other routes, match if pathname starts with the href
            const isBaseRoute = item.href === '/operator' || item.href === '/company' || item.href === '/platform'
            const isActive = isBaseRoute 
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMenuClose}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm lg:text-base',
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="whitespace-nowrap">{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

