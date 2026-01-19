# ForayPay Deployment Guide

Complete guide to deploying ForayPay to production.

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] ✅ All environment variables configured
- [ ] ✅ Supabase database set up and migrated
- [ ] ✅ Domain name (optional but recommended)
- [ ] ✅ SSL certificate (handled automatically by most platforms)
- [ ] ✅ MoniMe API credentials (if using route sync)
- [ ] ✅ Platform admin account created
- [ ] ✅ Security audit completed
- [ ] ✅ Backup strategy in place

---

## 🚀 Deployment Options

### Option 1: Vercel (Recommended - Easiest)

Vercel is the recommended platform for Next.js applications. It offers:
- ✅ Zero-configuration deployment
- ✅ Automatic SSL certificates
- ✅ Global CDN
- ✅ Serverless functions
- ✅ Free tier available

#### Step 1: Prepare Your Code

```bash
# Ensure all changes are committed
git add .
git commit -m "Prepare for deployment"

# Push to GitHub/GitLab/Bitbucket
git push origin main
```

#### Step 2: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub/GitLab/Bitbucket
3. Import your repository

#### Step 3: Configure Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables, add:

```env
# Required - Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Optional - MoniMe Integration
MONIME_API_URL=https://api.monime.io/v1
MONIME_API_KEY=your_monime_api_key_here
MONIME_AUTH_SCHEME=Bearer

# Optional - Node Environment
NODE_ENV=production
```

**Important:**
- Add these for **Production**, **Preview**, and **Development** environments
- Never commit these to git
- Use Vercel's environment variable interface

#### Step 4: Deploy

1. Click **"Deploy"** in Vercel Dashboard
2. Vercel will automatically:
   - Detect Next.js
   - Install dependencies
   - Build the application
   - Deploy to production

#### Step 5: Configure Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your domain (e.g., `foraypay.com`)
3. Follow DNS configuration instructions
4. SSL certificate is automatically provisioned

#### Step 6: Verify Deployment

1. Visit your deployment URL: `https://your-project.vercel.app`
2. Test login functionality
3. Verify API routes are working
4. Check environment variables are loaded

---

### Option 2: Self-Hosted (VPS/Cloud Server)

For more control, deploy on your own server (AWS EC2, DigitalOcean, Linode, etc.).

#### Prerequisites

- Ubuntu 20.04+ or similar Linux distribution
- Node.js 18+ installed
- PM2 or similar process manager
- Nginx (for reverse proxy)
- Domain name with DNS configured

#### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

#### Step 2: Clone and Build

```bash
# Clone repository
git clone https://github.com/your-username/FORAYPAY.git
cd FORAYPAY

# Install dependencies
npm install

# Create production environment file
nano .env.production
```

Add environment variables to `.env.production`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
MONIME_API_URL=https://api.monime.io/v1
MONIME_API_KEY=your_monime_api_key_here
MONIME_AUTH_SCHEME=Bearer
NODE_ENV=production
```

#### Step 3: Build Application

```bash
# Build for production
npm run build

# Start with PM2
pm2 start npm --name "foraypay" -- start
pm2 save
pm2 startup
```

#### Step 4: Configure Nginx

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/foraypay
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/foraypay /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 5: Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is set up automatically
```

#### Step 6: Firewall Configuration

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

### Option 3: Docker Deployment

For containerized deployment:

#### Step 1: Create Dockerfile

Create `Dockerfile` in project root:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Step 2: Update next.config.js

Add output configuration:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Add this for Docker
  // ... rest of your config
}

module.exports = nextConfig
```

#### Step 3: Create docker-compose.yml

```yaml
version: '3.8'

services:
  foraypay:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - MONIME_API_URL=${MONIME_API_URL}
      - MONIME_API_KEY=${MONIME_API_KEY}
      - NODE_ENV=production
    restart: unless-stopped
```

#### Step 4: Build and Run

```bash
# Build image
docker build -t foraypay .

# Run container
docker run -p 3000:3000 --env-file .env.production foraypay

# Or use docker-compose
docker-compose up -d
```

---

## 🔧 Environment Variables Setup

### Required Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase Dashboard → Settings → API |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONIME_API_URL` | MoniMe API base URL | - |
| `MONIME_API_KEY` | MoniMe API key | - |
| `MONIME_AUTH_SCHEME` | MoniMe auth scheme | `Bearer` |
| `NODE_ENV` | Node environment | `production` |

---

## 🗄️ Database Setup

### Step 1: Run Database Schema

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `database/schema.sql`
3. Paste and execute
4. Verify tables are created

### Step 2: Verify RLS Policies

Ensure Row Level Security (RLS) is enabled on all tables:

```sql
-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### Step 3: Create Platform Admin

See `SETUP.md` for detailed instructions on creating the first platform admin user.

---

## 🔒 Security Checklist

Before going live, ensure:

- [ ] ✅ All environment variables are set
- [ ] ✅ `SUPABASE_SERVICE_ROLE_KEY` is never exposed to client
- [ ] ✅ Rate limiting is configured
- [ ] ✅ Security headers are enabled (via middleware)
- [ ] ✅ HTTPS is enforced
- [ ] ✅ Database backups are configured
- [ ] ✅ Error messages don't leak sensitive info
- [ ] ✅ Input validation is working
- [ ] ✅ Authentication is required on all protected routes

---

## 📊 Post-Deployment Verification

### 1. Test Authentication

```bash
# Test login
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### 2. Test API Endpoints

```bash
# Test public endpoint (should have rate limiting)
curl https://your-domain.com/api/tickets/retrieve \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"+232123456789"}'
```

### 3. Check Security Headers

```bash
curl -I https://your-domain.com | grep -i "x-"
```

Should see:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

### 4. Verify Rate Limiting

Make multiple rapid requests to `/api/tickets/retrieve` - should get 429 after limit.

### 5. Test Real-time Features

- Login as operator/company admin
- Verify dashboard updates in real-time
- Test ticket validation

---

## 🔄 Continuous Deployment

### GitHub Actions (for Vercel)

Vercel automatically deploys on git push. For manual control:

1. Go to Vercel Dashboard → Settings → Git
2. Configure deployment settings
3. Set up preview deployments for PRs

### Self-Hosted Auto-Deploy

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /path/to/FORAYPAY
            git pull
            npm install
            npm run build
            pm2 restart foraypay
```

---

## 🐛 Troubleshooting

### Build Fails

```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

### Environment Variables Not Loading

- Verify variable names match exactly
- Check for typos
- Restart server/rebuild after adding variables
- Use `console.log(process.env.VARIABLE_NAME)` to debug

### Database Connection Issues

- Verify Supabase URL and keys
- Check Supabase project is active
- Verify RLS policies allow access
- Check network/firewall rules

### Rate Limiting Not Working

- Verify middleware is running
- Check rate limit store is initialized
- For production, consider Redis-based rate limiting

---

## 📈 Monitoring & Maintenance

### Recommended Tools

1. **Error Tracking**: Sentry, Rollbar
2. **Analytics**: Google Analytics, Plausible
3. **Uptime Monitoring**: UptimeRobot, Pingdom
4. **Logs**: Logtail, Datadog

### Health Check Endpoint

Create `app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
}
```

---

## 🎯 Production Best Practices

1. **Enable Production Mode**: `NODE_ENV=production`
2. **Use CDN**: For static assets (Vercel does this automatically)
3. **Enable Caching**: Configure cache headers appropriately
4. **Monitor Performance**: Use Next.js Analytics or similar
5. **Regular Backups**: Set up automated database backups
6. **Update Dependencies**: Regularly update npm packages
7. **Monitor Logs**: Set up log aggregation
8. **Set Up Alerts**: For errors, downtime, etc.

---

## 📞 Support

For deployment issues:
1. Check logs (Vercel Dashboard or server logs)
2. Verify environment variables
3. Test locally with production environment variables
4. Check Supabase dashboard for database issues

---

## 🎉 You're Live!

Once deployed, your ForayPay platform will be accessible at your domain. Remember to:

1. Create your first platform admin account
2. Test all user flows
3. Monitor for errors
4. Set up backups
5. Configure monitoring

Good luck with your deployment! 🚀

