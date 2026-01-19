import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's company_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.company_id) {
      return NextResponse.json(
        { error: 'No company associated with your account' },
        { status: 403 }
      )
    }

    // Get routes for the company
    const { data: routes, error: routesError } = await supabase
      .from('routes')
      .select('*')
      .eq('company_id', userData.company_id)
      .order('created_at', { ascending: false })

    if (routesError) {
      return NextResponse.json(
        { error: `Failed to fetch routes: ${routesError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      routes: routes || [],
    })
  } catch (error: any) {
    console.error('Error fetching routes:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

