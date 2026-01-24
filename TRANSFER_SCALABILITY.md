# Commission Transfer Scalability Guide

## Overview

This system is optimized to handle **10,000+ concurrent commission transfers** from different transport company MoniMe accounts to the platform MoniMe account simultaneously, without crashes or performance degradation.

## Architecture

### 1. Transfer Queue System (`lib/queue/transfer-queue.ts`)

- **In-memory queue** for asynchronous transfer processing
- **Batching**: Processes transfers in batches of 100
- **Auto-flush**: Flushes every 2 seconds or when batch size is reached
- **Retry logic**: Automatic retry with exponential backoff (up to 5 retries)
- **Non-blocking**: Transfers are queued immediately, processed asynchronously

### 2. Transfer Processor (`lib/processors/transfer-processor.ts`)

- **Idempotency**: Prevents duplicate transfers using database checks
- **Circuit breaker**: Protects MoniMe API from cascading failures
- **Batch processing**: Processes up to 100 transfers concurrently
- **Database tracking**: All transfers are tracked in `commission_transfers` table
- **Error handling**: Comprehensive error handling with retry logic

### 3. Database Schema (`supabase/transfer-schema.sql`)

- **`commission_transfers` table**: Tracks all transfer attempts
- **Unique constraint**: `(ticket_id, transaction_id)` ensures idempotency
- **Status tracking**: `pending`, `completed`, `failed`
- **Retry tracking**: `retry_count` field for retry management
- **RLS policies**: Row-level security for data access control

### 4. Performance Indexes (`supabase/transfer-indexes.sql`)

- Optimized indexes for common query patterns
- Partial indexes for status-based queries
- Composite indexes for company + status queries
- Date range indexes for reporting

## Flow

```
1. Ticket Created
   ↓
2. Commission Calculated
   ↓
3. Transfer Queued (non-blocking)
   ↓
4. Webhook Returns Immediately
   ↓
5. Transfer Queue Processes Batch
   ↓
6. Idempotency Check
   ↓
7. MoniMe API Call (with circuit breaker)
   ↓
8. Database Update
   ↓
9. Audit Log
```

## Key Features

### Idempotency
- Each transfer is uniquely identified by `(ticket_id, transaction_id)`
- Duplicate transfer attempts are automatically detected and skipped
- Prevents double-charging or duplicate transfers

### Retry Logic
- Automatic retry for transient failures (rate limits, timeouts, network errors)
- Exponential backoff: 2s, 4s, 8s, 16s, 32s
- Maximum 5 retries per transfer
- Failed transfers are logged for manual review

### Circuit Breaker
- Protects MoniMe API from overload
- Automatically opens when failure rate exceeds threshold
- Prevents cascading failures
- Auto-recovery when service is restored

### Batch Processing
- Processes transfers in batches of 100
- Up to 100 transfers processed concurrently
- Reduces API call overhead
- Improves throughput

### Database Tracking
- All transfer attempts are recorded
- Status tracking (pending, completed, failed)
- Error messages stored for debugging
- Transfer IDs from MoniMe API stored

## Configuration

### Environment Variables

```env
MONIME_API_URL=https://api.monime.com
MONIME_API_KEY=your_api_key
MONIME_PLATFORM_ACCOUNT_ID=platform_account_id
```

### Queue Configuration

```typescript
getTransferQueue({
  processBatch: async (batch) => {
    await processTransferBatch(batch)
  },
  batchSize: 100,        // Transfers per batch
  flushInterval: 2000,   // Flush every 2 seconds
})
```

### Circuit Breaker Configuration

See `lib/utils/circuit-breaker.ts` for circuit breaker settings:
- Failure threshold: 50%
- Timeout: 10 seconds
- Reset timeout: 60 seconds

## Database Setup

### 1. Create Transfer Table

Run the SQL in `supabase/transfer-schema.sql`:

```sql
-- Creates commission_transfers table with RLS policies
-- Includes indexes and triggers
```

### 2. Create Performance Indexes

Run the SQL in `supabase/transfer-indexes.sql`:

```sql
-- Creates optimized indexes for high-volume queries
```

## Monitoring

### Key Metrics

1. **Queue Size**: Number of pending transfers
2. **Processing Rate**: Transfers processed per second
3. **Success Rate**: Percentage of successful transfers
4. **Retry Rate**: Percentage of transfers requiring retries
5. **Circuit Breaker State**: Open/Closed/Half-Open

### Database Queries

```sql
-- Pending transfers
SELECT COUNT(*) FROM commission_transfers 
WHERE status = 'pending';

-- Failed transfers (retryable)
SELECT COUNT(*) FROM commission_transfers 
WHERE status = 'failed' AND retry_count < 5;

-- Success rate (last hour)
SELECT 
  COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / COUNT(*) as success_rate
FROM commission_transfers
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Transfers by company
SELECT 
  company_id,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'failed') as failed
FROM commission_transfers
GROUP BY company_id;
```

## Error Handling

### Retryable Errors
- Rate limit errors
- Network timeouts
- Temporary API failures
- Connection errors

### Non-Retryable Errors
- Invalid account IDs
- Insufficient funds
- Invalid amount
- Authentication errors

### Failed Transfer Handling
- Failed transfers are logged in `commission_transfers` table
- Error messages stored in `error_message` field
- Retry count tracked in `retry_count` field
- Manual review required for transfers exceeding max retries

## Performance Characteristics

### Throughput
- **10,000 transfers**: Processed in ~100 batches (100 transfers/batch)
- **Processing time**: ~200 seconds (2 seconds per batch)
- **Concurrent processing**: Up to 100 transfers simultaneously

### Scalability
- **Horizontal scaling**: Queue can be moved to Redis (BullMQ) for multi-instance
- **Database**: Optimized indexes support millions of transfer records
- **API rate limits**: Circuit breaker protects against MoniMe API limits

## Best Practices

1. **Monitor Queue Size**: Alert if queue size exceeds 10,000
2. **Monitor Failure Rate**: Alert if failure rate exceeds 5%
3. **Review Failed Transfers**: Daily review of transfers exceeding max retries
4. **Database Maintenance**: Regular VACUUM and ANALYZE on `commission_transfers` table
5. **Circuit Breaker Monitoring**: Alert when circuit breaker opens

## Troubleshooting

### High Queue Size
- Check MoniMe API status
- Verify circuit breaker state
- Review error logs for patterns

### High Failure Rate
- Check MoniMe API rate limits
- Verify account IDs are correct
- Review network connectivity

### Circuit Breaker Open
- Wait for auto-recovery (60 seconds)
- Check MoniMe API status
- Review recent error patterns

## Future Enhancements

1. **Redis Queue**: Move to BullMQ for multi-instance support
2. **Dead Letter Queue**: Store permanently failed transfers
3. **Transfer Reconciliation**: Automated reconciliation with MoniMe
4. **Real-time Monitoring**: Dashboard for transfer metrics
5. **Webhook Notifications**: Notify on transfer completion/failure

