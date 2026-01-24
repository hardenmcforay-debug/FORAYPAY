/**
 * Circuit Breaker Pattern
 * 
 * Prevents cascading failures by stopping requests to failing services.
 * Automatically recovers when service becomes healthy again.
 */

interface CircuitBreakerConfig {
  failureThreshold: number // Number of failures before opening circuit
  successThreshold: number // Number of successes before closing circuit
  timeout: number // Time in ms before attempting to close circuit
}

enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Circuit is open, requests are blocked
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED
  private failureCount = 0
  private successCount = 0
  private lastFailureTime: number | null = null
  private config: CircuitBreakerConfig

  constructor(config: CircuitBreakerConfig) {
    this.config = config
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check circuit state
    if (this.state === CircuitState.OPEN) {
      // Check if timeout has passed
      if (this.lastFailureTime && Date.now() - this.lastFailureTime > this.config.timeout) {
        this.state = CircuitState.HALF_OPEN
        this.successCount = 0
      } else {
        throw new Error('Circuit breaker is OPEN - service unavailable')
      }
    }

    try {
      const result = await fn()
      
      // Success - reset failure count
      if (this.state === CircuitState.HALF_OPEN) {
        this.successCount++
        if (this.successCount >= this.config.successThreshold) {
          this.state = CircuitState.CLOSED
          this.failureCount = 0
          this.successCount = 0
        }
      } else {
        this.failureCount = 0
      }

      return result
    } catch (error) {
      // Failure - increment failure count
      this.failureCount++
      this.lastFailureTime = Date.now()

      if (this.failureCount >= this.config.failureThreshold) {
        this.state = CircuitState.OPEN
      }

      throw error
    }
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state
  }

  /**
   * Manually reset circuit breaker
   */
  reset(): void {
    this.state = CircuitState.CLOSED
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = null
  }
}

// Circuit breaker for MoniMe API
const monimeCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5, // Open after 5 failures
  successThreshold: 2, // Close after 2 successes
  timeout: 30000, // 30 seconds
})

export function getMoniMeCircuitBreaker(): CircuitBreaker {
  return monimeCircuitBreaker
}

