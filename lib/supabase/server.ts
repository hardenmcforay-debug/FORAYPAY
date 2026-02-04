import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const createServerSupabaseClient = () => {
  // Validate environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const error = new Error(
      'NEXT_PUBLIC_SUPABASE_URL is not set. Please configure it in your Vercel environment variables. See VERCEL_ENV_SETUP.md for instructions.'
    )
    console.error(error.message)
    throw error
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const error = new Error(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Please configure it in your Vercel environment variables. See VERCEL_ENV_SETUP.md for instructions.'
    )
    console.error(error.message)
    throw error
  }

  try {
    // In Next.js 16, cookies() is synchronous and returns ReadonlyRequestCookies
    // createServerComponentClient expects a cookies function that returns Promise<ReadonlyRequestCookies>
    // We wrap it to return a Promise for compatibility
    return createServerComponentClient({ 
      cookies: async () => cookies()
    })
  } catch (error: any) {
    console.error('Failed to create Supabase server client:', error)
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    })
    const errorMessage = error?.message || 'Unknown error'
    throw new Error(`Failed to initialize Supabase client: ${errorMessage}. Please check your environment variables in Vercel.`)
  }
}

