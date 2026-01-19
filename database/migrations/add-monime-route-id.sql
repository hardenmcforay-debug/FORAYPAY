-- Migration: Add monime_route_id column to routes table
-- This column stores the MoniMe internal route ID for route synchronization
-- Run this migration in Supabase SQL Editor

-- Add monime_route_id column if it doesn't exist
ALTER TABLE routes 
ADD COLUMN IF NOT EXISTS monime_route_id VARCHAR(255);

-- Create index on monime_route_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_routes_monime_route_id ON routes(monime_route_id);

-- Add comment to column for documentation
COMMENT ON COLUMN routes.monime_route_id IS 'MoniMe internal route ID for synchronization. NULL if route has not been synced to MoniMe yet.';

