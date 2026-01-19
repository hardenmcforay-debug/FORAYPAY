# How to Run SQL Migrations

## Steps to Run the Migration

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the Migration SQL**
   - Copy the contents of `add-sales-stopped-to-route-daily-limits.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the SQL

3. **Verify the Migration**
   - The migration adds a `sales_stopped` column to the `route_daily_limits` table
   - You can verify by running: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'route_daily_limits' AND column_name = 'sales_stopped';`

## What This Migration Does

- Adds a `sales_stopped` boolean column (default: `false`) to the `route_daily_limits` table
- Allows park operators to manually stop ticket sales for a route on a specific date
- When `sales_stopped` is `true`, the webhook will reject all ticket purchases for that route on that date

## Important Notes

- This migration is safe to run multiple times (uses `IF NOT EXISTS`)
- Existing records will have `sales_stopped = false` by default
- No data will be lost when running this migration
