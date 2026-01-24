# Platform Admin Login - Localhost Guide

## Quick Steps to Sign In as Platform Admin

### Step 1: Access the Admin Login Page

Open your browser and go to:
```
http://localhost:3000/admin/login
```

**Note**: Platform admins have a **separate login page** at `/admin/login` (not the regular `/login` page).

### Step 2: Ensure You Have a Platform Admin Account

If you don't have a platform admin account yet, follow these steps:

#### Option A: Create New Platform Admin (Recommended)

1. **Create Auth User in Supabase Dashboard:**
   - Go to your Supabase Dashboard
   - Navigate to **Authentication** > **Users**
   - Click **"Add User"**
   - Enter:
     - **Email**: `admin@foraypay.com` (or your email)
     - **Password**: Set a secure password
     - **Auto Confirm User**: ✅ Enable this
   - Click **"Create User"**

2. **Set Platform Admin Role:**
   - Go to **SQL Editor** in Supabase Dashboard
   - Run this SQL (replace email with your actual email):
   ```sql
   UPDATE users
   SET 
     role = 'platform_admin',
     company_id = NULL
   WHERE email = 'admin@foraypay.com';
   ```

3. **Verify the Account:**
   ```sql
   SELECT id, email, role, company_id 
   FROM users 
   WHERE email = 'admin@foraypay.com';
   ```
   
   You should see:
   - `role`: `platform_admin`
   - `company_id`: `NULL`

#### Option B: Update Existing User to Platform Admin

If you already have a user account:

```sql
-- Replace 'your-email@example.com' with your actual email
UPDATE users
SET 
  role = 'platform_admin',
  company_id = NULL
WHERE email = 'your-email@example.com';
```

### Step 3: Sign In

1. Go to: `http://localhost:3000/admin/login`
2. Enter your **email** and **password**
3. Click **"Sign In"**
4. You'll be redirected to the Platform Admin Dashboard at `/platform`

## Login URLs

- **Platform Admin Login**: `http://localhost:3000/admin/login`
- **Regular Login** (Company Admin/Operator): `http://localhost:3000/login`

## Troubleshooting

### Issue: "User profile not found"
**Solution**: Your user exists in `auth.users` but not in `users` table. Run:
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

### Issue: "Access denied. This login page is for platform administrators only"
**Solution**: Your account doesn't have `platform_admin` role. Update it:
```sql
UPDATE users
SET role = 'platform_admin', company_id = NULL
WHERE email = 'your-email@example.com';
```

### Issue: Can't access `/admin/login` page
**Solution**: Make sure your Next.js dev server is running:
```bash
npm run dev
```
Then access: `http://localhost:3000/admin/login`

### Issue: Login redirects to wrong page
**Solution**: Clear browser cache and cookies, then try again.

## Quick Verification

Check if your account is set up correctly:

```sql
SELECT 
  u.email,
  u.role,
  u.company_id,
  au.email_confirmed_at,
  au.last_sign_in_at
FROM users u
JOIN auth.users au ON u.id = au.id
WHERE u.email = 'your-email@example.com';
```

Expected result:
- ✅ `role` = `platform_admin`
- ✅ `company_id` = `NULL`
- ✅ `email_confirmed_at` = Not NULL
- ✅ `last_sign_in_at` = Updates when you login

## Security Note

- Platform admin accounts have **full access** to all companies and data
- Use strong passwords
- Only create platform admin accounts for trusted administrators
- Keep platform admin credentials secure

## After Login

Once logged in as platform admin, you'll have access to:
- ✅ View all companies
- ✅ Create/edit/delete companies
- ✅ View all users
- ✅ View all transactions
- ✅ View all audit logs
- ✅ Manage platform settings

---

**Login URL**: `http://localhost:3000/admin/login`

