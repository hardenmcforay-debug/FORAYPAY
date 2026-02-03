import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const createServerSupabaseClient = () => {
  // Validate environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL is not set. Please configure it in your environment variables.'
    )
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Please configure it in your environment variables.'
    )
  }

  try {
    return createServerComponentClient({ cookies })
  } catch (error) {
    console.error('Failed to create Supabase server client:', error)
    throw new Error('Failed to initialize Supabase client. Please check your environment variables.')
  }
}

