# Database Initialization Guide

## Problem
Your database tables (`companies` and `monime_webhooks`) are empty and you need to populate them with initial data.

## Solution

This guide provides SQL scripts to initialize your database with sample data for testing.

---

## Quick Start (Recommended)

### Option 1: Quick Setup Script

1. **Go to Supabase Dashboard > SQL Editor**

2. **Open and run `database/quick-setup.sql`**
   - This creates a sample company and routes
   - **IMPORTANT**: Replace `'YOUR_MONIME_SPACE_ID_HERE'` with your actual MoniMe Space ID

3. **Verify data was created:**
   ```sql
   SELECT * FROM companies;
   SELECT * FROM routes;
   ```

4. **Create Auth Users** (see "Creating Users" section below)

---

## Step-by-Step Setup

### Step 1: Create Platform Admin User

**This is REQUIRED to manage the platform.**

1. **Create user in Supabase Auth:**
   - Go to Supabase Dashboard > Authentication > Users
   - Click "Add user" > "Create new user"
   - Enter:
     - Email: `admin@foraypay.com` (or your email)
     - Password: (choose a secure password)
   - Check "Auto Confirm User"
   - Click "Create user"
   - **COPY THE USER UUID** (shown in the user list)

2. **Create user record in database:**
   - Go to SQL Editor in Supabase
   - Run this SQL (replace `YOUR_UUID_HERE` with the UUID from step 1):

```sql
INSERT INTO users (id, email, password_hash, full_name, role, is_active)
VALUES (
  'YOUR_UUID_HERE',                    -- Paste UUID from Supabase Auth
  'admin@foraypay.com',                -- Your email
  '',                                  -- Leave empty (password managed by Auth)
  'Platform Administrator',            -- Your name
  'platform_admin',                    -- Keep as is
  true                                 -- Keep as is
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
```

3. **Verify:**
   ```sql
   SELECT * FROM users WHERE role = 'platform_admin';
   ```

---

### Step 2: Create Sample Company

**Run the quick setup script OR manually create:**

```sql
-- Create sample company
INSERT INTO companies (id, name, email, phone, monime_account_id, commission_rate, is_active)
VALUES (
  gen_random_uuid(),
  'Sample Transport Company',
  'company@example.com',
  '+232 76 123 456',
  'YOUR_MONIME_SPACE_ID_HERE',  -- ⚠️ REPLACE with your actual MoniMe Space ID
  2.5,
  true
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  monime_account_id = EXCLUDED.monime_account_id,
  commission_rate = EXCLUDED.commission_rate,
  updated_at = NOW()
RETURNING id, name, email, monime_account_id;
```

**Save the returned company ID** - you'll need it for the next step.

---

### Step 3: Create Sample Routes

```sql
-- Get your company ID first
SELECT id FROM companies WHERE email = 'company@example.com';

-- Then create routes (replace COMPANY_ID_UUID with your company ID)
INSERT INTO routes (company_id, name, origin, destination, fare_amount, is_active)
VALUES
  ('COMPANY_ID_UUID', 'Freetown to Bo', 'Freetown', 'Bo', 5000.00, true),
  ('COMPANY_ID_UUID', 'Freetown to Kenema', 'Freetown', 'Kenema', 8000.00, true),
  ('COMPANY_ID_UUID', 'Freetown to Makeni', 'Freetown', 'Makeni', 6000.00, true)
ON CONFLICT (company_id, name) DO UPDATE SET
  origin = EXCLUDED.origin,
  destination = EXCLUDED.destination,
  fare_amount = EXCLUDED.fare_amount,
  updated_at = NOW();
```

**Or use the quick-setup.sql script which does this automatically.**

---

### Step 4: Create Company Admin User

1. **Create user in Supabase Auth:**
   - Go to Authentication > Users
   - Create user: `company.admin@example.com`
   - **COPY THE UUID**

2. **Create user record:**
   ```sql
   INSERT INTO users (id, email, password_hash, full_name, role, company_id, is_active)
   VALUES (
     'YOUR_COMPANY_ADMIN_UUID',        -- UUID from Supabase Auth
     'company.admin@example.com',
     '',
     'Company Administrator',
     'company_admin',
     (SELECT id FROM companies WHERE email = 'company@example.com' LIMIT 1),
     true
   )
   ON CONFLICT (id) DO UPDATE SET
     email = EXCLUDED.email,
     full_name = EXCLUDED.full_name,
     role = EXCLUDED.role,
     company_id = EXCLUDED.company_id,
     updated_at = NOW();
   ```

---

## About MoniMe Webhooks Table

### ⚠️ IMPORTANT: Empty Webhooks Table is NORMAL

The `monime_webhooks` table will be **EMPTY** until MoniMe sends webhooks. This is **EXPECTED BEHAVIOR**.

**Webhooks are automatically created when:**
1. MoniMe sends payment notifications to `/api/webhooks/monime`
2. Passenger makes a payment via MoniMe offline payment
3. MoniMe syncs payment and sends webhook to ForayPay

**To populate webhooks:**
- Configure MoniMe webhook URL: `https://your-domain.com/api/webhooks/monime`
- Test by having a passenger make a payment (or use test webhook data)

### Testing Webhooks

If you want to test the webhook functionality, you can:

1. **Use the test webhook script:**
   - Run `database/test-webhook.sql` to create sample webhook data

2. **Manually send a test webhook:**
   - Use Postman or curl to POST to `/api/webhooks/monime`
   - See `database/test-webhook.sql` for the expected payload format

---

## Verification Queries

After setup, run these to verify everything is working:

```sql
-- Check companies
SELECT id, name, email, monime_account_id, is_active, created_at 
FROM companies 
ORDER BY created_at DESC;

-- Check users
SELECT id, email, full_name, role, company_id, is_active 
FROM users 
ORDER BY role, created_at;

-- Check routes
SELECT r.id, r.name, r.origin, r.destination, r.fare_amount, c.name as company_name 
FROM routes r 
JOIN companies c ON r.company_id = c.id 
ORDER BY c.name, r.name;

-- Check webhooks (will be empty until MoniMe sends webhooks)
SELECT webhook_id, event_type, processed, created_at 
FROM monime_webhooks 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## Files Available

- **`database/quick-setup.sql`** - Quick setup script (creates company + routes)
- **`database/initialize-database.sql`** - Detailed initialization guide with all steps
- **`database/test-webhook.sql`** - Test webhook data for testing MoniMe integration

---

## Next Steps

1. ✅ Run `quick-setup.sql` to create company and routes
2. ✅ Create Platform Admin user (see Step 1)
3. ✅ Login as Platform Admin
4. ✅ Create more companies via Platform Dashboard (optional)
5. ✅ Configure MoniMe webhook URL in MoniMe dashboard
6. ✅ Test the system by syncing routes to MoniMe

---

## Troubleshooting

### "Company table is empty"
- Run `quick-setup.sql` to create sample company
- Or create company via Platform Admin dashboard

### "MoniMe webhooks table is empty"
- **This is NORMAL** - webhooks are created automatically when MoniMe sends payment notifications
- To test, use `test-webhook.sql` or send test webhook via API

### "Cannot login"
- Ensure user exists in BOTH Supabase Auth AND `users` table
- User IDs must match between Auth and users table
- Check user is active: `is_active = true`

### "Cannot create company"
- Ensure you have a Platform Admin user created
- Platform Admin role required to create companies

---

## Important Notes

1. **MoniMe Account ID (Space ID) is REQUIRED:**
   - Set it when creating company: `monime_account_id = 'your-space-id'`
   - Or update via Company Settings page
   - Required for route synchronization with MoniMe

2. **Users must exist in BOTH places:**
   - Supabase Authentication (for login)
   - `users` table (for application data)
   - IDs must match exactly

3. **Webhooks are event-driven:**
   - They're created automatically when MoniMe sends payment notifications
   - Empty table is normal until payments occur
   - Don't manually populate unless testing

---

For more help, see:
- `SETUP.md` - Complete setup guide
- `database/create-platform-admin-fixed.sql` - Platform admin creation
- `database/create-user-helper.sql` - User creation helper

