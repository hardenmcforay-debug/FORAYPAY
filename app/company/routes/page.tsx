import Layout from '@/components/layout/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Plus, Route } from 'lucide-react'
import Link from 'next/link'
import RoutesTable from './RoutesTable'

export default async function RoutesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <Layout role="company_admin">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Routes</h1>
            <p className="text-gray-600 mt-1">Manage transport routes</p>
          </div>
          <Card>
            <p className="text-gray-500 text-center py-8">Unable to load user information. Please try again.</p>
          </Card>
        </div>
      </Layout>
    )
  }

  const { data: userData } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!userData?.company_id) {
    return (
      <Layout role="company_admin">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Routes</h1>
            <p className="text-gray-600 mt-1">Manage transport routes</p>
          </div>
          <Card>
            <p className="text-gray-500 text-center py-8">No company associated with your account. Please contact support.</p>
          </Card>
        </div>
      </Layout>
    )
  }

  // Get routes using service role key to bypass RLS
  // (RLS policies for routes SELECT are not set up yet)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  let routes: any[] | null = null
  let error: any = null

  if (supabaseServiceKey) {
    const supabaseAdmin = createServiceClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: routesData, error: routesError } = await supabaseAdmin
      .from('routes')
      .select('*')
      .eq('company_id', userData.company_id)
      .order('created_at', { ascending: false })

    routes = routesData
    error = routesError
  } else {
    // Fallback to regular client if service key not available
    const { data: routesData, error: routesError } = await supabase
      .from('routes')
      .select('*')
      .eq('company_id', userData.company_id)
      .order('created_at', { ascending: false })

    routes = routesData
    error = routesError
  }

  return (
    <Layout role="company_admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Routes</h1>
            <p className="text-gray-600 mt-1">Manage transport routes</p>
          </div>
          <Link href="/company/routes/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Route
            </Button>
          </Link>
        </div>

        <Card>
          {error ? (
            <div className="text-center py-12">
              <Route className="h-12 w-12 text-error-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Routes</h3>
              <p className="text-gray-500 mb-2">{error.message || 'An error occurred while loading routes'}</p>
              <p className="text-sm text-gray-400">
                If this is an RLS policy error, run the migration: database/migrations/add-routes-rls-policies.sql
              </p>
            </div>
          ) : !routes || routes.length === 0 ? (
            <div className="text-center py-12">
              <Route className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No routes found</p>
              <Link href="/company/routes/new">
                <Button>Create First Route</Button>
              </Link>
            </div>
          ) : (
            <RoutesTable routes={routes} />
          )}
        </Card>
      </div>
    </Layout>
  )
}

