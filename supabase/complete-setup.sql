-- ============================================
-- FORAYPAY COMPLETE SUPABASE SETUP SCRIPT
-- ============================================
-- 
-- This script sets up the entire ForayPay database schema, including:
-- - All tables with proper constraints
-- - Row Level Security (RLS) policies
-- - Performance indexes
-- - Helper functions
-- - Triggers
-- - Commission transfers system
-- - Payment codes system
--
-- IMPORTANT: Before running this script:
-- 1. Make sure you have a Supabase project created
-- 2. This script is idempotent (safe to run multiple times)
-- 3. After running, configure Supabase Auth redirect URLs in the dashboard
--    (See instructions at the end of this file)
--
-- ============================================
-- STEP 1: Enable Extensions
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STEP 2: Create Core Tables
-- ============================================

-- Companies table (multi-tenant root)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  monime_account_id TEXT,
  commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.05, -- 5% default commission
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('platform_admin', 'company_admin', 'park_operator')),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Routes table
CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  fare DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Park Operators table
CREATE TABLE IF NOT EXISTS park_operators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  assigned_routes UUID[] DEFAULT ARRAY[]::UUID[],
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  passenger_phone TEXT NOT NULL,
  monime_transaction_id TEXT NOT NULL UNIQUE,
  monime_otp TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE,
  validated_by UUID REFERENCES park_operators(id) ON DELETE SET NULL
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  commission DECIMAL(10,2) NOT NULL,
  net_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('completed', 'pending', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contact Requests table
CREATE TABLE IF NOT EXISTS contact_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  business_registration_number TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  website TEXT,
  socials TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'contacted', 'completed')),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Codes table (for reusable payment codes)
CREATE TABLE IF NOT EXISTS payment_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES park_operators(id) ON DELETE CASCADE,
  monime_code TEXT NOT NULL UNIQUE,
  total_tickets INTEGER NOT NULL DEFAULT 1,
  used_tickets INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(monime_code)
);

-- Commission Transfers table (tracks commission transfers to platform)
CREATE TABLE IF NOT EXISTS commission_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  from_account_id TEXT NOT NULL,
  to_account_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  reference TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  transfer_id TEXT, -- MoniMe transfer ID
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(ticket_id, transaction_id)
);

-- ============================================
-- STEP 3: Create Helper Functions (to avoid RLS recursion)
-- ============================================

-- Function to get user role (bypasses RLS)
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

-- Function to get user company ID (bypasses RLS)
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

-- Function to update commission_transfers updated_at timestamp
CREATE OR REPLACE FUNCTION update_commission_transfers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for automatic user creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, company_id)
  VALUES (
    NEW.id,
    NEW.email,
    'company_admin', -- Default role, can be updated by platform admin
    NULL -- Company ID set by platform admin
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_company_id(UUID) TO authenticated;

-- ============================================
-- STEP 4: Create Triggers
-- ============================================

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update commission_transfers updated_at
DROP TRIGGER IF EXISTS update_commission_transfers_updated_at ON commission_transfers;
CREATE TRIGGER update_commission_transfers_updated_at
  BEFORE UPDATE ON commission_transfers
  FOR EACH ROW
  EXECUTE FUNCTION update_commission_transfers_updated_at();

-- ============================================
-- STEP 5: Create Performance Indexes
-- ============================================

-- Core table indexes
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_routes_company_id ON routes(company_id);
CREATE INDEX IF NOT EXISTS idx_park_operators_company_id ON park_operators(company_id);
CREATE INDEX IF NOT EXISTS idx_park_operators_user_id ON park_operators(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_company_id ON tickets(company_id);
CREATE INDEX IF NOT EXISTS idx_tickets_route_id ON tickets(route_id);
CREATE INDEX IF NOT EXISTS idx_tickets_passenger_phone ON tickets(passenger_phone);
CREATE INDEX IF NOT EXISTS idx_tickets_monime_transaction_id ON tickets(monime_transaction_id);
CREATE INDEX IF NOT EXISTS idx_tickets_monime_otp ON tickets(monime_otp);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_transactions_company_id ON transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_transactions_ticket_id ON transactions(ticket_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON contact_requests(status);
CREATE INDEX IF NOT EXISTS idx_contact_requests_created_at ON contact_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_requests_reviewed_by ON contact_requests(reviewed_by);

-- Payment codes indexes
CREATE INDEX IF NOT EXISTS idx_payment_codes_monime_code ON payment_codes(monime_code);
CREATE INDEX IF NOT EXISTS idx_payment_codes_company_id ON payment_codes(company_id);
CREATE INDEX IF NOT EXISTS idx_payment_codes_status ON payment_codes(status);

-- Commission transfers indexes
CREATE INDEX IF NOT EXISTS idx_commission_transfers_ticket_id ON commission_transfers(ticket_id);
CREATE INDEX IF NOT EXISTS idx_commission_transfers_transaction_id ON commission_transfers(transaction_id);
CREATE INDEX IF NOT EXISTS idx_commission_transfers_company_id ON commission_transfers(company_id);
CREATE INDEX IF NOT EXISTS idx_commission_transfers_status ON commission_transfers(status);
CREATE INDEX IF NOT EXISTS idx_commission_transfers_created_at ON commission_transfers(created_at);
CREATE INDEX IF NOT EXISTS idx_commission_transfers_company_status ON commission_transfers(company_id, status);
CREATE INDEX IF NOT EXISTS idx_commission_transfers_pending ON commission_transfers(status, created_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_commission_transfers_failed_retryable ON commission_transfers(status, retry_count, updated_at) WHERE status = 'failed' AND retry_count < 5;

-- High-performance composite indexes
CREATE INDEX IF NOT EXISTS idx_tickets_transaction_lookup ON tickets(monime_transaction_id, company_id, status);
CREATE INDEX IF NOT EXISTS idx_payment_codes_active_lookup ON payment_codes(monime_code, status, company_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_transactions_company_date ON transactions(company_id, created_at DESC, status);
CREATE INDEX IF NOT EXISTS idx_payment_codes_active_partial ON payment_codes(monime_code) WHERE status = 'active' AND used_tickets < total_tickets;
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_routes_company_active ON routes(id, company_id, status) WHERE status = 'active';

-- ============================================
-- STEP 6: Enable Row Level Security (RLS)
-- ============================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE park_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_transfers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 7: Create RLS Policies
-- ============================================

-- Drop existing policies to avoid conflicts (idempotent)
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('companies', 'users', 'routes', 'park_operators', 'tickets', 'transactions', 'audit_logs', 'contact_requests', 'payment_codes', 'commission_transfers')) LOOP
    EXECUTE 'DROP POLICY IF EXISTS "Platform admins can view all companies" ON ' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Platform admins can insert companies" ON ' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Platform admins can update companies" ON ' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Platform admins can delete companies" ON ' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Company admins can view their own company" ON ' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Company admins can update their own company" ON ' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own profile" ON ' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Platform admins can view all users" ON ' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Company admins can view users in their company" ON ' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Company admins can manage routes in their company" ON ' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Park operators can view routes in their company" ON ' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Company admins can manage operators in their company" ON ' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Park operators can view their own profile" ON ' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Park operators can update their own profile" ON ' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Company admins can view tickets in their company" ON ' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Park operators can view tickets in their company" ON ' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Park operators can update tickets they validate" ON ' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Company admins can view transactions in their company" ON ' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Platform admins can view all transactions" ON ' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Company admins can view audit logs in their company" ON ' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Platform admins can view all audit logs" ON ' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Platform admins can delete audit logs" ON ' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Platform admins can view all contact requests" ON ' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Platform admins can update contact requests" ON ' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can insert contact requests" ON ' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Operators can view payment codes in their company" ON ' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Service role full access to payment_codes" ON ' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Company admins can view their transfers" ON ' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Platform admins can view all transfers" ON ' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Service role can manage transfers" ON ' || r.tablename;
  END LOOP;
END $$;

-- Companies policies
CREATE POLICY "Platform admins can view all companies"
  ON companies FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'platform_admin');

CREATE POLICY "Platform admins can insert companies"
  ON companies FOR INSERT
  WITH CHECK (public.get_user_role(auth.uid()) = 'platform_admin');

CREATE POLICY "Platform admins can update companies"
  ON companies FOR UPDATE
  USING (public.get_user_role(auth.uid()) = 'platform_admin');

CREATE POLICY "Platform admins can delete companies"
  ON companies FOR DELETE
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
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

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

CREATE POLICY "Platform admins can delete audit logs"
  ON audit_logs FOR DELETE
  USING (public.get_user_role(auth.uid()) = 'platform_admin');

-- Contact Requests policies
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

CREATE POLICY "Anyone can insert contact requests"
  ON contact_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Payment Codes policies
CREATE POLICY "Operators can view payment codes in their company"
  ON payment_codes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM park_operators po
      WHERE po.user_id = auth.uid()
      AND po.company_id = payment_codes.company_id
      AND po.status = 'active'
    )
  );

CREATE POLICY "Service role full access to payment_codes"
  ON payment_codes FOR ALL
  USING (auth.role() = 'service_role');

-- Commission Transfers policies
CREATE POLICY "Company admins can view their transfers"
  ON commission_transfers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.company_id = commission_transfers.company_id
      AND users.role = 'company_admin'
    )
  );

CREATE POLICY "Platform admins can view all transfers"
  ON commission_transfers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'platform_admin'
    )
  );

CREATE POLICY "Service role can manage transfers"
  ON commission_transfers FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- STEP 8: Verification Queries
-- ============================================

-- Check all tables were created
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('companies', 'users', 'routes', 'park_operators', 'tickets', 'transactions', 'audit_logs', 'contact_requests', 'payment_codes', 'commission_transfers');
  
  IF table_count = 10 THEN
    RAISE NOTICE '✅ All 10 tables created successfully';
  ELSE
    RAISE WARNING '⚠️ Only % out of 10 tables found', table_count;
  END IF;
END $$;

-- Check RLS is enabled
DO $$
DECLARE
  rls_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO rls_count
  FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename IN ('companies', 'users', 'routes', 'park_operators', 'tickets', 'transactions', 'audit_logs', 'contact_requests', 'payment_codes', 'commission_transfers')
  AND rowsecurity = true;
  
  IF rls_count = 10 THEN
    RAISE NOTICE '✅ RLS enabled on all tables';
  ELSE
    RAISE WARNING '⚠️ RLS enabled on % out of 10 tables', rls_count;
  END IF;
END $$;

-- Check helper functions exist
DO $$
DECLARE
  func_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname IN ('get_user_role', 'get_user_company_id', 'handle_new_user', 'update_commission_transfers_updated_at');
  
  IF func_count = 4 THEN
    RAISE NOTICE '✅ All helper functions created';
  ELSE
    RAISE WARNING '⚠️ Only % out of 4 functions found', func_count;
  END IF;
END $$;

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- 
-- Next Steps:
-- 
-- 1. CREATE PLATFORM ADMIN USER:
--    - Go to Supabase Dashboard > Authentication > Users
--    - Click "Add User"
--    - Enter email and password
--    - Enable "Auto Confirm User"
--    - Create the user
--    - Then run this SQL to set platform admin role:
--
--    UPDATE users
--    SET role = 'platform_admin', company_id = NULL
--    WHERE email = 'your-admin-email@example.com';
--
-- 2. CONFIGURE SUPABASE AUTH REDIRECT URLS:
--    - Go to Supabase Dashboard > Authentication > URL Configuration
--    - Add your main app domain to "Redirect URLs":
--      https://yourdomain.com/**
--    - If using separate admin domain, also add:
--      https://admin.yourdomain.com/**
--    - Set "Site URL" to your main domain:
--      https://yourdomain.com
--    - Save configuration
--
-- 3. SET ENVIRONMENT VARIABLES:
--    - NEXT_PUBLIC_SUPABASE_URL
--    - NEXT_PUBLIC_SUPABASE_ANON_KEY
--    - SUPABASE_SERVICE_ROLE_KEY
--    - NEXT_PUBLIC_APP_URL
--    - NEXT_PUBLIC_ADMIN_APP_URL (optional, if using separate admin domain)
--    - MONIME_API_URL
--    - MONIME_API_KEY
--    - MONIME_PLATFORM_ACCOUNT_ID
--    - MONIME_WEBHOOK_SECRET
--
-- 4. VERIFY SETUP:
--    - Try logging in as platform admin at /admin/login
--    - Create a test company
--    - Verify RLS policies are working
--
-- For detailed instructions, see:
-- - PLATFORM_ADMIN_DOMAIN_SETUP.md (for multi-domain configuration)
-- - DEPLOYMENT.md (for deployment guide)
-- - ENV-SETUP.md (for environment variables)
--
-- ============================================

