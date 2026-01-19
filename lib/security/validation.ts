// Input validation and sanitization utilities

export function sanitizeString(input: any, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    return String(input || '').trim().slice(0, maxLength)
  }
  return input.trim().slice(0, maxLength)
}

export function sanitizeEmail(email: any): string | null {
  if (!email || typeof email !== 'string') {
    return null
  }
  const sanitized = email.trim().toLowerCase().slice(0, 255)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(sanitized) ? sanitized : null
}

export function sanitizePhone(phone: any): string | null {
  if (!phone) return null
  // Remove all non-digit characters except +
  const sanitized = String(phone).replace(/[^\d+]/g, '').slice(0, 20)
  return sanitized.length > 0 ? sanitized : null
}

export function sanitizeNumber(input: any, min?: number, max?: number): number | null {
  const num = parseFloat(String(input))
  if (isNaN(num)) return null
  if (min !== undefined && num < min) return null
  if (max !== undefined && num > max) return null
  return num
}

export function sanitizeUUID(input: any): string | null {
  if (!input || typeof input !== 'string') return null
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(input.trim()) ? input.trim() : null
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' }
  }
  if (password.length > 128) {
    return { valid: false, error: 'Password must be less than 128 characters' }
  }
  return { valid: true }
}

export function sanitizeOrderNumber(orderNumber: any): string | null {
  if (!orderNumber || typeof orderNumber !== 'string') return null
  // Order numbers are typically alphanumeric, allow common separators
  const sanitized = orderNumber.trim().replace(/[^a-zA-Z0-9\-_]/g, '').slice(0, 100)
  return sanitized.length > 0 ? sanitized : null
}

