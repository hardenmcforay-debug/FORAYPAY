-- Performance Indexes for High-Volume Transaction Processing
-- These indexes optimize queries for 10,000+ concurrent transactions

-- Composite index for ticket lookups (idempotency checks)
CREATE INDEX IF NOT EXISTS idx_tickets_transaction_lookup 
ON tickets(monime_transaction_id, company_id, status);

-- Composite index for payment code lookups
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

-- Concurrent index creation (for production - run separately)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_transaction_lookup 
-- ON tickets(monime_transaction_id, company_id, status);

