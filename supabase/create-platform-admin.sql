-- ============================================
-- Create Platform Admin Account
-- ============================================
-- 
-- STEP 1: Create the user in Supabase Auth first
-- Go to Authentication > Users in Supabase Dashboard
-- Click "Add User" and create with:
--   Email: admin@foraypay.com (or your email)
--   Password: [set a secure password]
--   Auto Confirm User: YES
--
-- OR use Supabase Management API:
-- POST https://[project-ref].supabase.co/auth/v1/admin/users
-- {
--   "email": "admin@foraypay.com",
--   "password": "YourSecurePassword123!",
--   "email_confirm": true,
--   "user_metadata": {}
-- }
--
-- STEP 2: After creating the auth user, run this SQL:
-- ============================================

-- Option A: Update existing user to platform admin
-- Replace 'admin@foraypay.com' with your actual email
UPDATE users
SET 
  role = 'platform_admin',
  company_id = NULL
WHERE email = 'admin@foraypay.com';

-- Verify the update
SELECT 
  id,
  email,
  role,
  company_id,
  created_at
FROM users
WHERE email = 'admin@foraypay.com';

-- ============================================
-- Option B: Create platform admin directly (if auth user already exists)
-- ============================================
-- This assumes the auth user was created and you have the user ID
-- Replace the UUID with the actual auth.users.id

-- First, get the user ID from auth.users:
-- SELECT id, email FROM auth.users WHERE email = 'admin@foraypay.com';

-- Then insert/update in users table:
INSERT INTO users (id, email, role, company_id)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@foraypay.com'),
  'admin@foraypay.com',
  'platform_admin',
  NULL
)
ON CONFLICT (id) 
DO UPDATE SET
  role = 'platform_admin',
  company_id = NULL;

-- ============================================
-- Option C: Complete script with user creation (requires service role)
-- ============================================
-- WARNING: This requires service role access and should be run carefully
-- Only use this if you have direct database access with elevated privileges

-- Create auth user (requires service role)
-- DO NOT run this in the SQL editor - use Supabase Management API instead
-- Or create via Supabase Dashboard > Authentication > Users

-- After auth user exists, ensure platform admin profile:
DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'admin@foraypay.com'; -- Change this to your email
BEGIN
  -- Get the user ID from auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % does not exist in auth.users. Please create the user first via Supabase Dashboard or Auth API.', v_email;
  END IF;
  
  -- Insert or update the user profile
  INSERT INTO users (id, email, role, company_id)
  VALUES (v_user_id, v_email, 'platform_admin', NULL)
  ON CONFLICT (id) 
  DO UPDATE SET
    role = 'platform_admin',
    company_id = NULL;
  
  RAISE NOTICE 'Platform admin account created/updated successfully for: %', v_email;
END $$;

-- ============================================
-- Verification Query
-- ============================================
-- Run this to verify your platform admin account:

SELECT 
  u.id,
  u.email,
  u.role,
  u.company_id,
  u.created_at,
  au.email_confirmed_at,
  au.last_sign_in_at
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.role = 'platform_admin'
ORDER BY u.created_at DESC;

-- ============================================
-- Quick Setup Instructions:
-- ============================================
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add User" or "Invite User"
-- 3. Enter email: admin@foraypay.com
-- 4. Set password (or use passwordless)
-- 5. Enable "Auto Confirm User"
-- 6. Create the user
-- 7. Copy the user's UUID (or email)
-- 8. Run Option A SQL above with your email
-- 9. Login at /login with your credentials
-- 10. You'll be redirected to /platform dashboard

