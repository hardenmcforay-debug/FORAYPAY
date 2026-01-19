# Migration: Update to MoniMe Order Number System

This migration updates the ticket validation system to use MoniMe order numbers instead of OTP codes.

## Overview

The system now uses MoniMe order numbers as the primary identifier for ticket validation, with the database as the source of truth (not SMS messages).

## Changes

1. **Tickets Table**: Added `monime_order_number` column (unique index)
2. **Validations Table**: Added `order_number` column to track which order number was validated
3. **Status Values**: Removed 'validated' status - tickets now go directly from 'pending' to 'used'

## Payment & Ticketing Flow

1. Passenger pays transport fare using MoniMe
2. MoniMe sends an order # to the passenger
3. MoniMe confirms payment via API/webhook
4. ForayPay system verifies transaction authenticity
5. A server-side ticket is generated with:
   - MoniMe order number (unique)
   - MoniMe transaction ID
   - Passenger phone number
   - Route / trip information
6. Park operators validate ticket using the passenger's MoniMe order number
7. Ticket status is marked as USED
8. All actions are logged in audit_logs

## Running the Migration

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run the migration file: `update-to-order-number.sql`
4. Verify the changes:
   - Check that `monime_order_number` column exists in `tickets` table
   - Check that `order_number` column exists in `validations` table
   - Verify indexes are created

## Important Notes

- The old `monime_otp_code` column has been removed after migration to order numbers
- Run `remove-monime-otp-code.sql` migration to drop the deprecated column
- The database is now the source of truth - SMS messages are NOT used for validation
- All validation attempts are logged in the `audit_logs` table

## API Changes

- **Webhook**: Now expects `order_number` instead of `otp_code` in the webhook payload
- **Validation API**: Now accepts `order_number` instead of `otp_code` in the request body
- **Validation Page**: UI updated to ask for "MoniMe Order Number" instead of "OTP Code"

## Migration Steps

1. **First Migration** (Run `update-to-order-number.sql`):
   - Adds `monime_order_number` column to tickets table
   - Adds `order_number` column to validations table
   - Creates necessary indexes
   
2. **Second Migration** (Run `remove-monime-otp-code.sql` after confirming all systems work):
   - Removes the old `monime_otp_code` column from tickets table
   - Drops the old `idx_tickets_monime_otp_code` index
   
**Note**: Run the second migration only after confirming all systems are using order numbers and no old OTP codes remain.

