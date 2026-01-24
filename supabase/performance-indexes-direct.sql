-- Performance Indexes for High-Volume Transaction Processing
-- Run this SQL directly in Supabase SQL Editor
-- These indexes optimize queries for 10,000+ concurrent transactions
--
-- IMPORTANT: Make sure the payment_codes table exists first!
-- If you get an error about payment_codes not existing, run:
-- supabase/performance-indexes-complete.sql instead (it creates the table first)

-- Composite index for ticket lookups (idempotency checks)
CREATE INDEX IF NOT EXISTS idx_tickets_transaction_lookup 
ON tickets(monime_transaction_id, company_id, status);

-- Composite index for payment code lookups
-- NOTE: This will fail if payment_codes table doesn't exist
-- Run supabase/performance-indexes-complete.sql if you get an error
CREATE INDEX IF NOT EXISTS idx_payment_codes_active_lookup 
ON payment_codes(monime_code, status, company_id) 
WHERE status = 'active';

-- Index for transaction queries by company and date
CREATE INDEX IF NOT EXISTS idx_transactions_company_date 
ON transactions(company_id, created_at DESC, status);

-- Index for audit log queries (for batching)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
ON audit_logs(created_at DESC) 
WHERE created_at > NOW() - INTERVAL '30 days';

-- Partial index for active payment codes (reduces index size)
-- NOTE: This will fail if payment_codes table doesn't exist
CREATE INDEX IF NOT EXISTS idx_payment_codes_active_partial 
ON payment_codes(monime_code) 
WHERE status = 'active' AND used_tickets < total_tickets;

-- Index for company lookups during transaction processing
CREATE INDEX IF NOT EXISTS idx_companies_active 
ON companies(id, status) 
WHERE status = 'active';

-- Index for route lookups
CREATE INDEX IF NOT EXISTS idx_routes_company_active 
ON routes(id, company_id, status) 
WHERE status = 'active';

