-- ============================================
-- QUICK FIX - Copy and paste this, then replace values
-- ============================================
-- Your Auth UUID: e264e689-1f3c-4acc-8b50-ef98fa2ae552

-- First, get your email from auth.users:
SELECT email FROM auth.users WHERE id = 'e264e689-1f3c-4acc-8b50-ef98fa2ae552';

-- Then run this (replace 'YOUR_EMAIL_HERE' with the email from above):
DELETE FROM users WHERE email = 'YOUR_EMAIL_HERE';

INSERT INTO users (id, email, password_hash, full_name, role, is_active)
VALUES (
  'e264e689-1f3c-4acc-8b50-ef98fa2ae552',
  'YOUR_EMAIL_HERE',
  '',
  'Your Full Name',
  'platform_admin',
  true
);

-- Verify:
SELECT 
  a.id as auth_id,
  u.id as users_id,
  CASE WHEN a.id = u.id THEN '✅ Fixed!' ELSE '❌ Wrong' END as status
FROM auth.users a
LEFT JOIN users u ON a.id = u.id
WHERE a.id = 'e264e689-1f3c-4acc-8b50-ef98fa2ae552';

