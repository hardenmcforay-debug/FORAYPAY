-- Add DELETE policy for companies table to allow platform admins to delete companies

-- Create DELETE policy for platform admins
CREATE POLICY "Platform admins can delete companies"
  ON companies FOR DELETE
  USING (
    public.get_user_role(auth.uid()) = 'platform_admin'
  );

