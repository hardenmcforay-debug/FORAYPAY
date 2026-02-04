# Platform Admin Domain Setup Guide

This guide explains how to configure the system to allow Platform Admin to log in from a different domain than the main application.

## Overview

By default, Platform Admin logs in from the same domain as the main application. However, you can configure a separate domain (e.g., `admin.foraypay.com`) for Platform Admin access. This provides:

- **Enhanced Security**: Separate admin access point
- **Better Organization**: Clear separation between admin and user interfaces
- **Flexible Deployment**: Deploy admin interface separately if needed

## Prerequisites

1. You have a separate domain/subdomain for Platform Admin (e.g., `admin.foraypay.com`)
2. Your hosting platform supports multiple domains
3. Access to Supabase project dashboard

## Step 1: Configure Environment Variables

### For Development

In your `.env.local` file:

```env
# Main application domain
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Platform Admin domain (separate from main app)
NEXT_PUBLIC_ADMIN_APP_URL=http://localhost:3001
```

### For Production

In your hosting platform (Vercel, Netlify, etc.), set:

```env
NEXT_PUBLIC_APP_URL=https://foraypay.com
NEXT_PUBLIC_ADMIN_APP_URL=https://admin.foraypay.com
```

**Note:** If `NEXT_PUBLIC_ADMIN_APP_URL` is not set, Platform Admin will use `NEXT_PUBLIC_APP_URL`.

## Step 2: Configure Supabase Redirect URLs

This is the **most important step**. Supabase must be configured to allow authentication redirects from both domains.

### 2.1 Access Supabase URL Configuration

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**

### 2.2 Configure Site URL

In the **Site URL** field, you can either:

**Option A: Use Main Domain (Recommended)**
- Set to your main application domain: `https://foraypay.com`
- This is the primary domain Supabase will use

**Option B: Use Admin Domain**
- Set to your admin domain: `https://admin.foraypay.com`
- Only if admin domain is your primary entry point

### 2.3 Configure Redirect URLs

In the **Redirect URLs** section, add **both domains** with wildcards:

```
https://foraypay.com/**
https://admin.foraypay.com/**
```

**Important:** 
- Include the `/**` wildcard to allow all paths
- Add both domains even if one is the main app
- Each domain should be on a separate line or comma-separated

### 2.4 Example Configuration

```
Site URL: https://foraypay.com

Redirect URLs:
https://foraypay.com/**
https://admin.foraypay.com/**
http://localhost:3000/**
http://localhost:3001/**
```

**Note:** Include localhost URLs for development if needed.

### 2.5 Save Configuration

Click **Save** to apply the changes. Changes take effect immediately.

## Step 3: Deploy to Both Domains

### Option A: Same Deployment, Multiple Domains

If using Vercel or similar platforms:

1. Deploy your application once
2. Add both domains to the same deployment:
   - Main domain: `foraypay.com`
   - Admin domain: `admin.foraypay.com`
3. Both domains will serve the same application
4. Platform Admin login page will be accessible at both:
   - `https://foraypay.com/admin/login`
   - `https://admin.foraypay.com/admin/login`

### Option B: Separate Deployments

If you want separate deployments:

1. Deploy main application to `foraypay.com`
2. Deploy admin application to `admin.foraypay.com`
3. Set environment variables appropriately for each deployment

## Step 4: Verify Configuration

### 4.1 Test Main Domain Login

1. Visit `https://foraypay.com/login`
2. Log in as a regular user (company admin or operator)
3. Verify redirect works correctly

### 4.2 Test Admin Domain Login

1. Visit `https://admin.foraypay.com/admin/login`
2. Log in as Platform Admin
3. Verify redirect to dashboard works correctly

### 4.3 Check Browser Console

If authentication fails:
1. Open browser Developer Tools (F12)
2. Check Console for errors
3. Common errors:
   - "Invalid redirect URL" → Supabase redirect URLs not configured
   - "Session expired" → Check Supabase configuration

## Troubleshooting

### Issue: "Invalid redirect URL" Error

**Cause:** Supabase doesn't recognize the redirect URL.

**Solution:**
1. Go to Supabase → Authentication → URL Configuration
2. Verify the domain is in **Redirect URLs** with `/**` wildcard
3. Make sure there are no typos in the URL
4. Save and try again

### Issue: Authentication Works on Main Domain but Not Admin Domain

**Cause:** Admin domain not added to Supabase redirect URLs.

**Solution:**
1. Add admin domain to Supabase redirect URLs: `https://admin.foraypay.com/**`
2. Save configuration
3. Clear browser cache and cookies
4. Try logging in again

### Issue: "Session expired" Immediately After Login

**Cause:** Domain mismatch between login and redirect.

**Solution:**
1. Verify `NEXT_PUBLIC_ADMIN_APP_URL` is set correctly
2. Check that Supabase redirect URLs include both domains
3. Ensure you're accessing the correct domain for your role

### Issue: CORS Errors

**Cause:** Browser blocking cross-origin requests.

**Solution:**
1. Verify Supabase URL configuration includes both domains
2. Check that `NEXT_PUBLIC_SUPABASE_URL` is correct
3. Ensure HTTPS is enabled for both domains

## Security Considerations

### Best Practices

1. **Use HTTPS**: Always use HTTPS for both domains in production
2. **Separate Subdomains**: Use separate subdomains (e.g., `admin.foraypay.com`) rather than separate paths
3. **Restrict Access**: Consider IP whitelisting for admin domain if possible
4. **Monitor Logs**: Regularly check authentication logs for suspicious activity
5. **Strong Passwords**: Ensure Platform Admin accounts use strong passwords

### Domain Configuration

- **Main Domain**: `https://foraypay.com` - For regular users
- **Admin Domain**: `https://admin.foraypay.com` - For Platform Admin only
- Both domains can serve the same application, but admin domain provides a separate entry point

## Environment Variables Summary

### Required Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=https://foraypay.com
```

### Optional Variables (For Separate Admin Domain)

```env
NEXT_PUBLIC_ADMIN_APP_URL=https://admin.foraypay.com
```

## Quick Reference

### Supabase Configuration Checklist

- [ ] Site URL configured (main domain)
- [ ] Redirect URLs include main domain: `https://foraypay.com/**`
- [ ] Redirect URLs include admin domain: `https://admin.foraypay.com/**`
- [ ] Localhost URLs added for development (if needed)
- [ ] Configuration saved

### Deployment Checklist

- [ ] `NEXT_PUBLIC_APP_URL` set to main domain
- [ ] `NEXT_PUBLIC_ADMIN_APP_URL` set to admin domain (if using separate domain)
- [ ] Both domains point to deployment
- [ ] HTTPS enabled for both domains
- [ ] DNS records configured correctly

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase URL Configuration](https://supabase.com/docs/guides/auth/url-configuration)
- [DEPLOYMENT.md](./DEPLOYMENT.md) - General deployment guide
- [ENV-SETUP.md](./ENV-SETUP.md) - Environment variables guide

## Support

If you encounter issues:

1. Verify Supabase redirect URLs are configured correctly
2. Check environment variables are set in your hosting platform
3. Review browser console for specific error messages
4. Ensure both domains are accessible and using HTTPS

---

**Last Updated:** Configuration guide for Platform Admin multi-domain access

