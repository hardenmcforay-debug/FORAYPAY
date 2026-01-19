# Fixing "User account not found" - ID Mismatch Issue

## The Problem

You're getting "User account not found in system" even though you created the user. This happens when:

**The UUID in the `users` table doesn't match the UUID from Supabase Auth**

## Why This Happens

When you create a user in Supabase Auth, it generates a UUID. You MUST use that EXACT same UUID when creating the record in the `users` table. If you generate a new UUID or use a different one, the login will fail.

## Quick Fix (3 Steps)

### Step 1: Get Your Correct UUID from Supabase Auth

1. Go to Supabase Dashboard
2. Navigate to **Authentication > Users**
3. Find your user by email
4. **Copy the UUID** (it's shown in the user details, looks like: `123e4567-e89b-12d3-a456-426614174000`)

### Step 2: Check What's in Your Users Table

Run this SQL in Supabase SQL Editor (replace with your email):

```sql
SELECT id, email, full_name, role 
FROM users 
WHERE email = 'your-email@example.com';
```

### Step 3: Fix the Mismatch

**Option A: Delete and Recreate (Recommended)**

```sql
-- 1. Delete the wrong record
DELETE FROM users WHERE email = 'your-email@example.com';

-- 2. Insert with CORRECT UUID (use the UUID from Step 1)
INSERT INTO users (id, email, password_hash, full_name, role, is_active)
VALUES (
  'PASTE_UUID_FROM_STEP_1_HERE',  -- The UUID from Supabase Auth
  'your-email@example.com',        -- Your email
  '',                               -- Leave empty
  'Your Full Name',                 -- Your name
  'platform_admin',                  -- Your role
  true                              -- Active
);
```

**Option B: Update Existing Record**

```sql
-- Get the correct UUID first
SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Then update (replace NEW_UUID with the UUID from above)
UPDATE users 
SET id = 'NEW_UUID_FROM_AUTH_USERS'
WHERE email = 'your-email@example.com';
```

## Verify It's Fixed

Run this to check if IDs match:

```sql
SELECT 
  a.id as auth_id,
  u.id as users_id,
  CASE 
    WHEN a.id = u.id THEN '✅ Fixed! IDs match'
    ELSE '❌ Still mismatched'
  END as status
FROM auth.users a
LEFT JOIN users u ON a.id = u.id
WHERE a.email = 'your-email@example.com';
```

Both IDs should be the same.

## Complete Diagnostic Query

Run this to see everything at once:

```sql
SELECT 
  a.id as auth_users_id,
  a.email as auth_email,
  u.id as users_table_id,
  u.email as users_email,
  u.role,
  u.is_active,
  CASE 
    WHEN a.id IS NULL THEN '❌ Not in Auth'
    WHEN u.id IS NULL THEN '❌ Not in users table'
    WHEN a.id != u.id THEN '❌ ID MISMATCH - This is your problem!'
    WHEN a.email != u.email THEN '❌ Email mismatch'
    WHEN u.is_active = false THEN '⚠️ User inactive'
    ELSE '✅ Everything is correct!'
  END as status
FROM auth.users a
FULL OUTER JOIN users u ON a.id = u.id
WHERE a.email = 'your-email@example.com' OR u.email = 'your-email@example.com';
```

## Common Mistakes

1. **Generating a new UUID** instead of using the one from Supabase Auth
2. **Copying UUID incorrectly** (missing characters, extra spaces)
3. **Creating user in wrong order** (should create in Auth first, then users table)

## Prevention

Always follow this order:
1. ✅ Create user in Supabase Auth first
2. ✅ Copy the UUID from Auth
3. ✅ Use that EXACT UUID when creating record in users table

See `database/fix-user-id-mismatch.sql` for a complete fix script.

