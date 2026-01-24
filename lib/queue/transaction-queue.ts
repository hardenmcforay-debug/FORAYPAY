/**
 * Transaction Processing Queue
 * 
 * Handles high-volume transaction processing asynchronously
 * to prevent blocking the webhook handler.
 * 
 * This implementation uses an in-memory queue with batching.
 * For production at scale, consider Redis-based queue (BullMQ).
 */

interface QueuedTransaction {
  id: string
  payload: any
  timestamp: number
  retries: number
}

interface BatchProcessor {
  processBatch: (items: QueuedTransaction[]) => Promise<void>
  batchSize: number
  flushInterval: number
}

class TransactionQueue {
  private queue: QueuedTransaction[] = []
  private processing = false
  private batchProcessor: BatchProcessor
  private flushTimer: NodeJS.Timeout | null = null
  private maxRetries = 3
  private retryDelay = 1000 // 1 second base delay

  constructor(batchProcessor: BatchProcessor) {
    this.batchProcessor = batchProcessor
    this.startFlushTimer()
  }

  /**
   * Add transaction to queue
   */
  enqueue(transaction: Omit<QueuedTransaction, 'id' | 'timestamp' | 'retries'>): void {
    const queuedTransaction: QueuedTransaction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...transaction,
      timestamp: Date.now(),
      retries: 0,
    }

    this.queue.push(queuedTransaction)

    // Auto-flush if batch size reached
    if (this.queue.length >= this.batchProcessor.batchSize) {
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
      const batch = this.queue.splice(0, this.batchProcessor.batchSize)

      if (batch.length > 0) {
        try {
          await this.batchProcessor.processBatch(batch)
        } catch (error) {
          console.error('Batch processing error:', error)
          // Retry failed items
          await this.retryFailedItems(batch)
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
   * Retry failed items with exponential backoff
   */
  private async retryFailedItems(failedItems: QueuedTransaction[]): Promise<void> {
    for (const item of failedItems) {
      if (item.retries < this.maxRetries) {
        item.retries++
        const delay = this.retryDelay * Math.pow(2, item.retries - 1)
        
        setTimeout(() => {
          this.queue.push(item)
          this.flush()
        }, delay)
      } else {
        console.error('Transaction failed after max retries:', item.id)
        // Log to dead letter queue or alert system
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
    }, this.batchProcessor.flushInterval)
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
let transactionQueueInstance: TransactionQueue | null = null

export function getTransactionQueue(processor: BatchProcessor): TransactionQueue {
  if (!transactionQueueInstance) {
    transactionQueueInstance = new TransactionQueue(processor)
  }
  return transactionQueueInstance
}

export type { QueuedTransaction, BatchProcessor }

