-- Script to create a Platform Admin user
-- IMPORTANT: You must create the user in Supabase Auth FIRST, then run this script
-- 
-- Steps:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add user" > "Create new user"
-- 3. Enter email and password
-- 4. Copy the User UUID from the created user
-- 5. Replace 'USER_UUID_FROM_AUTH' below with that UUID
-- 6. Replace 'admin@foraypay.com' with your email
-- 7. Replace 'Platform Admin' with your full name
-- 8. Run this script in SQL Editor

-- Example:
-- INSERT INTO users (id, email, password_hash, full_name, role, is_active)
-- VALUES (
--   'USER_UUID_FROM_AUTH',  -- Replace with UUID from Supabase Auth
--   'admin@foraypay.com',   -- Your email
--   '',                      -- Leave empty, password is in Supabase Auth
--   'Platform Admin',        -- Your full name
--   'platform_admin',
--   true
-- );

-- Template (uncomment and fill in):
INSERT INTO users (id, email, password_hash, full_name, role, is_active)
VALUES (
  'YOUR_USER_UUID_HERE',  -- Get this from Supabase Auth > Users > [Your User] > UUID
  'your-email@example.com',
  '',                      -- Leave empty - password is managed by Supabase Auth
  'Your Full Name',
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

