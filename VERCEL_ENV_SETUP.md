# Vercel Environment Variables Setup Guide

## ⚠️ CRITICAL: Server-Side Error Fix

If you're seeing "Application error: a server-side exception has occurred" after deployment, this is almost always due to **missing environment variables** in Vercel.

## Required Environment Variables

You **MUST** set these in your Vercel project settings:

### Step 1: Access Vercel Project Settings

1. Go to [vercel.com](https://vercel.com) and sign in
2. Select your project (`foraypay`)
3. Click **Settings** (gear icon)
4. Click **Environment Variables** in the left sidebar

### Step 2: Add All Required Variables

Add each of these variables:

#### Supabase Configuration (REQUIRED)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**How to get these:**
1. Go to [supabase.com](https://supabase.com) → Your Project
2. Settings → API
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Keep secret!

#### MoniMe API Configuration (REQUIRED)
```
MONIME_API_URL=https://api.monime.com
MONIME_API_KEY=your_monime_api_key
MONIME_PLATFORM_ACCOUNT_ID=your_platform_account_id
MONIME_WEBHOOK_SECRET=your_webhook_secret
```

#### Application Configuration (REQUIRED)
```
NEXT_PUBLIC_APP_URL=https://foraypay.vercel.app
```
(Or your custom domain if you have one)

#### Admin Domain Configuration (REQUIRED)
```
NEXT_PUBLIC_ADMIN_DOMAIN=admin.foraypay.com
```
(Or your admin subdomain. For local development, use `admin.localhost`)

**Note:** Platform Admin login and administration work is separated to a different domain for security. Set this to your admin subdomain (e.g., `admin.foraypay.com`).

### Step 3: Set Environment for All Environments

For each variable:
1. Click **Add** or **Edit**
2. Enter the variable name and value
3. Select **Production**, **Preview**, and **Development** (or just Production if you only deploy to production)
4. Click **Save**

### Step 4: Redeploy

After adding all variables:
1. Go to **Deployments** tab
2. Click the **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger a new deployment

## Verification Checklist

✅ All 9 environment variables are set in Vercel
✅ Variables are set for **Production** environment (at minimum)
✅ You've redeployed after adding variables
✅ No typos in variable names (case-sensitive!)
✅ Admin domain is configured and DNS is set up

## Common Issues

### Issue: "Application error: a server-side exception has occurred"

**Cause:** Missing environment variables

**Solution:**
1. Check Vercel dashboard → Settings → Environment Variables
2. Verify all 8 variables are present
3. Check for typos (especially `NEXT_PUBLIC_` prefix)
4. Redeploy after adding variables

### Issue: "NEXT_PUBLIC_SUPABASE_URL is not set"

**Cause:** Missing Supabase URL

**Solution:**
1. Add `NEXT_PUBLIC_SUPABASE_URL` in Vercel
2. Make sure it starts with `https://`
3. Redeploy

### Issue: "Failed to initialize Supabase client"

**Cause:** Invalid Supabase credentials

**Solution:**
1. Double-check Supabase URL and keys
2. Verify keys are from the correct Supabase project
3. Make sure service role key is the **service_role** key, not anon key

## Quick Test

After setting up environment variables, test by:

1. Visit your deployed site: `https://foraypay.vercel.app`
2. Try to log in
3. If you still get errors, check Vercel deployment logs:
   - Go to Deployments → Latest deployment → View Function Logs

## Security Notes

⚠️ **Never commit environment variables to Git**
- They're in `.gitignore` for a reason
- Always set them in Vercel dashboard
- Use different values for development and production

## Still Having Issues?

1. **Check Vercel Function Logs:**
   - Deployments → Latest → Functions → View Logs
   - Look for specific error messages

2. **Verify Supabase Project:**
   - Make sure your Supabase project is active
   - Check that database tables exist
   - Verify RLS policies are set up

3. **Test Locally First:**
   - Make sure `.env.local` has all variables
   - Run `npm run build` and `npm start` locally
   - If it works locally but not on Vercel, it's an env var issue

## Support

If you've verified all environment variables are set correctly and still getting errors:
1. Check Vercel function logs for specific error messages
2. Verify your Supabase project is accessible
3. Make sure database schema is set up correctly

