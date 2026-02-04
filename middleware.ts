import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { securityHeadersMiddleware } from '@/lib/security/security-headers'
import { isAdminDomain, isPlatformAdminRoute, getAdminUrl, getMainUrl } from '@/lib/domain'

/**
 * Middleware to add security headers, perform security checks, and handle domain-based routing
 */
export async function middleware(request: NextRequest) {
  // Skip middleware for image optimization and static assets
  const pathname = request.nextUrl.pathname
  if (
    pathname.startsWith('/_next/image') ||
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|avif)$/i)
  ) {
    return NextResponse.next()
  }
  
  const hostHeader = request.headers.get('host') || ''
  const isOnAdminDomain = isAdminDomain(hostHeader)
  const isPlatformAdminPath = isPlatformAdminRoute(pathname)
  
  // Redirect platform admin routes to admin domain if not already there
  if (isPlatformAdminPath && !isOnAdminDomain) {
    const adminUrl = getAdminUrl(pathname)
    return NextResponse.redirect(adminUrl)
  }
  
  // Redirect non-platform admin routes away from admin domain
  // Allow root path and API routes on admin domain
  if (isOnAdminDomain && !isPlatformAdminPath && pathname !== '/' && !pathname.startsWith('/api')) {
    const mainUrl = getMainUrl(pathname)
    return NextResponse.redirect(mainUrl)
  }
  
  // Apply security headers
  const response = securityHeadersMiddleware(request)
  
  // Additional security checks can be added here
  // - Rate limiting
  // - IP blocking
  // - Request size limits
  // etc.
  
  return response
}

export const config = {
  /*
   * Match all request paths.
   * The exclusion logic for static files, images, and favicons
   * is handled in the middleware function itself.
   * 
   * Omitting matcher to run on all routes (Next.js 16 compatible).
   * Exclusions are handled in the middleware function.
   */
}

