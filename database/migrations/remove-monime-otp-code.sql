-- Migration: Remove old monime_otp_code column from tickets table
-- This migration removes the deprecated OTP code column after migration to order numbers

-- Step 1: Drop the unique index on monime_otp_code if it exists
DROP INDEX IF EXISTS idx_tickets_monime_otp_code;

-- Step 2: Remove the monime_otp_code column from tickets table
ALTER TABLE tickets 
DROP COLUMN IF EXISTS monime_otp_code;

-- Note: The validations table still has an otp_code column for backward compatibility
-- You can remove it later if all validation records have been migrated to use order_number

