-- Database Optimizations for High-Volume Ticket Validation (10,000+ concurrent)
-- Run this SQL directly in Supabase SQL Editor

-- ============================================
-- 1. Optimize tickets table for validation queries
-- ============================================

-- Composite index for OTP lookups (most common validation query)
-- This index is critical for fast ticket lookups by OTP
CREATE INDEX IF NOT EXISTS idx_tickets_otp_company_status 
ON tickets(monime_otp, company_id, status) 
WHERE status = 'pending';

-- Index for validation updates (optimistic locking)
CREATE INDEX IF NOT EXISTS idx_tickets_validation_update 
ON tickets(id, status, company_id) 
WHERE status = 'pending';

-- Index for operator validation queries (dashboard stats)
CREATE INDEX IF NOT EXISTS idx_tickets_validated_by_date 
ON tickets(validated_by, company_id, used_at DESC) 
WHERE status = 'used';

-- Composite index for company + status + date (for reporting)
CREATE INDEX IF NOT EXISTS idx_tickets_company_status_date 
ON tickets(company_id, status, created_at DESC, used_at DESC);

-- ============================================
-- 2. Optimize park_operators for validation checks
-- ============================================

-- Index for operator lookups (with company join)
CREATE INDEX IF NOT EXISTS idx_operators_user_company 
ON park_operators(user_id, company_id, status);

-- Index for route assignment checks
-- Note: This uses GIN index for array operations
CREATE INDEX IF NOT EXISTS idx_operators_assigned_routes 
ON park_operators USING GIN (assigned_routes);

-- ============================================
-- 3. Optimize companies table for status checks
-- ============================================

-- Index for company status lookups (caching optimization)
CREATE INDEX IF NOT EXISTS idx_companies_status_active 
ON companies(id, status) 
WHERE status = 'active';

-- ============================================
-- 4. Function for atomic ticket validation (optional optimization)
-- ============================================

-- This function provides atomic validation with optimistic locking
-- Can be used for even faster validation in high-volume scenarios
CREATE OR REPLACE FUNCTION validate_ticket_atomic(
  p_otp TEXT,
  p_company_id UUID,
  p_operator_id UUID
)
RETURNS TABLE(
  ticket_id UUID,
  success BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  v_ticket_id UUID;
  v_route_id UUID;
  v_assigned_routes UUID[];
BEGIN
  -- Find ticket by OTP and company
  SELECT id, route_id INTO v_ticket_id, v_route_id
  FROM tickets
  WHERE monime_otp = p_otp
    AND company_id = p_company_id
    AND status = 'pending'
  LIMIT 1
  FOR UPDATE SKIP LOCKED; -- Skip locked rows (handles concurrent requests)

  -- Check if ticket found
  IF v_ticket_id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, false, 'Invalid or already used ticket'::TEXT;
    RETURN;
  END IF;

  -- Check operator route assignment (if routes are assigned)
  SELECT assigned_routes INTO v_assigned_routes
  FROM park_operators
  WHERE id = p_operator_id
    AND company_id = p_company_id
    AND status = 'active';

  -- If operator has assigned routes, check if ticket route is in the list
  IF v_assigned_routes IS NOT NULL AND array_length(v_assigned_routes, 1) > 0 THEN
    IF NOT (v_route_id = ANY(v_assigned_routes)) THEN
      RETURN QUERY SELECT NULL::UUID, false, 'Not authorized for this route'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- Update ticket status atomically
  UPDATE tickets
  SET 
    status = 'used',
    used_at = NOW(),
    validated_by = p_operator_id
  WHERE id = v_ticket_id
    AND status = 'pending' -- Optimistic locking: only update if still pending
    AND company_id = p_company_id;

  -- Check if update succeeded
  IF FOUND THEN
    RETURN QUERY SELECT v_ticket_id, true, NULL::TEXT;
  ELSE
    -- Ticket was already validated by another request
    RETURN QUERY SELECT NULL::UUID, false, 'Ticket already validated'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION validate_ticket_atomic(TEXT, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_ticket_atomic(TEXT, UUID, UUID) TO service_role;

-- ============================================
-- 5. Update table statistics
-- ============================================

ANALYZE tickets;
ANALYZE park_operators;
ANALYZE companies;

-- ============================================
-- 6. Performance monitoring view (optional)
-- ============================================

-- View for monitoring validation performance
-- NOTE: RLS policies are added in validation-stats-rls.sql
-- This view is kept for service role access (bypasses RLS)
CREATE OR REPLACE VIEW validation_stats AS
SELECT 
  DATE(used_at) as validation_date,
  company_id,
  COUNT(*) as total_validations,
  COUNT(DISTINCT validated_by) as unique_operators,
  AVG(EXTRACT(EPOCH FROM (used_at - created_at))) as avg_validation_time_seconds
FROM tickets
WHERE status = 'used'
  AND used_at IS NOT NULL
GROUP BY DATE(used_at), company_id;

-- Grant access
GRANT SELECT ON validation_stats TO authenticated;
GRANT SELECT ON validation_stats TO service_role;

