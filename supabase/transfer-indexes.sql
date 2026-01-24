-- Performance Indexes for Commission Transfers
-- Optimized for high-volume concurrent transfers (10,000+ simultaneous)

-- Composite index for common query pattern: company transfers by status
CREATE INDEX IF NOT EXISTS idx_commission_transfers_company_status_created 
ON commission_transfers(company_id, status, created_at DESC);

-- Index for retry processing (failed transfers that can be retried)
CREATE INDEX IF NOT EXISTS idx_commission_transfers_retryable 
ON commission_transfers(status, retry_count, updated_at) 
WHERE status = 'failed' AND retry_count < 5;

-- Index for monitoring pending transfers
CREATE INDEX IF NOT EXISTS idx_commission_transfers_pending_monitoring 
ON commission_transfers(status, created_at) 
WHERE status = 'pending';

-- Index for transfer lookup by MoniMe transfer ID
CREATE INDEX IF NOT EXISTS idx_commission_transfers_transfer_id 
ON commission_transfers(transfer_id) 
WHERE transfer_id IS NOT NULL;

-- Index for date range queries (reporting)
CREATE INDEX IF NOT EXISTS idx_commission_transfers_date_range 
ON commission_transfers(company_id, created_at DESC, status);

-- Partial index for completed transfers (most common read pattern)
CREATE INDEX IF NOT EXISTS idx_commission_transfers_completed 
ON commission_transfers(company_id, completed_at DESC) 
WHERE status = 'completed';

