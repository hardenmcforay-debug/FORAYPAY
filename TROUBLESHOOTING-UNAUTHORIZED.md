# Troubleshooting "Unauthorized" Error in Ticket Validation

## Problem
You're getting "Unauthorized" error when trying to validate tickets.

## Possible Causes & Solutions

### 1. Not Logged In
**Symptom:** `Unauthorized` error immediately when trying to validate

**Solution:**
- Make sure you're logged in as a park operator
- Go to `/login` and sign in with your park operator credentials
- After login, you should be redirected to `/operator/dashboard`
- Then try validating tickets again

### 2. Session Expired
**Symptom:** Was working before, now getting `Unauthorized`

**Solution:**
- Log out and log back in
- Supabase sessions typically last 1 hour by default
- If session expires, you'll need to log in again

### 3. Wrong Role Selected at Login
**Symptom:** Login works, but validation fails

**Solution:**
- Make sure you selected "Park Operator" role at login
- Log out and log back in, selecting "Park Operator" this time
- Your user account must have `role = 'park_operator'` in the database

### 4. No Operator Record in Database
**Symptom:** Login works, but validation says "Operator not found"

**Solution:**
- Your user exists in `auth.users` and `users` table
- But you don't have a record in `park_operators` table
- Contact your company admin to create your operator record

### 5. Cookies Not Being Sent
**Symptom:** Login works, but API calls fail with `Unauthorized`

**Solution:**
- Clear browser cookies and try again
- Make sure you're not blocking cookies in browser settings
- Try in incognito/private mode to test
- The fetch call now includes `credentials: 'include'` which should help

### 6. Browser/Network Issues
**Symptom:** Intermittent `Unauthorized` errors

**Solution:**
- Clear browser cache
- Try a different browser
- Check browser console for errors
- Check network tab to see if cookies are being sent with the request

## Quick Fix Steps

1. **Log Out and Log Back In**
   ```
   - Click logout (if available)
   - Go to /login
   - Select "Park Operator" role
   - Enter your credentials
   - Try validation again
   ```

2. **Check Your Login Status**
   - After login, check if you can access `/operator/dashboard`
   - If dashboard works, authentication is fine
   - If dashboard doesn't work, you're not logged in properly

3. **Check Browser Console**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for any error messages
   - Go to Network tab
   - Try validating a ticket
   - Check the `/api/tickets/validate` request
   - Look at Request Headers - should include `Cookie` header

4. **Verify Database Records**
   - Make sure you have a record in `park_operators` table
   - Your `park_operators.user_id` should match your `auth.users.id`
   - Your `park_operators.is_active` should be `true`

## Still Having Issues?

### Check Server Logs
The API now logs detailed error information. Check your server console/terminal for:
- "Authentication error:" followed by error details
- "No user found in session"
- "User ID:" followed by your user ID

### Common Error Messages

1. **"Unauthorized"** - No user session found
   - Solution: Log in again

2. **"Unauthorized. Please log in and try again."** - Session expired or invalid
   - Solution: Log out and log back in

3. **"Operator not found"** - No operator record in database
   - Solution: Contact admin to create operator record

4. **"Operator record not found. Please contact your administrator."** - Operator record missing or inactive
   - Solution: Contact admin to verify your operator account

## Technical Details

### How Authentication Works

1. **Login:** User logs in via `/login` page
   - Supabase Auth creates session
   - Session stored in cookies (sb-* cookies)

2. **API Call:** Client calls `/api/tickets/validate`
   - Browser automatically sends cookies with request
   - API route reads cookies using `cookies()` from `next/headers`
   - Supabase client verifies session using cookies
   - If session valid, returns user
   - If session invalid/expired, returns error

3. **Authorization:** After authentication
   - API uses service role key to query `park_operators` table
   - Finds operator record by `user_id`
   - Verifies operator is active
   - Continues with validation

### Cookie Names to Check

Supabase stores session in cookies like:
- `sb-<project-ref>-auth-token`
- `sb-<project-ref>-auth-token-code-verifier`

These should be present in browser cookies when logged in.

## Testing Authentication

You can test if authentication is working by:

1. **Check Cookies:**
   - Open browser DevTools
   - Go to Application/Storage tab
   - Check Cookies for your domain
   - Should see Supabase auth cookies

2. **Check Network Request:**
   - Open Network tab in DevTools
   - Try validating a ticket
   - Click on `/api/tickets/validate` request
   - Check Request Headers
   - Should see `Cookie:` header with Supabase cookies

3. **Check Response:**
   - If unauthorized, response should be `401`
   - Response body should have error message

## Need More Help?

If you've tried all the above and still getting errors:
1. Check server logs for detailed error messages
2. Verify you're logged in by checking `/operator/dashboard` works
3. Verify your operator record exists in database
4. Try logging out completely and logging back in
5. Clear all cookies and try again

