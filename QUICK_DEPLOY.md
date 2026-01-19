# Quick Deployment Guide - ForayPay

## 🚀 Fastest Way: Deploy to Vercel (5 minutes)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign up
2. Click **"New Project"**
3. Import your GitHub repository
4. Click **"Deploy"**

### Step 3: Add Environment Variables
In Vercel Dashboard → Your Project → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 4: Redeploy
Click **"Redeploy"** after adding environment variables.

**Done!** Your app is live at `https://your-project.vercel.app`

---

## 📋 Pre-Deployment Checklist

- [ ] Code pushed to GitHub/GitLab
- [ ] Supabase project created
- [ ] Database schema executed (`database/schema.sql`)
- [ ] Environment variables ready
- [ ] Platform admin account created (see SETUP.md)

---

## 🔧 Environment Variables Needed

Copy these from Supabase Dashboard → Settings → API:

1. **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
2. **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Keep secret!

---

## 🌐 Custom Domain (Optional)

1. In Vercel → Settings → Domains
2. Add your domain
3. Update DNS records as instructed
4. SSL certificate is automatic

---

## ✅ Verify Deployment

1. Visit your deployment URL
2. Test login page loads
3. Create platform admin account
4. Test creating a company

---

## 🆘 Need Help?

See `DEPLOYMENT_GUIDE.md` for detailed instructions including:
- Self-hosted deployment
- Docker deployment
- Troubleshooting
- Production best practices

