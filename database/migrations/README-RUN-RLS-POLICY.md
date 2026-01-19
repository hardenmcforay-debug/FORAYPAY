# How to Run the Park Operators RLS Policy Migration

## Problem
You're getting a syntax error because `\i` is a **psql command** (PostgreSQL command-line tool), but you're trying to run it in **Supabase SQL Editor**, which only accepts SQL commands.

## Solution: Run SQL Directly in Supabase

### Step 1: Open Supabase SQL Editor

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Copy the SQL

Open the file: `database/migrations/add-park-operators-rls-policy-RUN-THIS.sql`

**Copy ALL the SQL from this section (starting from the first DROP POLICY line):**

```sql
-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Park operators can view their own record" ON park_operators;
DROP POLICY IF EXISTS "Park operators can update their own record" ON park_operators;

-- Create policy for park operators to view their own record
CREATE POLICY "Park operators can view their own record"
  ON park_operators FOR SELECT
  USING (user_id = auth.uid());

-- Create index on user_id for better query performance (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_park_operators_user_id ON park_operators(user_id);

-- Add policy for park operators to update their own record (if needed)
CREATE POLICY "Park operators can update their own record"
  ON park_operators FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### Step 3: Paste and Run

1. **Paste** the SQL into the SQL Editor
2. Click the **Run** button (or press `Ctrl+Enter` / `Cmd+Enter`)

### Step 4: Verify (Optional)

To verify the policies were created, run this query:

```sql
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'park_operators';
```

You should see:
- `Park operators can view their own record` (cmd: SELECT)
- `Park operators can update their own record` (cmd: UPDATE)

## Important Notes

✅ **DO:** Copy and paste the SQL directly into Supabase SQL Editor  
❌ **DON'T:** Use `\i` command (this is for psql command-line tool, not Supabase)

## Alternative: If You Prefer Using psql Command-Line

If you're using psql command-line tool directly (not Supabase dashboard), then you CAN use:

```bash
psql -h your-db-host -U postgres -d postgres -f database/migrations/add-park-operators-rls-policy.sql
```

But for Supabase, always use the SQL Editor and paste the SQL directly.

## Troubleshooting

### Error: "policy already exists"
- The migration uses `DROP POLICY IF EXISTS`, so this shouldn't happen
- If it does, you can manually drop it first:
```sql
DROP POLICY "Park operators can view their own record" ON park_operators;
```

### Error: "permission denied"
- Make sure you're logged in as a database administrator
- In Supabase, the default user has admin privileges

### Still having issues?
- Check the server logs for detailed error messages
- The validation API now uses service role key as a fallback, so it should work even without these policies
- However, having the policies is recommended for proper RLS security

