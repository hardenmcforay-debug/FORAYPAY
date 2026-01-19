-- Migration: Update ticket validation system to use OTP codes instead of order numbers
-- This migration adds OTP code field and updates the validation system

-- Step 1: Add monime_otp_code column to tickets table (if it doesn't exist)
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS monime_otp_code VARCHAR(10);

-- Step 2: Make OTP code unique (each OTP should map to one ticket)
CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_monime_otp_code ON tickets(monime_otp_code) WHERE monime_otp_code IS NOT NULL;

-- Step 3: Update validations table to use otp_code instead of order_number
-- First, add the otp_code column if it doesn't exist
ALTER TABLE validations 
ADD COLUMN IF NOT EXISTS otp_code VARCHAR(10);

-- Step 4: Create index on validations.otp_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_validations_otp_code ON validations(otp_code) WHERE otp_code IS NOT NULL;

-- Note: The monime_order_number column is kept for reference but won't be used for validation
-- OTP codes are now the primary validation method

