# Foraypay - Digital Transport Ticketing Platform

**One Tap. One Ticket.**

A B2B digital transport ticketing and revenue-control platform for Sierra Leone. This platform enables transport companies to replace cash transactions with verifiable digital payments while providing real-time revenue visibility and control.

## 🎯 Overview

Foraypay is a multi-tenant SaaS platform that helps transport companies:
- Eliminate cash handling and revenue leakage
- Gain real-time visibility into passenger counts and revenue
- Reduce disputes through verifiable digital tickets
- Maintain control over park operators and routes

## 🏗️ Architecture

### Multi-Tenant System
- **One Platform, Many Companies**: Each company operates as an isolated tenant
- **Strict Data Isolation**: All queries are filtered by `company_id`
- **Per-Company Configuration**: Commission rates, MoniMe accounts, routes, and operators are company-specific

### Technology Stack
- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Charts**: Recharts
- **Icons**: Lucide React

## 📁 Project Structure

```
FORAYPAY/
├── app/                          # Next.js App Router pages
│   ├── api/                      # API routes
│   │   ├── webhooks/             # MoniMe webhook handler
│   │   └── tickets/              # Ticket operations
│   ├── company/                  # Company admin pages
│   │   ├── dashboard/            # Revenue dashboard
│   │   ├── routes/               # Route management
│   │   ├── operators/            # Park operator management
│   │   ├── reports/              # Analytics and reports
│   │   └── transactions/         # Transaction history
│   ├── operator/                 # Park operator pages
│   │   ├── dashboard/            # Operator dashboard
│   │   ├── validate/             # Ticket validation interface
│   │   └── history/              # Validation history
│   ├── passenger/                # Passenger pages
│   │   └── retrieve/             # Ticket retrieval
│   ├── platform/                 # Platform admin pages
│   │   ├── dashboard/            # Platform overview
│   │   └── companies/            # Company management
│   ├── login/                    # Authentication
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home/redirect page
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── ui/                       # Reusable UI components
│   ├── layout/                   # Layout components
│   └── features/                 # Feature-specific components
├── lib/                          # Utilities and helpers
│   ├── supabase/                 # Supabase client setup
│   ├── utils.ts                  # Utility functions
│   └── types.ts                  # TypeScript types
├── database/                     # Database schema
│   └── schema.sql                # PostgreSQL schema
├── middleware.ts                 # Next.js middleware
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies

```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account and project
- MoniMe API credentials (for payment integration)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FORAYPAY
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. **Set up the database**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the SQL script from `database/schema.sql`
   - This will create all necessary tables, indexes, and RLS policies

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🚀 Deployment

### Quick Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add environment variables in Vercel Dashboard
4. Click Deploy - Done!

**See `QUICK_DEPLOY.md` for step-by-step instructions.**

### Other Deployment Options

- **Self-Hosted**: See `DEPLOYMENT_GUIDE.md` for VPS deployment
- **Docker**: See `DEPLOYMENT_GUIDE.md` for containerized deployment

### Required Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Get these from: Supabase Dashboard → Project Settings → API

## 🔐 User Roles

### Platform Admin
- Manages all companies on the platform
- Sets commission rules
- Views system-wide audit logs
- Manages platform users

### Company Admin
- Views revenue dashboards (by route and total)
- Manages routes and pricing
- Manages park operators
- Views reports and analytics
- Configures MoniMe account

### Park Operator
- Validates tickets using OTP codes
- Views trip passenger counts
- Views validation history
- Cannot edit financial data

### Passenger
- Retrieves tickets by phone number or transaction ID
- Views ticket status and details

## 💳 Payment Flow (Offline Payment)

1. **Routes & Prices Provided**
   - Routes are synced from ForayPay to MoniMe
   - Routes and prices are provided by MoniMe to passengers
   - Passengers see routes and prices in MoniMe app

2. **Passenger Payment (OFFLINE)**
   - Passenger views routes offline (cached in MoniMe app)
   - **Passenger pays fare using MoniMe offline payment** - NO INTERNET REQUIRED
   - Payment is processed via MoniMe's offline payment system
   - MoniMe generates unique order number
   - MoniMe queues payment information locally

3. **Payment Sync & Webhook**
   - When MoniMe has internet connection, it syncs offline payments
   - **MoniMe sends payment information to ForayPay company via webhook**
   - Webhook received at `/api/webhooks/monime`
   - System verifies transaction authenticity
   - Server-side ticket is generated
   - Ticket linked to: MoniMe order number, transaction ID, phone number, route
   - **Database is the source of truth**

4. **Ticket Validation**
   - Park operator enters MoniMe order number
   - System verifies ticket status in database
   - Ticket marked as USED
   - All actions logged in audit_logs

5. **Commission Settlement**
   - Commission calculated automatically
   - Recorded in commission_settlements table
   - Auto-settled in MVP (Phase 1)

## 🔒 Security Features

- **Row Level Security (RLS)**: Database-level data isolation
- **Role-Based Access Control**: Strict permission system
- **Idempotent Webhooks**: Prevents duplicate ticket creation
- **Audit Logging**: All actions are logged
- **Tenant Isolation**: No cross-company data visibility

## 📊 Key Features

### For Companies
- Real-time revenue dashboards
- Route-based revenue breakdown
- Transaction history
- Park operator management
- Commission tracking

### For Park Operators
- Simple order number validation interface
- Real-time passenger count
- Validation history
- Route-specific validation (if assigned)

### For Platform
- Multi-tenant management
- Commission rule configuration
- System-wide audit logs
- Company onboarding

## 🧪 Testing

### Manual Testing Checklist
- [ ] User authentication (all roles)
- [ ] Ticket creation via webhook
- [ ] Ticket validation by operator
- [ ] Ticket retrieval by passenger
- [ ] Revenue dashboard accuracy
- [ ] Route management
- [ ] Operator management
- [ ] Commission calculation
- [ ] Audit logging

## 🚢 Deployment

### Production Deployment Guide

**📋 See `MONIME-PRODUCTION-CONFIG.md` for complete production setup instructions**, including:
- Production environment variables configuration
- MoniMe webhook setup
- Database production setup
- Security considerations
- Deployment checklist
- Troubleshooting production issues

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables (see `MONIME-PRODUCTION-CONFIG.md`)
4. Deploy

### Other Platforms
The application can be deployed to any platform supporting Next.js:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## 📝 API Endpoints

### Webhooks
- `POST /api/webhooks/monime` - MoniMe payment webhook

### Tickets
- `POST /api/tickets/validate` - Validate ticket by MoniMe order number (authenticated)
- `POST /api/tickets/retrieve` - Retrieve ticket by phone/transaction ID

## 🔧 Configuration

### Commission Rates
Set per company in the `companies` table. Default: 2.5%

### Ticket Expiration
Tickets expire 24 hours after creation (configurable in webhook handler)

### MoniMe Integration
Configure MoniMe account ID per company in the `companies.monime_account_id` field

## 📚 Database Schema

Key tables:
- `companies` - Tenant/company data
- `users` - User accounts with roles
- `routes` - Transport routes
- `park_operators` - Operator accounts
- `tickets` - Generated tickets
- `transactions` - Payment records
- `validations` - Validation history
- `commission_settlements` - Commission tracking
- `audit_logs` - System audit trail
- `monime_webhooks` - Webhook event log

See `database/schema.sql` for complete schema.

## 🐛 Troubleshooting

### Common Issues

**Issue**: Cannot connect to Supabase
- Check environment variables
- Verify Supabase project is active
- Check network connectivity

**Issue**: Webhook not processing
- Verify webhook URL is accessible
- Check webhook_id uniqueness
- Review error logs in `monime_webhooks` table

**Issue**: Tickets not validating
- Check ticket status (must be 'pending')
- Verify OTP code matches
- Check operator route assignment

## 📄 License

[Your License Here]

## 👥 Support

For support, email support@foraypay.com or create an issue in the repository.

## 🗺️ Roadmap

### Phase 1 (MVP) - ✅ Current
- Basic ticketing system
- Payment integration
- Operator validation
- Revenue dashboards

### Phase 2 (Future)
- Mobile apps
- Offline mode
- Advanced analytics
- SMS notifications
- Multi-language support

---

**Built with ❤️ for Sierra Leone's transport industry**

