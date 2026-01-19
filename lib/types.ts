export type UserRole = 'platform_admin' | 'company_admin' | 'park_operator'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  company_id: string | null
  is_active: boolean
  last_login: string | null
  created_at: string
}

export interface Company {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  monime_account_id: string | null
  commission_rate: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Route {
  id: string
  company_id: string
  name: string
  origin: string
  destination: string
  fare_amount: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ParkOperator {
  id: string
  company_id: string
  user_id: string
  route_id: string | null
  location: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  user?: User
  route?: Route
}

export interface Ticket {
  id: string
  company_id: string
  route_id: string
  monime_transaction_id: string
  monime_otp_code: string
  passenger_phone: string
  fare_amount: number
  commission_amount: number
  status: 'pending' | 'validated' | 'used' | 'expired' | 'cancelled'
  validated_at: string | null
  validated_by: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
  route?: Route
}

export interface Transaction {
  id: string
  company_id: string
  ticket_id: string | null
  monime_transaction_id: string
  amount: number
  commission_amount: number
  net_amount: number
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  payment_method: string | null
  created_at: string
  updated_at: string
}

export interface Validation {
  id: string
  ticket_id: string
  park_operator_id: string
  otp_code: string
  is_valid: boolean
  validated_at: string
  notes: string | null
  ticket?: Ticket
  park_operator?: ParkOperator
}

export interface RevenueData {
  date: string
  revenue: number
  commission: number
  net_revenue: number
  ticket_count: number
}

