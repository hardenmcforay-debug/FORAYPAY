# Public Assets Folder

This folder contains static assets that are served directly by Next.js.

## Logo Setup - Two Options

### Option 1: Supabase Storage (Recommended) ✅

**This is the recommended approach** - Upload your logo to Supabase Storage:

1. **Go to Supabase Dashboard**
   - Navigate to **Storage** → `landing-images` bucket
   - Create a folder named `logo` (if it doesn't exist)
   - Upload your logo file as `logo.png` in the `logo` folder
   - Path should be: `landing-images/logo/logo.png`

2. **The logo will automatically appear** in:
   - Navigation bar (landing page)
   - Sidebar (platform/company/operator dashboards)

**Advantages:**
- ✅ Centralized asset management
- ✅ Works across all environments
- ✅ Easy to update without redeploying
- ✅ Already configured in your project

### Option 2: Public Folder (Fallback)

If Supabase storage is not available, you can use the public folder:

1. **Place your logo file** in this `public` folder:
   - File name: `logo.png` (or `logo.svg`, `logo.jpg`, `logo.webp`)

2. **Recommended specifications:**
   - Format: PNG with transparent background
   - Size: Square format (e.g., 512x512px or 1024x1024px)
   - File size: Under 500KB for best performance

## File Structure

```
public/
  ├── logo.png          ← Fallback logo (if not using Supabase)
  └── README.md         ← This file
```

## How It Works

The application will:
1. **First try** to load the logo from Supabase Storage (`landing-images/logo/logo.png`)
2. **Fallback** to the public folder (`/logo.png`) if Supabase is unavailable
3. **Show the Ticket icon** if both fail

## Troubleshooting

If the logo doesn't appear:
1. **For Supabase Storage:**
   - Verify the file path: `landing-images/logo/logo.png`
   - Check that the bucket is public
   - Ensure the file uploaded successfully
   
2. **For Public Folder:**
   - Make sure the file is named exactly `logo.png`
   - Check the browser console for error messages
   - Ensure the file is in the `public` folder (not in a subfolder)
   - Restart your Next.js development server after adding the file

