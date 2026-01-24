/**
 * Ticket Creation Queue
 * 
 * Dedicated queue for high-volume ticket creation.
 * Processes tickets in batches to handle 10,000+ concurrent creations.
 */

import { getTransactionQueue, QueuedTransaction, BatchProcessor } from './transaction-queue'
import { createTicketsBatch, TicketCreationData } from '@/lib/processors/ticket-creator'

interface TicketQueueItem {
  id: string
  ticketData: TicketCreationData
  timestamp: number
  retries: number
}

class TicketCreationQueue {
  private queue: TicketQueueItem[] = []
  private processing = false
  private batchSize = 100 // Process 100 tickets per batch
  private flushInterval = 500 // Flush every 500ms
  private flushTimer: NodeJS.Timeout | null = null
  private maxRetries = 3

  constructor() {
    this.startFlushTimer()
  }

  /**
   * Add ticket to queue
   */
  enqueue(ticketData: TicketCreationData): void {
    const item: TicketQueueItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ticketData,
      timestamp: Date.now(),
      retries: 0,
    }

    this.queue.push(item)

    // Auto-flush if batch size reached
    if (this.queue.length >= this.batchSize) {
      this.flush()
    }
  }

  /**
   * Process queue in batches
   */
  private async flush(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true

    try {
      // Extract batch
      const batch = this.queue.splice(0, this.batchSize)

      if (batch.length > 0) {
        try {
          // Convert queue items to ticket creation data
          const ticketData = batch.map(item => item.ticketData)

          // Process batch
          const result = await createTicketsBatch(ticketData)

          console.log(`Processed ${result.total} tickets: ${result.successful.length} successful, ${result.failed.length} failed`)

          // Retry failed tickets
          if (result.failed.length > 0) {
            await this.retryFailedTickets(batch, result.failed)
          }
        } catch (error) {
          console.error('Batch processing error:', error)
          // Retry all items in batch
          await this.retryFailedTickets(batch, [])
        }
      }
    } catch (error) {
      console.error('Queue flush error:', error)
    } finally {
      this.processing = false

      // Continue processing if more items in queue
      if (this.queue.length > 0) {
        setImmediate(() => this.flush())
      }
    }
  }

  /**
   * Retry failed tickets with exponential backoff
   */
  private async retryFailedTickets(
    batch: TicketQueueItem[],
    failedResults: Array<{ transaction_id: string }>
  ): Promise<void> {
    const failedTransactionIds = new Set(
      failedResults.map(r => r.transaction_id)
    )

    for (const item of batch) {
      // Only retry if it was in the failed list or if we don't have results
      if (failedResults.length === 0 || failedTransactionIds.has(item.ticketData.monime_transaction_id)) {
        if (item.retries < this.maxRetries) {
          item.retries++
          const delay = 100 * Math.pow(2, item.retries - 1) // Exponential backoff

          setTimeout(() => {
            this.queue.push(item)
            this.flush()
          }, delay)
        } else {
          console.error('Ticket failed after max retries:', item.id)
          // Log to dead letter queue or alert system
        }
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
      if (this.queue.length > 0) {
        this.flush()
      }
    }, this.flushInterval)
  }

  /**
   * Get queue size
   */
  getSize(): number {
    return this.queue.length
  }

  /**
   * Force flush (for graceful shutdown)
   */
  async forceFlush(): Promise<void> {
    while (this.queue.length > 0) {
      await this.flush()
    }
  }
}

// Singleton instance
let ticketQueueInstance: TicketCreationQueue | null = null

export function getTicketQueue(): TicketCreationQueue {
  if (!ticketQueueInstance) {
    ticketQueueInstance = new TicketCreationQueue()
  }
  return ticketQueueInstance
}

