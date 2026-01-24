/**
 * Rate Limiter
 * 
 * Simple in-memory rate limiter to prevent system overload.
 * For production, use Redis-based rate limiting (e.g., Upstash).
 */

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
    // Clean up old entries every minute
    setInterval(() => this.cleanup(), 60000)
  }

  /**
   * Check if request is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now()
    const windowStart = now - this.config.windowMs

    // Get or create request history for this key
    let requestTimes = this.requests.get(key) || []

    // Remove old requests outside the window
    requestTimes = requestTimes.filter(time => time > windowStart)

    // Check if limit exceeded
    if (requestTimes.length >= this.config.maxRequests) {
      return false
    }

    // Add current request
    requestTimes.push(now)
    this.requests.set(key, requestTimes)

    return true
  }

  /**
   * Get remaining requests in current window
   */
  getRemaining(key: string): number {
    const now = Date.now()
    const windowStart = now - this.config.windowMs

    const requestTimes = this.requests.get(key) || []
    const recentRequests = requestTimes.filter(time => time > windowStart).length

    return Math.max(0, this.config.maxRequests - recentRequests)
  }

  /**
   * Clean up old entries
   */
  private cleanup(): void {
    const now = Date.now()
    const windowStart = now - this.config.windowMs

    for (const [key, requestTimes] of this.requests.entries()) {
      const recentRequests = requestTimes.filter(time => time > windowStart)
      if (recentRequests.length === 0) {
        this.requests.delete(key)
      } else {
        this.requests.set(key, recentRequests)
      }
    }
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.requests.delete(key)
  }
}

// Global rate limiter instances
const webhookRateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 1000, // 1000 requests per minute per IP
})

const transferRateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 500, // 500 transfers per minute
})

export function getWebhookRateLimiter(): RateLimiter {
  return webhookRateLimiter
}

export function getTransferRateLimiter(): RateLimiter {
  return transferRateLimiter
}

