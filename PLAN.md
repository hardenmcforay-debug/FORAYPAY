# Foraypay Platform - Complete Implementation Plan

## Site Map & Feature List

### 1. Authentication Pages
- `/login` - Role-based login (Platform Admin, Company Admin, Park Operator)
- `/register` - Company registration (Platform Admin creates companies)
- `/forgot-password` - Password recovery

### 2. Platform Admin Dashboard (`/platform`)
- `/platform/dashboard` - Overview of all companies, total transactions, revenue
- `/platform/companies` - Company management (CRUD, suspend/activate)
- `/platform/commission-rules` - Set commission rates per company
- `/platform/audit-logs` - System-wide audit trail
- `/platform/users` - User management across companies
- `/platform/settings` - Platform settings

### 3. Company Admin Dashboard (`/company`)
- `/company/dashboard` - Revenue by route, total revenue, daily/weekly/monthly views
- `/company/routes` - Route management (create, edit, pricing)
- `/company/operators` - Park operator management (create, assign to routes)
- `/company/reports` - Detailed analytics and reports
- `/company/transactions` - Transaction history with filters
- `/company/settings` - Company settings, MoniMe account configuration

### 4. Park Operator Interface (`/operator`)
- `/operator/dashboard` - Today's validation summary
- `/operator/validate` - Ticket validation interface (OTP input)
- `/operator/trips` - Active trips and passenger counts
- `/operator/history` - Validation history

### 5. Passenger Interface (`/passenger`)
- `/passenger/retrieve` - Ticket retrieval by phone number or transaction ID
- `/passenger/ticket/[id]` - View ticket details and status

### 6. API Routes
- `/api/auth/*` - Authentication endpoints
- `/api/webhooks/monime` - MoniMe webhook handler
- `/api/tickets/*` - Ticket operations
- `/api/validation/*` - Ticket validation
- `/api/companies/*` - Company operations
- `/api/routes/*` - Route operations
- `/api/operators/*` - Operator operations
- `/api/reports/*` - Reporting endpoints

## Component Structure

### Layout Components
- `Layout` - Main layout wrapper
- `Sidebar` - Navigation sidebar
- `Header` - Top header with user info
- `MobileNav` - Mobile navigation

### UI Components
- `Button` - Reusable button component
- `Input` - Form input component
- `Card` - Card container
- `Table` - Data table component
- `Modal` - Modal dialog
- `Badge` - Status badges
- `Loading` - Loading spinner
- `EmptyState` - Empty state placeholder
- `Chart` - Revenue charts
- `FormField` - Form field wrapper

### Feature Components
- `TicketValidator` - OTP validation interface
- `RevenueChart` - Revenue visualization
- `RouteCard` - Route display card
- `TransactionRow` - Transaction table row
- `OperatorCard` - Operator display card
- `CompanyCard` - Company display card

## Database Schema (Supabase)

### Tables:
1. `companies` - Company/tenant data
2. `users` - User accounts with roles
3. `routes` - Transport routes
4. `park_operators` - Park operator accounts
5. `tickets` - Generated tickets
6. `transactions` - Payment transactions
7. `validations` - Ticket validation records
8. `commission_settlements` - Commission tracking
9. `audit_logs` - System audit trail
10. `monime_webhooks` - Webhook event log

## Design System

### Colors
- Primary: Blue (#2563EB)
- Success: Green (#10B981)
- Warning: Orange (#F59E0B)
- Error: Red (#EF4444)
- Neutral: Gray scale

### Typography
- Headings: Inter Bold
- Body: Inter Regular
- Code: JetBrains Mono

### Spacing
- Base unit: 4px
- Consistent spacing scale

### Icons
- Use Lucide React icons (no stickers/emojis)

## Technology Stack
- Next.js 14 (App Router)
- TypeScript
- Supabase (Auth, Database, Storage)
- Tailwind CSS
- React Hook Form
- Zod (validation)
- Recharts (charts)
- Lucide React (icons)

