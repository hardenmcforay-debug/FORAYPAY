import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { securityHeadersMiddleware } from '@/lib/security/security-headers'

/**
 * Middleware to add security headers and perform security checks
 */
export async function middleware(request: NextRequest) {
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
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

