-- Daily ticket limits per route
-- Allows park operators to set limits for early bus and late bus
-- Run this SQL in your Supabase SQL Editor to create the table

CREATE TABLE IF NOT EXISTS route_daily_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  park_operator_id UUID NOT NULL REFERENCES park_operators(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  early_bus_limit INTEGER DEFAULT 0,
  late_bus_limit INTEGER DEFAULT 0,
  early_bus_cutoff_time TIME DEFAULT '12:00:00', -- Default cutoff at noon
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(route_id, park_operator_id, date)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_route_daily_limits_route_date ON route_daily_limits(route_id, date);
CREATE INDEX IF NOT EXISTS idx_route_daily_limits_operator ON route_daily_limits(park_operator_id);

-- Enable RLS
ALTER TABLE route_daily_limits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Park operators can manage their route limits" ON route_daily_limits;
DROP POLICY IF EXISTS "Company admins can view route limits" ON route_daily_limits;

-- Park operators can manage their own limits
CREATE POLICY "Park operators can manage their route limits"
  ON route_daily_limits
  FOR ALL
  USING (
    park_operator_id IN (
      SELECT id FROM park_operators
      WHERE user_id = auth.uid()
    )
  );

-- Company admins can view all limits for their company
CREATE POLICY "Company admins can view route limits"
  ON route_daily_limits
  FOR SELECT
  USING (
    route_id IN (
      SELECT id FROM routes
      WHERE company_id IN (
        SELECT company_id FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'company_admin'
      )
    )
  );

