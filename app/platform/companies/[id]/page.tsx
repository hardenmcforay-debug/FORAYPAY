import Layout from '@/components/layout/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { ArrowLeft, Building2, Mail, Phone, MapPin, DollarSign, Route, Users, Ticket, Calendar } from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatCurrency } from '@/lib/utils'
import DeleteCompanyButton from '@/components/features/DeleteCompanyButton'

interface PageProps {
  params: {
    id: string
  }
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <Layout role="platform_admin">
        <div className="space-y-6">
          <Card>
            <p className="text-gray-500 text-center py-8">Please log in to view company details.</p>
          </Card>
        </div>
      </Layout>
    )
  }

  // Verify user is platform admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'platform_admin') {
    return (
      <Layout role="platform_admin">
        <div className="space-y-6">
          <Card>
            <p className="text-gray-500 text-center py-8">Unauthorized. Only platform admins can view company details.</p>
          </Card>
        </div>
      </Layout>
    )
  }

  // Get service role key for bypassing RLS
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  let company: any = null
  let error: any = null
  let stats: any = {
    routes: 0,
    operators: 0,
    tickets: 0,
    totalRevenue: 0,
  }

  if (supabaseServiceKey) {
    const supabaseAdmin = createServiceClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get company
    const { data: companyData, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('id', params.id)
      .single()

    company = companyData
    error = companyError

    if (company) {
      // Get statistics
      const { count: routesCount } = await supabaseAdmin
        .from('routes')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id)

      const { count: operatorsCount } = await supabaseAdmin
        .from('park_operators')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id)

      // Get tickets from last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { count: ticketsCount } = await supabaseAdmin
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id)
        .gte('created_at', thirtyDaysAgo.toISOString())

      const { data: transactions } = await supabaseAdmin
        .from('transactions')
        .select('amount')
        .eq('company_id', company.id)
        .eq('status', 'completed')

      stats.routes = routesCount || 0
      stats.operators = operatorsCount || 0
      stats.tickets = ticketsCount || 0
      stats.totalRevenue = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
    }
  } else {
    // Fallback to regular client
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', params.id)
      .single()

    company = companyData
    error = companyError
  }

  if (error || !company) {
    return (
      <Layout role="platform_admin">
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Link href="/platform/companies">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Company Details</h1>
              <p className="text-gray-600 mt-1">View company information</p>
            </div>
          </div>
          <Card>
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-error-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Company Not Found</h3>
              <p className="text-gray-500 mb-4">
                {error?.message || 'The company you are looking for does not exist.'}
              </p>
              <Link href="/platform/companies">
                <Button>Back to Companies</Button>
              </Link>
            </div>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout role="platform_admin">
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/platform/companies">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
            <p className="text-gray-600 mt-1">Company Details</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Routes</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.routes}</p>
              </div>
              <div className="bg-primary-50 p-3 rounded-lg">
                <Route className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Operators</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.operators}</p>
              </div>
              <div className="bg-success-50 p-3 rounded-lg">
                <Users className="h-6 w-6 text-success-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tickets (30d)</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.tickets}</p>
              </div>
              <div className="bg-warning-50 p-3 rounded-lg">
                <Ticket className="h-6 w-6 text-warning-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
              <div className="bg-success-50 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-success-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Company Information */}
        <Card>
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                Company Information
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Building2 className="h-4 w-4 mr-2" />
                  Company Name
                </label>
                <p className="text-gray-900 mt-1">{company.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </label>
                <p className="text-gray-900 mt-1">{company.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  Phone
                </label>
                <p className="text-gray-900 mt-1">{company.phone || 'N/A'}</p>
              </div>

              {company.address && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Address
                  </label>
                  <p className="text-gray-900 mt-1">{company.address}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  MoniMe Account ID
                </label>
                <p className="text-gray-900 font-mono mt-1">{company.monime_account_id || 'Not configured'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Commission Rate
                </label>
                <p className="text-gray-900 mt-1">{company.commission_rate}%</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Account Status */}
        <Card>
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Account Status
              </h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Company Status</span>
                <Badge variant={company.is_active ? 'success' : 'error'}>
                  {company.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                <p className="text-gray-900 mt-1">
                  {company.created_at ? formatDate(company.created_at) : 'N/A'}
                </p>
              </div>
              {company.updated_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                  <p className="text-gray-900 mt-1">
                    {formatDate(company.updated_at)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card>
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-error-600 mb-2">Danger Zone</h2>
              <p className="text-sm text-gray-600 mb-4">
                Once you delete a company, there is no going back. Please be certain.
              </p>
            </div>
            <div className="flex items-center justify-between p-4 bg-error-50 border border-error-200 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Delete Company</p>
                <p className="text-sm text-gray-600 mt-1">
                  This will permanently delete the company and all associated data.
                </p>
              </div>
              <DeleteCompanyButton
                companyId={company.id}
                companyName={company.name}
                variant="button"
                size="md"
              />
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  )
}

