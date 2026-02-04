# Admin Domain Setup Guide

## Overview

Platform Admin login and administration work has been separated to use a different domain for enhanced security and isolation. This guide explains how to set up and configure the admin domain.

## Architecture

- **Main Domain**: Regular users (Company Admins, Park Operators) access the platform here
- **Admin Domain**: Platform Administrators access login and administration features here

### Routes Separation

**Admin Domain Routes:**
- `/admin/login` - Platform Admin login
- `/platform` - Platform Admin dashboard
- `/platform/*` - All platform administration pages

**Main Domain Routes:**
- `/login` - Regular user login
- `/company/*` - Company Admin dashboard
- `/operator/*` - Park Operator dashboard
- All other public routes

## Environment Variables

### Required Environment Variable

Add this to your Vercel project settings:

```
NEXT_PUBLIC_ADMIN_DOMAIN=admin.foraypay.com
```

**For Production:**
- Set to your admin subdomain (e.g., `admin.foraypay.com`)
- Do NOT include `https://` or `http://` - just the domain name

**For Local Development:**
- Set to `admin.localhost` (or `admin.127.0.0.1`)
- Update your `/etc/hosts` file (see Local Development section)

## DNS Configuration

### Production Setup

1. **Add DNS Record:**
   - Type: `CNAME` or `A` record
   - Name: `admin` (or your preferred subdomain)
   - Value: Your Vercel deployment domain or IP

2. **Vercel Domain Configuration:**
   - Go to Vercel Dashboard → Your Project → Settings → Domains
   - Add your admin domain (e.g., `admin.foraypay.com`)
   - Vercel will automatically configure SSL certificates

3. **Verify DNS:**
   ```bash
   nslookup admin.foraypay.com
   # or
   dig admin.foraypay.com
   ```

## Local Development Setup

### Option 1: Using admin.localhost (Recommended)

1. **Update `/etc/hosts` file:**
   ```bash
   # macOS/Linux
   sudo nano /etc/hosts
   
   # Windows
   # Edit C:\Windows\System32\drivers\etc\hosts as Administrator
   ```

2. **Add these lines:**
   ```
   127.0.0.1    localhost
   127.0.0.1    admin.localhost
   ```

3. **Set environment variable in `.env.local`:**
   ```
   NEXT_PUBLIC_ADMIN_DOMAIN=admin.localhost
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Access:**
   - Main domain: `http://localhost:3000`
   - Admin domain: `http://admin.localhost:3000`

### Option 2: Using Different Ports

If you prefer using different ports:

1. **Update `.env.local`:**
   ```
   NEXT_PUBLIC_ADMIN_DOMAIN=localhost:3001
   ```

2. **Run two Next.js instances:**
   ```bash
   # Terminal 1 - Main domain
   PORT=3000 npm run dev
   
   # Terminal 2 - Admin domain
   PORT=3001 npm run dev
   ```

**Note:** This approach requires additional configuration and is not recommended. Use Option 1 instead.

## How It Works

### Automatic Redirects

The middleware automatically handles domain-based routing:

1. **Platform Admin Routes on Main Domain:**
   - If a user tries to access `/admin/login` or `/platform/*` on the main domain
   - They are automatically redirected to the admin domain

2. **Regular Routes on Admin Domain:**
   - If a user tries to access `/login`, `/company/*`, or `/operator/*` on the admin domain
   - They are automatically redirected to the main domain

3. **Login Detection:**
   - If a platform admin tries to log in on the regular login page
   - They are automatically redirected to the admin domain login

### Authentication Flow

1. **Platform Admin Login:**
   - User goes to `admin.foraypay.com/admin/login`
   - After successful login, stays on admin domain
   - All platform admin pages are served from admin domain

2. **Regular User Login:**
   - User goes to `foraypay.com/login`
   - After successful login, stays on main domain
   - All company/operator pages are served from main domain

## Testing

### Test Admin Domain Setup

1. **Test Redirect from Main Domain:**
   ```bash
   curl -I https://foraypay.com/admin/login
   # Should redirect to https://admin.foraypay.com/admin/login
   ```

2. **Test Admin Login:**
   - Visit `https://admin.foraypay.com/admin/login`
   - Login with platform admin credentials
   - Verify you stay on admin domain

3. **Test Regular Login:**
   - Visit `https://foraypay.com/login`
   - Login with company admin credentials
   - Verify you stay on main domain

4. **Test Platform Admin Detection:**
   - Visit `https://foraypay.com/login`
   - Try to login with platform admin credentials
   - Should redirect to admin domain

## Troubleshooting

### Issue: "Redirect loop" or "Too many redirects"

**Cause:** Domain configuration mismatch

**Solution:**
1. Verify `NEXT_PUBLIC_ADMIN_DOMAIN` is set correctly
2. Check that DNS is pointing to the correct server
3. Clear browser cache and cookies
4. Check middleware logs for redirect patterns

### Issue: "Cannot access admin domain"

**Cause:** DNS not configured or domain not added to Vercel

**Solution:**
1. Verify DNS record exists and is correct
2. Check Vercel domain settings
3. Wait for DNS propagation (can take up to 48 hours)
4. Verify SSL certificate is issued (check Vercel dashboard)

### Issue: "Admin login redirects to main domain"

**Cause:** Environment variable not set or incorrect

**Solution:**
1. Verify `NEXT_PUBLIC_ADMIN_DOMAIN` is set in Vercel
2. Check for typos in domain name
3. Ensure variable is set for the correct environment (Production/Preview)
4. Redeploy after adding the variable

### Issue: "Local development not working"

**Cause:** `/etc/hosts` not configured or environment variable missing

**Solution:**
1. Verify `/etc/hosts` has `admin.localhost` entry
2. Check `.env.local` has `NEXT_PUBLIC_ADMIN_DOMAIN=admin.localhost`
3. Restart development server
4. Clear browser cache

## Security Benefits

1. **Isolation:** Admin functionality is completely separated from regular user access
2. **Reduced Attack Surface:** Admin domain can have additional security measures
3. **Access Control:** Easier to implement IP whitelisting for admin domain
4. **Monitoring:** Separate logging and monitoring for admin activities
5. **Compliance:** Better separation for audit and compliance requirements

## Production Checklist

Before deploying to production:

- [ ] DNS record created for admin domain
- [ ] Domain added to Vercel project
- [ ] SSL certificate issued (automatic via Vercel)
- [ ] `NEXT_PUBLIC_ADMIN_DOMAIN` environment variable set
- [ ] Tested redirects from main domain to admin domain
- [ ] Tested redirects from admin domain to main domain
- [ ] Verified platform admin login works on admin domain
- [ ] Verified regular user login works on main domain
- [ ] Tested platform admin detection and redirect
- [ ] Checked browser console for any errors

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Verify environment variables are set correctly
3. Test DNS resolution: `nslookup admin.foraypay.com`
4. Check browser network tab for redirect chains
5. Verify middleware is running (check Vercel function logs)

