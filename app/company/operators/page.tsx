import Layout from '@/components/layout/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Plus, Users } from 'lucide-react'
import Link from 'next/link'
import OperatorsTable from './OperatorsTable'

export default async function OperatorsPage() {
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

  // Get operators using service role key to bypass RLS
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  let operators: any[] | null = null
  let error: any = null

  if (supabaseServiceKey) {
    const supabaseAdmin = createServiceClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: operatorsData, error: operatorsError } = await supabaseAdmin
      .from('park_operators')
      .select(`
        *,
        users!inner(full_name, email),
        routes(name, origin, destination)
      `)
      .eq('company_id', userData.company_id)
      .order('created_at', { ascending: false })

    operators = operatorsData
    error = operatorsError
  } else {
    // Fallback to regular client if service key not available
    const { data: operatorsData, error: operatorsError } = await supabase
      .from('park_operators')
      .select(`
        *,
        users!inner(full_name, email),
        routes(name, origin, destination)
      `)
      .eq('company_id', userData.company_id)
      .order('created_at', { ascending: false })

    operators = operatorsData
    error = operatorsError
  }

  return (
    <Layout role="company_admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Park Operators</h1>
            <p className="text-gray-600 mt-1">Manage park operators</p>
          </div>
          <Link href="/company/operators/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Operator
            </Button>
          </Link>
        </div>

        <Card>
          {error ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-error-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Operators</h3>
              <p className="text-gray-500 mb-2">{error.message || 'An error occurred while loading operators'}</p>
              <p className="text-sm text-gray-400">
                If this is an RLS policy error, ensure RLS policies are set up for park_operators table
              </p>
            </div>
          ) : !operators || operators.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No operators found</p>
              <Link href="/company/operators/new">
                <Button>Create First Operator</Button>
              </Link>
            </div>
          ) : (
            <OperatorsTable operators={operators} />
          )}
        </Card>
      </div>
    </Layout>
  )
}

