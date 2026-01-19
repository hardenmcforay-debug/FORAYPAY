# Upload Foraypay Logos

## Two Logo System

The system now supports **two separate logos**:

1. **Navigation Bar Logo** - Small logo displayed in the navigation bar
   - File: `nav-logo.png` or `logo.png` (fallback)
   - Path: `landing-images/logo/nav-logo.png`

2. **Hero Section Logo** - Large logo displayed in the hero section
   - File: `foraypay-logo.png`
   - Path: `landing-images/logo/foraypay-logo.png`

## Quick Upload Instructions

### Navigation Bar Logo

To deploy your navigation bar logo:

### Step 1: Prepare Your Navigation Logo
- File name: `nav-logo.png` (or `logo.png` as fallback)
- Format: PNG (with transparent background preferred)
- Recommended size: 200x200px or 300x100px (square or horizontal)
- File size: Under 500KB for best performance
- **Note:** This logo appears small in the navigation bar, so keep it simple and clear

### Step 2: Upload Navigation Logo to Supabase Storage

1. **Go to Supabase Dashboard**
   - Open your Supabase project dashboard
   - Navigate to **Storage** in the left sidebar

2. **Access the Bucket**
   - Click on the `landing-images` bucket
   - If the bucket doesn't exist, you'll need to create it first (see database/storage/create-landing-images-bucket.sql)

3. **Create Logo Folder (if needed)**
   - Click **"New folder"** 
   - Name it: `logo`
   - Click **"Create folder"**

4. **Upload Navigation Logo**
   - Navigate into the `logo` folder
   - Click **"Upload file"**
   - Select your `nav-logo.png` file
   - Click **"Upload"**

5. **Verify Navigation Logo Path**
   - The file should be at: `landing-images/logo/nav-logo.png`
   - Or use `logo.png` as a fallback

---

### Hero Section Logo

To deploy your hero section logo:

### Step 1: Prepare Your Hero Logo
- File name: `foraypay-logo.png`
- Format: PNG (with transparent background preferred)
- Recommended size: 1200x600px or similar aspect ratio (2:1)
- File size: Under 2MB for best performance
- **Note:** This is the large logo that appears prominently in the hero section

### Step 2: Upload Hero Logo to Supabase Storage

1. **Go to Supabase Dashboard**
   - Open your Supabase project dashboard
   - Navigate to **Storage** in the left sidebar

2. **Access the Bucket**
   - Click on the `landing-images` bucket
   - Navigate into the `logo` folder (create it if needed)

3. **Upload Hero Logo**
   - Click **"Upload file"** in the `logo` folder
   - Select your `foraypay-logo.png` file
   - Click **"Upload"**

4. **Verify Hero Logo Path**
   - The file should be at: `landing-images/logo/foraypay-logo.png`
   - Make sure the bucket is set to **Public** (images need to be publicly accessible)

### Step 3: Verify It Works

1. **Refresh your landing page** - The logo should appear automatically
2. **Check browser console** (F12) for any error messages
3. **Test on different screen sizes** to ensure it displays properly

## File Structure in Supabase

```
landing-images/
  └── logo/
      ├── nav-logo.png        ← Navigation bar logo (small)
      └── foraypay-logo.png   ← Hero section logo (large)
```

**Note:** If `nav-logo.png` is not found, the system will try `logo.png` as a fallback.

## Troubleshooting

If the logos don't appear:

1. **Check the file paths:**
   - Navigation logo: `logo/nav-logo.png` (or `logo/logo.png` as fallback)
   - Hero logo: `logo/foraypay-logo.png`
   - Case-sensitive - make sure filenames are lowercase

2. **Verify bucket is public:**
   - Go to Storage → `landing-images` bucket
   - Check that it's marked as "Public"

3. **Check file permissions:**
   - The file should be publicly readable
   - No authentication required for viewing

4. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or clear browser cache

5. **Check browser console:**
   - Open Developer Tools (F12)
   - Look for any error messages about image loading

6. **Verify the URLs:**
   - Navigation logo URL: `https://[your-project].supabase.co/storage/v1/object/public/landing-images/logo/nav-logo.png`
   - Hero logo URL: `https://[your-project].supabase.co/storage/v1/object/public/landing-images/logo/foraypay-logo.png`

## Alternative: Upload via Code

If you prefer to upload programmatically:

```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// Get file from input
const fileInput = document.querySelector('input[type="file"]')
const file = fileInput.files[0]

// Upload logo
const { data, error } = await supabase.storage
  .from('landing-images')
  .upload('logo/foraypay-logo.png', file, {
    cacheControl: '3600',
    upsert: true // Replace if exists
  })

if (error) {
  console.error('Upload error:', error)
} else {
  console.log('Logo uploaded successfully!')
}
```

## Notes

- Both logos will automatically scale responsively on all screen sizes
- They're optimized using Next.js Image component for performance
- The components have fallback support - if images fail to load, they show icon/text-based fallbacks
- Navigation logo appears in the top navigation bar
- Hero logo appears prominently in the hero section above the main heading
- You can use the same image for both, or different images optimized for each location

