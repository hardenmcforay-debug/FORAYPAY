-- Create storage bucket for landing page images
-- This bucket will store images used on the website landing page

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'landing-images',
  'landing-images',
  true, -- Public bucket so images can be accessed without authentication
  5242880, -- 5MB file size limit (adjust as needed)
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security on the bucket
-- Note: RLS is automatically enabled on storage.objects, but we need policies

-- Policy: Allow public read access to all images
CREATE POLICY "Public Access: Anyone can view landing page images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'landing-images');

-- Policy: Allow authenticated users to upload images (platform admins only)
-- This requires checking if the user is a platform admin
CREATE POLICY "Platform Admins: Can upload landing page images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'landing-images' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'platform_admin'
  )
);

-- Policy: Allow platform admins to update images
CREATE POLICY "Platform Admins: Can update landing page images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'landing-images' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'platform_admin'
  )
);

-- Policy: Allow platform admins to delete images
CREATE POLICY "Platform Admins: Can delete landing page images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'landing-images' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'platform_admin'
  )
);

-- Verify the bucket was created
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id = 'landing-images';

