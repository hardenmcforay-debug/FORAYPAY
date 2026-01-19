# How to Update Navigation Bar Logo

## Quick Steps

### 1. Upload New Logo to Supabase

1. **Go to Supabase Dashboard**
   - Navigate to **Storage** → `landing-images` bucket
   - Go to the `logo` folder

2. **Upload Your New Logo**
   - **Option A:** Upload as `nav-logo.png` (recommended)
   - **Option B:** Upload as `logo.png` (fallback)
   - **Important:** If a file with the same name exists, delete it first, then upload the new one
   - Or use "Replace" option if available

3. **Verify Upload**
   - Make sure the file is in: `landing-images/logo/nav-logo.png` or `logo/logo.png`
   - Check that the bucket is **Public**

### 2. Force Browser Refresh

After uploading, you need to force the browser to reload:

**Method 1: Hard Refresh (Recommended)**
- **Windows/Linux:** Press `Ctrl + Shift + R` or `Ctrl + F5`
- **Mac:** Press `Cmd + Shift + R`
- This clears the cache and reloads the page

**Method 2: Clear Browser Cache**
- Open Developer Tools (F12)
- Right-click the refresh button
- Select "Empty Cache and Hard Reload"

**Method 3: Incognito/Private Mode**
- Open the site in an incognito/private window
- This bypasses cache completely

### 3. Verify It Worked

1. **Check Browser Console (F12)**
   - Look for: "Nav logo URL updated: [url]"
   - Or: "Nav logo loaded successfully: [url]"
   - The URL should have query parameters like `?t=1234567890&v=abc123`

2. **Check Network Tab**
   - Open DevTools → Network tab
   - Filter by "Img"
   - Refresh the page
   - Find the logo image request
   - Check the URL - it should have cache-busting parameters
   - Status should be 200 (success)

## Troubleshooting

### Image Still Not Updating?

1. **Verify File Name**
   - Must be exactly: `nav-logo.png` or `logo.png`
   - Case-sensitive - lowercase only
   - Check spelling carefully

2. **Check File Path in Supabase**
   - Should be: `landing-images/logo/nav-logo.png`
   - Not: `landing-images/nav-logo.png` (missing logo folder)
   - Not: `landing-images/logo/Logo.png` (wrong case)

3. **Delete Old File First**
   - If updating an existing file, delete the old one first
   - Then upload the new file
   - This ensures Supabase recognizes it as a new file

4. **Check Bucket Permissions**
   - Go to Storage → `landing-images` bucket
   - Make sure it's marked as **Public**
   - Check that public read access is enabled

5. **Test URL Directly**
   - Copy the URL from browser console
   - Paste in a new browser tab
   - Does the image load? If yes, it's a cache issue
   - If no, the file might not exist or permissions are wrong

6. **Clear All Caches**
   - Browser cache
   - Next.js cache (delete `.next` folder and restart dev server)
   - CDN cache (if using a CDN)

7. **Check Console for Errors**
   - Open DevTools → Console
   - Look for any error messages
   - Check Network tab for failed requests (404, 403, etc.)

## How Cache-Busting Works

The system automatically adds cache-busting parameters to image URLs:
- Format: `?t=1234567890&v=abc123`
- `t` = timestamp (forces reload)
- `v` = random string (ensures uniqueness)

This ensures browsers fetch the latest version of the image.

## Manual Cache-Busting

If automatic cache-busting isn't working, you can manually add parameters:

1. Get the image URL from Supabase
2. Add `?t=` + current timestamp
3. Example: `https://...supabase.co/.../nav-logo.png?t=1704123456789`

## Still Not Working?

1. **Check File Size**
   - Should be under 5MB
   - Large files might fail to upload

2. **Check File Format**
   - Must be PNG, JPG, SVG, or WebP
   - PNG with transparent background recommended

3. **Restart Development Server**
   - Stop the server (Ctrl+C)
   - Delete `.next` folder
   - Restart: `npm run dev`

4. **Check Supabase Storage Logs**
   - Go to Supabase Dashboard
   - Check Storage logs for any errors

5. **Verify Environment Variables**
   - Check that `NEXT_PUBLIC_SUPABASE_URL` is correct
   - Check that `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct

## Expected Behavior

After uploading and refreshing:
- ✅ Navigation logo should update immediately
- ✅ Console should show "Nav logo loaded successfully"
- ✅ Network tab should show 200 status for image request
- ✅ Image URL should have cache-busting parameters

If all these are true, the logo should be updated!

