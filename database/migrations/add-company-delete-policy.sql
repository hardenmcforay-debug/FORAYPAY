-- Add DELETE policy for companies table
-- Platform admins can delete companies
-- Note: The API uses service role key which bypasses RLS, but this policy is good for direct database access

CREATE POLICY "Platform admins can delete companies"
  ON companies
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'platform_admin'
    )
  );

