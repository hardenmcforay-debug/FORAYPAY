'use client'

import { Menu, User } from 'lucide-react'
import Button from '@/components/ui/Button'

interface HeaderProps {
  user: {
    full_name: string
    email: string
    role: string
  }
  onMenuClick?: () => void
}

export default function Header({ user, onMenuClick }: HeaderProps) {
  const roleLabels = {
    platform_admin: 'Platform Admin',
    company_admin: 'Company Admin',
    park_operator: 'Park Operator',
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 gap-3">
      <div className="flex items-center min-w-0 gap-3">
        <div className="md:hidden">
          <Button
            type="button"
            variant="ghost"
            className="px-2"
            onClick={onMenuClick}
            disabled={!onMenuClick}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
          {roleLabels[user.role as keyof typeof roleLabels]}
        </h2>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary-100 shrink-0">
            <User className="h-5 w-5 text-primary-600" />
          </div>
          <div className="text-right min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate max-w-[10rem] sm:max-w-[16rem]">
              {user.full_name}
            </p>
            <p className="hidden sm:block text-xs text-gray-500 truncate max-w-[16rem]">
              {user.email}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}

