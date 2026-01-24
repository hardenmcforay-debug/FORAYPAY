# Company Isolation Security Measures

This document outlines all security measures implemented to ensure strict data isolation between companies. Park operators from Company A must NEVER see or access Company B data.

## Database Level Security (RLS Policies)

### Tickets Table
- **Policy**: "Park operators can view tickets in their company"
  - Operators can ONLY see tickets where `tickets.company_id = park_operators.company_id`
  - Prevents cross-company ticket viewing

- **Policy**: "Park operators can update tickets they validate"
  - Operators can ONLY update tickets from their own company
  - Additional check: `status = 'pending'` (can only validate pending tickets)

### Routes Table
- **Policy**: "Park operators can view routes in their company"
  - Operators can ONLY see routes where `routes.company_id = park_operators.company_id`
  - Prevents cross-company route access

### Payment Codes Table
- **Policy**: "Operators can view payment codes in their company"
  - Operators can ONLY see payment codes where `payment_codes.company_id = park_operators.company_id`
  - Prevents cross-company code viewing

## API Endpoint Security

### `/api/tickets/validate` (POST)
**Multi-layer security checks:**

1. **Operator Verification**
   - Verifies user is a park operator
   - Checks operator has `company_id` assigned
   - Validates operator is not suspended

2. **Company Isolation**
   - Query filters: `.eq('company_id', operator.company_id)`
   - Double-check: `ticket.company_id !== operator.company_id` → Reject
   - Update query includes: `.eq('company_id', operator.company_id)`

3. **Route Authorization**
   - Verifies operator is assigned to the route
   - Prevents validating tickets for unassigned routes

**Result**: Company A operators CANNOT validate Company B tickets, even if they somehow get the OTP.

### `/api/tickets/request-codes` (POST)
**Multi-layer security checks:**

1. **Operator Verification**
   - Verifies user is a park operator
   - Checks operator has `company_id` assigned
   - Validates operator is not suspended

2. **Company Isolation**
   - Route query filters: `.eq('company_id', operator.company_id)`
   - Double-check: `route.company_id !== operator.company_id` → Reject
   - Payment code stored with operator's `company_id`

3. **Route Authorization**
   - Verifies route belongs to operator's company
   - Verifies operator is assigned to the route

**Result**: Company A operators CANNOT generate codes for Company B routes.

## Frontend Security

### Validate Tickets Page (`/operator/validate`)
- All queries filter by `operator.company_id`
- Double-check: `ticket.company_id !== operator.company_id` → Error
- Only displays tickets from operator's company

### Generate Tickets Page (`/operator/generate`)
- Only fetches routes assigned to operator
- Routes filtered by `operator.company_id`
- Cannot select routes from other companies

### Dashboard & Trips Pages
- All statistics queries filter by `company_id`
- Only shows data from operator's company
- Revenue calculations limited to operator's company

## Webhook Security

### `/api/webhooks/monime` (POST)
- Payment codes are linked to `company_id` when created
- Webhook validates payment code belongs to correct company
- Tickets created with `company_id` from payment code
- Prevents cross-company ticket creation

## Security Logging

All security violations are logged:
- Cross-company access attempts
- Invalid company_id mismatches
- Unauthorized route access attempts

## Summary

**Company A Park Operator CAN:**
- ✅ View tickets from Company A
- ✅ Validate tickets from Company A
- ✅ Generate codes for Company A routes
- ✅ View statistics for Company A

**Company A Park Operator CANNOT:**
- ❌ View tickets from Company B
- ❌ Validate tickets from Company B (even with OTP)
- ❌ Generate codes for Company B routes
- ❌ View statistics for Company B
- ❌ Access any Company B data

## Defense in Depth

Multiple security layers ensure isolation:
1. **Database RLS**: First line of defense at database level
2. **API Validation**: Second layer with explicit company_id checks
3. **Frontend Filtering**: Third layer in UI queries
4. **Double-Checks**: Additional validation to catch edge cases
5. **Audit Logging**: Tracks all access attempts

Even if one layer fails, other layers prevent cross-company access.

