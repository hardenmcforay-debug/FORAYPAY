-- Payment Codes table to track reusable codes
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

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_codes_monime_code ON payment_codes(monime_code);
CREATE INDEX IF NOT EXISTS idx_payment_codes_company_id ON payment_codes(company_id);
CREATE INDEX IF NOT EXISTS idx_payment_codes_status ON payment_codes(status);

-- Add RLS policies
ALTER TABLE payment_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Operators can ONLY view payment codes from their own company
-- This ensures Company A operators can NEVER see Company B payment codes
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

