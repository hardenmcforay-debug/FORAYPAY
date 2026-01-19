-- Add RLS policies for routes table
-- This allows company admins to manage routes for their company

-- Company admins can view routes for their company
CREATE POLICY "Company admins can view their company routes"
  ON routes FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'company_admin'
    )
  );

-- Company admins can insert routes for their company
CREATE POLICY "Company admins can insert routes for their company"
  ON routes FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'company_admin'
    )
  );

-- Company admins can update routes for their company
CREATE POLICY "Company admins can update their company routes"
  ON routes FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'company_admin'
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'company_admin'
    )
  );

-- Company admins can delete routes for their company
CREATE POLICY "Company admins can delete their company routes"
  ON routes FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'company_admin'
    )
  );

-- Platform admins can view all routes
CREATE POLICY "Platform admins can view all routes"
  ON routes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'platform_admin'
    )
  );

-- Park operators can view routes for their company
CREATE POLICY "Park operators can view their company routes"
  ON routes FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM park_operators
      WHERE park_operators.user_id = auth.uid()
    )
  );

