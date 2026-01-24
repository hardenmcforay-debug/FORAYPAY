/**
 * Audit Log Batcher
 * 
 * Batches audit log inserts to reduce database load
 * under high transaction volume.
 */

import { createClient } from '@supabase/supabase-js'
import { QueuedTransaction } from './transaction-queue'

interface AuditLogEntry {
  company_id: string | null
  user_id?: string | null
  action: string
  details: Record<string, any>
}

class AuditLogBatcher {
  private batch: AuditLogEntry[] = []
  private batchSize = 100
  private flushInterval = 2000 // 2 seconds
  private flushTimer: NodeJS.Timeout | null = null
  private supabase: ReturnType<typeof createClient>

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
    })

    this.startFlushTimer()
  }

  /**
   * Add audit log entry to batch
   */
  add(entry: AuditLogEntry): void {
    this.batch.push(entry)

    // Auto-flush if batch size reached
    if (this.batch.length >= this.batchSize) {
      this.flush()
    }
  }

  /**
   * Flush batch to database
   */
  private async flush(): Promise<void> {
    if (this.batch.length === 0) {
      return
    }

    const batchToInsert = [...this.batch]
    this.batch = []

    try {
      // Use batch insert for better performance
      const { error } = await this.supabase
        .from('audit_logs')
        .insert(batchToInsert)

      if (error) {
        console.error('Audit log batch insert error:', error)
        // Retry individual inserts for failed batch
        await this.retryIndividualInserts(batchToInsert)
      } else {
        console.log(`Inserted ${batchToInsert.length} audit logs`)
      }
    } catch (error) {
      console.error('Audit log flush error:', error)
      // Retry individual inserts
      await this.retryIndividualInserts(batchToInsert)
    }
  }

  /**
   * Retry failed inserts individually
   */
  private async retryIndividualInserts(entries: AuditLogEntry[]): Promise<void> {
    for (const entry of entries) {
      try {
        await this.supabase.from('audit_logs').insert(entry)
      } catch (error) {
        console.error('Failed to insert audit log:', entry, error)
        // In production, send to dead letter queue or alerting system
      }
    }
  }

  /**
   * Start automatic flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }

    this.flushTimer = setInterval(() => {
      if (this.batch.length > 0) {
        this.flush()
      }
    }, this.flushInterval)
  }

  /**
   * Force flush (for graceful shutdown)
   */
  async forceFlush(): Promise<void> {
    await this.flush()
  }

  /**
   * Get current batch size
   */
  getBatchSize(): number {
    return this.batch.length
  }
}

// Singleton instance
let auditLogBatcherInstance: AuditLogBatcher | null = null

export function getAuditLogBatcher(): AuditLogBatcher {
  if (!auditLogBatcherInstance) {
    auditLogBatcherInstance = new AuditLogBatcher()
  }
  return auditLogBatcherInstance
}

