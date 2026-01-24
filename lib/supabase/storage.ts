/**
 * Get public URL for an image stored in Supabase Storage
 * @param bucketName - The storage bucket name (e.g., 'images')
 * @param filePath - The path to the file in the bucket (e.g., 'signin-image.png')
 * @returns The public URL for the image
 */
export function getSupabaseImageUrl(bucketName: string, filePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined')
  }
  
  // Remove trailing slash if present
  const baseUrl = supabaseUrl.replace(/\/$/, '')
  
  // Supabase storage public URL format: {supabaseUrl}/storage/v1/object/public/{bucket}/{filePath}
  return `${baseUrl}/storage/v1/object/public/${bucketName}/${filePath}`
}

/**
 * Get public URL for images stored in the 'images' bucket
 * @param filePath - The path to the file (e.g., 'signin-image.png')
 * @returns The public URL for the image
 */
export function getImageUrl(filePath: string): string {
  return getSupabaseImageUrl('images', filePath)
}

