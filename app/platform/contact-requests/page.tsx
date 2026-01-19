import Layout from '@/components/layout/Layout'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/server'
import { Mail, Phone, MapPin, Building2, FileText, Hash, Globe, Share2, Calendar, User } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import ContactRequestDetail from '@/components/features/ContactRequestDetail'

export default async function ContactRequestsPage() {
  const supabase = createClient()

  const { data: requests, error } = await supabase
    .from('contact_requests')
    .select('*')
    .order('created_at', { ascending: false })

  // Count pending requests
  const pendingCount = requests?.filter(r => r.status === 'pending').length || 0

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>
      case 'contacted':
        return <Badge variant="info">Contacted</Badge>
      case 'in_progress':
        return <Badge variant="info">In Progress</Badge>
      case 'completed':
        return <Badge variant="success">Completed</Badge>
      case 'rejected':
        return <Badge variant="error">Rejected</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <Layout role="platform_admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contact Requests</h1>
            <p className="text-gray-600 mt-1">
              Company space setup requests from the contact page
              {pendingCount > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
                  {pendingCount} pending
                </span>
              )}
            </p>
          </div>
        </div>

        <Card>
          {error ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Error loading contact requests</p>
              <p className="text-sm text-gray-400 mt-2">{error.message}</p>
            </div>
          ) : !requests || requests.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No contact requests found</p>
              <p className="text-sm text-gray-400">New requests will appear here when companies submit the contact form.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Person
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Routes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{request.company_name}</div>
                        {request.legal_name && (
                          <div className="text-xs text-gray-500 mt-1">Legal: {request.legal_name}</div>
                        )}
                        {request.business_registration_number && (
                          <div className="text-xs text-gray-500 mt-1">
                            Reg: {request.business_registration_number}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.contact_person}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{request.email}</div>
                        <div className="text-sm text-gray-500">{request.phone}</div>
                        {request.website && (
                          <div className="text-xs text-gray-500 mt-1 flex items-center">
                            <Globe className="h-3 w-3 mr-1" />
                            {request.website}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.number_of_routes}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(request.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <ContactRequestDetail request={request} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  )
}

