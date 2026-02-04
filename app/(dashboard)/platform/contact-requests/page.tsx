'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Button from '@/components/ui/button'
import { Mail, Phone, MapPin, Globe, MessageSquare, CheckCircle2, Clock, UserCheck, FileText, RefreshCw, Filter } from 'lucide-react'

interface ContactRequest {
  id: string
  name: string
  email: string
  legal_name: string
  business_registration_number: string
  phone: string
  address: string
  website: string | null
  socials: string | null
  message: string
  status: 'pending' | 'reviewed' | 'contacted' | 'completed'
  reviewed_by: string | null
  reviewed_at: string | null
  notes: string | null
  created_at: string
  reviewed_by_user?: {
    id: string
    email: string
  }
}

export default function ContactRequestsPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [fetching, setFetching] = useState(true)
  const [userEmail, setUserEmail] = useState<string>('')
  const [requests, setRequests] = useState<ContactRequest[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [refreshing, setRefreshing] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<ContactRequest | null>(null)

  const loadRequests = useCallback(async () => {
    try {
      const url = filterStatus === 'all' 
        ? '/api/contact-requests'
        : `/api/contact-requests?status=${filterStatus}`
      
      const response = await fetch(url)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch contact requests')
      }

      setRequests(result.data || [])
    } catch (err: any) {
      console.error('Error loading contact requests:', err)
    } finally {
      setFetching(false)
      setRefreshing(false)
    }
  }, [filterStatus])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        setUserEmail(user.email || '')

        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile?.role !== 'platform_admin') {
          router.push('/unauthorized')
          return
        }

        loadRequests()
      } catch (err: any) {
        console.error('Error fetching data:', err)
      }
    }

    fetchData()
  }, [supabase, router, loadRequests])

  const handleStatusUpdate = async (requestId: string, newStatus: string, notes?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const response = await fetch(`/api/contact-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          notes: notes || null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update request')
      }

      // Reload requests
      loadRequests()
      setSelectedRequest(null)
    } catch (err: any) {
      console.error('Error updating request:', err)
      alert(err.message || 'Failed to update request')
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadRequests()
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-warning-100 text-warning-700 border-warning-200',
      reviewed: 'bg-primary-100 text-primary-700 border-primary-200',
      contacted: 'bg-info-100 text-info-700 border-info-200',
      completed: 'bg-success-100 text-success-700 border-success-200',
    }
    return styles[status as keyof typeof styles] || styles.pending
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'reviewed':
        return <FileText className="w-4 h-4" />
      case 'contacted':
        return <MessageSquare className="w-4 h-4" />
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length

  if (fetching) {
    return (
      <DashboardLayout
        role="platform_admin"
        userEmail={userEmail}
        userName="Platform Admin"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading contact requests...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      role="platform_admin"
      userEmail={userEmail}
      userName="Platform Admin"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contact Requests</h1>
            <p className="text-gray-600 mt-2">Manage company setup requests from potential clients</p>
          </div>
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <div className="px-4 py-2 bg-warning-100 text-warning-700 rounded-lg font-semibold">
                {pendingCount} Pending
              </div>
            )}
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Requests</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="contacted">Contacted</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        {requests.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No contact requests found</p>
              <p className="text-gray-500 text-sm mt-2">
                {filterStatus !== 'all' ? `No requests with status "${filterStatus}"` : 'No requests have been submitted yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => (
              <Card key={request.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedRequest(request)}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{request.legal_name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusBadge(request.status)}`}>
                          {getStatusIcon(request.status)}
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">{request.name} • {request.email}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{request.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{request.address}</span>
                        </div>
                        {request.website && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Globe className="w-4 h-4" />
                            <a href={request.website} target="_blank" rel="noopener noreferrer" className="text-gray-900 dark:text-gray-100 hover:underline truncate">
                              {request.website}
                            </a>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-600">
                          <FileText className="w-4 h-4" />
                          <span>Reg: {request.business_registration_number}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-500 mt-4">
                        Submitted {new Date(request.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedRequest(null)}>
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Contact Request Details</h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border inline-flex items-center gap-1 ${getStatusBadge(selectedRequest.status)}`}>
                {getStatusIcon(selectedRequest.status)}
                {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
              </span>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Legal Name</label>
                    <p className="text-gray-900">{selectedRequest.legal_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Business Registration Number</label>
                    <p className="text-gray-900">{selectedRequest.business_registration_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Address</label>
                    <p className="text-gray-900">{selectedRequest.address}</p>
                  </div>
                  {selectedRequest.website && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Website</label>
                      <p className="text-gray-900">
                        <a href={selectedRequest.website} target="_blank" rel="noopener noreferrer" className="text-gray-900 dark:text-gray-100 hover:underline">
                          {selectedRequest.website}
                        </a>
                      </p>
                    </div>
                  )}
                  {selectedRequest.socials && (
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-500">Social Media</label>
                      <p className="text-gray-900">{selectedRequest.socials}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Contact Name</label>
                    <p className="text-gray-900">{selectedRequest.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">
                      <a href={`mailto:${selectedRequest.email}`} className="text-gray-900 dark:text-gray-100 hover:underline">
                        {selectedRequest.email}
                      </a>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-gray-900">
                      <a href={`tel:${selectedRequest.phone}`} className="text-gray-900 dark:text-gray-100 hover:underline">
                        {selectedRequest.phone}
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Message</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedRequest.message}</p>
              </div>

              {selectedRequest.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Admin Notes</h3>
                  <p className="text-gray-700 bg-primary-50 p-4 rounded-lg">{selectedRequest.notes}</p>
                </div>
              )}

              {selectedRequest.reviewed_by_user && (
                <div className="text-sm text-gray-500">
                  Reviewed by {selectedRequest.reviewed_by_user.email} on{' '}
                  {new Date(selectedRequest.reviewed_at!).toLocaleDateString()}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {selectedRequest.status === 'pending' && (
                  <>
                    <Button onClick={() => handleStatusUpdate(selectedRequest.id, 'reviewed')}>
                      <FileText className="w-4 h-4 mr-2" />
                      Mark as Reviewed
                    </Button>
                    <Button variant="outline" onClick={() => handleStatusUpdate(selectedRequest.id, 'contacted')}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Mark as Contacted
                    </Button>
                  </>
                )}
                {selectedRequest.status === 'reviewed' && (
                  <Button onClick={() => handleStatusUpdate(selectedRequest.id, 'contacted')}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Mark as Contacted
                  </Button>
                )}
                {selectedRequest.status === 'contacted' && (
                  <Button onClick={() => handleStatusUpdate(selectedRequest.id, 'completed')}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Mark as Completed
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

