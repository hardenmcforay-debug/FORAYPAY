-- Add RLS policy for park operators to view their own record
-- This allows park operators to query their own operator record
-- Run this SQL directly in Supabase SQL Editor (copy and paste all the SQL below)

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Park operators can view their own record" ON park_operators;
DROP POLICY IF EXISTS "Park operators can update their own record" ON park_operators;

-- Create policy for park operators to view their own record
CREATE POLICY "Park operators can view their own record"
  ON park_operators FOR SELECT
  USING (user_id = auth.uid());

-- Create index on user_id for better query performance (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_park_operators_user_id ON park_operators(user_id);

-- Add policy for park operators to update their own record (if needed)
CREATE POLICY "Park operators can update their own record"
  ON park_operators FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

