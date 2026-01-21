import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

/**
 * Get routes available to the current operator
 */
export async function GET(request: NextRequest) {
  try {
    // Create Supabase client with proper cookie handling
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // Ignore - cookie setting in API routes
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              // Ignore - cookie removal in API routes
            }
          },
        },
      }
    )

    // Get current user (authentication check)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use service role key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createServiceClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get operator info
    const { data: operator, error: operatorError } = await supabaseAdmin
      .from('park_operators')
      .select('id, company_id, route_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (operatorError || !operator) {
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 404 }
      )
    }

    // Get routes - if operator has assigned route, only return that route
    // Otherwise, return all active routes for the company
    let query = supabaseAdmin
      .from('routes')
      .select('id, name, origin, destination, fare_amount')
      .eq('company_id', operator.company_id)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (operator.route_id) {
      query = query.eq('id', operator.route_id)
    }

    const { data: routes, error: routesError } = await query

    if (routesError) {
      return NextResponse.json(
        { error: 'Failed to fetch routes', details: routesError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      routes: routes || [],
    })
  } catch (error: any) {
    console.error('Error fetching operator routes:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

