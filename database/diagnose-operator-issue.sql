-- ============================================
-- DIAGNOSE PARK OPERATOR DASHBOARD ISSUE
-- ============================================
-- Run these queries to find out why the dashboard is blank

-- 1. Check if user exists in users table
-- Replace 'operator@example.com' with your operator email
SELECT 
  id,
  email,
  full_name,
  role,
  company_id,
  is_active
FROM users 
WHERE email = 'operator@example.com';

-- 2. Check if park_operator record exists
-- Replace 'USER_UUID' with the user id from step 1
SELECT 
  po.id,
  po.company_id,
  po.user_id,
  po.route_id,
  po.location,
  po.is_active,
  u.email as user_email,
  c.name as company_name
FROM park_operators po
LEFT JOIN users u ON po.user_id = u.id
LEFT JOIN companies c ON po.company_id = c.id
WHERE po.user_id = 'USER_UUID_FROM_STEP_1';

-- 3. Check if user_id matches between users and park_operators
-- Replace 'operator@example.com' with your operator email
SELECT 
  u.id as user_id,
  u.email,
  u.role,
  po.id as operator_id,
  po.is_active as operator_active,
  CASE 
    WHEN po.id IS NULL THEN '❌ No park_operator record found'
    WHEN po.is_active = false THEN '⚠️ Operator record is inactive'
    WHEN u.is_active = false THEN '⚠️ User is inactive'
    ELSE '✅ Operator record exists and is active'
  END as status
FROM users u
LEFT JOIN park_operators po ON po.user_id = u.id
WHERE u.email = 'operator@example.com';

-- 4. Check RLS policies (if you have access)
-- This shows if RLS is blocking the query
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'park_operators';

-- 5. Quick fix: If operator record doesn't exist, create it
-- Replace all placeholder values
-- First get the user_id and company_id:
-- SELECT id, company_id FROM users WHERE email = 'operator@example.com';

-- Then create park_operator (replace USER_ID and COMPANY_ID):
INSERT INTO park_operators (company_id, user_id, route_id, location, is_active)
VALUES (
  'COMPANY_ID_HERE',    -- From users.company_id
  'USER_ID_HERE',       -- From users.id (same as auth.users.id)
  NULL,                 -- Route ID (optional)
  'Main Terminal',      -- Location
  true
)
ON CONFLICT DO NOTHING;

