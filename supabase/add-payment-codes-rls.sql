-- Add RLS policies for payment_codes table to ensure company isolation

-- Enable RLS on payment_codes table
ALTER TABLE payment_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Operators can view their payment codes" ON payment_codes;
DROP POLICY IF EXISTS "Service role full access to payment_codes" ON payment_codes;

-- Policy: Park operators can only view payment codes from their own company
CREATE POLICY "Park operators can view payment codes in their company"
  ON payment_codes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM park_operators po
      WHERE po.user_id = auth.uid()
      AND po.company_id = payment_codes.company_id
      AND po.status = 'active'
    )
  );

-- Policy: Company admins can view payment codes in their company
CREATE POLICY "Company admins can view payment codes in their company"
  ON payment_codes FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = 'company_admin'
    AND company_id = public.get_user_company_id(auth.uid())
  );

-- Policy: Platform admins can view all payment codes
CREATE POLICY "Platform admins can view all payment codes"
  ON payment_codes FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = 'platform_admin'
  );

-- Policy: Service role can do everything (for webhooks and server-side operations)
CREATE POLICY "Service role full access to payment_codes"
  ON payment_codes FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

