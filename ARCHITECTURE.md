# ForayPay Architecture Plan

## Site Map & Features

### Public Pages
1. **Landing Page** (`/`)
   - Hero section with value proposition
   - Features overview
   - Call-to-action for companies

2. **Login** (`/login`)
   - Email/password authentication for Company Admins and Park Operators
   - Role-based redirect after login

3. **Admin Login** (`/admin/login`)
   - Separate login page for Platform Administrators
   - Email/password authentication
   - Redirects to platform admin dashboard

3. **Ticket Retrieval** (`/ticket/retrieve`)
   - Public interface for passengers
   - Retrieve ticket by phone number
   - Display ticket details and OTP

### Platform Admin Dashboard (`/platform`)
1. **Companies Management**
   - List all companies
   - Create/edit company
   - Set commission rates
   - Manage MoniMe account references
   - Suspend/activate companies

2. **System Settings**
   - Platform-wide configuration
   - Commission rules

3. **Platform Reports**
   - Total transactions
   - Revenue overview
   - System health metrics

### Company Admin Dashboard (`/company`)
1. **Revenue Dashboard**
   - Total revenue (all routes)
   - Revenue by route breakdown
   - Commission paid
   - Net revenue
   - Real-time updates

2. **Routes Management**
   - Create/edit routes
   - Set fare prices
   - Activate/deactivate routes
   - View route statistics

3. **Park Operators Management**
   - Add/edit park operators
   - Assign to routes
   - View operator activity
   - Suspend operators

4. **Reports & Analytics**
   - Daily/weekly/monthly reports
   - Transaction history
   - Passenger counts
   - Revenue trends

5. **Settings**
   - Company profile
   - MoniMe account configuration
   - Notification preferences

### Park Operator Dashboard (`/operator`)
1. **Ticket Validation Interface**
   - OTP input field
   - Validate ticket
   - Mark as used
   - View ticket details

2. **Trip Dashboard**
   - Current trip passenger count
   - Today's validated tickets
   - Route information

3. **Activity Log**
   - Recent validations
   - Ticket history

## Database Schema (Supabase)

### Tables
1. **companies**
   - id (uuid, primary key)
   - name (text)
   - monime_account_id (text)
   - commission_rate (decimal)
   - status (text: active/suspended)
   - created_at (timestamp)

2. **users**
   - id (uuid, primary key, references auth.users)
   - email (text)
   - role (text: platform_admin/company_admin/park_operator)
   - company_id (uuid, references companies, nullable)
   - created_at (timestamp)

3. **routes**
   - id (uuid, primary key)
   - company_id (uuid, references companies)
   - name (text)
   - origin (text)
   - destination (text)
   - fare (decimal)
   - status (text: active/inactive)
   - created_at (timestamp)

4. **park_operators**
   - id (uuid, primary key)
   - company_id (uuid, references companies)
   - user_id (uuid, references users)
   - name (text)
   - phone (text)
   - assigned_routes (uuid[], references routes)
   - status (text: active/suspended)
   - created_at (timestamp)

5. **tickets**
   - id (uuid, primary key)
   - company_id (uuid, references companies)
   - route_id (uuid, references routes)
   - passenger_phone (text)
   - monime_transaction_id (text, unique)
   - monime_otp (text)
   - status (text: pending/used/expired)
   - created_at (timestamp)
   - used_at (timestamp, nullable)
   - validated_by (uuid, references park_operators, nullable)

6. **transactions**
   - id (uuid, primary key)
   - company_id (uuid, references companies)
   - ticket_id (uuid, references tickets)
   - amount (decimal)
   - commission (decimal)
   - net_amount (decimal)
   - status (text: completed/pending/failed)
   - created_at (timestamp)

7. **audit_logs**
   - id (uuid, primary key)
   - company_id (uuid, references companies, nullable)
   - user_id (uuid, references users, nullable)
   - action (text)
   - details (jsonb)
   - created_at (timestamp)

## Component Structure

### Layout Components
- `Layout` - Main app layout
- `Sidebar` - Navigation sidebar
- `Header` - Top header with user info
- `ProtectedRoute` - Route protection wrapper

### Dashboard Components
- `RevenueCard` - Revenue display card
- `RouteCard` - Route information card
- `TicketValidator` - OTP validation interface
- `DataTable` - Reusable data table
- `Chart` - Revenue charts

### Form Components
- `Input` - Text input
- `Select` - Dropdown select
- `Button` - Button component
- `Modal` - Modal dialog

### Design System
- Colors: Primary blue, Success green, Warning orange, Error red
- Typography: Inter font family
- Spacing: 4px base unit
- Icons: Lucide React icons

## API Routes

1. `/api/webhooks/monime` - MoniMe payment webhook
2. `/api/tickets/validate` - Validate ticket with OTP
3. `/api/tickets/retrieve` - Retrieve ticket by phone
4. `/api/routes` - CRUD operations for routes
5. `/api/operators` - CRUD operations for park operators
6. `/api/revenue` - Revenue data endpoints

## Security & Multi-Tenancy

- Row Level Security (RLS) policies in Supabase
- All queries filtered by company_id
- Platform admin can access all companies
- Company admin limited to their company
- Park operator limited to assigned routes

