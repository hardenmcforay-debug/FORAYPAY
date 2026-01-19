-- Helper script to create users for Foraypay
-- 
-- IMPORTANT: Users must exist in BOTH Supabase Auth AND the users table
-- The ID in the users table MUST match the UUID from auth.users
--
-- ============================================
-- STEP 1: Create user in Supabase Auth
-- ============================================
-- 1. Go to Supabase Dashboard
-- 2. Navigate to: Authentication > Users
-- 3. Click "Add user" > "Create new user"
-- 4. Enter:
--    - Email: your-email@example.com
--    - Password: your-password
--    - Auto Confirm User: YES (check the box)
-- 5. Click "Create user"
-- 6. Copy the User UUID (shown in the user details)
--
-- ============================================
-- STEP 2: Create corresponding record in users table
-- ============================================
-- Run the appropriate INSERT statement below in SQL Editor
-- Replace USER_UUID with the UUID from Step 1

-- ============================================
-- PLATFORM ADMIN
-- ============================================
INSERT INTO users (id, email, password_hash, full_name, role, is_active)
VALUES (
  'USER_UUID_FROM_AUTH',  -- Replace with UUID from Supabase Auth
  'admin@foraypay.com',   -- Your email (must match Supabase Auth email)
  '',                      -- Leave empty - password managed by Supabase Auth
  'Platform Admin',        -- Your full name
  'platform_admin',
  true
)
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================
-- COMPANY ADMIN (requires company_id)
-- ============================================
-- First, create or get a company ID:
-- SELECT id FROM companies WHERE email = 'company@example.com';
--
-- Then create the user:
INSERT INTO users (id, email, password_hash, full_name, role, company_id, is_active)
VALUES (
  'USER_UUID_FROM_AUTH',  -- Replace with UUID from Supabase Auth
  'admin@company.com',    -- Your email
  '',                      -- Leave empty
  'Company Admin',         -- Your full name
  'company_admin',
  'COMPANY_UUID_HERE',    -- Replace with company UUID
  true
)
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  company_id = EXCLUDED.company_id,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================
-- PARK OPERATOR (requires company_id and user_id)
-- ============================================
-- First create the user:
INSERT INTO users (id, email, password_hash, full_name, role, company_id, is_active)
VALUES (
  'USER_UUID_FROM_AUTH',  -- Replace with UUID from Supabase Auth
  'operator@company.com', -- Your email
  '',                      -- Leave empty
  'Park Operator',         -- Your full name
  'park_operator',
  'COMPANY_UUID_HERE',    -- Replace with company UUID
  true
)
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  company_id = EXCLUDED.company_id,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Then create the park_operator record:
INSERT INTO park_operators (company_id, user_id, route_id, location, is_active)
VALUES (
  'COMPANY_UUID_HERE',    -- Company UUID
  'USER_UUID_FROM_AUTH',  -- Same UUID from users table
  NULL,                    -- Route ID (can be set later)
  'Main Terminal',         -- Location
  true
)
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Check if user exists in users table:
-- SELECT * FROM users WHERE email = 'your-email@example.com';

-- Check if user exists in auth.users:
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Verify IDs match:
-- SELECT 
--   u.id as users_table_id,
--   u.email,
--   u.role,
--   a.id as auth_users_id
-- FROM users u
-- LEFT JOIN auth.users a ON u.id = a.id
-- WHERE u.email = 'your-email@example.com';

