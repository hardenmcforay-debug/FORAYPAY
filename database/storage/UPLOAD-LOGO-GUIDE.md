# Upload Foraypay Logo to Supabase Storage

## Quick Steps

1. **Prepare Your Logo**
   - Ensure your logo file is named: `foraypay-logo.png`
   - Recommended size: 800x400px or similar aspect ratio
   - Format: PNG with transparent background (preferred) or white background

2. **Upload to Supabase Storage**
   - Go to your Supabase Dashboard
   - Navigate to **Storage** in the left sidebar
   - Click on the `landing-images` bucket
   - Click **"New folder"** and create a folder named `logo`
   - Click **"Upload file"** in the `logo` folder
   - Select your `foraypay-logo.png` file
   - Click **"Upload"**

3. **Verify the Upload**
   - The file should be at: `landing-images/logo/foraypay-logo.png`
   - The logo will automatically appear on your landing page hero section

## Alternative: Upload via Code

If you prefer to upload programmatically, you can use this code:

```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// Upload logo
const file = // your file object from input
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

## File Path

The logo should be located at:
```
landing-images/logo/foraypay-logo.png
```

## Notes

- The logo will be displayed prominently in the hero section above the main heading
- It's optimized using Next.js Image component for better performance
- The logo is responsive and will scale appropriately on different screen sizes
- If the logo doesn't appear, check that:
  1. The file path is correct: `logo/foraypay-logo.png`
  2. The bucket is public (which it should be)
  3. The file was uploaded successfully

