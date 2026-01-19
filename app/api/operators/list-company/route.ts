import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!userData?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    let operators: any[] | null = null
    let error: any = null

    if (supabaseServiceKey) {
      const supabaseAdmin = createServiceClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })

      const { data: operatorsData, error: operatorsError } = await supabaseAdmin
        .from('park_operators')
        .select(`
          *,
          users!inner(full_name, email),
          routes(name, origin, destination)
        `)
        .eq('company_id', userData.company_id)
        .order('created_at', { ascending: false })

      operators = operatorsData
      error = operatorsError
    } else {
      const { data: operatorsData, error: operatorsError } = await supabase
        .from('park_operators')
        .select(`
          *,
          users!inner(full_name, email),
          routes(name, origin, destination)
        `)
        .eq('company_id', userData.company_id)
        .order('created_at', { ascending: false })

      operators = operatorsData
      error = operatorsError
    }

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch operators', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      operators: operators || [],
    })
  } catch (error: any) {
    console.error('Error fetching operators:', error)
    return NextResponse.json(
      { error: 'Failed to fetch operators', details: error.message },
      { status: 500 }
    )
  }
}

