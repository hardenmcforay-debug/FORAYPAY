import Layout from '@/components/layout/Layout'
import Card from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Ticket } from 'lucide-react'
import RealtimeTrips from '@/components/operator/RealtimeTrips'

export default async function OperatorTripsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <Layout role="park_operator">
        <div className="space-y-6">
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500">Please log in to view active trips.</p>
            </div>
          </Card>
        </div>
      </Layout>
    )
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
        location,
        routes:route_id(name, origin, destination)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    operator = operatorData
    operatorError = error
  } else {
    // Fallback to regular client
    const { data: operatorData, error: error } = await supabase
      .from('park_operators')
      .select(`
        id,
        company_id,
        route_id,
        location,
        routes:route_id(name, origin, destination)
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

  // Get today's validations count (as passenger count) using service role key
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let todayCount: number | null = null
  let recentValidations: any[] | null = null

  if (supabaseServiceKey) {
    const supabaseAdmin = createServiceClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { count: count } = await supabaseAdmin
      .from('validations')
      .select('*', { count: 'exact', head: true })
      .eq('park_operator_id', operator.id)
      .eq('is_valid', true)
      .gte('validated_at', today.toISOString())

    // Get recent validations for active trip display (exclude financial data)
    const { data: validations } = await supabaseAdmin
      .from('validations')
      .select(`
        id,
        validated_at,
        is_valid,
        tickets!inner(
          passenger_phone,
          routes!inner(name, origin, destination)
        )
      `)
      .eq('park_operator_id', operator.id)
      .eq('is_valid', true)
      .order('validated_at', { ascending: false })
      .limit(10)

    todayCount = count
    recentValidations = validations
  } else {
    // Fallback to regular client
    const { count: count } = await supabase
      .from('validations')
      .select('*', { count: 'exact', head: true })
      .eq('park_operator_id', operator.id)
      .eq('is_valid', true)
      .gte('validated_at', today.toISOString())

    const { data: validations } = await supabase
      .from('validations')
      .select(`
        id,
        validated_at,
        is_valid,
        tickets!inner(
          passenger_phone,
          routes!inner(name, origin, destination)
        )
      `)
      .eq('park_operator_id', operator.id)
      .eq('is_valid', true)
      .order('validated_at', { ascending: false })
      .limit(10)

    todayCount = count
    recentValidations = validations
  }

  // Handle route display safely (exclude financial data)
  const routeInfo = operator.routes && typeof operator.routes === 'object' && !Array.isArray(operator.routes)
    ? operator.routes as { name?: string; origin?: string; destination?: string }
    : null

  return (
    <Layout role="park_operator">
      <RealtimeTrips
        initialOperator={operator}
        initialTodayCount={todayCount || 0}
        initialRecentValidations={recentValidations || []}
      />
    </Layout>
  )
}

