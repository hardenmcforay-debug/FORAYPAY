// Client-side auth utilities (for use in 'use client' components)
import { UserRole } from '@/types/database'

export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'platform_admin':
      return '/platform'
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
      return '/admin/login'
    case 'company_admin':
    case 'park_operator':
    default:
      return '/login'
  }
}

