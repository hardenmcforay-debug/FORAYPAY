import Layout from '@/components/layout/Layout'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { formatDate } from '@/lib/utils'
import { Ticket, AlertCircle } from 'lucide-react'

export default async function OperatorHistoryPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <Layout role="park_operator">
        <div className="space-y-6">
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500">Please log in to view validation history.</p>
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
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    operator = operatorData
    operatorError = error
  } else {
    // Fallback to regular client
    const { data: operatorData, error: error } = await supabase
      .from('park_operators')
      .select('id')
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

  // Get validation history using service role key (exclude financial data)
  let validations: any[] | null = null
  let error: any = null

  if (supabaseServiceKey) {
    const supabaseAdmin = createServiceClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: validationsData, error: validationsError } = await supabaseAdmin
      .from('validations')
      .select(`
        *,
        tickets(
          id,
          passenger_phone,
          routes(
            name,
            origin,
            destination
          )
        )
      `)
      .eq('park_operator_id', operator.id)
      .order('validated_at', { ascending: false })
      .limit(100)

    validations = validationsData
    error = validationsError
  } else {
    // Fallback to regular client
    const { data: validationsData, error: validationsError } = await supabase
      .from('validations')
      .select(`
        *,
        tickets(
          id,
          passenger_phone,
          routes(
            name,
            origin,
            destination
          )
        )
      `)
      .eq('park_operator_id', operator.id)
      .order('validated_at', { ascending: false })
      .limit(100)

    validations = validationsData
    error = validationsError
  }

  return (
    <Layout role="park_operator">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Validation History</h1>
          <p className="text-gray-600 mt-1">View your ticket validation history</p>
        </div>

        <Card>
          {error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-error-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading History</h3>
              <p className="text-gray-500 mb-4">{error.message}</p>
              <p className="text-sm text-gray-400">Please try refreshing the page or contact support if the issue persists.</p>
            </div>
          ) : !validations || validations.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Validation History</h3>
              <p className="text-gray-500">You haven&apos;t validated any tickets yet.</p>
              <p className="text-sm text-gray-400 mt-2">Start validating tickets to see your history here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Passenger Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Validated At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {validations.map((validation: any) => {
                    const ticket = validation.tickets
                    const route = ticket?.routes
                    const isArray = Array.isArray(route)
                    const routeData = isArray ? route[0] : route
                    
                    return (
                      <tr key={validation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {routeData && routeData.origin && routeData.destination
                              ? `${routeData.origin} - ${routeData.destination}`
                              : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {ticket?.passenger_phone || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900">
                            {validation.order_number || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {validation.validated_at ? formatDate(validation.validated_at) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {validation.is_valid ? (
                            <Badge variant="success">Valid</Badge>
                          ) : (
                            <Badge variant="error">Invalid</Badge>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  )
}

