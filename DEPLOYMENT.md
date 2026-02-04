# Deployment Guide

## Prerequisites

1. Node.js 18+ installed
2. Supabase account and project
3. MoniMe API credentials
4. Domain name (optional, for production)

## Setup Steps

### 1. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL schema from `supabase/schema.sql`
4. Verify all tables and policies are created

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
MONIME_API_URL=https://api.monime.com
MONIME_API_KEY=your_monime_api_key
MONIME_PLATFORM_ACCOUNT_ID=your_platform_monime_account_id
MONIME_WEBHOOK_SECRET=your_monime_webhook_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

### 5. Initial Setup

1. Create a platform admin user:
   - Sign up through Supabase Auth
   - Update the user role in the `users` table to `platform_admin`
   - Set `company_id` to NULL for platform admin
   - **Important:** Platform admins must login at `/admin/login` (not `/login`)

2. Create a company:
   - Login as platform admin at `/admin/login`
   - Navigate to Companies
   - Add a new company with MoniMe account ID

3. Create company admin:
   - Create a new user
   - Update role to `company_admin`
   - Set `company_id` to the company ID

4. Create routes and park operators:
   - Login as company admin
   - Add routes
   - Add park operators

### 6. MoniMe Integration

1. Configure MoniMe API credentials:
   - `MONIME_API_URL`: MoniMe API base URL (default: `https://api.monime.com`)
   - `MONIME_API_KEY`: Your MoniMe API key for making API requests
   - `MONIME_PLATFORM_ACCOUNT_ID`: Your platform's MoniMe account ID (for receiving commission transfers)
   - `MONIME_WEBHOOK_SECRET`: Secret key for verifying webhook requests

2. Configure MoniMe webhook:
   - Webhook URL: `https://yourdomain.com/api/webhooks/monime`
   - Secret: Set `MONIME_WEBHOOK_SECRET` in environment variables
   - Include metadata: `company_id` and `route_id` in webhook payload

3. Internal Transfer System:
   - After each ticket sale, the system automatically transfers the platform's commission percentage from the company's MoniMe account to the platform's MoniMe account
   - Transfer is initiated immediately after ticket creation
   - All transfers are logged in audit logs for tracking and reconciliation
   - If transfer fails, it's logged for manual review but doesn't block ticket creation

2. Webhook payload format:
```json
{
  "transaction_id": "unique_transaction_id",
  "amount": 5000,
  "phone": "+232123456789",
  "otp": "123456",
  "status": "success",
  "timestamp": "2024-01-01T00:00:00Z",
  "metadata": {
    "company_id": "uuid",
    "route_id": "uuid"
  }
}
```

## Production Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Ensure all environment variables are set in your hosting platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MONIME_API_URL` (optional, defaults to `https://api.monime.com`)
- `MONIME_API_KEY`
- `MONIME_PLATFORM_ACCOUNT_ID`
- `MONIME_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL` (your production URL)

### Security Checklist

- [ ] RLS policies are enabled on all tables
- [ ] Service role key is kept secret
- [ ] Webhook secret is configured
- [ ] HTTPS is enabled
- [ ] Environment variables are secure
- [ ] Database backups are configured

## Troubleshooting

### Common Issues

1. **Authentication not working**
   - Verify Supabase URL and keys
   - Check RLS policies
   - Ensure user exists in `users` table

2. **Webhook not receiving requests**
   - Verify webhook URL is accessible
   - Check webhook secret matches
   - Review server logs

3. **Ticket validation failing**
   - Verify park operator is assigned to route
   - Check ticket status is 'pending'
   - Ensure OTP matches

## Support

For issues or questions, refer to the documentation or contact support.

