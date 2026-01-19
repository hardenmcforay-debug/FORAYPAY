import Layout from '@/components/layout/Layout'
import { createClient } from '@/lib/supabase/server'
import RealtimeTransactions from '@/components/company/RealtimeTransactions'

export default async function TransactionsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: userData } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!userData?.company_id) {
    return null
  }

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select(`
      *,
      tickets!left(
        routes!inner(name, origin, destination),
        passenger_phone
      )
    `)
    .eq('company_id', userData.company_id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return (
      <Layout role="company_admin">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-600 mt-1">View all payment transactions</p>
          </div>
          <div className="text-center py-12">
            <p className="text-gray-500">Error loading transactions</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout role="company_admin">
      <RealtimeTransactions
        companyId={userData.company_id}
        initialTransactions={transactions || []}
      />
    </Layout>
  )
}

