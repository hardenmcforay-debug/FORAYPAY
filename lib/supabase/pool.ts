/**
 * Supabase Connection Pool Manager
 * 
 * Manages reusable Supabase client instances to reduce connection overhead.
 * Uses singleton pattern to share clients across requests.
 */

import { createClient } from '@supabase/supabase-js'

interface PoolConfig {
  maxConnections?: number
  idleTimeout?: number
}

class SupabaseConnectionPool {
  private adminClient: ReturnType<typeof createClient> | null = null
  private config: Required<PoolConfig>

  constructor(config: PoolConfig = {}) {
    this.config = {
      maxConnections: config.maxConnections || 10,
      idleTimeout: config.idleTimeout || 300000, // 5 minutes
    }
  }

  /**
   * Get or create admin client (service role)
   * This client bypasses RLS and is safe for webhook processing
   */
  getAdminClient(): ReturnType<typeof createClient> {
    if (!this.adminClient) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase credentials not configured')
      }

      this.adminClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        db: {
          schema: 'public',
        },
        // Connection pooling optimizations
        global: {
          headers: {
            'x-client-info': 'foraypay-webhook',
          },
        },
      })
    }

    return this.adminClient
  }

  /**
   * Reset pool (for testing or reconnection)
   */
  reset(): void {
    this.adminClient = null
  }
}

// Singleton instance
let poolInstance: SupabaseConnectionPool | null = null

export function getSupabasePool(): SupabaseConnectionPool {
  if (!poolInstance) {
    poolInstance = new SupabaseConnectionPool()
  }
  return poolInstance
}

