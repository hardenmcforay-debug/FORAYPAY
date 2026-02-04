/**
 * Domain utility functions for handling admin domain routing
 */

/**
 * Get the admin domain from environment variables
 * Falls back to localhost for development
 */
export function getAdminDomain(): string {
  if (typeof window !== 'undefined') {
    // Client-side: use current hostname if on admin domain, otherwise use env var
    const hostname = window.location.hostname
    const adminDomain = process.env.NEXT_PUBLIC_ADMIN_DOMAIN
    
    // If we're already on the admin domain, use it
    if (adminDomain && hostname === adminDomain) {
      return window.location.origin
    }
    
    // Otherwise construct from env var
    if (adminDomain) {
      const protocol = window.location.protocol
      return `${protocol}//${adminDomain}`
    }
    
    // Development fallback
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://admin.localhost:3000'
    }
    
    return window.location.origin
  }
  
  // Server-side: use environment variable
  const adminDomain = process.env.NEXT_PUBLIC_ADMIN_DOMAIN
  if (adminDomain) {
    return `https://${adminDomain}`
  }
  
  // Development fallback
  return 'http://admin.localhost:3000'
}

/**
 * Get the main domain from environment variables
 * Falls back to localhost for development
 */
export function getMainDomain(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  
  // Server-side: use environment variable
  const mainDomain = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_MAIN_DOMAIN
  if (mainDomain) {
    try {
      const url = new URL(mainDomain)
      return url.origin
    } catch {
      return `https://${mainDomain}`
    }
  }
  
  // Development fallback
  return 'http://localhost:3000'
}

/**
 * Extract hostname from host header (removes port if present)
 */
function extractHostname(host: string): string {
  // Remove port if present (e.g., "admin.localhost:3000" -> "admin.localhost")
  return host.split(':')[0]
}

/**
 * Check if the current request is on the admin domain
 */
export function isAdminDomain(hostname?: string): boolean {
  if (typeof window !== 'undefined') {
    const currentHostname = hostname ? extractHostname(hostname) : window.location.hostname
    const adminDomain = process.env.NEXT_PUBLIC_ADMIN_DOMAIN
    
    if (adminDomain) {
      return currentHostname === extractHostname(adminDomain)
    }
    
    // Development: check for admin.localhost
    return currentHostname === 'admin.localhost' || currentHostname === 'admin.127.0.0.1'
  }
  
  // Server-side
  if (hostname) {
    const cleanHostname = extractHostname(hostname)
    const adminDomain = process.env.NEXT_PUBLIC_ADMIN_DOMAIN
    if (adminDomain) {
      return cleanHostname === extractHostname(adminDomain)
    }
    return cleanHostname === 'admin.localhost' || cleanHostname === 'admin.127.0.0.1'
  }
  
  return false
}

/**
 * Get the full URL for a path on the admin domain
 */
export function getAdminUrl(path: string): string {
  const adminDomain = getAdminDomain()
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${adminDomain}${cleanPath}`
}

/**
 * Get the full URL for a path on the main domain
 */
export function getMainUrl(path: string): string {
  const mainDomain = getMainDomain()
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${mainDomain}${cleanPath}`
}

/**
 * Check if a path is a platform admin route
 */
export function isPlatformAdminRoute(pathname: string): boolean {
  return (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/platform') ||
    pathname === '/admin/login'
  )
}

