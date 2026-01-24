'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Modal from '@/components/ui/modal'
import { ClipboardList, Building2, User, Calendar, Trash2, Loader2, AlertTriangle, CheckSquare, Square } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import DeleteAuditLogButton from '@/components/audit-logs/delete-audit-log-button'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface AuditLog {
  id: string
  action: string
  details: any
  created_at: string
  company_id: string | null
  user_id: string | null
  companies: { id: string; name: string } | null
  users: { id: string; email: string; role: string } | null
}

export default function AuditLogsPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [fetching, setFetching] = useState(true)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [totalLogs, setTotalLogs] = useState(0)
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set())
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        setUserEmail(user.email || '')

        // Verify user is platform admin
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile?.role !== 'platform_admin') {
          router.push('/unauthorized')
          return
        }

        // Get all audit logs with company and user information
        const { data: logs } = await supabase
          .from('audit_logs')
          .select(`
            *,
            companies:company_id (
              id,
              name
            ),
            users:user_id (
              id,
              email,
              role
            )
          `)
          .order('created_at', { ascending: false })
          .limit(100)

        setAuditLogs(logs || [])

        // Get total count
        const { count } = await supabase
          .from('audit_logs')
          .select('*', { count: 'exact', head: true })

        setTotalLogs(count || 0)
      } catch (err: any) {
        console.error('Error fetching audit logs:', err)
        setError(err.message || 'Failed to load audit logs')
      } finally {
        setFetching(false)
      }
    }

    fetchData()
  }, [supabase, router])

  const toggleSelectAll = () => {
    if (selectedLogs.size === auditLogs.length) {
      setSelectedLogs(new Set())
    } else {
      setSelectedLogs(new Set(auditLogs.map(log => log.id)))
    }
  }

  const toggleSelectLog = (logId: string) => {
    const newSelected = new Set(selectedLogs)
    if (newSelected.has(logId)) {
      newSelected.delete(logId)
    } else {
      newSelected.add(logId)
    }
    setSelectedLogs(newSelected)
  }

  const handleBulkDelete = async () => {
    if (selectedLogs.size === 0) return

    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch('/api/audit-logs/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logIds: Array.from(selectedLogs),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete audit logs')
      }

      // Remove deleted logs from state
      setAuditLogs(prev => prev.filter(log => !selectedLogs.has(log.id)))
      setTotalLogs(prev => prev - selectedLogs.size)
      setSelectedLogs(new Set())
      setIsBulkDeleteModalOpen(false)
      router.refresh()
    } catch (err: any) {
      console.error('Error deleting audit logs:', err)
      setError(err.message || 'Failed to delete audit logs')
    } finally {
      setIsDeleting(false)
    }
  }

  // Get logs by action type
  const actionCounts = auditLogs.reduce((acc: Record<string, number>, log) => {
    const action = log.action || 'unknown'
    acc[action] = (acc[action] || 0) + 1
    return acc
  }, {})

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
            <p className="text-gray-600">Loading audit logs...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-gray-600 mt-2">System-wide activity and transaction logs</p>
          </div>
          {selectedLogs.size > 0 && (
            <Button
              variant="outline"
              className="text-error-600 hover:text-error-700 hover:bg-error-50"
              onClick={() => setIsBulkDeleteModalOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected ({selectedLogs.size})
            </Button>
          )}
        </div>

        {error && (
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Logs</p>
                  <p className="text-3xl font-bold text-gray-900">{totalLogs}</p>
                </div>
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {Object.entries(actionCounts).slice(0, 3).map(([action, count]) => (
            <Card key={action}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1 capitalize">
                      {action.replace(/_/g, ' ')}
                    </p>
                    <p className="text-3xl font-bold text-gray-900">{count}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <ClipboardList className="w-6 h-6 text-primary-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Audit Logs Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary-600" />
                Recent Activity
              </CardTitle>
              {auditLogs.length > 0 && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {selectedLogs.size === auditLogs.length ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    <span>Select All</span>
                  </button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {auditLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 w-12">
                        <input
                          type="checkbox"
                          checked={selectedLogs.size === auditLogs.length && auditLogs.length > 0}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date & Time</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Action</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Company</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">User</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Details</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => {
                      const company = log.companies as { id: string; name: string } | null
                      const user = log.users as { id: string; email: string; role: string } | null
                      const isSelected = selectedLogs.has(log.id)
                      
                      return (
                        <tr 
                          key={log.id} 
                          className={`border-b border-gray-100 hover:bg-gray-50 ${isSelected ? 'bg-primary-50' : ''}`}
                        >
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectLog(log.id)}
                              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-900">
                                {formatDate(log.created_at)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 text-xs rounded-full bg-primary-100 text-primary-700 capitalize">
                              {log.action?.replace(/_/g, ' ') || 'Unknown'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {company ? (
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-900">{company.name}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">System</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {user ? (
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <div>
                                  <span className="text-sm text-gray-900">{user.email}</span>
                                  <span className="text-xs text-gray-500 ml-2 capitalize">
                                    ({user.role?.replace(/_/g, ' ')})
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">System</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {log.details && typeof log.details === 'object' ? (
                              <div className="text-sm text-gray-600">
                                {Object.entries(log.details).map(([key, value]) => (
                                  <div key={key} className="text-xs">
                                    <span className="font-medium">{key}:</span>{' '}
                                    <span>{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <DeleteAuditLogButton 
                              logId={log.id} 
                              action={log.action || 'Unknown'} 
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No audit logs found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bulk Delete Modal */}
      <Modal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => !isDeleting && setIsBulkDeleteModalOpen(false)}
        title="Delete Selected Audit Logs"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-warning-50 border border-warning-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-warning-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-warning-900">Delete {selectedLogs.size} Audit Log(s)</p>
              <p className="text-sm text-warning-700 mt-1">
                Are you sure you want to delete {selectedLogs.size} selected audit log(s)? This action cannot be undone.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-error-50 border border-error-200 rounded-lg">
              <p className="text-sm text-error-700">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setIsBulkDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              className="text-error-600 hover:text-error-700 hover:bg-error-50"
              onClick={handleBulkDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete {selectedLogs.size} Log(s)
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
