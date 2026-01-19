# Contact Requests Table Setup

## Quick Setup

To fix the "Could not find the table 'public.contact_requests'" error, run the SQL script in Supabase:

### Steps:

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to **SQL Editor**

2. **Run the Setup Script**
   - Open the file: `database/create-contact-requests-table.sql`
   - Copy the entire contents
   - Paste into Supabase SQL Editor
   - Click **Run** or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

3. **Verify Table Creation**
   - The script will output: "contact_requests table created successfully!"
   - You can verify by running: `SELECT * FROM contact_requests;`

## What This Script Creates:

- ✅ `contact_requests` table with all required fields
- ✅ Indexes for performance (status, created_at, email)
- ✅ Row Level Security (RLS) policies
- ✅ Platform admin access policies
- ✅ Public insert policy (for contact form)
- ✅ Auto-update trigger for `updated_at` timestamp

## Table Structure:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| company_name | VARCHAR(255) | Company name |
| legal_name | VARCHAR(255) | Legal registered name |
| business_registration_number | VARCHAR(255) | Business registration number |
| contact_person | VARCHAR(255) | Contact person name |
| email | VARCHAR(255) | Contact email |
| phone | VARCHAR(50) | Contact phone |
| address | TEXT | Company address |
| number_of_routes | VARCHAR(50) | Number of routes (e.g., "1-5", "6-10") |
| website | VARCHAR(500) | Company website (optional) |
| socials | TEXT | Social media handles (optional) |
| additional_info | TEXT | Additional information (optional) |
| status | VARCHAR(50) | Status: pending, contacted, in_progress, completed, rejected |
| created_at | TIMESTAMP | When request was submitted |
| updated_at | TIMESTAMP | Last update timestamp |
| contacted_at | TIMESTAMP | When company was first contacted |
| notes | TEXT | Admin notes |

## RLS Policies:

- **Platform Admins**: Can view and update all contact requests
- **Anyone**: Can insert contact requests (for the contact form)

## Troubleshooting:

If you still see errors after running the script:

1. **Check if table exists:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name = 'contact_requests';
   ```

2. **Check RLS policies:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'contact_requests';
   ```

3. **Verify platform admin user:**
   ```sql
   SELECT id, email, role FROM users WHERE role = 'platform_admin';
   ```

4. **If policies fail, you can temporarily disable RLS for testing:**
   ```sql
   ALTER TABLE contact_requests DISABLE ROW LEVEL SECURITY;
   ```
   (Remember to re-enable it after testing!)

## Next Steps:

After creating the table:
1. Test the contact form at `/contact`
2. Check platform admin dashboard at `/platform/contact-requests`
3. Verify requests appear in the table

