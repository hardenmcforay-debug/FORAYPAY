-- ============================================
-- FIX USER WITH EXACT UUID FROM ERROR MESSAGE
-- ============================================
-- Your Auth ID from the error: e264e689-1f3c-4acc-8b50-ef98fa2ae552
-- Use this exact UUID below

-- STEP 1: Check if user exists in users table with this UUID
SELECT 
  id,
  email,
  full_name,
  role,
  is_active
FROM users 
WHERE id = 'e264e689-1f3c-4acc-8b50-ef98fa2ae552';

-- STEP 2: Check what email is associated with this UUID in auth.users
SELECT 
  id,
  email,
  created_at
FROM auth.users 
WHERE id = 'e264e689-1f3c-4acc-8b50-ef98fa2ae552';

-- STEP 3: Delete any existing record with wrong UUID (if exists)
-- Replace 'your-email@example.com' with your actual email from Step 2
DELETE FROM users WHERE email = 'your-email@example.com';

-- STEP 4: Insert with the EXACT UUID from error message
-- Replace the values below:
--   - 'your-email@example.com' with your email from Step 2
--   - 'Your Full Name' with your actual name
INSERT INTO users (id, email, password_hash, full_name, role, is_active)
VALUES (
  'e264e689-1f3c-4acc-8b50-ef98fa2ae552',  -- EXACT UUID from error message
  'your-email@example.com',                 -- Your email (get from Step 2)
  '',                                       -- Leave empty
  'Your Full Name',                         -- Your name
  'platform_admin',                          -- Your role
  true                                      -- Active
);

-- STEP 5: Verify it worked
SELECT 
  a.id as auth_id,
  a.email as auth_email,
  u.id as users_id,
  u.email as users_email,
  u.role,
  CASE 
    WHEN a.id = u.id THEN '✅ SUCCESS - IDs match!'
    ELSE '❌ Still wrong'
  END as status
FROM auth.users a
LEFT JOIN users u ON a.id = u.id
WHERE a.id = 'e264e689-1f3c-4acc-8b50-ef98fa2ae552';

