# Supabase Storage Setup Guide for Images

This guide will walk you through setting up Supabase Storage to host images for the ForayPay application.

## Prerequisites

- A Supabase account and project
- Access to your Supabase dashboard
- Images ready to upload (`logo.png` and `signin-image.png`)

## Step 1: Access Supabase Storage

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign in to your account
3. Select your ForayPay project
4. In the left sidebar, click on **Storage**

## Step 2: Create a Storage Bucket

1. Click the **"New bucket"** button (or **"Create bucket"**)
2. Enter the bucket name: `images`
   - **Important:** The bucket name must be exactly `images` (lowercase, no spaces)
3. Set the bucket to **Public**:
   - Toggle the **"Public bucket"** switch to ON
   - This allows images to be accessed without authentication
4. Click **"Create bucket"** or **"Save"**

## Step 3: Upload Images

### Upload logo.png

1. Click on the `images` bucket you just created
2. Click the **"Upload file"** button (or drag and drop)
3. Select your `logo.png` file
4. Wait for the upload to complete
5. Verify the file appears in the bucket

### Upload signin-image.png

1. While still in the `images` bucket
2. Click **"Upload file"** again
3. Select your `signin-image.png` file
4. Wait for the upload to complete
5. Verify both files are now in the bucket

## Step 4: Verify Public Access

1. Click on one of the uploaded images (e.g., `logo.png`)
2. You should see a **Public URL** or **URL** field
3. Copy the URL - it should look like:
   ```
   https://[your-project-ref].supabase.co/storage/v1/object/public/images/logo.png
   ```
4. Open this URL in a new browser tab to verify the image loads
5. Repeat for `signin-image.png`

## Step 5: Verify Environment Variables

Make sure your `.env.local` file contains:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**To find these values:**
1. Go to your Supabase project dashboard
2. Click on **Settings** (gear icon) → **API**
3. Copy the **Project URL** → This is `NEXT_PUBLIC_SUPABASE_URL`
4. Copy the **anon public** key → This is `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Copy the **service_role** key → This is `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

## Step 6: Test the Application

1. Restart your Next.js development server:
   ```bash
   npm run dev
   ```
   or
   ```bash
   yarn dev
   ```

2. Navigate to the login page: `http://localhost:3000/login`

3. Verify that:
   - The logo appears in the header/navigation
   - The sign-in image appears on the left side (on large screens)
   - Images load correctly without errors

## Step 7: Troubleshooting

### Images not loading?

1. **Check browser console** for errors:
   - Open Developer Tools (F12)
   - Check the Console tab for any error messages

2. **Verify bucket is public:**
   - Go to Storage → `images` bucket
   - Check that "Public bucket" toggle is ON

3. **Verify file names match:**
   - Files in Supabase should be: `logo.png` and `signin-image.png`
   - Check for typos or case sensitivity issues

4. **Check Next.js image configuration:**
   - Verify `next.config.js` includes your Supabase domain
   - The config should automatically add your Supabase URL to allowed image domains

5. **Verify environment variables:**
   - Make sure `.env.local` has the correct `NEXT_PUBLIC_SUPABASE_URL`
   - Restart the dev server after changing environment variables

### Getting 403 Forbidden errors?

- The bucket might not be public
- Go to Storage → `images` bucket → Settings
- Enable "Public bucket" toggle

### Getting 404 Not Found errors?

- Verify the file names match exactly (case-sensitive)
- Check that files are uploaded to the `images` bucket (not a different bucket)
- Verify the bucket name is exactly `images` (lowercase)

## Step 8: Add More Images (Optional)

To add more images in the future:

1. Go to Storage → `images` bucket
2. Click "Upload file"
3. Upload your image file
4. Use `getImageUrl('your-image.png')` in your code

Example:
```tsx
import { getImageUrl } from '@/lib/supabase/storage'

<Image 
  src={getImageUrl('your-image.png')} 
  alt="Description" 
  width={300} 
  height={400} 
/>
```

## Additional Storage Buckets

If you need different buckets for different purposes, you can use:

```tsx
import { getSupabaseImageUrl } from '@/lib/supabase/storage'

// For a different bucket
const url = getSupabaseImageUrl('avatars', 'user-123.png')
```

## Security Notes

- **Public buckets** are accessible to anyone with the URL
- For sensitive images, create **private buckets** and use signed URLs
- Never commit `.env.local` to version control
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret and never expose it in client-side code

## Summary Checklist

- [ ] Created `images` bucket in Supabase Storage
- [ ] Made the bucket public
- [ ] Uploaded `logo.png` to the bucket
- [ ] Uploaded `signin-image.png` to the bucket
- [ ] Verified images are accessible via public URLs
- [ ] Verified `.env.local` has correct Supabase credentials
- [ ] Restarted Next.js dev server
- [ ] Tested login page - images load correctly
- [ ] Checked browser console for errors

## Need Help?

If you encounter issues:
1. Check the Supabase Storage documentation: [https://supabase.com/docs/guides/storage](https://supabase.com/docs/guides/storage)
2. Verify your Supabase project is active and not paused
3. Check that your Next.js app can connect to Supabase (test other Supabase features)

