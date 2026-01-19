# Environment Variables Setup Guide

## Quick Fix for "Service role key not found" Error

If you're getting the error: **"Server configuration error: Service role key not found"**, follow these steps:

### Step 1: Create `.env.local` file

In the root directory of your project, create a file named `.env.local` (if it doesn't exist).

### Step 2: Get your Supabase credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Project Settings** (gear icon in the left sidebar)
4. Click on **API** in the settings menu

### Step 3: Copy the required keys

You'll see three important values:

1. **Project URL** - Copy this as `NEXT_PUBLIC_SUPABASE_URL`
2. **anon/public key** - Copy this as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **service_role key** - Copy this as `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **This is the one you're missing!**

**Important:** The service_role key is different from the anon key. Make sure you're copying the **service_role** key, not the anon/public key.

### Step 4: Add to `.env.local`

Create or edit your `.env.local` file in the project root with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Example:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI4MCwiZXhwIjoxOTU0NTQzMjgwfQ.example
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjM4OTY3MjgwLCJleHAiOjE5NTQ1NDMyODB9.example
```

### Step 5: Restart your development server

After adding the environment variables:

1. Stop your development server (Ctrl+C)
2. Start it again: `npm run dev`

### Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env.local` to git (it should be in `.gitignore`)
- The service_role key bypasses Row Level Security - keep it secret!
- Only use the service_role key on the server-side (API routes), never in client-side code

### Verify Setup

After restarting, try creating a company again. The error should be resolved.

### MoniMe API Configuration (Optional - for route synchronization)

**Required for route synchronization with MoniMe:**

```env
MONIME_API_URL=https://api.monime.io/v1
MONIME_API_KEY=your_monime_api_key_here
MONIME_AUTH_SCHEME=Bearer
```

**Configuration Details:**
- `MONIME_API_URL` - MoniMe API base URL (must end with `/v1`): `https://api.monime.io/v1`
- `MONIME_API_KEY` - MoniMe API key for authentication (Bearer token)
- `MONIME_AUTH_SCHEME` - (Optional) Authorization scheme: `Bearer` (default, recommended), `API-Key`, `Token`, etc.

**Important:**
- The API URL must end with `/v1` (e.g., `https://api.monime.io/v1`)
- The client will automatically normalize the URL if needed
- Authorization header format: `Bearer <token>` (as per MoniMe API documentation)
- `Monime-Space-Id` header is automatically added for space-scoped endpoints

**Note:** If these are not configured, routes will still be created in ForayPay but won't be automatically synced to MoniMe. You can sync manually from the routes page.

### Still having issues?

1. Make sure the `.env.local` file is in the **root directory** (same level as `package.json`)
2. Check for typos in the variable names (they must match exactly)
3. Make sure there are no extra spaces or quotes around the values
4. Restart your development server after making changes

---

## Production Environment Configuration

For production deployment, see **`MONIME-PRODUCTION-CONFIG.md`** for:
- Production environment variable setup
- MoniMe webhook configuration
- Database production setup
- Security considerations
- Production deployment checklist
- Troubleshooting production issues

