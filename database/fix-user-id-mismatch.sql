-- ============================================
-- FIX USER ID MISMATCH - QUICK FIX SCRIPT
-- ============================================
-- This script helps fix the common issue where the UUID in users table
-- doesn't match the UUID from Supabase Auth

-- STEP 1: Get your UUID from Supabase Auth
-- Replace 'your-email@example.com' with your actual email
SELECT 
  id as correct_uuid,
  email
FROM auth.users 
WHERE email = 'your-email@example.com';

-- Copy the UUID from the result above (it looks like: 123e4567-e89b-12d3-a456-426614174000)

-- STEP 2: Check what's currently in users table
SELECT 
  id as current_uuid,
  email,
  full_name,
  role
FROM users 
WHERE email = 'your-email@example.com';

-- STEP 3: Delete the wrong record (if it exists with wrong UUID)
-- Replace 'your-email@example.com' with your email
DELETE FROM users WHERE email = 'your-email@example.com';

-- STEP 4: Insert with the CORRECT UUID from Step 1
-- Replace all the values below:
--   - CORRECT_UUID_FROM_STEP_1: The UUID you got from Step 1
--   - your-email@example.com: Your email
--   - Your Full Name: Your actual name
INSERT INTO users (id, email, password_hash, full_name, role, is_active)
VALUES (
  'CORRECT_UUID_FROM_STEP_1',  -- Paste the UUID from Step 1 here
  'your-email@example.com',     -- Your email
  '',                           -- Leave empty
  'Your Full Name',             -- Your name
  'platform_admin',             -- Your role
  true                          -- Active
);

-- STEP 5: Verify it worked
SELECT 
  a.id as auth_id,
  a.email as auth_email,
  u.id as users_id,
  u.email as users_email,
  CASE 
    WHEN a.id = u.id THEN '✅ IDs Match - Fixed!'
    ELSE '❌ Still mismatched'
  END as status
FROM auth.users a
LEFT JOIN users u ON a.id = u.id
WHERE a.email = 'your-email@example.com';

-- ============================================
-- ALTERNATIVE: Update existing record (if you want to keep the record)
-- ============================================
-- Only use this if you want to update instead of delete/insert
-- 
-- First get both UUIDs:
-- SELECT id FROM auth.users WHERE email = 'your-email@example.com';
-- SELECT id FROM users WHERE email = 'your-email@example.com';
--
-- Then update (replace OLD_UUID with users.id and NEW_UUID with auth.users.id):
-- UPDATE users 
-- SET id = 'NEW_UUID_FROM_AUTH_USERS'
-- WHERE id = 'OLD_UUID_FROM_USERS_TABLE';

