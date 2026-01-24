-- Fix RLS policies for companies table to allow platform admins to insert/update

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Platform admins can insert companies" ON companies;
DROP POLICY IF EXISTS "Platform admins can update companies" ON companies;

-- Create INSERT policy for platform admins
CREATE POLICY "Platform admins can insert companies"
  ON companies FOR INSERT
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'platform_admin'
  );

-- Create UPDATE policy for platform admins
CREATE POLICY "Platform admins can update companies"
  ON companies FOR UPDATE
  USING (
    public.get_user_role(auth.uid()) = 'platform_admin'
  );

