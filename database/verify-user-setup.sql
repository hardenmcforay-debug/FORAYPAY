-- ============================================
-- VERIFY USER SETUP - DIAGNOSTIC QUERIES
-- ============================================
-- Run these queries to check if your user is set up correctly

-- 1. Check if user exists in auth.users (Supabase Auth)
-- Replace 'your-email@example.com' with your actual email
SELECT 
  id as auth_user_id,
  email as auth_email,
  created_at as auth_created_at,
  email_confirmed_at,
  confirmed_at
FROM auth.users 
WHERE email = 'your-email@example.com';

-- 2. Check if user exists in users table
-- Replace 'your-email@example.com' with your actual email
SELECT 
  id as users_table_id,
  email as users_email,
  full_name,
  role,
  is_active,
  created_at as users_created_at
FROM users 
WHERE email = 'your-email@example.com';

-- 3. COMPARE IDs - This is the most important check!
-- The IDs MUST match between auth.users and users table
-- Replace 'your-email@example.com' with your actual email
SELECT 
  a.id as auth_users_id,
  a.email as auth_email,
  u.id as users_table_id,
  u.email as users_email,
  u.role,
  u.is_active,
  CASE 
    WHEN a.id IS NULL THEN '❌ User NOT in Supabase Auth'
    WHEN u.id IS NULL THEN '❌ User NOT in users table'
    WHEN a.id != u.id THEN '❌ ID MISMATCH - This is the problem!'
    WHEN a.email != u.email THEN '❌ Email mismatch'
    WHEN u.is_active = false THEN '⚠️ User is inactive'
    ELSE '✅ User setup is correct!'
  END as status
FROM auth.users a
FULL OUTER JOIN users u ON a.id = u.id
WHERE a.email = 'your-email@example.com' OR u.email = 'your-email@example.com';

-- 4. If IDs don't match, you need to fix it:
-- Option A: Delete the wrong record and recreate with correct UUID
-- DELETE FROM users WHERE email = 'your-email@example.com';
-- Then insert with the correct UUID from auth.users

-- Option B: Update the existing record with correct UUID
-- First, get the UUID from auth.users:
-- SELECT id FROM auth.users WHERE email = 'your-email@example.com';
--
-- Then update users table (replace OLD_UUID with current users.id and NEW_UUID with auth.users.id):
-- UPDATE users SET id = 'NEW_UUID_FROM_AUTH' WHERE id = 'OLD_UUID_IN_USERS_TABLE';

-- 5. Quick fix script (replace values):
-- Step 1: Get your auth.users UUID
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
--
-- Step 2: Delete wrong record from users table
-- DELETE FROM users WHERE email = 'your-email@example.com';
--
-- Step 3: Insert with correct UUID (use the UUID from Step 1)
-- INSERT INTO users (id, email, password_hash, full_name, role, is_active)
-- VALUES (
--   'UUID_FROM_STEP_1',           -- Use the UUID from auth.users
--   'your-email@example.com',     -- Your email
--   '',                            -- Leave empty
--   'Your Full Name',              -- Your name
--   'platform_admin',              -- Your role
--   true                           -- Active
-- );

