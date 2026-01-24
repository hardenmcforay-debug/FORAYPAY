-- ============================================
-- Fix RLS Infinite Recursion on Users Table
-- ============================================
-- This script fixes the infinite recursion error by:
-- 1. Creating helper functions that bypass RLS
-- 2. Dropping and recreating all policies that query users table
-- 3. Using helper functions instead of direct queries

-- Step 1: Create helper functions (bypass RLS with SECURITY DEFINER)
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
  SELECT role INTO user_role
  FROM users
  WHERE id = user_id;
  
  RETURN user_role;
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
  SELECT company_id INTO company_uuid
  FROM users
  WHERE id = user_id;
  
  RETURN company_uuid;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_company_id(UUID) TO authenticated;

-- Step 2: Drop all policies that query users table
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Platform admins can view all users" ON users;
DROP POLICY IF EXISTS "Company admins can view users in their company" ON users;
DROP POLICY IF EXISTS "Platform admins can view all companies" ON companies;
DROP POLICY IF EXISTS "Company admins can view their own company" ON companies;
DROP POLICY IF EXISTS "Company admins can manage routes in their company" ON routes;
DROP POLICY IF EXISTS "Company admins can manage operators in their company" ON park_operators;
DROP POLICY IF EXISTS "Company admins can view tickets in their company" ON tickets;
DROP POLICY IF EXISTS "Company admins can view transactions in their company" ON transactions;
DROP POLICY IF EXISTS "Platform admins can view all transactions" ON transactions;
DROP POLICY IF EXISTS "Company admins can view audit logs in their company" ON audit_logs;
DROP POLICY IF EXISTS "Platform admins can view all audit logs" ON audit_logs;

-- Step 3: Recreate policies using helper functions (no recursion)

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

-- Park Operators policies
CREATE POLICY "Company admins can manage operators in their company"
  ON park_operators FOR ALL
  USING (
    public.get_user_role(auth.uid()) = 'company_admin'
    AND company_id = public.get_user_company_id(auth.uid())
  );

-- Tickets policies
CREATE POLICY "Company admins can view tickets in their company"
  ON tickets FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = 'company_admin'
    AND company_id = public.get_user_company_id(auth.uid())
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

