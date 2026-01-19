import Layout from '@/components/layout/Layout'
import { createClient } from '@/lib/supabase/server'
import RealtimeUsers from '@/components/platform/RealtimeUsers'

export default async function UsersPage() {
  const supabase = createClient()

  const { data: users, error } = await supabase
    .from('users')
    .select(`
      *,
      companies!left(name)
    `)
    .order('created_at', { ascending: false })

  return (
    <Layout role="platform_admin">
      <RealtimeUsers initialUsers={users || []} />
    </Layout>
  )
}

