import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Settings, 
  Building2, 
  Users, 
  DollarSign, 
  Shield, 
  CreditCard,
  BarChart3,
  Info,
  Mail,
  Phone
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default async function PlatformSettingsPage() {
  const user = await requireRole(['platform_admin'])
  const supabase = createServerSupabaseClient()

  // Get platform statistics
  const { count: totalCompanies } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })

  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  const { count: activeCompanies } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  // Get average commission rate
  const { data: companies } = await supabase
    .from('companies')
    .select('commission_rate')

  const avgCommissionRate = companies && companies.length > 0
    ? companies.reduce((sum, c) => sum + (Number(c.commission_rate) || 0), 0) / companies.length
    : 0

  // Get total revenue (sum of all commissions from transactions)
  const { data: transactions } = await supabase
    .from('transactions')
    .select('commission')
    .eq('status', 'completed')

  const totalPlatformRevenue = transactions?.reduce((sum, t) => sum + (Number(t.commission) || 0), 0) || 0

  return (
    <DashboardLayout
      role="platform_admin"
      userEmail={user.email}
      userName="Platform Admin"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="w-8 h-8 text-primary-600" />
            Platform Settings
          </h1>
          <p className="text-gray-600 mt-2">System-wide configuration and management</p>
        </div>

        {/* Platform Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Companies</p>
                  <p className="text-3xl font-bold text-gray-900">{totalCompanies || 0}</p>
                  <p className="text-xs text-success-600 mt-1">
                    {activeCompanies || 0} active
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{totalUsers || 0}</p>
                </div>
                <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-success-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Platform Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(totalPlatformRevenue)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-warning-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg Commission Rate</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {(avgCommissionRate * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-primary-600" />
              Platform Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform Name</label>
                <p className="text-gray-900 font-semibold">ForayPay</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform Admin</label>
                <p className="text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Companies</label>
                <p className="text-gray-900">{totalCompanies || 0} companies registered</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">System Status</label>
                <span className="inline-block px-3 py-1 text-sm rounded-full bg-success-100 text-success-700 font-medium">
                  Operational
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Gateway Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary-600" />
              Payment Gateway
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Provider</label>
                <p className="text-gray-900">MoniMe</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Integration Status</label>
                <span className="inline-block px-3 py-1 text-sm rounded-full bg-success-100 text-success-700 font-medium">
                  Active
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Webhook Endpoint</label>
                <p className="text-gray-900 font-mono text-sm break-all">
                  /api/webhooks/monime
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Processing</label>
                <span className="inline-block px-3 py-1 text-sm rounded-full bg-primary-100 text-primary-700 font-medium">
                  Real-time
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-600" />
              Security & Access Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Row Level Security (RLS)</label>
                <span className="inline-block px-3 py-1 text-sm rounded-full bg-success-100 text-success-700 font-medium">
                  Enabled
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Audit Logging</label>
                <span className="inline-block px-3 py-1 text-sm rounded-full bg-success-100 text-success-700 font-medium">
                  Active
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Multi-Tenant Isolation</label>
                <span className="inline-block px-3 py-1 text-sm rounded-full bg-success-100 text-success-700 font-medium">
                  Enforced
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role-Based Access</label>
                <span className="inline-block px-3 py-1 text-sm rounded-full bg-success-100 text-success-700 font-medium">
                  Configured
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary-600" />
              System Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Commission Rate</label>
                <p className="text-gray-900">0.00%</p>
                <p className="text-xs text-gray-500 mt-1">Applied to new companies</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Average Commission Rate</label>
                <p className="text-gray-900">0.00%</p>
                <p className="text-xs text-gray-500 mt-1">Across all companies</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Validation</label>
                <span className="inline-block px-3 py-1 text-sm rounded-full bg-primary-100 text-primary-700 font-medium">
                  OTP-based
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Retention</label>
                <p className="text-gray-900">Indefinite</p>
                <p className="text-xs text-gray-500 mt-1">All data preserved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support & Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary-600" />
              Support & Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Support Email
                </label>
                <p className="text-gray-900">support@foraypay.com</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Contact
                </label>
                <p className="text-gray-900">Available via dashboard</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

