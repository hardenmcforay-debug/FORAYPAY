import Layout from '@/components/layout/Layout'
import { createClient } from '@/lib/supabase/server'
import RealtimeCompanies from '@/components/platform/RealtimeCompanies'

export default async function CompaniesPage() {
  const supabase = createClient()

  const { data: companies, error } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <Layout role="platform_admin">
      <RealtimeCompanies initialCompanies={companies || []} />
    </Layout>
  )
}

