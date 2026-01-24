# How to Run RLS SQL - Step by Step

## ⚠️ Important: Copy SQL Only, Not TypeScript Code!

The error you got was because you copied **TypeScript code** instead of **SQL code**.

## Step-by-Step Instructions

### Step 1: Open the SQL File

Open this file in your editor:
```
supabase/validation-stats-rls-direct.sql
```

### Step 2: Copy ALL the SQL Content

1. Open `supabase/validation-stats-rls-direct.sql`
2. Select **ALL** the content (Ctrl+A or Cmd+A)
3. Copy it (Ctrl+C or Cmd+C)

**What to copy:**
- ✅ SQL statements starting with `DROP VIEW`, `CREATE OR REPLACE FUNCTION`, etc.
- ✅ All the SQL code between `$$` markers
- ✅ All `GRANT` statements

**What NOT to copy:**
- ❌ TypeScript code like `const { data } = await supabase.rpc(...)`
- ❌ JavaScript/TypeScript examples
- ❌ Code from documentation files

### Step 3: Paste into Supabase SQL Editor

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Paste the SQL content (Ctrl+V or Cmd+V)
5. Click **Run** or press Ctrl+Enter

### Step 4: Verify Success

You should see:
- ✅ "Success. No rows returned" or similar success message
- ✅ No error messages

If you see errors, check:
- Did you copy the entire SQL file?
- Are there any TypeScript/JavaScript code mixed in?
- Did you copy from the correct file?

## Example: What SQL Looks Like

**✅ CORRECT - This is SQL:**
```sql
CREATE OR REPLACE FUNCTION get_validation_stats(
  p_company_id UUID DEFAULT NULL
)
RETURNS TABLE(...)
LANGUAGE plpgsql
AS $$
BEGIN
  -- SQL code here
END;
$$;
```

**❌ WRONG - This is TypeScript (don't copy this):**
```typescript
const { data } = await supabase.rpc('get_validation_stats', {
  p_company_id: null
})
```

## Quick Checklist

- [ ] Opened `supabase/validation-stats-rls-direct.sql`
- [ ] Selected ALL content (Ctrl+A)
- [ ] Copied it (Ctrl+C)
- [ ] Opened Supabase SQL Editor
- [ ] Pasted SQL content
- [ ] Clicked Run
- [ ] Saw success message

## Still Having Issues?

If you're still getting errors:

1. **Make sure you're copying from the SQL file**, not from:
   - Documentation files (.md files)
   - TypeScript files (.ts files)
   - Example code snippets

2. **Check the file extension**: It should be `.sql`, not `.ts` or `.md`

3. **Verify the content starts with SQL keywords** like:
   - `DROP VIEW`
   - `CREATE OR REPLACE FUNCTION`
   - `GRANT`

## After Running Successfully

Once the SQL runs successfully:
- ✅ RLS policies are now active
- ✅ Validation system still works (uses service role)
- ✅ System still handles 10,000+ concurrent validations
- ✅ Users can only see their company's stats

You're done! 🎉

