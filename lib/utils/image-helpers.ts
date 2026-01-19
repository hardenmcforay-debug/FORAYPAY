/**
 * Validates if a Supabase storage URL is properly formatted
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }
  
  const trimmed = url.trim()
  if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
    return false
  }
  
  // Check if it's a valid URL
  try {
    const urlObj = new URL(trimmed)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Adds cache-busting query parameter to force image reload
 */
export function addCacheBuster(url: string): string {
  if (!url || !isValidImageUrl(url)) {
    return url
  }
  
  try {
    const urlObj = new URL(url)
    // Add timestamp to force reload
    urlObj.searchParams.set('t', Date.now().toString())
    // Add a random parameter to ensure uniqueness
    urlObj.searchParams.set('v', Math.random().toString(36).substring(7))
    return urlObj.toString()
  } catch {
    // If URL parsing fails, return original
    return url
  }
}

/**
 * Gets a public URL from Supabase storage with validation
 * @param addCacheBust - Whether to add cache-busting parameters (default: true in development)
 */
export function getValidImageUrl(
  supabase: any,
  bucket: string,
  path: string,
  addCacheBust: boolean = process.env.NODE_ENV === 'development'
): string | null {
  try {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)
    
    if (data?.publicUrl && isValidImageUrl(data.publicUrl)) {
      // Add cache-busting in development or if explicitly requested
      return addCacheBust ? addCacheBuster(data.publicUrl) : data.publicUrl
    }
    
    return null
  } catch (error) {
    console.error('Error getting image URL:', error)
    return null
  }
}

