// Client-side auth utilities (for use in 'use client' components)
import { UserRole } from '@/types/database'
import { getAdminUrl, getMainUrl, isAdminDomain } from '@/lib/domain'

export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'platform_admin':
      // Platform admin dashboard should always be on admin domain
      const path = '/platform'
      if (typeof window !== 'undefined' && isAdminDomain()) {
        return path
      }
      return getAdminUrl(path)
    case 'company_admin':
      return '/company'
    case 'park_operator':
      return '/operator'
    default:
      return '/'
  }
}

export function getLoginPath(role?: UserRole): string {
  switch (role) {
    case 'platform_admin':
      // Platform admin login should always be on admin domain
      const path = '/admin/login'
      if (typeof window !== 'undefined' && isAdminDomain()) {
        return path
      }
      return getAdminUrl(path)
    case 'company_admin':
    case 'park_operator':
    default:
      return '/login'
  }
}

