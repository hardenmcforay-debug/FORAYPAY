import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // SECURITY: Require authentication - only platform admins can view platform stats
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is platform admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || !userData || userData.role !== 'platform_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only platform admins can view platform stats' },
        { status: 403 }
      )
    }

    // Get total companies
    const { count: companyCount } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })

    // Get active companies
    const { count: activeCompanyCount } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Get total transactions (all time)
    const { data: allTransactions } = await supabase
      .from('transactions')
      .select('amount, commission_amount')
      .eq('status', 'completed')

    const totalRevenue = allTransactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0

    // Get total transactions (last 30 days) for commission calculations
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, commission_amount')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .eq('status', 'completed')

    const totalCommission = transactions?.reduce((sum, t) => sum + (t.commission_amount || 0), 0) || 0

    // Get total tickets (last 30 days)
    const { count: ticketCount } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())

    // Get tickets per company (last 30 days)
    const { data: companyTickets } = await supabase
      .from('tickets')
      .select(`
        company_id,
        companies!inner(name)
      `)
      .gte('created_at', thirtyDaysAgo.toISOString())

    // Calculate tickets per company
    const ticketsByCompany = companyTickets?.reduce((acc: any, ticket: any) => {
      const companyId = ticket.company_id
      const companyName = ticket.companies?.name || 'Unknown'
      if (!acc[companyId]) {
        acc[companyId] = {
          name: companyName,
          ticketCount: 0,
        }
      }
      acc[companyId].ticketCount += 1
      return acc
    }, {}) || {}

    const ticketsByCompanyList = Object.values(ticketsByCompany).map((company: any) => ({
      name: company.name,
      ticketCount: company.ticketCount,
    })).sort((a: any, b: any) => b.ticketCount - a.ticketCount)

    // Get commission per company (last 30 days)
    const { data: companyTransactions } = await supabase
      .from('transactions')
      .select(`
        commission_amount,
        company_id,
        companies!inner(name)
      `)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .eq('status', 'completed')

    // Calculate commission per company
    const commissionByCompany = companyTransactions?.reduce((acc: any, t: any) => {
      const companyId = t.company_id
      const companyName = t.companies?.name || 'Unknown'
      if (!acc[companyId]) {
        acc[companyId] = {
          name: companyName,
          totalCommission: 0,
        }
      }
      acc[companyId].totalCommission += t.commission_amount || 0
      return acc
    }, {}) || {}

    const commissionByCompanyList = Object.values(commissionByCompany).map((company: any) => ({
      name: company.name,
      totalCommission: company.totalCommission,
    })).sort((a: any, b: any) => b.totalCommission - a.totalCommission)

    return NextResponse.json({
      stats: {
        companyCount: companyCount || 0,
        activeCompanyCount: activeCompanyCount || 0,
        totalRevenue,
        totalCommission,
        ticketCount: ticketCount || 0,
      },
      ticketsByCompany: ticketsByCompanyList,
      commissionByCompany: commissionByCompanyList,
    })
  } catch (error: any) {
    console.error('Error fetching platform stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}

