'use client'

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
  Mail
} from 'lucide-react'
import { UserRole } from '@/types/database'

interface SidebarProps {
  role: UserRole
  companyId?: string | null
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

export default function Sidebar({ role, companyId }: SidebarProps) {
  const pathname = usePathname()
  
  const navItems = 
    role === 'platform_admin' ? platformAdminNav :
    role === 'company_admin' ? companyAdminNav :
    parkOperatorNav

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden relative">
            <Image 
              src={getImageUrl('logo.png')} 
              alt="ForayPay Logo" 
              width={80} 
              height={80} 
              quality={100}
              className="object-contain w-full h-full"
            />
          </div>
          <span className="text-xl font-bold">
            <span className="text-primary-600">Foray</span>
            <span className="text-success-600">Pay</span>
          </span>
        </div>
      </div>
      
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

