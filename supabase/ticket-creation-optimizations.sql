-- Database Optimizations for High-Volume Ticket Creation (10,000+ concurrent)
-- Run this SQL directly in Supabase SQL Editor

-- ============================================
-- 1. Optimize tickets table for concurrent writes
-- ============================================

-- Add unique constraint on monime_transaction_id if not exists (prevents duplicates)
-- This is critical for handling concurrent ticket creation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tickets_monime_transaction_id_key'
  ) THEN
    ALTER TABLE tickets 
    ADD CONSTRAINT tickets_monime_transaction_id_key 
    UNIQUE (monime_transaction_id);
  END IF;
END $$;

-- ============================================
-- 2. Additional performance indexes for ticket creation
-- ============================================

-- Composite index for fast company + status lookups (for dashboards)
CREATE INDEX IF NOT EXISTS idx_tickets_company_status_created 
ON tickets(company_id, status, created_at DESC);

-- Index for route-based ticket queries
CREATE INDEX IF NOT EXISTS idx_tickets_route_company 
ON tickets(route_id, company_id, status);

-- Partial index for pending tickets (most common query)
CREATE INDEX IF NOT EXISTS idx_tickets_pending 
ON tickets(company_id, created_at DESC) 
WHERE status = 'pending';

-- Index for phone number lookups (ticket retrieval)
CREATE INDEX IF NOT EXISTS idx_tickets_phone_company 
ON tickets(passenger_phone, company_id, created_at DESC);

-- ============================================
-- 3. Optimize payment_codes for concurrent updates
-- ============================================

-- Index for concurrent payment code updates (prevents lock contention)
CREATE INDEX IF NOT EXISTS idx_payment_codes_update 
ON payment_codes(id, used_tickets, total_tickets, status) 
WHERE status = 'active';

-- ============================================
-- 4. Optimize transactions table for batch inserts
-- ============================================

-- Composite index for transaction queries
CREATE INDEX IF NOT EXISTS idx_transactions_ticket_company 
ON transactions(ticket_id, company_id, status, created_at DESC);

-- ============================================
-- 5. Table statistics and vacuum settings
-- ============================================

-- Update table statistics for better query planning
ANALYZE tickets;
ANALYZE transactions;
ANALYZE payment_codes;

-- ============================================
-- 6. Connection and transaction settings (if you have database admin access)
-- ============================================

-- These settings optimize PostgreSQL for high concurrent writes
-- Note: These require superuser access. Run separately if you have access.

/*
-- Increase max connections if needed (default is usually 100)
ALTER SYSTEM SET max_connections = 200;

-- Optimize for write-heavy workload
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Reload configuration (requires superuser)
SELECT pg_reload_conf();
*/

-- ============================================
-- 7. Function for batch ticket creation (optional optimization)
-- ============================================

-- This function can be used for even faster batch inserts
-- It's called from the application layer, but having it in DB can help
CREATE OR REPLACE FUNCTION create_tickets_batch(
  ticket_data JSONB[]
)
RETURNS TABLE(
  id UUID,
  monime_transaction_id TEXT,
  success BOOLEAN
) AS $$
DECLARE
  ticket_item JSONB;
  ticket_id UUID;
  transaction_id TEXT;
BEGIN
  FOREACH ticket_item IN ARRAY ticket_data
  LOOP
    BEGIN
      -- Insert ticket
      INSERT INTO tickets (
        company_id,
        route_id,
        passenger_phone,
        monime_transaction_id,
        monime_otp,
        status
      ) VALUES (
        (ticket_item->>'company_id')::UUID,
        (ticket_item->>'route_id')::UUID,
        ticket_item->>'passenger_phone',
        ticket_item->>'monime_transaction_id',
        ticket_item->>'monime_otp',
        'pending'
      )
      RETURNING id, monime_transaction_id INTO ticket_id, transaction_id;
      
      -- Return success
      RETURN QUERY SELECT ticket_id, transaction_id, true;
      
    EXCEPTION 
      WHEN unique_violation THEN
        -- Ticket already exists, return existing
        SELECT t.id, t.monime_transaction_id INTO ticket_id, transaction_id
        FROM tickets t
        WHERE t.monime_transaction_id = ticket_item->>'monime_transaction_id'
        LIMIT 1;
        
        RETURN QUERY SELECT ticket_id, transaction_id, true;
        
      WHEN OTHERS THEN
        -- Return failure
        RETURN QUERY SELECT NULL::UUID, ticket_item->>'monime_transaction_id', false;
    END;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

