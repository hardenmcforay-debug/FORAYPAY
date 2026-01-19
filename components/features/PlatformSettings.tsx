'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'
import { Users, DollarSign, FileText, Shield } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Operator {
  id: string
  users: { full_name: string; email: string } | null
  companies: { name: string } | null
  routes: { origin: string; destination: string } | null
  location: string | null
  is_active: boolean
  created_at: string
  user_id?: string
}

interface Company {
  id: string
  name: string
  commission_rate: number
  is_active: boolean
}

interface Transaction {
  id: string
  companies: { name: string } | null
  amount: number
  commission_amount: number
  status: string
  created_at: string
}

interface PlatformSettingsProps {
  operators: Operator[]
  companies: Company[]
  transactions: Transaction[]
}

export default function PlatformSettings({ operators, companies, transactions }: PlatformSettingsProps) {
  const [activeTab, setActiveTab] = useState<'operators' | 'commission' | 'transactions' | 'suspension'>('operators')
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [showSuspendModal, setShowSuspendModal] = useState(false)
  const [suspensionReason, setSuspensionReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null)
  const [editRates, setEditRates] = useState<Record<string, string>>({})
  const [savingCompanyId, setSavingCompanyId] = useState<string | null>(null)

  const supabase = createClient()

  const handleSuspendOperator = async () => {
    if (!selectedOperator) return
    setIsLoading(true)
    try {
      const response = await fetch('/api/operators/suspend', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operatorId: selectedOperator.id,
          isActive: !selectedOperator.is_active,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update operator status')
      }

      window.location.reload()
    } catch (error: any) {
      console.error('Error suspending operator:', error)
      alert(error.message || 'Failed to update operator status')
    } finally {
      setIsLoading(false)
      setShowSuspendModal(false)
      setSelectedOperator(null)
    }
  }

  const handleSuspendCompany = async () => {
    if (!selectedCompany) return
    setIsLoading(true)
    try {
      const response = await fetch('/api/companies/suspend', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: selectedCompany.id,
          isActive: !selectedCompany.is_active,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update company status')
      }

      window.location.reload()
    } catch (error: any) {
      console.error('Error suspending company:', error)
      alert(error.message || 'Failed to update company status')
    } finally {
      setIsLoading(false)
      setShowSuspendModal(false)
      setSelectedCompany(null)
    }
  }


  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'operators', label: 'Manage Operators', icon: Users },
            { id: 'commission', label: 'Commission Rules', icon: DollarSign },
            { id: 'transactions', label: 'Audit Transactions', icon: FileText },
            { id: 'suspension', label: 'Access Control', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Operators Tab */}
      {activeTab === 'operators' && (
        <Card>
          {operators.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No operators found</p>
              <p className="text-sm text-gray-400">
                Operators will appear here once companies create park operator accounts.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operator</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {operators.map((operator) => (
                    <tr key={operator.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{operator.users?.full_name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{operator.users?.email || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{operator.companies?.name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {operator.routes ? `${operator.routes.origin} - ${operator.routes.destination}` : 'Not assigned'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={operator.is_active ? 'success' : 'error'}>
                          {operator.is_active ? 'Active' : 'Suspended'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedOperator(operator)
                            setShowSuspendModal(true)
                          }}
                        >
                          {operator.is_active ? 'Suspend' : 'Activate'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Commission Rules Tab */}
      {activeTab === 'commission' && (
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Commission Rates by Company</h3>
            <p className="text-sm text-gray-600">Set and update commission rates for each company. Changes take effect immediately.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">New Rate (%)</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {companies.map((company) => {
                  const isEditing = editingCompanyId === company.id
                  const currentEditRate = editRates[company.id] || company.commission_rate.toString()
                  const isSaving = savingCompanyId === company.id

                  const handleStartEdit = () => {
                    setEditingCompanyId(company.id)
                    setEditRates({ ...editRates, [company.id]: company.commission_rate.toString() })
                  }

                  const handleCancelEdit = () => {
                    setEditingCompanyId(null)
                    const newRates = { ...editRates }
                    delete newRates[company.id]
                    setEditRates(newRates)
                  }

                  const handleSaveCommission = async () => {
                    const rateNum = parseFloat(currentEditRate)
                    if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
                      alert('Commission rate must be between 0 and 100')
                      return
                    }

                    setSavingCompanyId(company.id)
                    try {
                      const response = await fetch('/api/companies/update-commission', {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          companyId: company.id,
                          commissionRate: rateNum,
                        }),
                      })

                      const result = await response.json()

                      if (!response.ok) {
                        throw new Error(result.error || 'Failed to update commission rate')
                      }

                      setEditingCompanyId(null)
                      const newRates = { ...editRates }
                      delete newRates[company.id]
                      setEditRates(newRates)
                      window.location.reload()
                    } catch (error: any) {
                      console.error('Error updating commission:', error)
                      alert(error.message || 'Failed to update commission rate')
                    } finally {
                      setSavingCompanyId(null)
                    }
                  }

                  return (
                    <tr key={company.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{company.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-semibold">{company.commission_rate}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              value={currentEditRate}
                              onChange={(e) => setEditRates({ ...editRates, [company.id]: e.target.value })}
                              className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                              min="0"
                              max="100"
                              step="0.1"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveCommission()
                                } else if (e.key === 'Escape') {
                                  handleCancelEdit()
                                }
                              }}
                            />
                            <span className="text-sm text-gray-500">%</span>
                          </div>
                        ) : (
                          <button
                            onClick={handleStartEdit}
                            className="text-sm text-primary-600 hover:text-primary-700 font-medium underline"
                          >
                            Click to edit
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {isEditing ? (
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCancelEdit}
                              disabled={isSaving}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleSaveCommission}
                              isLoading={isSaving}
                            >
                              Save
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleStartEdit}
                          >
                            Edit
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(transaction.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{transaction.companies?.name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(transaction.amount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(transaction.commission_amount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={transaction.status === 'completed' ? 'success' : 'warning'}>
                        {transaction.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Suspension Tab */}
      {activeTab === 'suspension' && (
        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Suspend Companies</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {companies.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{company.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={company.is_active ? 'success' : 'error'}>
                          {company.is_active ? 'Active' : 'Suspended'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCompany(company)
                            setShowSuspendModal(true)
                          }}
                        >
                          {company.is_active ? 'Suspend Access' : 'Activate Access'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Suspend Modal */}
      <Modal
        isOpen={showSuspendModal}
        onClose={() => {
          setShowSuspendModal(false)
          setSelectedOperator(null)
          setSelectedCompany(null)
          setSuspensionReason('')
        }}
        title={selectedOperator ? 'Suspend Operator' : selectedCompany ? 'Suspend Company' : 'Suspend Access'}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {selectedOperator
              ? `Are you sure you want to ${selectedOperator.is_active ? 'suspend' : 'activate'} ${selectedOperator.users?.full_name}?`
              : selectedCompany
              ? `Are you sure you want to ${selectedCompany.is_active ? 'suspend' : 'activate'} ${selectedCompany.name}? This will affect all users in this company.`
              : ''}
          </p>
          <Input
            label="Reason (optional)"
            value={suspensionReason}
            onChange={(e) => setSuspensionReason(e.target.value)}
            placeholder="Enter reason for suspension..."
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setShowSuspendModal(false)
                setSelectedOperator(null)
                setSelectedCompany(null)
                setSuspensionReason('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant={selectedOperator?.is_active || selectedCompany?.is_active ? 'danger' : 'primary'}
              onClick={selectedOperator ? handleSuspendOperator : handleSuspendCompany}
              isLoading={isLoading}
            >
              {selectedOperator?.is_active || selectedCompany?.is_active ? 'Suspend' : 'Activate'}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  )
}

