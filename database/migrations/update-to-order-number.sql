-- Migration: Update ticket validation system to use MoniMe order number instead of OTP
-- This migration adds order_number field and updates the validation system

-- Step 1: Add order_number column to tickets table (if it doesn't exist)
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS monime_order_number VARCHAR(255);

-- Step 2: Make order_number unique (each order number should map to one ticket)
CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_monime_order_number ON tickets(monime_order_number);

-- Step 3: Update validations table to use order_number instead of otp_code
-- First, add the new column
ALTER TABLE validations 
ADD COLUMN IF NOT EXISTS order_number VARCHAR(255);

-- Step 4: Update the status check constraint to remove 'validated' (we'll use 'pending' and 'used')
-- Note: This might fail if constraint doesn't exist, so we use IF EXISTS pattern
DO $$ 
BEGIN
    ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;
    ALTER TABLE tickets ADD CONSTRAINT tickets_status_check 
        CHECK (status IN ('pending', 'used', 'expired', 'cancelled'));
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- Step 5: Create index on validations.order_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_validations_order_number ON validations(order_number);

-- Note: The old monime_otp_code column is kept for backward compatibility during transition
-- You can remove it later after confirming all systems are migrated

