'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  Route,
  Users,
  FileText,
  Settings,
  Ticket,
  CheckCircle,
  BarChart3,
  Shield,
  LogOut,
  Calendar,
  Mail,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { getValidImageUrl } from '@/lib/utils/image-helpers'

interface SidebarProps {
  role: 'platform_admin' | 'company_admin' | 'park_operator'
  onNavigate?: () => void
}

export default function Sidebar({ role, onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [logoError, setLogoError] = useState(false)
  const [useImgTag, setUseImgTag] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Fetch logo from Supabase storage
  useEffect(() => {
    // Try nav-logo.png first, then fallback to logo.png
    let fetchedUrl = getValidImageUrl(supabase, 'landing-images', 'logo/nav-logo.png', true)
    if (!fetchedUrl) {
      fetchedUrl = getValidImageUrl(supabase, 'landing-images', 'logo/logo.png', true)
    }
    if (fetchedUrl) {
      setLogoUrl(fetchedUrl)
    } else {
      // Fallback to public folder
      setLogoUrl('/logo.png')
    }
  }, [supabase])

  // Use Supabase URL if available, otherwise fallback to public folder
  const logoPath = logoUrl || '/logo.png'

  const platformAdminLinks = [
    { href: '/platform/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/platform/companies', label: 'Companies', icon: Building2 },
    { href: '/platform/contact-requests', label: 'Contact Requests', icon: Mail },
    { href: '/platform/commission-rules', label: 'Commission Rules', icon: FileText },
    { href: '/platform/audit-logs', label: 'Audit Logs', icon: Shield },
    { href: '/platform/users', label: 'Users', icon: Users },
    { href: '/platform/settings', label: 'Settings', icon: Settings },
  ]

  const companyAdminLinks = [
    { href: '/company/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/company/routes', label: 'Routes', icon: Route },
    { href: '/company/operators', label: 'Park Operators', icon: Users },
    { href: '/company/reports', label: 'Reports', icon: BarChart3 },
    { href: '/company/transactions', label: 'Transactions', icon: FileText },
    { href: '/company/settings', label: 'Settings', icon: Settings },
  ]

  const operatorLinks = [
    { href: '/operator/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/operator/validate', label: 'Validate Ticket', icon: CheckCircle },
    { href: '/operator/tickets', label: 'Generate Tickets', icon: Ticket },
    { href: '/operator/trips', label: 'Active Trips', icon: Ticket },
    { href: '/operator/history', label: 'History', icon: FileText },
  ]

  const links = role === 'platform_admin' 
    ? platformAdminLinks 
    : role === 'company_admin' 
    ? companyAdminLinks 
    : operatorLinks

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 gap-2">
        {!logoError ? (
          useImgTag ? (
            <img
              src={logoPath}
              alt="Foraypay Logo"
              className="w-8 h-8 object-contain flex-shrink-0"
              loading="eager"
              decoding="async"
              onError={() => {
                console.log('Sidebar logo image failed to load, falling back to icon')
                setLogoError(true)
              }}
            />
          ) : (
            <div className="relative w-8 h-8 flex-shrink-0">
              <Image
                src={logoPath}
                alt="Foraypay Logo"
                fill
                className="object-contain"
                onError={() => {
                  console.log('Sidebar Next.js Image failed, trying regular img tag')
                  setUseImgTag(true)
                }}
                priority
                quality={85}
                sizes="32px"
                loading="eager"
              />
            </div>
          )
        ) : (
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-600 flex-shrink-0">
            <Ticket className="h-5 w-5 text-white" />
          </div>
        )}
        <h1 className="text-xl font-bold">
          <span className="text-primary-600 font-bold">Foray</span>
          <span className="text-success-600">pay</span>
        </h1>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href || pathname?.startsWith(link.href + '/')
          
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              <Icon className="mr-3 h-5 w-5" />
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  )
}

