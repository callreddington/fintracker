# 🚀 Deployment Checklist

**Quick reference for deploying FinTracker to production**

---

## ✅ Pre-Deployment (YOU DO THIS)

### 1. Create GitHub Repository (5 minutes)

1. Go to: https://github.com/new
2. Name: `fintracker`
3. Visibility: **Private**
4. Click "Create repository"

### 2. Push Code to GitHub

```bash
cd /Projects/fintracker

# Add GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/fintracker.git

# Push to GitHub
git push -u origin main
```

---

## 🔧 Upstash Redis Verification (3 minutes)

1. Login: https://console.upstash.com/
2. Click on your database: `easy-husky-28091`
3. Verify settings:
   - **Eviction Policy**: Should be `noeviction` (to prevent refresh token deletion)
   - **TLS**: Should be ✅ Enabled
   - **Region**: Note the region for Render setup

4. Test in Upstash CLI tab:

```redis
PING
SET test "hello"
GET test
DEL test
```

**That's it!** Your current Redis URL will work for both development and production.

---

## 🌐 Render Setup (15 minutes)

### Step 1: Create Account

1. Go to: https://render.com/
2. Sign up with GitHub (recommended)
3. Authorize Render to access repositories

### Step 2: Create Web Service

1. Dashboard → **New +** → **Web Service**
2. Connect your `fintracker` repository
3. Fill in these settings:

```yaml
Name: fintracker-api
Region: Frankfurt (EU Central) # Match Upstash region if possible
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm run start
Instance Type: Free (for testing) or Starter ($7/month)
```

4. Click **"Advanced"** and add these build settings:
   - **Auto-Deploy**: Yes
   - **Node Version**: 20

### Step 3: Environment Variables

Click **"Environment"** tab and add these (one by one):

#### Copy These Production Secrets (SAVE THEM!)

```bash
JWT_SECRET=d893cb51e39153e48187431529d1a41783501b48a536a360eafae301873b52b5
ENCRYPTION_KEY=87cb9c225a2b10b252c5e6eb039e913228e02be0fca1d87169af59a9729dadbf
SESSION_SECRET=97331b7b92bf9ff6828eadc4f88e3fd17d0d92a2e26ae7b17fceb3cacf98bdb1
```

#### Add All Environment Variables

```bash
# Application
NODE_ENV=production
PORT=10000
API_VERSION=v1

# Database (Supabase)
DATABASE_URL=postgresql://postgres.pccpmgwhkvfuutxcqsud:mMm1ogrWysgUXlcG@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_CONNECTION_TIMEOUT=5000

# Redis (Upstash) - Your existing URL
REDIS_URL=redis://default:AW27AAIncDIyMzg1NDRkNTMxOTY0NDM2OTg0MzEwODY4NmI2ZTdmMHAyMjgwOTE@easy-husky-28091.upstash.io:6379

# JWT (USE PRODUCTION SECRETS FROM ABOVE!)
JWT_SECRET=d893cb51e39153e48187431529d1a41783501b48a536a360eafae301873b52b5
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
REFRESH_TOKEN_ROTATION=true

# Encryption (USE PRODUCTION SECRET FROM ABOVE!)
ENCRYPTION_KEY=87cb9c225a2b10b252c5e6eb039e913228e02be0fca1d87169af59a9729dadbf

# Session (USE PRODUCTION SECRET FROM ABOVE!)
SESSION_SECRET=97331b7b92bf9ff6828eadc4f88e3fd17d0d92a2e26ae7b17fceb3cacf98bdb1

# CORS (Will update after deployment)
CORS_ORIGINS=https://fintracker-api.onrender.com

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX=5

# Frontend URL (Will update later)
FRONTEND_URL=http://localhost:5173

# Feature Flags
ENABLE_EMAIL_VERIFICATION=false
ENABLE_MFA=false
ENABLE_SMS_PARSING=true
```

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Wait ~5-10 minutes for deployment
3. Watch the **Logs** tab for progress

---

## ✅ Post-Deployment Verification (5 minutes)

### 1. Run Database Migrations

Once deployment shows "Live":

1. Go to **Shell** tab in Render
2. Run:

```bash
npm run migrate:latest
```

3. Verify:

```bash
npm run migrate:status
```

You should see all 6 migrations completed.

### 2. Test API Endpoints

Your API URL will be: `https://fintracker-api.onrender.com`

Test in your terminal:

```bash
# Health check
curl https://fintracker-api.onrender.com/health

# Register a user
curl -X POST https://fintracker-api.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!","full_name":"Test User"}'

# Login
curl -X POST https://fintracker-api.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'
```

### 3. Configure Render Settings

In Render Dashboard → **Settings**:

1. **Health Check Path**: `/health`
2. **Auto-Deploy**: ✅ Yes
3. **Pull Request Previews**: Optional

---

## 🎯 What You Should Have Now

- ✅ Code pushed to GitHub
- ✅ Backend API deployed on Render
- ✅ Redis connected via Upstash
- ✅ Database migrations run successfully
- ✅ API accessible at: `https://fintracker-api.onrender.com`

---

## 🔍 Quick Troubleshooting

### Build fails on Render?

- Check **Logs** tab for error messages
- Verify Node version is 20+
- Ensure all dependencies are in package.json

### Redis connection fails?

- Check Upstash console for connection limits
- Verify REDIS_URL in Render environment variables
- Redis should work on Render (no network restrictions like local)

### Database connection timeout?

- Verify DATABASE_URL is correct
- Check Supabase project isn't paused (free tier)
- Ensure SSL is enabled in connection string

### API not responding?

- Check Health Check Path is set to `/health`
- Verify instance is running (not sleeping - free tier sleeps after inactivity)
- Check Render Metrics for errors

---

## 📞 Support

If you encounter issues:

1. Check Render **Logs** tab first
2. Review **Metrics** for CPU/Memory spikes
3. Verify all environment variables are set
4. Check Upstash console for Redis errors

---

## ⏭️ Next Steps After Deployment

Once everything is working:

1. **Continue Development**:
   - Build Core Ledger Engine, or
   - Build PAYE Calculator & Income Tracking

2. **Set Up Frontend** (later):
   - Deploy React app to Vercel
   - Update CORS_ORIGINS in Render
   - Update FRONTEND_URL in Render

3. **Monitor Your App**:
   - Check Render logs daily initially
   - Monitor Upstash Redis usage
   - Watch Supabase database size

---

**Deployment time**: ~25 minutes total

**Let me know when you're ready to deploy!** 🚀
