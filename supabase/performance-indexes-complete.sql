-- Performance Indexes for High-Volume Transaction Processing
-- This file creates missing tables first, then creates all indexes
-- Run this SQL directly in Supabase SQL Editor

-- ============================================
-- STEP 1: Create payment_codes table if it doesn't exist
-- ============================================
CREATE TABLE IF NOT EXISTS payment_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES park_operators(id) ON DELETE CASCADE,
  monime_code TEXT NOT NULL UNIQUE,
  total_tickets INTEGER NOT NULL DEFAULT 1,
  used_tickets INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(monime_code)
);

-- Basic indexes for payment_codes (if not already created)
CREATE INDEX IF NOT EXISTS idx_payment_codes_monime_code ON payment_codes(monime_code);
CREATE INDEX IF NOT EXISTS idx_payment_codes_company_id ON payment_codes(company_id);
CREATE INDEX IF NOT EXISTS idx_payment_codes_status ON payment_codes(status);

-- Enable RLS on payment_codes if not already enabled
ALTER TABLE payment_codes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: Create performance indexes
-- ============================================

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
-- Note: Partial index with WHERE clause may fail if table is empty
-- If this fails, remove the WHERE clause and run:
-- CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
-- ON audit_logs(created_at DESC);
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM audit_logs LIMIT 1) THEN
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
    ON audit_logs(created_at DESC) 
    WHERE created_at > NOW() - INTERVAL '30 days';
  ELSE
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
    ON audit_logs(created_at DESC);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- If partial index fails, create regular index
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
    ON audit_logs(created_at DESC);
END $$;

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

-- ============================================
-- STEP 3: Add RLS policies for payment_codes (if not already added)
-- ============================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Operators can view payment codes in their company" ON payment_codes;
DROP POLICY IF EXISTS "Service role full access to payment_codes" ON payment_codes;

-- Policy: Operators can ONLY view payment codes from their own company
CREATE POLICY "Operators can view payment codes in their company"
  ON payment_codes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM park_operators po
      WHERE po.user_id = auth.uid()
      AND po.company_id = payment_codes.company_id
      AND po.status = 'active'
    )
  );

-- Policy: Service role can do everything (for webhooks)
CREATE POLICY "Service role full access to payment_codes"
  ON payment_codes FOR ALL
  USING (auth.role() = 'service_role');

