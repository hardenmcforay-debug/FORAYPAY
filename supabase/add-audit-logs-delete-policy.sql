-- Add DELETE policy for audit_logs table
-- Platform admins can delete audit logs

CREATE POLICY "Platform admins can delete audit logs"
  ON audit_logs FOR DELETE
  USING (
    public.get_user_role(auth.uid()) = 'platform_admin'
  );

