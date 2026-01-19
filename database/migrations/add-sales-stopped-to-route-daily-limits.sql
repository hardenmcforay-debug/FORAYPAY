-- Add sales_stopped column to route_daily_limits table
-- Allows park operators to manually stop ticket sales for a route on a specific date
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE route_daily_limits 
ADD COLUMN IF NOT EXISTS sales_stopped BOOLEAN DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN route_daily_limits.sales_stopped IS 'When true, ticket sales are stopped for this route on this date, regardless of limits';

