-- Commission Transfers Table
-- Tracks all commission transfers from company accounts to platform account
-- Optimized for high-volume concurrent transfers (10,000+ simultaneous)

CREATE TABLE IF NOT EXISTS commission_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  from_account_id TEXT NOT NULL,
  to_account_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  reference TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  transfer_id TEXT, -- MoniMe transfer ID
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Ensure one transfer per ticket (idempotency)
  UNIQUE(ticket_id, transaction_id)
);

-- Indexes for high-performance queries
CREATE INDEX IF NOT EXISTS idx_commission_transfers_ticket_id ON commission_transfers(ticket_id);
CREATE INDEX IF NOT EXISTS idx_commission_transfers_transaction_id ON commission_transfers(transaction_id);
CREATE INDEX IF NOT EXISTS idx_commission_transfers_company_id ON commission_transfers(company_id);
CREATE INDEX IF NOT EXISTS idx_commission_transfers_status ON commission_transfers(status);
CREATE INDEX IF NOT EXISTS idx_commission_transfers_created_at ON commission_transfers(created_at);
CREATE INDEX IF NOT EXISTS idx_commission_transfers_company_status ON commission_transfers(company_id, status);
CREATE INDEX IF NOT EXISTS idx_commission_transfers_pending ON commission_transfers(status, created_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_commission_transfers_failed_retryable ON commission_transfers(status, retry_count, updated_at) WHERE status = 'failed' AND retry_count < 5;

-- RLS Policies
ALTER TABLE commission_transfers ENABLE ROW LEVEL SECURITY;

-- Company admins can view their own transfers
CREATE POLICY "Company admins can view their transfers"
  ON commission_transfers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.company_id = commission_transfers.company_id
      AND users.role = 'company_admin'
    )
  );

-- Platform admins can view all transfers
CREATE POLICY "Platform admins can view all transfers"
  ON commission_transfers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'platform_admin'
    )
  );

-- Only service role can insert/update (for system operations)
CREATE POLICY "Service role can manage transfers"
  ON commission_transfers
  FOR ALL
  USING (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_commission_transfers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_commission_transfers_updated_at
  BEFORE UPDATE ON commission_transfers
  FOR EACH ROW
  EXECUTE FUNCTION update_commission_transfers_updated_at();

