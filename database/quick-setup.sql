-- =====================================================
-- QUICK SETUP SCRIPT - Run this to quickly populate database
-- =====================================================
-- This creates sample data WITHOUT requiring Auth users first
-- Use this for quick testing, then set up proper Auth users later
-- =====================================================

-- =====================================================
-- 1. CREATE SAMPLE COMPANY WITH MONIME ACCOUNT ID
-- =====================================================
-- REPLACE 'YOUR_MONIME_SPACE_ID_HERE' with your actual MoniMe Space ID
-- =====================================================

DO $$
DECLARE
  v_company_id UUID;
BEGIN
  -- Create sample company
  INSERT INTO companies (id, name, email, phone, monime_account_id, commission_rate, is_active)
  VALUES (
    gen_random_uuid(),
    'Sample Transport Company',
    'company@example.com',
    '+232 76 123 456',
    'YOUR_MONIME_SPACE_ID_HERE',  -- ⚠️ REPLACE THIS with your actual MoniMe Space ID
    2.5,
    true
  )
  ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    monime_account_id = EXCLUDED.monime_account_id,
    commission_rate = EXCLUDED.commission_rate,
    updated_at = NOW()
  RETURNING id INTO v_company_id;

  -- Create sample routes for the company
  INSERT INTO routes (company_id, name, origin, destination, fare_amount, is_active)
  VALUES
    (v_company_id, 'Freetown to Bo', 'Freetown', 'Bo', 5000.00, true),
    (v_company_id, 'Freetown to Kenema', 'Freetown', 'Kenema', 8000.00, true),
    (v_company_id, 'Freetown to Makeni', 'Freetown', 'Makeni', 6000.00, true),
    (v_company_id, 'Bo to Kenema', 'Bo', 'Kenema', 4000.00, true)
  ON CONFLICT (company_id, name) DO UPDATE SET
    origin = EXCLUDED.origin,
    destination = EXCLUDED.destination,
    fare_amount = EXCLUDED.fare_amount,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

  RAISE NOTICE 'Company created with ID: %', v_company_id;
  RAISE NOTICE 'Sample routes created for company';
END $$;

-- =====================================================
-- 2. VERIFY DATA WAS CREATED
-- =====================================================

-- Show created company
SELECT 
  id,
  name,
  email,
  phone,
  monime_account_id,
  commission_rate,
  is_active,
  created_at
FROM companies
ORDER BY created_at DESC;

-- Show created routes
SELECT 
  r.id,
  r.name,
  r.origin,
  r.destination,
  r.fare_amount,
  r.is_active,
  c.name as company_name,
  c.monime_account_id as company_space_id
FROM routes r
JOIN companies c ON r.company_id = c.id
ORDER BY c.name, r.name;

-- =====================================================
-- 3. IMPORTANT: Create Auth Users
-- =====================================================
-- After running this script, you MUST create users in Supabase Auth:
--
-- FOR PLATFORM ADMIN:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add user" > "Create new user"
-- 3. Email: admin@foraypay.com
-- 4. Password: (your secure password)
-- 5. Check "Auto Confirm User"
-- 6. Create user and COPY THE UUID
-- 7. Run this SQL (replace UUID):
--
--    INSERT INTO users (id, email, password_hash, full_name, role, is_active)
--    VALUES (
--      'PASTE_UUID_HERE',          -- UUID from Supabase Auth
--      'admin@foraypay.com',
--      '',
--      'Platform Administrator',
--      'platform_admin',
--      true
--    )
--    ON CONFLICT (id) DO UPDATE SET
--      email = EXCLUDED.email,
--      full_name = EXCLUDED.full_name,
--      role = EXCLUDED.role,
--      updated_at = NOW();
--
-- FOR COMPANY ADMIN:
-- 1. Get company ID: SELECT id FROM companies WHERE email = 'company@example.com';
-- 2. Create user in Supabase Auth: company.admin@example.com
-- 3. COPY THE UUID
-- 4. Run this SQL (replace UUID and company_id):
--
--    INSERT INTO users (id, email, password_hash, full_name, role, company_id, is_active)
--    VALUES (
--      'PASTE_UUID_HERE',          -- UUID from Supabase Auth
--      'company.admin@example.com',
--      '',
--      'Company Administrator',
--      'company_admin',
--      (SELECT id FROM companies WHERE email = 'company@example.com' LIMIT 1),
--      true
--    )
--    ON CONFLICT (id) DO UPDATE SET
--      email = EXCLUDED.email,
--      full_name = EXCLUDED.full_name,
--      role = EXCLUDED.role,
--      company_id = EXCLUDED.company_id,
--      updated_at = NOW();
--
-- =====================================================

-- =====================================================
-- 4. NOTE: MoniMe Webhooks Table
-- =====================================================
-- The monime_webhooks table will be EMPTY until MoniMe sends webhooks.
-- This is NORMAL and EXPECTED behavior.
--
-- Webhooks are automatically created when:
-- 1. MoniMe sends payment notifications to /api/webhooks/monime
-- 2. Passenger makes a payment via MoniMe offline payment
-- 3. MoniMe syncs payment and sends webhook to ForayPay
--
-- To test webhooks, you can manually insert a test webhook:
-- (See test-webhook.sql for examples)
-- =====================================================

