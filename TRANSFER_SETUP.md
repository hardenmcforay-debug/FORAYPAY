# Commission Transfer Setup Guide

## Quick Setup

### 1. Database Setup

Run the following SQL files in your Supabase SQL Editor:

1. **Create Transfer Table**:
   ```sql
   -- Copy and paste contents of supabase/transfer-schema.sql
   ```

2. **Create Performance Indexes**:
   ```sql
   -- Copy and paste contents of supabase/transfer-indexes.sql
   ```

### 2. Environment Variables

Ensure these environment variables are set:

```env
MONIME_API_URL=https://api.monime.com
MONIME_API_KEY=your_monime_api_key
MONIME_PLATFORM_ACCOUNT_ID=your_platform_monime_account_id
```

### 3. System Initialization

The transfer queue is automatically initialized when the webhook handler receives its first request. No manual initialization needed.

## Verification

### Check Transfer Table

```sql
SELECT COUNT(*) FROM commission_transfers;
```

### Monitor Queue

The transfer queue processes batches automatically. Check logs for:
- `Transfer queue batch processing`
- `Transfer processing error` (if any)

### Test Transfer

1. Create a ticket via webhook
2. Check `commission_transfers` table for transfer record
3. Verify status changes from `pending` → `completed`

## Troubleshooting

### Transfers Not Processing

1. Check webhook handler logs
2. Verify `MONIME_PLATFORM_ACCOUNT_ID` is set
3. Check circuit breaker state
4. Review `commission_transfers` table for errors

### High Failure Rate

1. Check MoniMe API status
2. Verify account IDs are correct
3. Review `error_message` in `commission_transfers` table
4. Check circuit breaker logs

### Database Errors

1. Verify `commission_transfers` table exists
2. Check RLS policies are correct
3. Verify indexes are created
4. Check database connection pool

## Monitoring Queries

```sql
-- Pending transfers
SELECT COUNT(*) FROM commission_transfers WHERE status = 'pending';

-- Failed transfers (retryable)
SELECT * FROM commission_transfers 
WHERE status = 'failed' AND retry_count < 5
ORDER BY updated_at DESC
LIMIT 10;

-- Recent transfers
SELECT * FROM commission_transfers 
ORDER BY created_at DESC
LIMIT 20;

-- Transfer success rate (last hour)
SELECT 
  COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / COUNT(*) as success_rate,
  COUNT(*) as total
FROM commission_transfers
WHERE created_at > NOW() - INTERVAL '1 hour';
```

