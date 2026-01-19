import Layout from '@/components/layout/Layout'
import Card from '@/components/ui/Card'
import PlatformSettings from '@/components/features/PlatformSettings'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Settings, Building2, DollarSign, Shield, Users } from 'lucide-react'

export default async function PlatformSettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get platform statistics
  const { count: totalCompanies } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })

  const { count: activeCompanies } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  // Get service role key for bypassing RLS
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  let operators: any[] = []
  let companies: any[] = []
  let transactions: any[] = []

  if (supabaseServiceKey) {
    const supabaseAdmin = createServiceClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get all operators with their related data
    const { data: operatorsData } = await supabaseAdmin
      .from('park_operators')
      .select(`
        *,
        user_id,
        users!inner(full_name, email),
        companies!inner(name),
        routes(origin, destination)
      `)
      .order('created_at', { ascending: false })

    operators = operatorsData || []

    // Get all companies for commission management
    const { data: companiesData } = await supabaseAdmin
      .from('companies')
      .select('id, name, commission_rate, is_active')
      .order('name')

    companies = companiesData || []

    // Get recent transactions for audit
    const { data: transactionsData } = await supabaseAdmin
      .from('transactions')
      .select(`
        *,
        companies!inner(name)
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    transactions = transactionsData || []
  } else {
    // Fallback to regular client if service key not available
    const { data: operatorsData } = await supabase
      .from('park_operators')
      .select(`
        *,
        user_id,
        users!inner(full_name, email),
        companies!inner(name),
        routes(origin, destination)
      `)
      .order('created_at', { ascending: false })

    operators = operatorsData || []

    const { data: companiesData } = await supabase
      .from('companies')
      .select('id, name, commission_rate, is_active')
      .order('name')

    companies = companiesData || []

    const { data: transactionsData } = await supabase
      .from('transactions')
      .select(`
        *,
        companies!inner(name)
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    transactions = transactionsData || []
  }

  // Check system status
  let dbStatus = { status: 'error', message: 'Unknown' }
  let serviceKeyStatus = { status: 'error', message: 'Not configured' }
  let paymentGatewayStatus = { status: 'warning', message: 'No recent activity' }
  let platformStatus = { status: 'error', message: 'Issues detected' }

  // Check database connection
  try {
    const { error: dbError } = await supabase
      .from('companies')
      .select('id')
      .limit(1)
    
    if (!dbError) {
      dbStatus = { status: 'success', message: 'Active' }
    } else {
      dbStatus = { status: 'error', message: 'Connection failed' }
    }
  } catch (error) {
    dbStatus = { status: 'error', message: 'Connection error' }
  }

  // Check service role key configuration
  if (supabaseServiceKey && supabaseServiceKey.length > 0) {
    serviceKeyStatus = { status: 'success', message: 'Configured' }
  } else {
    serviceKeyStatus = { status: 'error', message: 'Not configured' }
  }

  // Check payment gateway (MoniMe) - check if any companies have MoniMe account IDs and recent transactions
  try {
    const { count: companiesWithMoniMe } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })
      .not('monime_account_id', 'is', null)
      .eq('is_active', true)

    // Check for recent transactions (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { count: recentTransactions } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())
      .eq('status', 'completed')

    if (companiesWithMoniMe && companiesWithMoniMe > 0) {
      if (recentTransactions && recentTransactions > 0) {
        paymentGatewayStatus = { status: 'success', message: 'Active' }
      } else {
        paymentGatewayStatus = { status: 'warning', message: 'Configured (no recent activity)' }
      }
    } else {
      paymentGatewayStatus = { status: 'warning', message: 'Not configured' }
    }
  } catch (error) {
    paymentGatewayStatus = { status: 'error', message: 'Check failed' }
  }

  // Overall platform status
  if (dbStatus.status === 'success' && serviceKeyStatus.status === 'success') {
    platformStatus = { status: 'success', message: 'Operational' }
  } else if (dbStatus.status === 'success' || serviceKeyStatus.status === 'success') {
    platformStatus = { status: 'warning', message: 'Degraded' }
  } else {
    platformStatus = { status: 'error', message: 'Issues detected' }
  }

  // Get platform statistics for information section
  let totalRoutes = 0
  let totalOperators = 0
  let averageCommissionRate = 0
  let companiesWithMoniMe = 0

  try {
    if (supabaseServiceKey) {
      const supabaseAdmin = createServiceClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })

      // Get total routes
      const { count: routesCount } = await supabaseAdmin
        .from('routes')
        .select('*', { count: 'exact', head: true })

      totalRoutes = routesCount || 0

      // Get total operators
      const { count: operatorsCount } = await supabaseAdmin
        .from('park_operators')
        .select('*', { count: 'exact', head: true })

      totalOperators = operatorsCount || 0

      // Get average commission rate
      const { data: allCompanies } = await supabaseAdmin
        .from('companies')
        .select('commission_rate, monime_account_id')

      if (allCompanies && allCompanies.length > 0) {
        const totalRate = allCompanies.reduce((sum, c) => sum + (c.commission_rate || 0), 0)
        averageCommissionRate = totalRate / allCompanies.length
        companiesWithMoniMe = allCompanies.filter(c => c.monime_account_id).length
      }
    } else {
      // Fallback to regular client
      const { count: routesCount } = await supabase
        .from('routes')
        .select('*', { count: 'exact', head: true })

      totalRoutes = routesCount || 0

      const { count: operatorsCount } = await supabase
        .from('park_operators')
        .select('*', { count: 'exact', head: true })

      totalOperators = operatorsCount || 0

      const { data: allCompanies } = await supabase
        .from('companies')
        .select('commission_rate, monime_account_id')

      if (allCompanies && allCompanies.length > 0) {
        const totalRate = allCompanies.reduce((sum, c) => sum + (c.commission_rate || 0), 0)
        averageCommissionRate = totalRate / allCompanies.length
        companiesWithMoniMe = allCompanies.filter(c => c.monime_account_id).length
      }
    }
  } catch (error) {
    console.error('Error fetching platform statistics:', error)
  }

  return (
    <Layout role="platform_admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
          <p className="text-gray-600 mt-1">Configure platform-wide settings and manage access control</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-primary-50 p-3 rounded-lg">
                <Building2 className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Companies</p>
                <p className="text-2xl font-bold text-gray-900">{totalCompanies || 0}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-success-50 p-3 rounded-lg">
                <Building2 className="h-6 w-6 text-success-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Companies</p>
                <p className="text-2xl font-bold text-gray-900">{activeCompanies || 0}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-warning-50 p-3 rounded-lg">
                <Users className="h-6 w-6 text-warning-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{totalUsers || 0}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Management Tools */}
        <PlatformSettings
          operators={operators}
          companies={companies}
          transactions={transactions}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Platform Information
                </h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Platform Name</label>
                  <p className="text-gray-900 text-lg font-semibold">
                    <span className="text-primary-600">Foray</span>
                    <span className="text-success-600">pay</span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Platform Type</label>
                  <p className="text-gray-900">B2B Transport Ticketing Infrastructure</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Gateway</label>
                  <p className="text-gray-900 font-mono">MoniMe</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {companiesWithMoniMe > 0 
                      ? `${companiesWithMoniMe} ${companiesWithMoniMe === 1 ? 'company has' : 'companies have'} MoniMe configured`
                      : 'No companies have MoniMe configured'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Average Commission Rate</label>
                  <p className="text-gray-900">
                    {averageCommissionRate > 0 
                      ? `${averageCommissionRate.toFixed(2)}%`
                      : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Calculated from {totalCompanies || 0} {totalCompanies === 1 ? 'company' : 'companies'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Routes</label>
                  <p className="text-gray-900">{totalRoutes}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Operators</label>
                  <p className="text-gray-900">{totalOperators}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Companies</label>
                  <p className="text-gray-900">{totalCompanies || 0}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  System Status
                </h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Database Connection</span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    dbStatus.status === 'success'
                      ? 'bg-success-100 text-success-700'
                      : dbStatus.status === 'warning'
                      ? 'bg-warning-100 text-warning-700'
                      : 'bg-error-100 text-error-700'
                  }`}>
                    {dbStatus.message}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Service Role Key</span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    serviceKeyStatus.status === 'success'
                      ? 'bg-success-100 text-success-700'
                      : 'bg-error-100 text-error-700'
                  }`}>
                    {serviceKeyStatus.message}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Payment Gateway</span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    paymentGatewayStatus.status === 'success'
                      ? 'bg-success-100 text-success-700'
                      : paymentGatewayStatus.status === 'warning'
                      ? 'bg-warning-100 text-warning-700'
                      : 'bg-error-100 text-error-700'
                  }`}>
                    {paymentGatewayStatus.message}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Platform Status</span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    platformStatus.status === 'success'
                      ? 'bg-success-100 text-success-700'
                      : platformStatus.status === 'warning'
                      ? 'bg-warning-100 text-warning-700'
                      : 'bg-error-100 text-error-700'
                  }`}>
                    {platformStatus.message}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}

