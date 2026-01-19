-- Migration: Add support for pre-generated tickets (offline USSD use case)
-- This migration ensures the database schema supports pre-generated tickets

-- Note: The existing schema already supports this feature:
-- 1. monime_order_number is UNIQUE and NOT NULL - we generate unique order numbers
-- 2. monime_transaction_id is UNIQUE - we use 'PRE-{order_number}' prefix for pre-generated tickets
-- 3. passenger_phone is NOT NULL - we use 'PENDING' as placeholder until payment is received
-- 4. validated_by can store the operator ID who generated the ticket

-- Ensure indexes exist for efficient queries
CREATE INDEX IF NOT EXISTS idx_tickets_monime_order_number ON tickets(monime_order_number);
CREATE INDEX IF NOT EXISTS idx_tickets_monime_transaction_id ON tickets(monime_transaction_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_company_route_status ON tickets(company_id, route_id, status);

-- Ensure validations table has order_number column (from previous migration)
ALTER TABLE validations 
ADD COLUMN IF NOT EXISTS order_number VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_validations_order_number ON validations(order_number);

-- Note: Pre-generated tickets are identified by:
-- - monime_transaction_id LIKE 'PRE-%'
-- - passenger_phone = 'PENDING'
-- - status = 'pending'
-- When payment is received via webhook, these fields are updated with actual values

