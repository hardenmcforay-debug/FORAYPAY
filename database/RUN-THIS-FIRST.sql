-- =====================================================
-- RUN THIS FIRST - Quick Database Setup
-- =====================================================
-- Copy and paste this entire file into Supabase SQL Editor
-- Then replace 'YOUR_MONIME_SPACE_ID_HERE' with your actual MoniMe Space ID
-- =====================================================

-- =====================================================
-- STEP 1: CREATE SAMPLE COMPANY
-- =====================================================
-- ⚠️ IMPORTANT: Replace 'YOUR_MONIME_SPACE_ID_HERE' with your actual MoniMe Space ID
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

  RAISE NOTICE '✅ Company created with ID: %', v_company_id;
  RAISE NOTICE '✅ Sample routes created for company';
  RAISE NOTICE '';
  RAISE NOTICE '📋 NEXT STEPS:';
  RAISE NOTICE '1. Create Platform Admin user in Supabase Auth';
  RAISE NOTICE '2. Create user record in users table (see README-INITIALIZE.md)';
  RAISE NOTICE '3. Verify data: SELECT * FROM companies; SELECT * FROM routes;';
END $$;

-- =====================================================
-- VERIFY DATA WAS CREATED
-- =====================================================

-- Show created company
SELECT 
  'Company' as table_name,
  id::text,
  name,
  email,
  monime_account_id as space_id,
  is_active::text,
  created_at::text
FROM companies
ORDER BY created_at DESC
LIMIT 5;

-- Show created routes
SELECT 
  'Route' as table_name,
  r.id::text,
  r.name,
  r.origin || ' → ' || r.destination as route_info,
  r.fare_amount::text || ' SLE' as fare,
  c.name as company_name,
  r.is_active::text
FROM routes r
JOIN companies c ON r.company_id = c.id
ORDER BY c.name, r.name
LIMIT 10;

-- =====================================================
-- NOTE: monime_webhooks table will be EMPTY until MoniMe sends webhooks
-- This is NORMAL and EXPECTED behavior!
-- =====================================================

