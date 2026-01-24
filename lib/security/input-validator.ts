/**
 * Input Validation and Sanitization Utilities
 * 
 * Provides secure input validation to prevent injection attacks,
 * XSS, and other security vulnerabilities.
 */

import { z } from 'zod'

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid('Invalid UUID format')

/**
 * Email validation schema
 */
export const emailSchema = z.string().email('Invalid email format').max(255)

/**
 * Phone number validation schema (basic)
 */
export const phoneSchema = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .max(20)

/**
 * OTP validation schema (6 digits)
 */
export const otpSchema = z.string()
  .regex(/^\d{6}$/, 'OTP must be exactly 6 digits')
  .length(6)

/**
 * Password validation schema (strong password)
 */
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

/**
 * Company name validation schema
 */
export const companyNameSchema = z.string()
  .min(2, 'Company name must be at least 2 characters')
  .max(100, 'Company name is too long')
  .regex(/^[a-zA-Z0-9\s\-_&.]+$/, 'Company name contains invalid characters')

/**
 * Route name validation schema
 */
export const routeNameSchema = z.string()
  .min(2, 'Route name must be at least 2 characters')
  .max(100, 'Route name is too long')

/**
 * Sanitize string input (remove dangerous characters)
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }
  
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '')
  
  // Trim whitespace
  sanitized = sanitized.trim()
  
  // Remove control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
  
  return sanitized
}

/**
 * Sanitize HTML input (basic XSS prevention)
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Validate and sanitize UUID
 */
export function validateUUID(input: unknown): string | null {
  try {
    const result = uuidSchema.parse(input)
    return result
  } catch {
    return null
  }
}

/**
 * Validate and sanitize email
 */
export function validateEmail(input: unknown): string | null {
  try {
    const result = emailSchema.parse(input)
    return sanitizeString(result.toLowerCase())
  } catch {
    return null
  }
}

/**
 * Validate and sanitize phone number
 */
export function validatePhone(input: unknown): string | null {
  try {
    const result = phoneSchema.parse(input)
    return sanitizeString(result)
  } catch {
    return null
  }
}

/**
 * Validate and sanitize OTP
 */
export function validateOTP(input: unknown): string | null {
  try {
    const result = otpSchema.parse(input)
    return result
  } catch {
    return null
  }
}

/**
 * Validate password strength
 */
export function validatePassword(input: unknown): { valid: boolean; error?: string } {
  try {
    passwordSchema.parse(input)
    return { valid: true }
  } catch (error: any) {
    return {
      valid: false,
      error: error.errors?.[0]?.message || 'Invalid password format',
    }
  }
}

/**
 * Validate company name
 */
export function validateCompanyName(input: unknown): string | null {
  try {
    const result = companyNameSchema.parse(input)
    return sanitizeString(result)
  } catch {
    return null
  }
}

/**
 * Validate amount (positive number)
 */
export function validateAmount(input: unknown): number | null {
  if (typeof input === 'number') {
    if (input > 0 && input <= 1000000 && Number.isFinite(input)) {
      return Math.round(input * 100) / 100 // Round to 2 decimal places
    }
  }
  
  if (typeof input === 'string') {
    const parsed = parseFloat(input)
    if (!isNaN(parsed) && parsed > 0 && parsed <= 1000000) {
      return Math.round(parsed * 100) / 100
    }
  }
  
  return null
}

/**
 * Validate status enum
 */
export function validateStatus(
  input: unknown,
  allowedStatuses: string[]
): string | null {
  if (typeof input === 'string' && allowedStatuses.includes(input)) {
    return input
  }
  return null
}

/**
 * Validate pagination parameters
 */
export function validatePagination(
  page?: unknown,
  limit?: unknown
): { page: number; limit: number } {
  const pageNum = typeof page === 'number' && page > 0 ? page : 
                  typeof page === 'string' && /^\d+$/.test(page) ? parseInt(page, 10) : 1
  const limitNum = typeof limit === 'number' && limit > 0 && limit <= 100 ? limit :
                   typeof limit === 'string' && /^\d+$/.test(limit) ? 
                     Math.min(parseInt(limit, 10), 100) : 20
  
  return {
    page: Math.max(1, pageNum),
    limit: Math.max(1, Math.min(100, limitNum)),
  }
}

/**
 * Validate date string
 */
export function validateDate(input: unknown): string | null {
  if (typeof input !== 'string') {
    return null
  }
  
  const date = new Date(input)
  if (isNaN(date.getTime())) {
    return null
  }
  
  // Return ISO string
  return date.toISOString()
}

/**
 * Validate JSON payload structure
 */
export function validateJsonPayload<T>(
  input: unknown,
  schema: z.ZodSchema<T>
): { valid: boolean; data?: T; error?: string } {
  try {
    const data = schema.parse(input)
    return { valid: true, data }
  } catch (error: any) {
    return {
      valid: false,
      error: error.errors?.[0]?.message || 'Invalid payload structure',
    }
  }
}

