/**
 * Secure Error Handling
 * 
 * Prevents information disclosure through error messages
 * while maintaining useful error responses for legitimate users.
 */

/**
 * Sanitize error message for client response
 * Removes sensitive information like stack traces, file paths, etc.
 */
export function sanitizeError(error: unknown): {
  message: string
  code?: string
} {
  // Handle Error objects
  if (error instanceof Error) {
    // Don't expose internal error messages in production
    if (process.env.NODE_ENV === 'production') {
      // Return generic error messages
      if (error.message.includes('database') || error.message.includes('SQL')) {
        return {
          message: 'Database error occurred. Please try again.',
          code: 'DATABASE_ERROR',
        }
      }
      
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return {
          message: 'Network error occurred. Please check your connection.',
          code: 'NETWORK_ERROR',
        }
      }
      
      if (error.message.includes('auth') || error.message.includes('unauthorized')) {
        return {
          message: 'Authentication failed. Please log in again.',
          code: 'AUTH_ERROR',
        }
      }
      
      // Generic error for production
      return {
        message: 'An error occurred. Please try again later.',
        code: 'INTERNAL_ERROR',
      }
    }
    
    // In development, show more details
    return {
      message: error.message,
      code: error.name,
    }
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: error,
    }
  }
  
  // Unknown error type
  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
  }
}

/**
 * Log error securely (without exposing sensitive data)
 */
export function logError(error: unknown, context?: string): void {
  const timestamp = new Date().toISOString()
  const contextStr = context ? `[${context}] ` : ''
  
  if (error instanceof Error) {
    console.error(`${contextStr}${timestamp}:`, {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  } else {
    console.error(`${contextStr}${timestamp}:`, error)
  }
}

/**
 * Create a safe error response
 */
export function createErrorResponse(
  error: unknown,
  statusCode: number = 500,
  context?: string
): Response {
  // Log error server-side
  logError(error, context)
  
  // Sanitize error for client
  const sanitized = sanitizeError(error)
  
  return Response.json(
    {
      error: sanitized.message,
      code: sanitized.code,
      ...(process.env.NODE_ENV === 'development' && {
        // Only include stack trace in development
        stack: error instanceof Error ? error.stack : undefined,
      }),
    },
    { status: statusCode }
  )
}

