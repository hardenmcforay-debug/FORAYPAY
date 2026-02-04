import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // Get tickets for this phone number
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select(`
        *,
        routes(name, origin, destination, fare),
        companies(name)
      `)
      .eq('passenger_phone', phone)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      return NextResponse.json({ error: 'Failed to retrieve tickets' }, { status: 500 })
    }

    return NextResponse.json({ tickets: tickets || [] })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

