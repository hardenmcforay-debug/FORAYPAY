-- ============================================
-- CREATE COMPANY ADMIN - COMPLETE SCRIPT
-- ============================================
-- This script creates both the company and the company admin user
-- Replace the values below with your actual data

-- OPTION 1: If company already exists, use this:
-- First get the company UUID:
SELECT id, name, email FROM companies WHERE email = 'hardenforaybusiness@gmail.com';

-- Then create user (replace COMPANY_UUID with the UUID from above):
INSERT INTO users (id, email, password_hash, full_name, role, company_id, is_active)
VALUES (
  'f1f64e73-c0fc-4d9b-a3c2-d28a9897e2ed',  -- Your auth user UUID
  'hardenforaybusiness@gmail.com',
  '',
  'Jaminatu James',
  'company_admin',
  'COMPANY_UUID_HERE',  -- Replace with actual company UUID
  true
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  company_id = EXCLUDED.company_id,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================
-- OPTION 2: Create company and user in one go (Recommended)
-- ============================================
WITH company_data AS (
  INSERT INTO companies (name, email, commission_rate, is_active)
  VALUES ('Jmie Transport', 'hardenforaybusiness@gmail.com', 2.5, true)
  ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO users (id, email, password_hash, full_name, role, company_id, is_active)
SELECT 
  'f1f64e73-c0fc-4d9b-a3c2-d28a9897e2ed',  -- Your auth user UUID
  'hardenforaybusiness@gmail.com',
  '',
  'Jaminatu James',
  'company_admin',  -- Must be exactly 'company_admin'
  company_data.id,  -- Uses the company UUID automatically
  true
FROM company_data
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  company_id = EXCLUDED.company_id,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================
-- VERIFY IT WORKED
-- ============================================
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.is_active,
  c.name as company_name,
  c.id as company_id
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
WHERE u.email = 'hardenforaybusiness@gmail.com';

