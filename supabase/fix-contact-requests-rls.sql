-- Fix Contact Requests RLS Policies
-- Run this if you're getting RLS policy violations

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Platform admins can view all contact requests" ON contact_requests;
DROP POLICY IF EXISTS "Platform admins can update contact requests" ON contact_requests;
DROP POLICY IF EXISTS "Anyone can insert contact requests" ON contact_requests;

-- Recreate policies with correct syntax
CREATE POLICY "Platform admins can view all contact requests"
  ON contact_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'platform_admin'
    )
  );

CREATE POLICY "Platform admins can update contact requests"
  ON contact_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'platform_admin'
    )
  );

-- Allow public inserts - this should work but using admin client bypasses RLS anyway
CREATE POLICY "Anyone can insert contact requests"
  ON contact_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

