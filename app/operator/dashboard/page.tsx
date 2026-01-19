import Layout from '@/components/layout/Layout'
import Card from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Ticket } from 'lucide-react'
import RealtimeDashboard from '@/components/operator/RealtimeDashboard'

export default async function OperatorDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get operator info using service role key to bypass RLS
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  let operator: any = null
  let operatorError: any = null

  if (supabaseServiceKey) {
    const supabaseAdmin = createServiceClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: operatorData, error: error } = await supabaseAdmin
      .from('park_operators')
      .select(`
        id,
        company_id,
        route_id,
        routes:route_id(name, origin, destination),
        companies:company_id(name)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    operator = operatorData
    operatorError = error
  } else {
    // Fallback to regular client if service key not available
    const { data: operatorData, error: error } = await supabase
      .from('park_operators')
      .select(`
        id,
        company_id,
        route_id,
        routes:route_id(name, origin, destination),
        companies:company_id(name)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    operator = operatorData
    operatorError = error
  }

  if (operatorError || !operator) {
    return (
      <Layout role="park_operator">
        <div className="space-y-6">
          <Card>
            <div className="text-center py-12">
              <div className="mb-4">
                <Ticket className="h-16 w-16 text-gray-400 mx-auto" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Operator Account Not Found</h2>
              <p className="text-gray-600 mb-4">
                Your user account exists, but no park operator record was found.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Please contact your company administrator to set up your operator account.
              </p>
              {operatorError && (
                <div className="mt-4 p-3 bg-error-50 border border-error-200 rounded-lg text-error-700 text-sm max-w-md mx-auto">
                  <p className="font-semibold">Error Details:</p>
                  <p>{operatorError.message}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </Layout>
    )
  }

  // Get today's validations using service role key
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let todayValidations: number | null = null
  let weekValidations: number | null = null
  let monthValidations: number | null = null

  if (supabaseServiceKey) {
    const supabaseAdmin = createServiceClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { count: todayCount } = await supabaseAdmin
      .from('validations')
      .select('*', { count: 'exact', head: true })
      .eq('park_operator_id', operator.id)
      .eq('is_valid', true)
      .gte('validated_at', today.toISOString())

    // Get this week's validations
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const { count: weekCount } = await supabaseAdmin
      .from('validations')
      .select('*', { count: 'exact', head: true })
      .eq('park_operator_id', operator.id)
      .eq('is_valid', true)
      .gte('validated_at', weekAgo.toISOString())

    // Get this month's validations
    const monthAgo = new Date()
    monthAgo.setDate(1)
    monthAgo.setHours(0, 0, 0, 0)

    const { count: monthCount } = await supabaseAdmin
      .from('validations')
      .select('*', { count: 'exact', head: true })
      .eq('park_operator_id', operator.id)
      .eq('is_valid', true)
      .gte('validated_at', monthAgo.toISOString())

    todayValidations = todayCount
    weekValidations = weekCount
    monthValidations = monthCount
  } else {
    // Fallback to regular client
    const { count: todayCount } = await supabase
      .from('validations')
      .select('*', { count: 'exact', head: true })
      .eq('park_operator_id', operator.id)
      .eq('is_valid', true)
      .gte('validated_at', today.toISOString())

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const { count: weekCount } = await supabase
      .from('validations')
      .select('*', { count: 'exact', head: true })
      .eq('park_operator_id', operator.id)
      .eq('is_valid', true)
      .gte('validated_at', weekAgo.toISOString())

    // Get this month's validations
    const monthAgo = new Date()
    monthAgo.setDate(1)
    monthAgo.setHours(0, 0, 0, 0)

    const { count: monthCount } = await supabase
      .from('validations')
      .select('*', { count: 'exact', head: true })
      .eq('park_operator_id', operator.id)
      .eq('is_valid', true)
      .gte('validated_at', monthAgo.toISOString())

    todayValidations = todayCount
    weekValidations = weekCount
    monthValidations = monthCount
  }

  // Get generated tickets statistics
  let totalGeneratedTickets = 0
  let pendingGeneratedTickets = 0
  let usedGeneratedTickets = 0
  let todayGeneratedTickets = 0
  let weekGeneratedTickets = 0
  let monthGeneratedTickets = 0

  if (supabaseServiceKey) {
    const supabaseAdmin = createServiceClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get all pre-generated tickets (with PRE- prefix)
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    // Week's generated tickets (last 7 days)
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)

    // Month's generated tickets (from start of current month)
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    // Total pre-generated tickets
    const { count: totalGenerated } = await supabaseAdmin
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', operator.company_id)
      .like('monime_transaction_id', 'PRE-%')
    
    if (operator.route_id) {
      // Filter by route if operator has assigned route
      const { count: totalGeneratedWithRoute } = await supabaseAdmin
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', operator.company_id)
        .eq('route_id', operator.route_id)
        .like('monime_transaction_id', 'PRE-%')
      totalGeneratedTickets = totalGeneratedWithRoute || 0
    } else {
      totalGeneratedTickets = totalGenerated || 0
    }

    // Pending pre-generated tickets
    const { count: pendingGenerated } = await supabaseAdmin
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', operator.company_id)
      .eq('status', 'pending')
      .like('monime_transaction_id', 'PRE-%')
    
    if (operator.route_id) {
      const { count: pendingGeneratedWithRoute } = await supabaseAdmin
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', operator.company_id)
        .eq('route_id', operator.route_id)
        .eq('status', 'pending')
        .like('monime_transaction_id', 'PRE-%')
      pendingGeneratedTickets = pendingGeneratedWithRoute || 0
    } else {
      pendingGeneratedTickets = pendingGenerated || 0
    }

    // Used pre-generated tickets
    const { count: usedGenerated } = await supabaseAdmin
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', operator.company_id)
      .eq('status', 'used')
      .like('monime_transaction_id', 'PRE-%')
    
    if (operator.route_id) {
      const { count: usedGeneratedWithRoute } = await supabaseAdmin
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', operator.company_id)
        .eq('route_id', operator.route_id)
        .eq('status', 'used')
        .like('monime_transaction_id', 'PRE-%')
      usedGeneratedTickets = usedGeneratedWithRoute || 0
    } else {
      usedGeneratedTickets = usedGenerated || 0
    }

    // Today's generated tickets
    const { count: todayGenerated } = await supabaseAdmin
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', operator.company_id)
      .like('monime_transaction_id', 'PRE-%')
      .gte('created_at', todayStart.toISOString())
    
    if (operator.route_id) {
      const { count: todayGeneratedWithRoute } = await supabaseAdmin
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', operator.company_id)
        .eq('route_id', operator.route_id)
        .like('monime_transaction_id', 'PRE-%')
        .gte('created_at', todayStart.toISOString())
      todayGeneratedTickets = todayGeneratedWithRoute || 0
    } else {
      todayGeneratedTickets = todayGenerated || 0
    }

    // This week's generated tickets
    const { count: weekGenerated } = await supabaseAdmin
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', operator.company_id)
      .like('monime_transaction_id', 'PRE-%')
      .gte('created_at', weekStart.toISOString())
    
    if (operator.route_id) {
      const { count: weekGeneratedWithRoute } = await supabaseAdmin
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', operator.company_id)
        .eq('route_id', operator.route_id)
        .like('monime_transaction_id', 'PRE-%')
        .gte('created_at', weekStart.toISOString())
      weekGeneratedTickets = weekGeneratedWithRoute || 0
    } else {
      weekGeneratedTickets = weekGenerated || 0
    }

    // This month's generated tickets
    const { count: monthGenerated } = await supabaseAdmin
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', operator.company_id)
      .like('monime_transaction_id', 'PRE-%')
      .gte('created_at', monthStart.toISOString())
    
    if (operator.route_id) {
      const { count: monthGeneratedWithRoute } = await supabaseAdmin
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', operator.company_id)
        .eq('route_id', operator.route_id)
        .like('monime_transaction_id', 'PRE-%')
        .gte('created_at', monthStart.toISOString())
      monthGeneratedTickets = monthGeneratedWithRoute || 0
    } else {
      monthGeneratedTickets = monthGenerated || 0
    }
  }

  const stats = [
    {
      title: 'Today\'s Validations',
      value: todayValidations || 0,
      icon: CheckCircle,
      color: 'text-success-600',
      bgColor: 'bg-success-50',
    },
    {
      title: 'This Week\'s Validations',
      value: weekValidations || 0,
      icon: TrendingUp,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: 'This Month\'s Validations',
      value: monthValidations || 0,
      icon: TrendingUp,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: 'Today\'s Generated Tickets',
      value: todayGeneratedTickets,
      icon: Ticket,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: 'This Week\'s Generated Tickets',
      value: weekGeneratedTickets,
      icon: Ticket,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: 'This Month\'s Generated Tickets',
      value: monthGeneratedTickets,
      icon: Ticket,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: 'Pending Generated Tickets',
      value: pendingGeneratedTickets,
      icon: Clock,
      color: 'text-warning-600',
      bgColor: 'bg-warning-50',
    },
  ]

  // Handle route display safely
  const routeInfo = operator.routes && typeof operator.routes === 'object' && !Array.isArray(operator.routes)
    ? operator.routes as { name?: string; origin?: string; destination?: string }
    : null

  // Handle company display safely
  const companyInfo = operator.companies && typeof operator.companies === 'object' && !Array.isArray(operator.companies)
    ? operator.companies as { name?: string }
    : null

  const initialStats = {
    todayValidations: todayValidations || 0,
    weekValidations: weekValidations || 0,
    monthValidations: monthValidations || 0,
    todayGeneratedTickets,
    weekGeneratedTickets,
    monthGeneratedTickets,
    pendingGeneratedTickets,
    totalGeneratedTickets,
    usedGeneratedTickets,
  }

  return (
    <Layout role="park_operator">
      <RealtimeDashboard initialOperator={operator} initialStats={initialStats} />
    </Layout>
  )
}

