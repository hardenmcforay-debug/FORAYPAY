-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Indexes for performance
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

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE park_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

-- Companies policies (fixed to avoid recursion)
CREATE POLICY "Platform admins can view all companies"
  ON companies FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = 'platform_admin'
  );

CREATE POLICY "Platform admins can insert companies"
  ON companies FOR INSERT
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'platform_admin'
  );

CREATE POLICY "Platform admins can update companies"
  ON companies FOR UPDATE
  USING (
    public.get_user_role(auth.uid()) = 'platform_admin'
  );

CREATE POLICY "Platform admins can delete companies"
  ON companies FOR DELETE
  USING (
    public.get_user_role(auth.uid()) = 'platform_admin'
  );

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

-- Helper functions to avoid RLS recursion
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

-- Users policies (fixed to avoid recursion)
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Platform admins can view all users"
  ON users FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = 'platform_admin'
  );

CREATE POLICY "Company admins can view users in their company"
  ON users FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = 'company_admin'
    AND company_id = public.get_user_company_id(auth.uid())
  );

-- Routes policies (fixed to avoid recursion)
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

-- Park Operators policies (fixed to avoid recursion)
CREATE POLICY "Company admins can manage operators in their company"
  ON park_operators FOR ALL
  USING (
    public.get_user_role(auth.uid()) = 'company_admin'
    AND company_id = public.get_user_company_id(auth.uid())
  );

CREATE POLICY "Park operators can view their own profile"
  ON park_operators FOR SELECT
  USING (
    user_id = auth.uid()
  );

CREATE POLICY "Park operators can update their own profile"
  ON park_operators FOR UPDATE
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- Tickets policies (fixed to avoid recursion)
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

-- Transactions policies (fixed to avoid recursion)
CREATE POLICY "Company admins can view transactions in their company"
  ON transactions FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = 'company_admin'
    AND company_id = public.get_user_company_id(auth.uid())
  );

CREATE POLICY "Platform admins can view all transactions"
  ON transactions FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = 'platform_admin'
  );

-- Audit Logs policies (fixed to avoid recursion)
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
  USING (
    public.get_user_role(auth.uid()) = 'platform_admin'
  );

CREATE POLICY "Platform admins can delete audit logs"
  ON audit_logs FOR DELETE
  USING (
    public.get_user_role(auth.uid()) = 'platform_admin'
  );

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

-- Allow public inserts (using admin client in API bypasses RLS anyway)
CREATE POLICY "Anyone can insert contact requests"
  ON contact_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Functions for automatic user creation
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

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

