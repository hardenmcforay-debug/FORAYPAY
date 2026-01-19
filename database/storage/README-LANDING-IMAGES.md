# Landing Page Images Storage Bucket

This SQL script creates a Supabase storage bucket for storing images used on the website landing page.

## Setup Instructions

1. **Open Supabase SQL Editor**
   - Go to your Supabase Dashboard
   - Navigate to SQL Editor
   - Click "New Query"

2. **Run the SQL Script**
   - Copy and paste the contents of `create-landing-images-bucket.sql`
   - Click "Run" to execute the script

3. **Verify Bucket Creation**
   - Go to Storage in your Supabase Dashboard
   - You should see a bucket named `landing-images`
   - The bucket should be marked as "Public"

## Bucket Configuration

- **Bucket ID**: `landing-images`
- **Public Access**: Yes (images are publicly accessible)
- **File Size Limit**: 5MB per file
- **Allowed MIME Types**:
  - image/jpeg
  - image/jpg
  - image/png
  - image/gif
  - image/webp
  - image/svg+xml

## Access Policies

### Public Read Access
- Anyone can view/download images from this bucket
- No authentication required for viewing

### Upload/Update/Delete Access
- Only platform admins can upload, update, or delete images
- Requires authentication and platform_admin role

## Usage in Your Application

### Upload Image (Platform Admin Only)

```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// Upload an image
const { data, error } = await supabase.storage
  .from('landing-images')
  .upload('hero-image.jpg', file, {
    cacheControl: '3600',
    upsert: false
  })

if (error) {
  console.error('Upload error:', error)
} else {
  console.log('Upload successful:', data)
}
```

### Get Public URL

```typescript
// Get public URL for an image
const { data } = supabase.storage
  .from('landing-images')
  .getPublicUrl('hero-image.jpg')

console.log('Public URL:', data.publicUrl)
```

### Use in Next.js Image Component

```tsx
import Image from 'next/image'

const imageUrl = supabase.storage
  .from('landing-images')
  .getPublicUrl('hero-image.jpg').data.publicUrl

<Image
  src={imageUrl}
  alt="Hero Image"
  width={1200}
  height={600}
/>
```

## File Organization Recommendations

Consider organizing files with folders:
- `hero/` - Hero section images
- `features/` - Feature section images
- `testimonials/` - Testimonial images
- `logos/` - Company/partner logos
- `banners/` - Banner images

Example:
```
landing-images/
  ├── hero/
  │   ├── hero-main.jpg
  │   └── hero-background.png
  ├── features/
  │   ├── feature-1.png
  │   └── feature-2.png
  └── logos/
      └── partner-logo.svg
```

## Notes

- Images are publicly accessible, so ensure you only upload appropriate content
- File size limit is set to 5MB - adjust in the SQL script if needed
- Only platform admins can manage images to prevent unauthorized uploads
- Consider implementing image optimization before upload for better performance

