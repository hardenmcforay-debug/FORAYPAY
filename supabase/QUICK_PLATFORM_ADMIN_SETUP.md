# Quick Platform Admin Setup Guide

## Method 1: Via Supabase Dashboard (Recommended)

### Step 1: Create Auth User
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Users**
3. Click **"Add User"** or **"Invite User"**
4. Fill in:
   - **Email**: `admin@foraypay.com` (or your email)
   - **Password**: Set a secure password
   - **Auto Confirm User**: ✅ Enable this
5. Click **"Create User"**
6. **Copy the User ID** (UUID) - you'll see it in the user list

### Step 2: Update User Role
Run this SQL in **SQL Editor**:

```sql
-- Replace 'admin@foraypay.com' with your actual email
UPDATE users
SET 
  role = 'platform_admin',
  company_id = NULL
WHERE email = 'admin@foraypay.com';
```

### Step 3: Verify
```sql
SELECT id, email, role, company_id 
FROM users 
WHERE email = 'admin@foraypay.com';
```

You should see:
- `role`: `platform_admin`
- `company_id`: `NULL`

---

## Method 2: Direct SQL (If user already exists)

If you already have a user created, just run:

```sql
UPDATE users
SET role = 'platform_admin', company_id = NULL
WHERE email = 'your-email@example.com';
```

---

## Method 3: One-Step Script (Auto-detects user)

```sql
DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'admin@foraypay.com'; -- Change to your email
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User % does not exist. Create it first via Dashboard > Authentication > Users', v_email;
  END IF;
  
  INSERT INTO users (id, email, role, company_id)
  VALUES (v_user_id, v_email, 'platform_admin', NULL)
  ON CONFLICT (id) 
  DO UPDATE SET
    role = 'platform_admin',
    company_id = NULL;
END $$;
```

---

## After Setup

1. **Login** at `http://localhost:3000/login` (or your domain)
2. Use the email and password you set
3. You'll be automatically redirected to `/platform` dashboard
4. You now have full platform admin access!

---

## Troubleshooting

**User doesn't exist?**
- Make sure you created the user in Supabase Auth first
- Check Authentication > Users in dashboard

**Can't login?**
- Verify email is confirmed (Auto Confirm should be enabled)
- Check password is correct
- Verify user exists in `users` table with correct role

**Role not updating?**
- Check if user exists in `auth.users` table
- Verify the email matches exactly
- Check RLS policies allow the update

---

## Quick Verification Query

```sql
-- Check all platform admins
SELECT 
  u.email,
  u.role,
  u.company_id,
  au.email_confirmed_at
FROM users u
JOIN auth.users au ON u.id = au.id
WHERE u.role = 'platform_admin';
```

