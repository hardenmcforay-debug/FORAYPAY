# Foraypay Setup Guide

## Quick Start

### 1. Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (free tier works)
- MoniMe API credentials (for production)

### 2. Installation Steps

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp env.example .env.local
# Edit .env.local with your Supabase credentials

# 3. Set up database
# - Go to Supabase Dashboard > SQL Editor
# - Copy and paste contents of database/schema.sql
# - Run the SQL script

# 4. Start development server
npm run dev
```

### 3. Supabase Setup

1. **Create a Supabase Project**
   - Go to https://supabase.com
   - Create a new project
   - Note your project URL and anon key

2. **Run Database Schema**
   - In Supabase Dashboard, go to SQL Editor
   - Copy the entire contents of `database/schema.sql`
   - Paste and execute
   - Verify tables are created

3. **Configure Row Level Security**
   - The schema includes RLS policies
   - Review and adjust as needed for your security requirements

### 4. Create Initial Users

**IMPORTANT**: Users must exist in BOTH Supabase Auth AND the `users` table with matching IDs.

#### Step-by-Step: Create Platform Admin

1. **Create user in Supabase Auth:**
   - Go to Supabase Dashboard > Authentication > Users
   - Click "Add user" > "Create new user"
   - Enter your email and password
   - Check "Auto Confirm User"
   - Click "Create user"
   - **Copy the User UUID** (you'll need this)

2. **Create corresponding record in users table:**
   - Go to SQL Editor in Supabase
   - Copy this SQL template and replace the values (IMPORTANT: Keep all quotes!):

```sql
-- Option 1: Multi-line (easier to read)
INSERT INTO users (id, email, password_hash, full_name, role, is_active)
VALUES (
  'YOUR_USER_UUID_HERE',        -- Paste UUID from Step 1 (keep quotes)
  'your-email@example.com',      -- Your email (keep quotes)
  '',                            -- Leave empty (keep quotes)
  'Your Full Name Here',         -- Your name (keep quotes, spaces OK)
  'platform_admin',              -- Keep as is (keep quotes)
  true                           -- Keep as is (no quotes)
)
ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Option 2: Single-line (if multi-line causes issues - copy this entire line)
-- INSERT INTO users (id, email, password_hash, full_name, role, is_active) VALUES ('YOUR_USER_UUID_HERE', 'your-email@example.com', '', 'Your Full Name Here', 'platform_admin', true) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role, is_active = EXCLUDED.is_active, updated_at = NOW();
```

**Example with actual values:**
```sql
-- If your UUID is: 123e4567-e89b-12d3-a456-426614174000
-- If your email is: admin@foraypay.com
-- If your name is: Harden Mathew Condor Foray

INSERT INTO users (id, email, password_hash, full_name, role, is_active)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  'admin@foraypay.com',
  '',
  'Harden Mathew Condor Foray',
  'platform_admin',
  true
)
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
```

**⚠️ IMPORTANT:** 
- All text values (UUID, email, name) MUST be in single quotes: `'value'`
- Names with spaces are fine, just keep them inside quotes: `'Harden Mathew'`
- Do NOT put commas inside the quotes
- See `database/create-platform-admin-fixed.sql` for detailed examples

3. **Verify the user:**
```sql
-- Check if user exists and IDs match
SELECT 
  u.id as users_table_id,
  u.email,
  u.role,
  a.id as auth_users_id
FROM users u
LEFT JOIN auth.users a ON u.id = a.id
WHERE u.email = 'your-email@example.com';
```

**For detailed instructions and templates for all user types, see `database/create-user-helper.sql`**

### 5. MoniMe Integration

1. **Configure Webhook URL**
   - Set webhook URL in MoniMe dashboard to: `https://yourdomain.com/api/webhooks/monime`
   - For local testing, use ngrok or similar: `https://your-ngrok-url.ngrok.io/api/webhooks/monime`

2. **Webhook Payload Format**
   MoniMe should send webhooks in this format:
   ```json
   {
     "webhook_id": "unique-webhook-id",
     "event_type": "payment.success",
     "transaction_id": "monime-transaction-id",
     "amount": 10000.00,
     "order_number": "ORD-2024-123456789",
     "passenger_phone": "+232123456789",
     "route_id": "route-uuid",
     "company_account_id": "monime-account-id",
     "status": "completed",
     "timestamp": "2024-01-01T00:00:00Z"
   }
   ```
   
   **Important**: The `order_number` must be unique and must match the order number sent to the passenger. See `MONIME-INTEGRATION-GUIDE.md` for complete details.

3. **Test Webhook**
   - Use a tool like Postman or curl to test the webhook endpoint
   - Verify tickets are created in the database

### 6. Testing the Application

1. **Login**
   - Navigate to `/login`
   - Use credentials for the user you created

2. **Platform Admin Flow**
   - Create companies
   - Set commission rates
   - View audit logs

3. **Company Admin Flow**
   - Create routes
   - Add park operators
   - View revenue dashboards

4. **Park Operator Flow**
   - Validate tickets using MoniMe order numbers
   - View validation history

5. **Passenger Flow**
   - Retrieve tickets at `/passenger/retrieve`
   - Use phone number or transaction ID

### 7. Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**
   - Push code to GitHub
   - Import project in Vercel
   - Add environment variables
   - Deploy

3. **Configure Production Environment**
   - Update `NEXT_PUBLIC_APP_URL` to production URL
   - Configure MoniMe webhook to production URL
   - Set up proper authentication (Supabase Auth)

### 8. Security Checklist

- [ ] Enable Row Level Security (RLS) in Supabase
- [ ] Configure webhook signature verification
- [ ] Set up proper authentication flow
- [ ] Use HTTPS in production
- [ ] Review and test all API endpoints
- [ ] Set up monitoring and error tracking
- [ ] Configure backup strategy for database

### 9. Common Issues

**Issue**: Cannot login
- Check if user exists in `users` table
- Verify Supabase Auth is configured
- Check environment variables

**Issue**: Webhooks not working
- Verify webhook URL is accessible
- Check `monime_webhooks` table for errors
- Verify webhook payload format

**Issue**: Tickets not validating
- Check ticket status (must be 'pending')
- Verify OTP code matches
- Check operator route assignment

### 10. Next Steps

After setup:
1. Create your first company
2. Add routes and pricing
3. Create park operators
4. Test the payment flow
5. Monitor revenue dashboards

For support, refer to the main README.md file.

