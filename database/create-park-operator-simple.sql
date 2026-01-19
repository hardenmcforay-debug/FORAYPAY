-- ============================================
-- CREATE PARK OPERATOR - SIMPLE VERSION
-- ============================================
-- Quick script to create park operator
-- Replace all placeholder values

-- STEP 1: Get your Auth User UUID from Supabase Auth
-- STEP 2: Get your Company UUID (run: SELECT id FROM companies WHERE email = 'company@example.com';)
-- STEP 3: Run the script below with your values

WITH user_data AS (
  INSERT INTO users (id, email, password_hash, full_name, role, company_id, is_active)
  VALUES (
    'AUTH_USER_UUID_HERE',        -- Step 1: UUID from Supabase Auth
    'operator@example.com',       -- Operator email
    '',
    'Operator Full Name',         -- Operator name
    'park_operator',              -- Must be 'park_operator'
    'COMPANY_UUID_HERE',          -- Step 2: Company UUID
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    company_id = EXCLUDED.company_id,
    is_active = EXCLUDED.is_active,
    updated_at = NOW()
  RETURNING id, company_id
)
INSERT INTO park_operators (company_id, user_id, route_id, location, is_active)
SELECT 
  user_data.company_id,
  user_data.id,
  NULL,                          -- Route ID (optional, can set later)
  'Main Terminal',               -- Location name
  true
FROM user_data
ON CONFLICT DO NOTHING;

