-- ============================================
-- Check and Fix User Profile
-- ============================================
-- Run this to check if your user has a profile in the users table

-- Step 1: Check if user exists in auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'your-email@example.com'; -- Replace with your email

-- Step 2: Check if user profile exists in users table
SELECT 
  u.id,
  u.email,
  u.role,
  u.company_id,
  u.created_at
FROM users u
WHERE u.email = 'your-email@example.com'; -- Replace with your email

-- Step 3: If user exists in auth.users but NOT in users table,
-- create the profile manually:

-- For Platform Admin:
INSERT INTO users (id, email, role, company_id)
SELECT 
  id,
  email,
  'platform_admin',
  NULL
FROM auth.users
WHERE email = 'your-email@example.com' -- Replace with your email
AND id NOT IN (SELECT id FROM users)
ON CONFLICT (id) DO NOTHING;

-- For Company Admin (replace company_id with actual UUID):
-- INSERT INTO users (id, email, role, company_id)
-- SELECT 
--   id,
--   email,
--   'company_admin',
--   'your-company-uuid-here'::uuid
-- FROM auth.users
-- WHERE email = 'your-email@example.com'
-- AND id NOT IN (SELECT id FROM users)
-- ON CONFLICT (id) DO NOTHING;

-- Step 4: Verify the profile was created
SELECT 
  u.id,
  u.email,
  u.role,
  u.company_id,
  au.email_confirmed_at
FROM users u
JOIN auth.users au ON u.id = au.id
WHERE u.email = 'your-email@example.com'; -- Replace with your email

