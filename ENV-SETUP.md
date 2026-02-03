# Environment Variables Setup Guide

This guide explains how to set up environment variables for the ForayPay application.

## Required Environment Variables

Create a `.env.local` file in the root directory of the project with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# MoniMe API Configuration
MONIME_API_URL=https://api.monime.com
MONIME_API_KEY=your_monime_api_key
MONIME_PLATFORM_ACCOUNT_ID=your_platform_monime_account_id
MONIME_WEBHOOK_SECRET=your_monime_webhook_secret

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## How to Obtain These Values

### Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **KEEP THIS SECRET!**

### MoniMe API Credentials

1. Log in to your MoniMe account
2. Navigate to API settings
3. Generate or copy your API credentials:
   - API Key → `MONIME_API_KEY`
   - Platform Account ID → `MONIME_PLATFORM_ACCOUNT_ID`
   - Webhook Secret → `MONIME_WEBHOOK_SECRET`

## Security Best Practices

⚠️ **IMPORTANT SECURITY NOTES:**

1. **Never commit `.env.local` to version control** - It's already in `.gitignore`
2. **Never expose `SUPABASE_SERVICE_ROLE_KEY`** - This key bypasses Row Level Security (RLS)
3. **Never share service role keys in documentation** - Always use placeholders
4. **Rotate keys immediately if exposed** - If a key is leaked, regenerate it in Supabase dashboard
5. **Use different keys for development and production** - Never reuse production keys in development

## Environment-Specific Configuration

### Development
- Use development Supabase project
- Set `NEXT_PUBLIC_APP_URL=http://localhost:3000`

### Production
- Use production Supabase project
- Set `NEXT_PUBLIC_APP_URL=https://your-production-domain.com`
- Ensure all secrets are set in your hosting platform's environment variables

## Verification

After setting up your environment variables:

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Verify the application starts without errors
3. Check that you can log in to the application
4. Verify API endpoints are working correctly

## Troubleshooting

### Missing Environment Variables
If you see errors about missing environment variables:
- Verify `.env.local` exists in the root directory
- Check that all required variables are set
- Restart the development server after making changes

### Authentication Issues
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Check that your Supabase project is active

### Service Role Key Issues
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is the **service_role** key (not the anon key)
- Verify the key hasn't expired or been rotated
- Check that the key has the correct permissions

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment instructions

