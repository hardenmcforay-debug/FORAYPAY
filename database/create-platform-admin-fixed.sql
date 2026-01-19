-- ============================================
-- CREATE PLATFORM ADMIN USER - CORRECTED VERSION
-- ============================================
-- 
-- STEP 1: Get your User UUID from Supabase Auth
--   1. Go to Supabase Dashboard > Authentication > Users
--   2. Find your user and copy the UUID
--
-- STEP 2: Replace the values below and run this SQL
--   - Replace YOUR_UUID_HERE with your actual UUID
--   - Replace your-email@example.com with your email
--   - Replace 'Your Full Name' with your actual name (keep the quotes!)
--
-- ============================================

-- CORRECT FORMAT (copy and modify this):
INSERT INTO users (id, email, password_hash, full_name, role, is_active)
VALUES (
  'YOUR_UUID_HERE',                    -- Replace with UUID from Supabase Auth (keep quotes)
  'your-email@example.com',             -- Replace with your email (keep quotes)
  '',                                   -- Leave empty (keep quotes)
  'Harden Mathew Condor Foray',         -- Replace with your name (keep quotes, spaces are OK)
  'platform_admin',                     -- Keep as is (keep quotes)
  true                                  -- Keep as is (no quotes for boolean)
)
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================
-- EXAMPLE WITH ACTUAL VALUES:
-- ============================================
-- If your UUID is: 123e4567-e89b-12d3-a456-426614174000
-- If your email is: harden@foraypay.com
-- If your name is: Harden Mathew Condor Foray
--
-- Then your SQL should look like this:
--
-- INSERT INTO users (id, email, password_hash, full_name, role, is_active)
-- VALUES (
--   '123e4567-e89b-12d3-a456-426614174000',
--   'harden@foraypay.com',
--   '',
--   'Harden Mathew Condor Foray',
--   'platform_admin',
--   true
-- )
-- ON CONFLICT (id) DO UPDATE
-- SET 
--   email = EXCLUDED.email,
--   full_name = EXCLUDED.full_name,
--   role = EXCLUDED.role,
--   is_active = EXCLUDED.is_active,
--   updated_at = NOW();

-- ============================================
-- COMMON MISTAKES TO AVOID:
-- ============================================
-- ❌ WRONG: 'Your Full Name',Harden Mathew (missing quotes around name)
-- ✅ CORRECT: 'Harden Mathew Condor Foray' (quotes around entire name)
--
-- ❌ WRONG: Harden Mathew (no quotes at all)
-- ✅ CORRECT: 'Harden Mathew' (quotes required)
--
-- ❌ WRONG: 'Harden Mathew', condor (comma outside quotes)
-- ✅ CORRECT: 'Harden Mathew Condor' (everything inside quotes)

