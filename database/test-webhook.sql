-- =====================================================
-- TEST WEBHOOK DATA - For Testing MoniMe Integration
-- =====================================================
-- This script creates sample webhook data for testing
-- IMPORTANT: Only use this for testing/development
-- =====================================================

-- =====================================================
-- PREREQUISITES
-- =====================================================
-- Before running this, ensure you have:
-- 1. A company with monime_account_id set
-- 2. At least one route for that company
-- =====================================================

-- Get company and route info
DO $$
DECLARE
  v_company_id UUID;
  v_company_space_id VARCHAR(255);
  v_route_id UUID;
  v_webhook_id VARCHAR(255);
BEGIN
  -- Get first company with MoniMe Account ID
  SELECT id, monime_account_id INTO v_company_id, v_company_space_id
  FROM companies
  WHERE monime_account_id IS NOT NULL
    AND monime_account_id != ''
    AND monime_account_id != 'YOUR_MONIME_SPACE_ID_HERE'
  LIMIT 1;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'No company found with MoniMe Account ID configured. Please set monime_account_id in companies table first.';
  END IF;

  -- Get first route for the company
  SELECT id INTO v_route_id
  FROM routes
  WHERE company_id = v_company_id
    AND is_active = true
  LIMIT 1;

  IF v_route_id IS NULL THEN
    RAISE EXCEPTION 'No active routes found for company. Please create at least one route first.';
  END IF;

  -- Generate a unique webhook ID
  v_webhook_id := 'TEST-WEBHOOK-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8);

  -- Create test webhook
  INSERT INTO monime_webhooks (
    webhook_id,
    event_type,
    payload,
    processed,
    processed_at
  )
  VALUES (
    v_webhook_id,
    'payment.success',
    jsonb_build_object(
      'webhook_id', v_webhook_id,
      'event_type', 'payment.success',
      'transaction_id', 'TEST-TXN-' || extract(epoch from now())::bigint,
      'amount', 5000.00,
      'order_number', 'TEST-ORD-' || extract(epoch from now())::bigint,
      'passenger_phone', '+232761234567',
      'route_id', v_route_id::text,
      'company_account_id', v_company_space_id,
      'status', 'completed',
      'timestamp', now()::text
    ),
    false,  -- Not processed yet
    NULL    -- Not processed yet
  );

  RAISE NOTICE 'Test webhook created with ID: %', v_webhook_id;
  RAISE NOTICE 'Company ID: %', v_company_id;
  RAISE NOTICE 'Company Space ID: %', v_company_space_id;
  RAISE NOTICE 'Route ID: %', v_route_id;

END $$;

-- =====================================================
-- VIEW TEST WEBHOOKS
-- =====================================================

SELECT 
  id,
  webhook_id,
  event_type,
  payload->>'transaction_id' as transaction_id,
  payload->>'order_number' as order_number,
  payload->>'passenger_phone' as passenger_phone,
  payload->>'route_id' as route_id,
  payload->>'company_account_id' as company_space_id,
  processed,
  processed_at,
  error_message,
  created_at
FROM monime_webhooks
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- MANUAL WEBHOOK INSERT (If needed)
-- =====================================================
-- To manually insert a webhook for testing:
-- (Replace the values with your actual data)
--
-- INSERT INTO monime_webhooks (
--   webhook_id,
--   event_type,
--   payload,
--   processed
-- )
-- VALUES (
--   'WEBHOOK-' || extract(epoch from now())::bigint,
--   'payment.success',
--   jsonb_build_object(
--     'webhook_id', 'WEBHOOK-' || extract(epoch from now())::bigint,
--     'event_type', 'payment.success',
--     'transaction_id', 'TXN-123456789',
--     'amount', 5000.00,
--     'order_number', 'ORD-987654321',
--     'passenger_phone', '+232761234567',
--     'route_id', (SELECT id::text FROM routes LIMIT 1),
--     'company_account_id', (SELECT monime_account_id FROM companies WHERE monime_account_id IS NOT NULL LIMIT 1),
--     'status', 'completed',
--     'timestamp', now()::text
--   ),
--   false
-- );
-- =====================================================

-- =====================================================
-- CLEANUP TEST WEBHOOKS (If needed)
-- =====================================================
-- To remove test webhooks:
--
-- DELETE FROM monime_webhooks 
-- WHERE webhook_id LIKE 'TEST-%' 
--   OR webhook_id LIKE 'WEBHOOK-%';
-- =====================================================

