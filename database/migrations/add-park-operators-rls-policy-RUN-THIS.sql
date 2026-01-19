-- ============================================================================
-- Park Operators RLS Policy Migration
-- ============================================================================
-- Instructions:
-- 1. Open Supabase Dashboard
-- 2. Go to SQL Editor
-- 3. Copy and paste ALL the SQL below (from this line to the end)
-- 4. Click "Run" or press Ctrl+Enter
-- ============================================================================

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

-- ============================================================================
-- Verification (optional - run separately to check if policies were created)
-- ============================================================================
-- SELECT 
--   schemaname,
--   tablename,
--   policyname,
--   permissive,
--   roles,
--   cmd,
--   qual,
--   with_check
-- FROM pg_policies
-- WHERE tablename = 'park_operators';
-- ============================================================================

