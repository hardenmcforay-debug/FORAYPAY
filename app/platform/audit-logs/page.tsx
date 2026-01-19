import Layout from '@/components/layout/Layout'
import { createClient } from '@/lib/supabase/server'
import RealtimeAuditLogs from '@/components/platform/RealtimeAuditLogs'

export default async function AuditLogsPage() {
  const supabase = createClient()

  const { data: logs, error } = await supabase
    .from('audit_logs')
    .select(`
      *,
      users!left(full_name, email),
      companies!left(name)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <Layout role="platform_admin">
      <RealtimeAuditLogs initialLogs={logs || []} />
    </Layout>
  )
}

