# ForayPay - Digital Transport Ticketing Platform

A B2B digital transport ticketing and revenue-control platform for Sierra Leone.

**Slogan:** "One Tap. One Ticket."

## Overview

ForayPay is a multi-tenant platform that enables transport companies to:
- Replace cash payments with verifiable digital transactions
- Gain real-time visibility into revenue and passenger counts
- Reduce revenue leakage through automated commission settlement
- Maintain strict control over ticket validation

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database & Auth:** Supabase
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Charts:** Recharts
- **Language:** TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
MONIME_API_URL=https://api.monime.com
MONIME_API_KEY=your_monime_api_key
MONIME_PLATFORM_ACCOUNT_ID=your_platform_monime_account_id
MONIME_WEBHOOK_SECRET=your_monime_webhook_secret
```

4. Set up the database:
Run the SQL schema from `supabase/schema.sql` in your Supabase SQL editor.

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Auth pages (login)
│   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── platform/      # Platform admin dashboard
│   │   ├── company/       # Company admin dashboard
│   │   └── operator/      # Park operator dashboard
│   ├── api/               # API routes
│   │   └── webhooks/      # Webhook handlers
│   └── ticket/            # Public ticket retrieval
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── dashboard/        # Dashboard-specific components
│   └── layout/           # Layout components
├── lib/                  # Utilities and helpers
│   ├── supabase/         # Supabase client setup
│   └── utils/            # Helper functions
└── types/                # TypeScript type definitions
```

## Key Features

### Multi-Tenant Architecture
- Strict data isolation per company
- Row-level security policies
- Per-company configuration

### Payment Integration
- MoniMe payment webhook handling
- OTP-based ticket validation
- Idempotent transaction processing

### Role-Based Access
- **Platform Admin:** Manage all companies (login at `/admin/login`)
- **Company Admin:** Manage routes, operators, view revenue
- **Park Operator:** Validate tickets, view trip data

### Revenue Control
- Real-time revenue dashboards
- Route-based revenue breakdown
- Automated commission calculation
- Audit logging

### High-Performance Architecture
- **Handles 10,000+ concurrent transactions** without crashes
- **Handles 10,000+ concurrent ticket creations** from multiple companies
- **Handles 10,000+ concurrent ticket validations** from multiple companies
- Async queue processing for webhook handling
- Batch ticket creation (100 tickets per batch)
- Optimized ticket validation with optimistic locking
- Operator data caching (90%+ cache hit rate)
- Connection pooling for database efficiency
- Batch operations for audit logs
- Rate limiting and circuit breakers
- Optimized database indexes and constraints
- Automatic conflict resolution for concurrent writes
- RLS (Row Level Security) policies for data isolation
- Two-tier security model (application + database level)
- See [SCALABILITY_GUIDE.md](./SCALABILITY_GUIDE.md), [TICKET_CREATION_SCALABILITY.md](./TICKET_CREATION_SCALABILITY.md), [TICKET_VALIDATION_SCALABILITY.md](./TICKET_VALIDATION_SCALABILITY.md), and [TICKET_VALIDATION_RLS.md](./TICKET_VALIDATION_RLS.md) for details

### Security Features
- **Comprehensive Input Validation** - UUID, email, phone, OTP, password validation
- **Secure Error Handling** - No information disclosure, sanitized error messages
- **Security Headers** - XSS protection, clickjacking prevention, MIME sniffing protection
- **Webhook Security** - HMAC signature verification, secret validation
- **Strong Password Policy** - Minimum 8 characters with complexity requirements
- **SQL Injection Prevention** - Parameterized queries, input sanitization
- **XSS Prevention** - HTML sanitization, Content-Security-Policy
- **Authentication & Authorization** - Role-based access control, company isolation
- **Audit Logging** - All critical actions logged
- See [SECURITY_AUDIT_REPORT.md](./SECURITY_AUDIT_REPORT.md) and [SECURITY_HARDENING_SUMMARY.md](./SECURITY_HARDENING_SUMMARY.md) for details

## Database Schema

See `supabase/schema.sql` for complete database schema including:
- Companies (multi-tenant)
- Users (role-based)
- Routes
- Park Operators
- Tickets
- Transactions
- Audit Logs

## API Endpoints

- `POST /api/webhooks/monime` - MoniMe payment webhook
- `POST /api/tickets/validate` - Validate ticket with OTP
- `GET /api/tickets/retrieve` - Retrieve ticket by phone
- `GET /api/revenue` - Revenue data (company-scoped)

## Security

- Row Level Security (RLS) enabled on all tables
- All queries filtered by company_id
- Platform admin bypass for system management
- Audit logging for all critical actions

## Documentation

### Setup & Configuration
- [Environment Variables Setup](./ENV-SETUP.md) - Configure environment variables
- [Platform Admin Setup](./PLATFORM_ADMIN_LOGIN_LOCALHOST.md) - Set up Platform Admin account
- [Supabase Storage Setup](./SUPABASE_STORAGE_SETUP.md) - Configure image storage

### Deployment
- [Deployment Guide](./DEPLOYMENT.md) - Complete deployment instructions
- [Platform Admin Domain Setup](./PLATFORM_ADMIN_DOMAIN_SETUP.md) - Configure separate admin domain
- [Vercel Environment Setup](./VERCEL_ENV_SETUP.md) - Vercel-specific configuration
- [Alternative Deployment](./ALTERNATIVE_DEPLOYMENT.md) - Other deployment options

### Security & Performance
- [Security Audit Report](./SECURITY_AUDIT_REPORT.md) - Security assessment
- [Security Hardening Summary](./SECURITY_HARDENING_SUMMARY.md) - Security measures
- [Scalability Guide](./SCALABILITY_GUIDE.md) - Performance optimization

## License

Proprietary - ForayPay Platform

