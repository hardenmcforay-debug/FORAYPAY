import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createServerSupabaseClient()

    // Verify user is a park operator
    const { data: operator } = await supabase
      .from('park_operators')
      .select('id, company_id, assigned_routes, status')
      .eq('user_id', user.id)
      .single()

    if (!operator) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get company details
    let company: any = null
    if (operator.company_id) {
      const { data: companyData } = await supabase
        .from('companies')
        .select('status, name, monime_account_id')
        .eq('id', operator.company_id)
        .single()

      if (!companyData) {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 })
      }

      company = companyData

      if (company.status === 'suspended') {
        return NextResponse.json(
          { error: `Your company account "${company.name}" has been suspended. You cannot generate tickets.` },
          { status: 403 }
        )
      }

      if (!company.monime_account_id) {
        return NextResponse.json(
          { error: 'MoniMe account not configured for your company. Please contact your administrator.' },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json({ error: 'No company assigned' }, { status: 400 })
    }

    // Check if operator is suspended
    if (operator.status === 'suspended') {
      return NextResponse.json(
        { error: 'Your operator account has been suspended. You cannot generate tickets.' },
        { status: 403 }
      )
    }

    const { route_id, amount, quantity = 1 } = await request.json()

    if (!route_id || !amount) {
      return NextResponse.json(
        { error: 'Route ID and amount are required' },
        { status: 400 }
      )
    }

    // CRITICAL: Ensure operator has a company_id
    if (!operator.company_id) {
      return NextResponse.json({ error: 'No company assigned to operator' }, { status: 403 })
    }

    // Verify route exists and MUST belong to operator's company
    // This ensures Company A operators can NEVER generate tickets for Company B routes
    const { data: route } = await supabase
      .from('routes')
      .select('id, name, origin, destination, fare, company_id')
      .eq('id', route_id)
      .eq('company_id', operator.company_id) // CRITICAL: Filter by operator's company_id
      .eq('status', 'active')
      .single()

    if (!route) {
      return NextResponse.json({ error: 'Route not found or does not belong to your company' }, { status: 404 })
    }

    // ADDITIONAL SECURITY: Double-check route belongs to operator's company
    if (route.company_id !== operator.company_id) {
      console.error('SECURITY ALERT: Attempted cross-company route access', {
        operator_company: operator.company_id,
        route_company: route.company_id,
        operator_id: operator.id,
        route_id: route_id,
      })
      return NextResponse.json({ error: 'Unauthorized: Route does not belong to your company' }, { status: 403 })
    }

    // Check if operator is assigned to this route
    if (operator.assigned_routes && !operator.assigned_routes.includes(route_id)) {
      return NextResponse.json(
        { error: 'You are not authorized to generate tickets for this route' },
        { status: 403 }
      )
    }

    // Request Multiple Dedicated Codes from MoniMe
    const monimeApiUrl = process.env.MONIME_API_URL || 'https://api.monime.com'
    const monimeApiKey = process.env.MONIME_API_KEY

    if (!monimeApiKey) {
      return NextResponse.json(
        { error: 'MoniMe API not configured. Please contact administrator.' },
        { status: 500 }
      )
    }

    // Call MoniMe API to request ONE reusable code
    // This code can be used multiple times (up to quantity) for the same route
    // The code expires after the full amount of tickets is used
    const totalTickets = parseInt(quantity) || 1
    
    const monimeResponse = await fetch(`${monimeApiUrl}/api/v1/codes/dedicated`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${monimeApiKey}`,
      },
      body: JSON.stringify({
        account_id: company.monime_account_id,
        amount: parseFloat(amount),
        quantity: 1, // Always request 1 code (reusable)
        metadata: {
          route_id: route_id,
          company_id: operator.company_id,
          operator_id: operator.id,
          total_tickets: totalTickets, // Track how many times this code can be used
        },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/monime`,
      }),
    })

    if (!monimeResponse.ok) {
      const errorData = await monimeResponse.json().catch(() => ({}))
      console.error('MoniMe API error:', errorData)
      return NextResponse.json(
        { error: errorData.message || 'Failed to request code from MoniMe' },
        { status: monimeResponse.status }
      )
    }

    const monimeData = await monimeResponse.json()
    
    // Get the single code from MoniMe response
    const code = monimeData.code || (monimeData.codes && monimeData.codes[0])
    
    if (!code) {
      return NextResponse.json(
        { error: 'No code received from MoniMe' },
        { status: 500 }
      )
    }

    // Store the payment code with usage tracking
    const { data: paymentCode, error: codeError } = await supabase
      .from('payment_codes')
      .insert({
        company_id: operator.company_id,
        route_id: route_id,
        operator_id: operator.id,
        monime_code: code,
        total_tickets: totalTickets,
        used_tickets: 0,
        status: 'active',
      })
      .select()
      .single()

    if (codeError) {
      console.error('Error storing payment code:', codeError)
      return NextResponse.json(
        { error: 'Failed to store payment code' },
        { status: 500 }
      )
    }

    // Create audit log for code request
    await supabase.from('audit_logs').insert({
      company_id: operator.company_id,
      user_id: user.id,
      action: 'code_requested',
      details: {
        route_id: route_id,
        amount: amount,
        total_tickets: totalTickets,
        payment_code_id: paymentCode.id,
        monime_code: code,
      },
    })

    return NextResponse.json({
      success: true,
      code: code,
      total_tickets: totalTickets,
      used_tickets: 0,
      message: `Code generated successfully. This code can be used ${totalTickets} time(s) for ticket payments.`,
      route: {
        name: route.name,
        origin: route.origin,
        destination: route.destination,
        fare: route.fare,
      },
    })
  } catch (error: any) {
    console.error('Error requesting codes:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

