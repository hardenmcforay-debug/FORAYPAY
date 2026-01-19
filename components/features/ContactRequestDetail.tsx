'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  FileText, 
  Hash, 
  Globe, 
  Share2, 
  Calendar, 
  User,
  X,
  CheckCircle,
  Clock,
  XCircle,
  Edit,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface ContactRequest {
  id: string
  company_name: string
  legal_name?: string
  business_registration_number?: string
  contact_person: string
  email: string
  phone: string
  address: string
  number_of_routes: string
  website?: string
  socials?: string
  additional_info?: string
  status: string
  created_at: string
  contacted_at?: string
  notes?: string
}

interface ContactRequestDetailProps {
  request: ContactRequest
}

export default function ContactRequestDetail({ request }: ContactRequestDetailProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState(request.status)
  const [notes, setNotes] = useState(request.notes || '')
  const [contactedAt, setContactedAt] = useState(request.contacted_at)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true)
    setSuccessMessage(null)
    try {
      const response = await fetch('/api/contact-requests/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: request.id,
          status: newStatus,
          notes: notes,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update request')
      }

      const result = await response.json()
      setStatus(newStatus)
      if (result.request?.contacted_at) {
        setContactedAt(result.request.contacted_at)
      }
      if (result.request?.notes !== undefined) {
        setNotes(result.request.notes || '')
      }
      setSuccessMessage(`Status updated to ${newStatus.replace('_', ' ')} successfully!`)
      
      // Refresh the page after a short delay to show updated status in the list
      setTimeout(() => {
        router.refresh()
      }, 1500)
    } catch (error: any) {
      console.error('Error updating request:', error)
      alert(error.message || 'Failed to update request. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSaveNotes = async () => {
    setIsSavingNotes(true)
    setSuccessMessage(null)
    try {
      const response = await fetch('/api/contact-requests/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: request.id,
          status: status, // Keep current status
          notes: notes,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save notes')
      }

      setSuccessMessage('Notes saved successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error: any) {
      console.error('Error saving notes:', error)
      alert(error.message || 'Failed to save notes. Please try again.')
    } finally {
      setIsSavingNotes(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/contact-requests/delete?id=${request.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete contact request')
      }

      // Close modal and refresh the page
      setIsOpen(false)
      router.push('/platform/contact-requests')
      router.refresh()
    } catch (error: any) {
      console.error('Error deleting contact request:', error)
      alert(error.message || 'An error occurred while deleting the contact request.')
      setIsDeleting(false)
    }
  }

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

  if (!isOpen) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)}>
        View
      </Button>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* Header - Fixed */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Contact Request Details</h2>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-500">Request ID: {request.id.substring(0, 8)}...</p>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                title="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="overflow-y-auto flex-1 pr-2">
            <div className="space-y-6">
              {/* Success Message */}
              {successMessage && (
                <div className="p-4 bg-success-50 border border-success-200 rounded-lg text-success-700 text-sm">
                  {successMessage}
                </div>
              )}

              {/* Status Overview Section */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 text-center">Request Overview</h3>
                <div className="flex justify-center items-center gap-6 flex-wrap">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 text-center">Status</div>
                    <div className="mt-1 flex justify-center">{getStatusBadge(status)}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 text-center">Submitted</div>
                    <div className="text-sm font-semibold text-gray-900 mt-1 text-center">{formatDate(request.created_at)}</div>
                  </div>
                  {contactedAt && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Contacted</div>
                      <div className="text-sm font-semibold text-gray-900 mt-1">{formatDate(contactedAt)}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Company Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-100 mr-3">
                    <Building2 className="h-5 w-5 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Company Name - Full Width */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Company Name</label>
                    <div className="text-lg font-bold text-gray-900 text-center">{request.company_name}</div>
                  </div>

                  {/* Legal Name */}
                  {request.legal_name && (
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center text-left">
                        <FileText className="h-3 w-3 mr-1.5" />
                        Legal Name
                      </label>
                      <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200 text-left">{request.legal_name}</div>
                    </div>
                  )}

                  {/* Business Registration Number */}
                  {request.business_registration_number && (
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center text-left">
                        <Hash className="h-3 w-3 mr-1.5" />
                        Business Registration Number
                      </label>
                      <div className="text-sm font-mono text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200 text-left">{request.business_registration_number}</div>
                    </div>
                  )}

                  {/* Number of Routes */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide text-left">Number of Routes</label>
                    <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200 text-left">{request.number_of_routes}</div>
                  </div>

                  {/* Website */}
                  {request.website && (
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center text-left">
                        <Globe className="h-3 w-3 mr-1.5" />
                        Website
                      </label>
                      <a 
                        href={request.website.startsWith('http') ? request.website : `https://${request.website}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:underline break-all bg-gray-50 p-3 rounded-lg border border-gray-200 block text-left"
                      >
                        {request.website}
                      </a>
                    </div>
                  )}

                  {/* Social Media */}
                  {request.socials && (
                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center text-left">
                        <Share2 className="h-3 w-3 mr-1.5" />
                        Social Media
                      </label>
                      <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200 text-left">{request.socials}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-100 mr-3">
                    <User className="h-5 w-5 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Contact Person - Full Width */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center text-left">
                      <User className="h-3 w-3 mr-1.5" />
                      Contact Person
                    </label>
                    <div className="text-lg font-bold text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200 text-left">{request.contact_person}</div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center text-left">
                      <Mail className="h-3 w-3 mr-1.5" />
                      Email
                    </label>
                    <a 
                      href={`mailto:${request.email}`}
                      className="text-sm text-primary-600 hover:underline break-all bg-gray-50 p-3 rounded-lg border border-gray-200 block text-left"
                    >
                      {request.email}
                    </a>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center text-left">
                      <Phone className="h-3 w-3 mr-1.5" />
                      Phone
                    </label>
                    <a 
                      href={`tel:${request.phone}`}
                      className="text-sm text-primary-600 hover:underline bg-gray-50 p-3 rounded-lg border border-gray-200 block text-left"
                    >
                      {request.phone}
                    </a>
                  </div>

                  {/* Address - Full Width */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center text-left">
                      <MapPin className="h-3 w-3 mr-1.5" />
                      Address
                    </label>
                    <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200 text-left">{request.address}</div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              {request.additional_info && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center mb-4 pb-4 border-b border-gray-200">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-100 mr-3">
                      <FileText className="h-5 w-5 text-primary-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{request.additional_info}</p>
                  </div>
                </div>
              )}

              {/* Notes Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-100 mr-3">
                      <Edit className="h-5 w-5 text-primary-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes || notes === (request.notes || '')}
                    isLoading={isSavingNotes}
                  >
                    Save Notes
                  </Button>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
                  placeholder="Add notes about this request..."
                />
                {notes !== (request.notes || '') && (
                  <p className="text-xs text-gray-500 mt-2">You have unsaved changes</p>
                )}
              </div>

              {/* Status Actions */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Update Status</h3>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleStatusUpdate('contacted')}
                    disabled={isUpdating || status === 'contacted'}
                    size="sm"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Contacted
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleStatusUpdate('in_progress')}
                    disabled={isUpdating || status === 'in_progress'}
                    size="sm"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    In Progress
                  </Button>
                  <Button
                    variant="success"
                    onClick={() => handleStatusUpdate('completed')}
                    disabled={isUpdating || status === 'completed'}
                    size="sm"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete
                  </Button>
                  <Button
                    variant="error"
                    onClick={() => handleStatusUpdate('rejected')}
                    disabled={isUpdating || status === 'rejected'}
                    size="sm"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
                {isUpdating && (
                  <p className="text-xs text-gray-500 mt-3">Updating status...</p>
                )}
              </div>

              {/* Danger Zone */}
              <div className="bg-white border-2 border-error-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-error-600 mb-2 text-center">Danger Zone</h3>
                    <p className="text-sm text-gray-600 text-center">
                      Once you delete this contact request, there is no going back. Please be certain.
                    </p>
                  </div>
                  <Button
                    variant="error"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting}
                    size="md"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Request
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => !isDeleting && setShowDeleteConfirm(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-error-100 mr-3">
                    <AlertTriangle className="h-5 w-5 text-error-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Delete Contact Request</h2>
                </div>
                {!isDeleting && (
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <p className="text-center text-sm font-medium text-gray-900 mb-3">
                    To confirm deletion, type the company name:
                  </p>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder={`Type "${request.company_name}" to confirm`}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-error-500 focus:border-transparent transition-colors"
                      disabled={isDeleting}
                      autoFocus
                    />
                    {deleteConfirmText && deleteConfirmText !== request.company_name && (
                      <p className="text-xs text-error-600 mt-2">
                        Company name does not match. Please type exactly: <strong>{request.company_name}</strong>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                {!isDeleting && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeleteConfirmText('')
                    }}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  variant="error"
                  onClick={handleDelete}
                  isLoading={isDeleting}
                  disabled={isDeleting || deleteConfirmText !== request.company_name}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? 'Deleting...' : 'Delete Request'}
                </Button>
              </div>
            </Card>
          </div>
        </>
      )}
    </>
  )
}

