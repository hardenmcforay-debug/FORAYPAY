-- =====================================================
-- FORAYPAY DATABASE INITIALIZATION SCRIPT
-- =====================================================
-- This script helps initialize your database with:
-- 1. A Platform Admin user (required to manage the platform)
-- 2. A sample Company (for testing)
-- 3. A Company Admin user for the sample company
-- 4. Sample routes for the company
-- =====================================================
-- IMPORTANT: Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- STEP 1: CREATE PLATFORM ADMIN USER
-- =====================================================
-- First, you MUST create the user in Supabase Auth:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add user" > "Create new user"
-- 3. Enter email: admin@foraypay.com
-- 4. Enter password: (your secure password)
-- 5. Check "Auto Confirm User"
-- 6. Click "Create user"
-- 7. COPY THE USER UUID (you'll see it in the user list)
-- 
-- Then replace 'YOUR_PLATFORM_ADMIN_UUID_HERE' below with the actual UUID
-- =====================================================

-- Platform Admin User (replace UUID with your actual UUID from Supabase Auth)
-- INSERT INTO users (id, email, password_hash, full_name, role, is_active)
-- VALUES (
--   'YOUR_PLATFORM_ADMIN_UUID_HERE',  -- Replace with UUID from Supabase Auth
--   'admin@foraypay.com',              -- Your platform admin email
--   '',                                -- Leave empty (password managed by Supabase Auth)
--   'Platform Administrator',          -- Your full name
--   'platform_admin',                  -- Keep as is
--   true                               -- Keep as is
-- )
-- ON CONFLICT (id) DO UPDATE SET
--   email = EXCLUDED.email,
--   full_name = EXCLUDED.full_name,
--   role = EXCLUDED.role,
--   is_active = EXCLUDED.is_active,
--   updated_at = NOW();

-- =====================================================
-- STEP 2: CREATE SAMPLE COMPANY
-- =====================================================
-- Create a test company with MoniMe Account ID (Space ID)
-- Replace 'YOUR_MONIME_SPACE_ID_HERE' with your actual MoniMe Space ID
-- =====================================================

-- Sample Company (you can modify the values)
INSERT INTO companies (id, name, email, phone, monime_account_id, commission_rate, is_active)
VALUES (
  gen_random_uuid(),                    -- Auto-generate UUID
  'Sample Transport Company',            -- Company name
  'company@example.com',                -- Company email
  '+232 XX XXX XXXX',                   -- Company phone
  'YOUR_MONIME_SPACE_ID_HERE',         -- REPLACE: Your MoniMe Account ID (Space ID)
  2.5,                                  -- Commission rate (2.5%)
  true                                  -- Active
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  monime_account_id = EXCLUDED.monime_account_id,
  commission_rate = EXCLUDED.commission_rate,
  is_active = EXCLUDED.is_active,
  updated_at = NOW()
RETURNING id, name, email, monime_account_id;

-- Save the returned company ID - you'll need it for the next step
-- Example output: company_id = '123e4567-e89b-12d3-a456-426614174000'

-- =====================================================
-- STEP 3: CREATE COMPANY ADMIN USER FOR THE COMPANY
-- =====================================================
-- First, create the user in Supabase Auth:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add user" > "Create new user"
-- 3. Enter email: company.admin@example.com
-- 4. Enter password: (your secure password)
-- 5. Check "Auto Confirm User"
-- 6. Click "Create user"
-- 7. COPY THE USER UUID
--
-- Then replace the UUID and company_id below
-- =====================================================

-- Company Admin User (replace UUID and company_id)
-- Get company_id from Step 2 output, or run: SELECT id FROM companies WHERE email = 'company@example.com';
-- INSERT INTO users (id, email, password_hash, full_name, role, company_id, is_active)
-- VALUES (
--   'YOUR_COMPANY_ADMIN_UUID_HERE',    -- Replace with UUID from Supabase Auth
--   'company.admin@example.com',       -- Company admin email
--   '',                                -- Leave empty (password managed by Supabase Auth)
--   'Company Administrator',           -- Full name
--   'company_admin',                   -- Keep as is
--   (SELECT id FROM companies WHERE email = 'company@example.com' LIMIT 1),  -- Auto-link to company
--   true                               -- Keep as is
-- )
-- ON CONFLICT (id) DO UPDATE SET
--   email = EXCLUDED.email,
--   full_name = EXCLUDED.full_name,
--   role = EXCLUDED.role,
--   company_id = EXCLUDED.company_id,
--   is_active = EXCLUDED.is_active,
--   updated_at = NOW();

-- =====================================================
-- STEP 4: CREATE SAMPLE ROUTES FOR THE COMPANY
-- =====================================================
-- Create sample routes that can be synced to MoniMe
-- Routes will automatically sync when company has MoniMe Account ID
-- =====================================================

-- Sample Routes (linked to the company created above)
INSERT INTO routes (company_id, name, origin, destination, fare_amount, is_active)
SELECT 
  c.id,                                 -- Company ID
  route_data.name,                      -- Route name
  route_data.origin,                    -- Origin
  route_data.destination,               -- Destination
  route_data.fare_amount,               -- Fare amount
  true                                  -- Active
FROM companies c
CROSS JOIN (
  VALUES
    ('Freetown to Bo', 'Freetown', 'Bo', 5000.00),
    ('Freetown to Kenema', 'Freetown', 'Kenema', 8000.00),
    ('Freetown to Makeni', 'Freetown', 'Makeni', 6000.00),
    ('Bo to Kenema', 'Bo', 'Kenema', 4000.00)
) AS route_data(name, origin, destination, fare_amount)
WHERE c.email = 'company@example.com'
ON CONFLICT (company_id, name) DO UPDATE SET
  origin = EXCLUDED.origin,
  destination = EXCLUDED.destination,
  fare_amount = EXCLUDED.fare_amount,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these queries to verify your setup:

-- Check if companies exist
-- SELECT id, name, email, monime_account_id, is_active, created_at FROM companies;

-- Check if users exist
-- SELECT id, email, full_name, role, company_id, is_active FROM users ORDER BY role, created_at;

-- Check if routes exist
-- SELECT r.id, r.name, r.origin, r.destination, r.fare_amount, c.name as company_name 
-- FROM routes r 
-- JOIN companies c ON r.company_id = c.id 
-- ORDER BY c.name, r.name;

-- Check MoniMe webhooks table structure (will be empty until MoniMe sends webhooks)
-- SELECT * FROM monime_webhooks ORDER BY created_at DESC LIMIT 10;

-- =====================================================
-- NOTES
-- =====================================================
-- 1. monime_webhooks table will be empty until MoniMe sends webhooks
--    This is NORMAL - webhooks are created automatically when MoniMe sends payment notifications
-- 
-- 2. To populate webhooks table:
--    - Configure MoniMe webhook URL: https://your-domain.com/api/webhooks/monime
--    - MoniMe will send webhooks when passengers make payments
--    - Webhooks are automatically processed and tickets are created
--
-- 3. To create more companies:
--    - Login as Platform Admin
--    - Go to Platform Dashboard > Companies
--    - Click "Add Company"
--    - Fill in company details including MoniMe Account ID (Space ID)
--
-- 4. To create company admin users:
--    - Login as Platform Admin
--    - Go to Platform Dashboard > Companies > [Select Company] > Users
--    - Create new company admin user
--
-- =====================================================

