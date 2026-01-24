-- ============================================
-- URGENT: Fix RLS Infinite Recursion
-- ============================================
-- Run this script IMMEDIATELY in Supabase SQL Editor
-- This will fix the infinite recursion error

-- Step 1: Create helper functions (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- This function bypasses RLS, so no recursion
  SELECT role INTO user_role
  FROM public.users
  WHERE id = user_id;
  
  RETURN COALESCE(user_role, '');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_company_id(user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  company_uuid UUID;
BEGIN
  -- This function bypasses RLS, so no recursion
  SELECT company_id INTO company_uuid
  FROM public.users
  WHERE id = user_id;
  
  RETURN company_uuid;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_company_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_company_id(UUID) TO anon;

-- Step 2: Drop ALL existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Platform admins can view all users" ON users;
DROP POLICY IF EXISTS "Company admins can view users in their company" ON users;
DROP POLICY IF EXISTS "Platform admins can view all companies" ON companies;
DROP POLICY IF EXISTS "Company admins can view their own company" ON companies;
DROP POLICY IF EXISTS "Company admins can manage routes in their company" ON routes;
DROP POLICY IF EXISTS "Park operators can view routes in their company" ON routes;
DROP POLICY IF EXISTS "Company admins can manage operators in their company" ON park_operators;
DROP POLICY IF EXISTS "Park operators can view their own profile" ON park_operators;
DROP POLICY IF EXISTS "Company admins can view tickets in their company" ON tickets;
DROP POLICY IF EXISTS "Park operators can view tickets in their company" ON tickets;
DROP POLICY IF EXISTS "Park operators can update tickets they validate" ON tickets;
DROP POLICY IF EXISTS "Company admins can view transactions in their company" ON transactions;
DROP POLICY IF EXISTS "Platform admins can view all transactions" ON transactions;
DROP POLICY IF EXISTS "Company admins can view audit logs in their company" ON audit_logs;
DROP POLICY IF EXISTS "Platform admins can view all audit logs" ON audit_logs;

-- Step 3: Recreate policies using helper functions (NO RECURSION)

-- Users policies
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Platform admins can view all users"
  ON users FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'platform_admin');

CREATE POLICY "Company admins can view users in their company"
  ON users FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = 'company_admin'
    AND company_id = public.get_user_company_id(auth.uid())
  );

-- Companies policies
CREATE POLICY "Platform admins can view all companies"
  ON companies FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'platform_admin');

CREATE POLICY "Company admins can view their own company"
  ON companies FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = 'company_admin'
    AND id = public.get_user_company_id(auth.uid())
  );

CREATE POLICY "Company admins can update their own company"
  ON companies FOR UPDATE
  USING (
    public.get_user_role(auth.uid()) = 'company_admin'
    AND id = public.get_user_company_id(auth.uid())
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'company_admin'
    AND id = public.get_user_company_id(auth.uid())
  );

-- Routes policies
CREATE POLICY "Company admins can manage routes in their company"
  ON routes FOR ALL
  USING (
    public.get_user_role(auth.uid()) = 'company_admin'
    AND company_id = public.get_user_company_id(auth.uid())
  );

CREATE POLICY "Park operators can view routes in their company"
  ON routes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM park_operators po
      WHERE po.user_id = auth.uid()
      AND po.company_id = routes.company_id
      AND po.status = 'active'
    )
  );

-- Park Operators policies
CREATE POLICY "Company admins can manage operators in their company"
  ON park_operators FOR ALL
  USING (
    public.get_user_role(auth.uid()) = 'company_admin'
    AND company_id = public.get_user_company_id(auth.uid())
  );

CREATE POLICY "Park operators can view their own profile"
  ON park_operators FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Park operators can update their own profile"
  ON park_operators FOR UPDATE
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- Tickets policies
CREATE POLICY "Company admins can view tickets in their company"
  ON tickets FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = 'company_admin'
    AND company_id = public.get_user_company_id(auth.uid())
  );

CREATE POLICY "Park operators can view tickets in their company"
  ON tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM park_operators po
      WHERE po.user_id = auth.uid()
      AND po.company_id = tickets.company_id
      AND po.status = 'active'
    )
  );

CREATE POLICY "Park operators can update tickets they validate"
  ON tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM park_operators po
      WHERE po.user_id = auth.uid()
      AND po.company_id = tickets.company_id
      AND po.status = 'active'
    )
    AND status = 'pending'
  );

-- Transactions policies
CREATE POLICY "Company admins can view transactions in their company"
  ON transactions FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = 'company_admin'
    AND company_id = public.get_user_company_id(auth.uid())
  );

CREATE POLICY "Platform admins can view all transactions"
  ON transactions FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'platform_admin');

-- Audit Logs policies
CREATE POLICY "Company admins can view audit logs in their company"
  ON audit_logs FOR SELECT
  USING (
    (
      public.get_user_role(auth.uid()) = 'company_admin'
      AND company_id = public.get_user_company_id(auth.uid())
    )
    OR company_id IS NULL
  );

CREATE POLICY "Platform admins can view all audit logs"
  ON audit_logs FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'platform_admin');

-- Step 4: Verify functions exist
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname IN ('get_user_role', 'get_user_company_id')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Done! The recursion should now be fixed.
-- Try logging in again.

