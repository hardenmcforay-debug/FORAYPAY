# Troubleshooting Login Issues

## Issue: Login doesn't redirect to dashboard

### Common Causes

1. **User profile doesn't exist in `users` table**
   - The user exists in `auth.users` but not in `public.users`
   - This happens if the trigger wasn't set up or user was created before trigger

2. **User role not assigned**
   - User exists but `role` is NULL
   - User needs role assignment by platform admin

### Solution Steps

#### Step 1: Check Browser Console
Open browser DevTools (F12) → Console tab
- Look for error messages
- Check what the login page logs

#### Step 2: Verify User Profile Exists

Run this SQL in Supabase SQL Editor:

```sql
-- Replace 'your-email@example.com' with your actual email
SELECT 
  u.id,
  u.email,
  u.role,
  u.company_id,
  au.email_confirmed_at
FROM users u
JOIN auth.users au ON u.id = au.id
WHERE u.email = 'your-email@example.com';
```

**If no rows returned:**
- Your profile doesn't exist
- Follow Step 3 to create it

**If rows returned but `role` is NULL:**
- Your profile exists but role isn't set
- Follow Step 4 to assign role

#### Step 3: Create Missing User Profile

**For Platform Admin:**
```sql
INSERT INTO users (id, email, role, company_id)
SELECT 
  id,
  email,
  'platform_admin',
  NULL
FROM auth.users
WHERE email = 'your-email@example.com'
AND id NOT IN (SELECT id FROM users);
```

**For Company Admin:**
```sql
-- First, get your company ID:
SELECT id FROM companies WHERE name = 'Your Company Name';

-- Then create profile (replace 'company-uuid' with actual UUID):
INSERT INTO users (id, email, role, company_id)
SELECT 
  id,
  email,
  'company_admin',
  'company-uuid'::uuid
FROM auth.users
WHERE email = 'your-email@example.com'
AND id NOT IN (SELECT id FROM users);
```

**For Park Operator:**
- Park operators are created by company admin through the dashboard
- Contact your company admin

#### Step 4: Update Existing Profile Role

```sql
-- Update to platform admin:
UPDATE users
SET role = 'platform_admin', company_id = NULL
WHERE email = 'your-email@example.com';

-- Update to company admin (replace with actual company UUID):
UPDATE users
SET role = 'company_admin', company_id = 'company-uuid'::uuid
WHERE email = 'your-email@example.com';
```

#### Step 5: Verify and Test

1. Run the check query from Step 2 again
2. Verify `role` is set correctly
3. Try logging in again
4. Check browser console for redirect URL

### Quick Fix Script

Run this complete script (replace email):

```sql
DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'your-email@example.com'; -- CHANGE THIS
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User % not found in auth.users', v_email;
  END IF;
  
  -- Create or update profile as platform admin
  INSERT INTO users (id, email, role, company_id)
  VALUES (v_user_id, v_email, 'platform_admin', NULL)
  ON CONFLICT (id) 
  DO UPDATE SET
    role = 'platform_admin',
    company_id = NULL;
  
  RAISE NOTICE 'Profile created/updated for: %', v_email;
END $$;
```

### Still Not Working?

1. **Check Supabase Connection**
   - Verify `.env.local` has correct Supabase credentials
   - Check Supabase project is active

2. **Check RLS Policies**
   - Verify Row Level Security allows reading `users` table
   - Platform admin should bypass RLS

3. **Clear Browser Cache**
   - Clear cookies and localStorage
   - Try incognito/private window

4. **Check Network Tab**
   - Open DevTools → Network tab
   - Try login and check for failed requests
   - Look for 401/403 errors

### Expected Behavior

After successful login:
1. Browser console shows: "Login successful!" and redirect URL
2. Page navigates to:
   - `/platform` for platform_admin
   - `/company` for company_admin  
   - `/operator` for park_operator

If you see error messages in the login form, they will tell you exactly what's wrong.

