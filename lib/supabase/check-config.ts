/**
 * Check if Supabase is properly configured
 * Returns error message if not configured, null if OK
 */
export function checkSupabaseConfig(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url) {
    return 'NEXT_PUBLIC_SUPABASE_URL is not set in environment variables'
  }

  if (!key) {
    return 'NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in environment variables'
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'NEXT_PUBLIC_SUPABASE_URL must be a valid HTTP/HTTPS URL'
  }

  return null
}

