export type UserRole = 'platform_admin' | 'company_admin' | 'park_operator'

export interface Company {
  id: string
  name: string
  monime_account_id: string | null
  commission_rate: number
  status: 'active' | 'suspended'
  created_at: string
}

export interface User {
  id: string
  email: string
  role: UserRole
  company_id: string | null
  created_at: string
}

export interface Route {
  id: string
  company_id: string
  name: string
  origin: string
  destination: string
  fare: number
  status: 'active' | 'inactive'
  created_at: string
}

export interface ParkOperator {
  id: string
  company_id: string
  user_id: string
  name: string
  phone: string
  assigned_routes: string[]
  status: 'active' | 'suspended'
  created_at: string
}

export interface Ticket {
  id: string
  company_id: string
  route_id: string
  passenger_phone: string
  monime_transaction_id: string
  monime_otp: string
  status: 'pending' | 'used' | 'expired'
  created_at: string
  used_at: string | null
  validated_by: string | null
}

export interface Transaction {
  id: string
  company_id: string
  ticket_id: string
  amount: number
  commission: number
  net_amount: number
  status: 'completed' | 'pending' | 'failed'
  created_at: string
}

export interface AuditLog {
  id: string
  company_id: string | null
  user_id: string | null
  action: string
  details: Record<string, any>
  created_at: string
}

export interface MoniMeWebhookPayload {
  transaction_id: string
  amount: number
  phone: string
  otp: string
  status: 'success' | 'failed'
  timestamp: string
  metadata?: {
    route_id?: string
    company_id?: string
  }
}

