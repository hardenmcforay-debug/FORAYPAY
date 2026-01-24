/**
 * CSRF Protection Utilities
 * 
 * Provides CSRF token generation and validation to prevent
 * Cross-Site Request Forgery attacks.
 */

import { cookies } from 'next/headers'
import crypto from 'crypto'

const CSRF_TOKEN_COOKIE = 'csrf-token'
const CSRF_TOKEN_HEADER = 'x-csrf-token'
const CSRF_TOKEN_EXPIRY = 60 * 60 * 24 // 24 hours

/**
 * Generate a secure CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Get CSRF token from cookies
 */
export async function getCSRFToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(CSRF_TOKEN_COOKIE)?.value || null
}

/**
 * Set CSRF token in cookie
 */
export async function setCSRFToken(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(CSRF_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: CSRF_TOKEN_EXPIRY,
    path: '/',
  })
}

/**
 * Validate CSRF token
 */
export async function validateCSRFToken(
  headerToken: string | null
): Promise<boolean> {
  if (!headerToken) {
    return false
  }
  
  const cookieToken = await getCSRFToken()
  
  if (!cookieToken) {
    return false
  }
  
  // Use constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(headerToken),
    Buffer.from(cookieToken)
  )
}

/**
 * Middleware to validate CSRF token for state-changing requests
 */
export async function requireCSRF(
  request: Request,
  method: string
): Promise<{ valid: boolean; error?: string }> {
  // Only validate state-changing methods
  const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE']
  
  if (!stateChangingMethods.includes(method)) {
    return { valid: true }
  }
  
  // Skip CSRF for webhooks (they use different authentication)
  const url = new URL(request.url)
  if (url.pathname.startsWith('/api/webhooks/')) {
    return { valid: true }
  }
  
  const headerToken = request.headers.get(CSRF_TOKEN_HEADER)
  const isValid = await validateCSRFToken(headerToken)
  
  if (!isValid) {
    return {
      valid: false,
      error: 'Invalid or missing CSRF token',
    }
  }
  
  return { valid: true }
}

