# FinTracker Infrastructure Setup Guide

**Date**: 2026-01-07
**Status**: Ready for Deployment

---

## 📋 Current Status

✅ **Local Development**: Working

- Database: Supabase (connected)
- Redis: Upstash (credentials configured, network issues on local)
- Backend: Running on port 3000
- Authentication: Complete with JWT

⚠️ **Pending Setup**:

1. Push code to GitHub
2. Configure Render for backend deployment
3. Verify Upstash Redis settings
4. Deploy to production

---

## 1️⃣ GitHub Setup

### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `fintracker` or `personal-finance-tracker`
3. Description: "Personal Finance Tracker for Kenyan Employees"
4. Visibility: **Private** (recommended) or Public
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

### Step 2: Push Code to GitHub

```bash
# Add GitHub remote (replace with your repository URL)
git remote add origin https://github.com/YOUR_USERNAME/fintracker.git

# Verify remote
git remote -v

# Push to GitHub
git branch -M main
git push -u origin main
```

**Expected Output**:

```
Enumerating objects: XX, done.
Counting objects: 100% (XX/XX), done.
Writing objects: 100% (XX/XX), done.
To https://github.com/YOUR_USERNAME/fintracker.git
 * [new branch]      main -> main
```

---

## 2️⃣ Upstash Redis Setup

### Your Current Configuration

```
REDIS_URL=redis://default:AW27AAIncDIyMzg1NDRkNTMxOTY0NDM2OTg0MzEwODY4NmI2ZTdmMHAyMjgwOTE@easy-husky-28091.upstash.io:6379
```

### Verify Upstash Settings

1. **Login to Upstash Console**: https://console.upstash.com/
2. **Navigate to your Redis database** (easy-husky-28091)
3. **Check Configuration**:
   - ✅ Region: Should be close to your Render region (e.g., eu-west-1)
   - ✅ TLS: Enabled (required for production)
   - ✅ Eviction: Set to `noeviction` or `allkeys-lru`

### Settings to Verify

Go to **Database Details** → **Configuration**:

| Setting             | Recommended Value  | Why                                           |
| ------------------- | ------------------ | --------------------------------------------- |
| **Max Memory**      | 256 MB (free tier) | Sufficient for refresh tokens & rate limiting |
| **Eviction Policy** | `noeviction`       | Prevent token eviction                        |
| **TLS**             | Enabled            | Security requirement                          |
| **REST API**        | Optional           | Not needed for Node.js client                 |

### Test Redis Connection (from Upstash console)

In Upstash Console → **CLI**:

```redis
PING
# Expected: PONG

SET test "hello"
GET test
# Expected: "hello"

DEL test
```

### Update .env for Production (if needed)

If you need to enable TLS explicitly:

```bash
# Option 1: Use rediss:// (with double 's' for TLS)
REDIS_URL=rediss://default:PASSWORD@easy-husky-28091.upstash.io:6379

# Option 2: Your current URL should work (Upstash handles TLS automatically)
REDIS_URL=redis://default:PASSWORD@easy-husky-28091.upstash.io:6379
```

---

## 3️⃣ Render Setup (Backend Deployment)

### Step 1: Create Render Account

1. Go to https://render.com/
2. Sign up with GitHub (recommended for easy deployment)
3. Authorize Render to access your repositories

### Step 2: Create New Web Service

1. **Click "New +"** → **Web Service**
2. **Connect Repository**: Select your GitHub repository (`fintracker`)
3. **Configure Service**:

```yaml
Name: fintracker-api
Region: Frankfurt (EU Central) or Oregon (US West)
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm run start
```

### Step 3: Configure Environment Variables

In Render Dashboard → **Environment** tab, add these variables:

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

# Redis (Upstash)
REDIS_URL=redis://default:AW27AAIncDIyMzg1NDRkNTMxOTY0NDM2OTg0MzEwODY4NmI2ZTdmMHAyMjgwOTE@easy-husky-28091.upstash.io:6379

# JWT (CHANGE THESE - Generate new secrets!)
JWT_SECRET=<GENERATE_NEW_SECRET>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
REFRESH_TOKEN_ROTATION=true

# Encryption (CHANGE THIS!)
ENCRYPTION_KEY=<GENERATE_NEW_KEY>

# CORS (Update after frontend deployment)
CORS_ORIGINS=https://fintracker.vercel.app

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX=5

# Frontend URL (Update after frontend deployment)
FRONTEND_URL=https://fintracker.vercel.app

# Feature Flags
ENABLE_EMAIL_VERIFICATION=false
ENABLE_MFA=false
ENABLE_SMS_PARSING=true

# Session
SESSION_SECRET=<GENERATE_NEW_SECRET>
```

### Step 4: Generate Production Secrets

**On your local machine**, generate secure secrets:

```bash
# JWT Secret (64 characters)
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Encryption Key (64 characters)
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"

# Session Secret (64 characters)
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

Copy these values and paste them into Render's environment variables.

### Step 5: Deploy

1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Build the project
   - Start the server

**Deployment time**: ~5-10 minutes

### Step 6: Run Migrations on Production

After deployment completes:

1. Go to **Shell** tab in Render dashboard
2. Run migrations:

```bash
npm run migrate:latest
```

3. Verify:

```bash
npm run migrate:status
```

### Step 7: Test Production API

Once deployed, test the health endpoint:

```bash
# Replace with your Render URL
curl https://fintracker-api.onrender.com/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2026-01-07T...",
  "uptime": 123.45,
  "environment": "production",
  "version": "v1"
}
```

---

## 4️⃣ Render Configuration Details

### Auto-Deploy Settings

In Render Dashboard → **Settings**:

- ✅ **Auto-Deploy**: Yes (deploy on every push to main)
- ✅ **Branch**: main
- ✅ **Pull Request Previews**: Optional (useful for testing)

### Health Check Path

Set this in **Settings** → **Health Check Path**:

```
/health
```

Render will automatically restart the service if health checks fail.

### Scaling (Optional)

For production, consider:

- **Instance Type**: Starter ($7/month) or Standard ($25/month)
- **Instances**: 1 (sufficient for MVP)
- **Auto-scaling**: Not needed initially

---

## 5️⃣ Vercel Setup (Frontend - Later)

**Note**: Frontend hasn't been developed yet. When ready:

1. Go to https://vercel.com/
2. Import Git Repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: frontend
   - **Build Command**: `npm run build`
   - **Output Directory**: dist

4. Environment Variables:

```bash
VITE_API_URL=https://fintracker-api.onrender.com
```

---

## 6️⃣ Post-Deployment Checklist

### Backend Verification

- [ ] Health endpoint responds: `GET /health`
- [ ] Registration works: `POST /api/v1/auth/register`
- [ ] Login returns tokens: `POST /api/v1/auth/login`
- [ ] Protected route requires auth: `GET /api/v1/users/me`
- [ ] Database migrations completed
- [ ] Redis connection working (check logs)

### Security Verification

- [ ] JWT_SECRET changed from default
- [ ] ENCRYPTION_KEY changed from default
- [ ] SESSION_SECRET changed from default
- [ ] CORS configured for production domain
- [ ] Environment variables not exposed in logs
- [ ] Database credentials secure

### Monitoring Setup

In Render Dashboard:

- [ ] Check **Logs** for errors
- [ ] Monitor **Metrics** (CPU, Memory, Response Time)
- [ ] Set up **Alerts** (optional)

---

## 7️⃣ Cost Estimate

### Free Tier (Development/MVP)

- **Supabase**: Free (500 MB database)
- **Upstash Redis**: Free (256 MB, 10k commands/day)
- **Render**: Free tier available (with limitations)
- **Vercel**: Free (hobby projects)
- **Total**: $0/month

### Paid Tier (Production)

- **Supabase**: $25/month (Pro plan)
- **Upstash Redis**: $0.2 per 100k commands (~$10-20/month)
- **Render**: $7-25/month (Starter/Standard instance)
- **Vercel**: Free (upgrade if needed)
- **Total**: ~$42-70/month

---

## 8️⃣ Troubleshooting

### Issue: Redis Connection Fails

**Symptoms**: `Socket closed unexpectedly`

**Solutions**:

1. Verify Redis URL format (check for `rediss://` vs `redis://`)
2. Check Upstash console for connection limits
3. Verify TLS settings
4. Check Render logs for connection errors

**Test Redis from Render Shell**:

```bash
npm install -g redis-cli
redis-cli -u $REDIS_URL ping
```

### Issue: Database Connection Timeout

**Symptoms**: `connect ETIMEDOUT`

**Solutions**:

1. Verify Supabase pooler URL (use pooler, not direct connection)
2. Check if Supabase project is paused (free tier auto-pauses)
3. Verify SSL configuration in knexfile.ts
4. Check database connection pool settings

### Issue: Build Fails on Render

**Symptoms**: `npm install` or `npm run build` fails

**Solutions**:

1. Check Node.js version compatibility (use Node 20+)
2. Verify `package.json` scripts
3. Check for missing TypeScript dependencies
4. Review Render build logs

---

## 9️⃣ Next Steps After Deployment

Once infrastructure is operational:

1. **Test Production Endpoints** (use Postman/Insomnia)
2. **Monitor Logs** (watch for errors in first 24 hours)
3. **Set Up CI/CD** (GitHub Actions for automated testing)
4. **Continue Development**:
   - Option A: Core Ledger Engine
   - Option B: PAYE Calculator & Income Tracking

---

## 🔗 Important URLs

**Update these after deployment**:

```bash
# Backend API
Production: https://fintracker-api.onrender.com
Health Check: https://fintracker-api.onrender.com/health

# Frontend (future)
Production: https://fintracker.vercel.app

# Databases
Supabase Dashboard: https://supabase.com/dashboard
Upstash Dashboard: https://console.upstash.com/

# Hosting
Render Dashboard: https://dashboard.render.com/
Vercel Dashboard: https://vercel.com/dashboard
```

---

## 📞 Support Resources

- **Render Docs**: https://render.com/docs
- **Upstash Docs**: https://docs.upstash.com/redis
- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs

---

**Ready to deploy!** 🚀

Start with **Step 1: GitHub Setup**, then proceed through each section.
