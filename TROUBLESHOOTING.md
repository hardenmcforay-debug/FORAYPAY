# Troubleshooting Guide

## Login Issues

### Problem: Cannot login as Platform Admin

**Symptoms:**
- You created a user in Supabase Auth
- Login fails or doesn't redirect to dashboard
- Error message appears

**Solution:**

1. **Verify user exists in Supabase Auth:**
   - Go to Supabase Dashboard > Authentication > Users
   - Find your user by email
   - Note the User UUID

2. **Verify user exists in users table:**
   Run this SQL in Supabase SQL Editor:
   ```sql
   SELECT * FROM users WHERE email = 'your-email@example.com';
   ```

3. **Check if IDs match:**
   ```sql
   SELECT 
     u.id as users_table_id,
     u.email,
     u.role,
     u.is_active,
     a.id as auth_users_id,
     a.email as auth_email
   FROM users u
   LEFT JOIN auth.users a ON u.id = a.id
   WHERE u.email = 'your-email@example.com';
   ```

   **Expected Result:**
   - `users_table_id` should equal `auth_users_id`
   - Both emails should match
   - `is_active` should be `true`
   - `role` should be `platform_admin`

4. **If user doesn't exist in users table:**
   - Use the UUID from Step 1
   - Run the INSERT statement from `database/create-user-helper.sql`
   - Make sure the `id` in the INSERT matches the UUID from Supabase Auth

5. **If IDs don't match:**
   - Delete the record from users table
   - Re-insert with the correct UUID from Supabase Auth

### Problem: "User account not found in system"

**Cause:** User exists in Supabase Auth but not in `users` table.

**Solution:**
1. Get the User UUID from Supabase Auth (Authentication > Users)
2. Run this SQL (replace values):
   ```sql
   INSERT INTO users (id, email, password_hash, full_name, role, is_active)
   VALUES (
     'PASTE_UUID_HERE',
     'your-email@example.com',
     '',
     'Your Name',
     'platform_admin',
     true
   );
   ```

### Problem: "This account is for [Role]. Please select the correct role."

**Cause:** You selected the wrong role on the login page.

**Solution:**
- Check your actual role in the database:
  ```sql
  SELECT email, role FROM users WHERE email = 'your-email@example.com';
  ```
- Select the correct role on the login page

### Problem: "Invalid email or password"

**Possible Causes:**
1. Wrong email or password
2. User not confirmed in Supabase Auth
3. User doesn't exist in Supabase Auth

**Solution:**
1. Verify user exists in Supabase Auth:
   - Go to Authentication > Users
   - Check if your user is listed
   - Check if "Email Confirmed" is true

2. If user doesn't exist:
   - Create user in Supabase Auth first
   - Then create corresponding record in users table

3. If user exists but not confirmed:
   - In Supabase Auth, click on your user
   - Check "Email Confirmed" or manually confirm

### Problem: Login succeeds but redirects to wrong page

**Cause:** Role mismatch between selected role and actual role.

**Solution:**
1. Check your actual role:
   ```sql
   SELECT role FROM users WHERE email = 'your-email@example.com';
   ```

2. Select the correct role on login page

3. Or update your role in database (if you have access):
   ```sql
   UPDATE users 
   SET role = 'platform_admin' 
   WHERE email = 'your-email@example.com';
   ```

## Quick Fix Script

Run this to check and fix common issues:

```sql
-- Check user setup
SELECT 
  u.id,
  u.email,
  u.role,
  u.is_active,
  CASE 
    WHEN a.id IS NULL THEN '❌ Not in Auth'
    WHEN u.id != a.id THEN '❌ ID Mismatch'
    WHEN u.email != a.email THEN '❌ Email Mismatch'
    ELSE '✅ OK'
  END as status
FROM users u
LEFT JOIN auth.users a ON u.id = a.id
WHERE u.email = 'your-email@example.com';
```

## Common Setup Mistakes

1. **Creating user only in Supabase Auth**
   - ❌ Wrong: Only creating in Authentication
   - ✅ Correct: Create in both Auth AND users table

2. **Using different UUIDs**
   - ❌ Wrong: Generating new UUID for users table
   - ✅ Correct: Use the same UUID from auth.users

3. **Wrong role value**
   - ❌ Wrong: 'admin', 'platform', 'Platform Admin'
   - ✅ Correct: 'platform_admin' (exact spelling)

4. **Not setting is_active**
   - ❌ Wrong: Forgetting to set is_active = true
   - ✅ Correct: Always set is_active = true for new users

## Still Having Issues?

1. Check browser console for errors (F12)
2. Check Supabase logs (Dashboard > Logs)
3. Verify environment variables are set correctly
4. Ensure database schema is fully applied
5. Try clearing browser cookies and cache

