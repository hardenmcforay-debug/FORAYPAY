-- ============================================
-- CREATE PARK OPERATOR - COMPLETE SCRIPT
-- ============================================
-- This script creates both the user and park_operator records
-- 
-- IMPORTANT: 
-- 1. Create user in Supabase Auth first
-- 2. Get the UUID from Supabase Auth
-- 3. Replace all placeholder values below
-- 4. Make sure the company exists (or create it first)

-- ============================================
-- STEP 1: Get your Auth User UUID
-- ============================================
-- Go to Supabase Dashboard > Authentication > Users
-- Find your user and copy the UUID
-- Or run this to find it:
-- SELECT id, email FROM auth.users WHERE email = 'operator@example.com';

-- ============================================
-- STEP 2: Get Company UUID (if company exists)
-- ============================================
-- Run this to find your company:
SELECT id, name, email FROM companies WHERE email = 'company@example.com';
-- Copy the company UUID

-- ============================================
-- OPTION 1: Create User and Park Operator Separately
-- ============================================

-- Step A: Create user in users table
INSERT INTO users (id, email, password_hash, full_name, role, company_id, is_active)
VALUES (
  'AUTH_USER_UUID_HERE',        -- Replace with UUID from Supabase Auth
  'operator@example.com',        -- Replace with operator email
  '',                            -- Leave empty
  'Park Operator Name',          -- Replace with operator name
  'park_operator',               -- Must be exactly 'park_operator'
  'COMPANY_UUID_HERE',          -- Replace with company UUID
  true
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  company_id = EXCLUDED.company_id,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Step B: Create park_operator record
INSERT INTO park_operators (company_id, user_id, route_id, location, is_active)
VALUES (
  'COMPANY_UUID_HERE',          -- Same company UUID as above
  'AUTH_USER_UUID_HERE',        -- Same user UUID as above
  NULL,                         -- Route ID (can be set later or leave NULL)
  'Main Terminal',              -- Location name
  true
)
ON CONFLICT DO NOTHING;

-- ============================================
-- OPTION 2: Create Everything in One Go (Recommended)
-- ============================================
-- This creates company (if needed), user, and park_operator all at once

WITH company_data AS (
  -- Get or create company
  INSERT INTO companies (name, email, commission_rate, is_active)
  VALUES ('Transport Company Name', 'company@example.com', 2.5, true)
  ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
),
user_data AS (
  -- Create user
  INSERT INTO users (id, email, password_hash, full_name, role, company_id, is_active)
  SELECT 
    'AUTH_USER_UUID_HERE',        -- Replace with UUID from Supabase Auth
    'operator@example.com',       -- Replace with operator email
    '',
    'Park Operator Name',          -- Replace with operator name
    'park_operator',
    company_data.id,
    true
  FROM company_data
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    company_id = EXCLUDED.company_id,
    is_active = EXCLUDED.is_active,
    updated_at = NOW()
  RETURNING id, company_id
)
-- Create park_operator record
INSERT INTO park_operators (company_id, user_id, route_id, location, is_active)
SELECT 
  user_data.company_id,
  user_data.id,
  NULL,                          -- Route ID (set later if needed)
  'Main Terminal',                -- Location
  true
FROM user_data
ON CONFLICT DO NOTHING;

-- ============================================
-- OPTION 3: If Company Already Exists (Simplest)
-- ============================================
-- Use this if you already have a company and just need to add the operator

-- First, get your company UUID:
-- SELECT id FROM companies WHERE email = 'company@example.com';

-- Then run this (replace COMPANY_UUID with actual UUID):
WITH user_data AS (
  INSERT INTO users (id, email, password_hash, full_name, role, company_id, is_active)
  VALUES (
    'AUTH_USER_UUID_HERE',        -- Replace with UUID from Supabase Auth
    'operator@example.com',       -- Replace with operator email
    '',
    'Park Operator Name',          -- Replace with operator name
    'park_operator',
    'COMPANY_UUID_HERE',          -- Replace with existing company UUID
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    company_id = EXCLUDED.company_id,
    is_active = EXCLUDED.is_active,
    updated_at = NOW()
  RETURNING id, company_id
)
INSERT INTO park_operators (company_id, user_id, route_id, location, is_active)
SELECT 
  user_data.company_id,
  user_data.id,
  NULL,
  'Main Terminal',
  true
FROM user_data
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFY IT WORKED
-- ============================================
SELECT 
  u.id as user_id,
  u.email,
  u.full_name,
  u.role,
  u.is_active as user_active,
  c.name as company_name,
  po.id as operator_id,
  po.location,
  po.is_active as operator_active,
  r.name as route_name
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
LEFT JOIN park_operators po ON po.user_id = u.id
LEFT JOIN routes r ON po.route_id = r.id
WHERE u.email = 'operator@example.com';

-- ============================================
-- EXAMPLE WITH ACTUAL VALUES
-- ============================================
-- If your Auth UUID is: 123e4567-e89b-12d3-a456-426614174000
-- If your company UUID is: 987fcdeb-51a2-43bc-9d1e-123456789abc
-- If operator email is: john.operator@transport.com
-- If operator name is: John Operator
-- If company email is: company@transport.com

WITH user_data AS (
  INSERT INTO users (id, email, password_hash, full_name, role, company_id, is_active)
  VALUES (
    '123e4567-e89b-12d3-a456-426614174000',
    'john.operator@transport.com',
    '',
    'John Operator',
    'park_operator',
    '987fcdeb-51a2-43bc-9d1e-123456789abc',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    company_id = EXCLUDED.company_id,
    is_active = EXCLUDED.is_active,
    updated_at = NOW()
  RETURNING id, company_id
)
INSERT INTO park_operators (company_id, user_id, route_id, location, is_active)
SELECT 
  user_data.company_id,
  user_data.id,
  NULL,
  'Main Terminal',
  true
FROM user_data
ON CONFLICT DO NOTHING;

