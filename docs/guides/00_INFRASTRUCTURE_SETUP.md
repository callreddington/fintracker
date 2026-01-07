# Infrastructure Setup Guide

## Setting Up Cloud Services for FinTracker

**Estimated Time**: 30-45 minutes
**Cost**: $0 (All free tiers)

---

## 1. Supabase (PostgreSQL Database)

### Why Supabase?

- Free tier: 500MB database, 2GB bandwidth
- PostgreSQL 16 with extensions
- Automatic daily backups
- Built-in connection pooling

### Setup Steps

1. **Go to**: https://supabase.com
2. **Sign up** with GitHub account (recommended for easy integration)
3. **Create New Project**:
   - Organization: Create new or select existing
   - Project Name: `fintracker-prod`
   - Database Password: **Generate Strong Password** (save this securely!)
   - Region: **Europe West (Frankfurt)** - closest to Kenya
   - Pricing Plan: **Free**

4. **Wait for provisioning** (~2 minutes)

5. **Get Connection String**:
   - Go to Project Settings → Database
   - Under "Connection string" section, select "URI"
   - Copy the connection string (looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`)
   - **IMPORTANT**: Replace `[YOUR-PASSWORD]` with the password you generated

6. **Save These Details**:
   ```
   SUPABASE_URL=https://[PROJECT-REF].supabase.co
   SUPABASE_ANON_KEY=[your-anon-key]
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

---

## 2. Upstash (Redis Cache)

### Why Upstash?

- Serverless Redis with free tier
- 10,000 commands/day free
- Low latency global replication

### Setup Steps

1. **Go to**: https://upstash.com
2. **Sign up** with GitHub
3. **Create Database**:
   - Database Name: `fintracker-redis`
   - Type: **Regional**
   - Region: **Europe West (Frankfurt)**
   - Eviction: **No Eviction** (keep all data)
   - Pricing: **Free**

4. **Get Connection Details**:
   - Click on your database
   - Go to "Details" tab
   - Copy:
     - **Endpoint**: `rediss://[endpoint].upstash.io:6379`
     - **Password**: [your-password]

5. **Save These Details**:
   ```
   REDIS_URL=rediss://default:[PASSWORD]@[endpoint].upstash.io:6379
   REDIS_PASSWORD=[your-password]
   ```

---

## 3. Vercel (Frontend Hosting)

### Why Vercel?

- Free unlimited bandwidth
- Automatic HTTPS and CDN
- Zero-config React deployment
- Preview deployments for PRs

### Setup Steps

1. **Go to**: https://vercel.com
2. **Sign up** with GitHub
3. **Import Project**:
   - Click "Add New" → "Project"
   - Select "Import Git Repository"
   - **Authorize Vercel** to access your GitHub
   - Select repository: `callreddington/personal-finance-tracker`
   - Click "Import"

4. **Configure Project**:
   - Framework Preset: **Vite**
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

5. **Environment Variables** (we'll add these later):
   - Don't add any yet - we'll configure after backend is deployed

6. **Deploy Settings**:
   - Production Branch: `main`
   - Auto-deploy: **Enabled**

7. **Don't deploy yet** - click "Skip" for now, we'll deploy once code is ready

8. **Save Project URL** (you'll get this after first deploy):
   ```
   FRONTEND_URL=https://fintracker-[random].vercel.app
   ```

---

## 4. Render (Backend Hosting)

### Why Render?

- Free tier for web services
- Automatic HTTPS
- Better than Railway's $5 credit (which expires)
- Sleeps after 15min inactivity (acceptable for MVP)

### Setup Steps

1. **Go to**: https://render.com
2. **Sign up** with GitHub
3. **Create Web Service**:
   - Click "New +" → "Web Service"
   - Select "Build and deploy from a Git repository"
   - **Connect GitHub account**
   - Select repository: `callreddington/personal-finance-tracker`
   - Click "Connect"

4. **Configure Service**:
   - Name: `fintracker-api`
   - Region: **Frankfurt (EU Central)**
   - Branch: `main`
   - Root Directory: `backend`
   - Runtime: **Node**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Instance Type: **Free**

5. **Environment Variables** (Add these now):

   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=[Paste from Supabase]
   REDIS_URL=[Paste from Upstash]
   JWT_SECRET=[Generate random 64-char string]
   JWT_ACCESS_EXPIRY=15m
   JWT_REFRESH_EXPIRY=7d
   FRONTEND_URL=https://fintracker-[your-vercel-subdomain].vercel.app
   CORS_ORIGINS=https://fintracker-[your-vercel-subdomain].vercel.app
   ```

6. **How to Generate JWT_SECRET**:

   ```bash
   # On Linux/Mac
   openssl rand -hex 32

   # Or use online generator (save securely!)
   # https://www.random.org/strings/?num=1&len=64&digits=on&upperalpha=on&loweralpha=on&unique=on&format=plain
   ```

7. **Don't deploy yet** - we'll deploy once code is ready

8. **Save Backend URL** (you'll get this after first deploy):
   ```
   BACKEND_URL=https://fintracker-api.onrender.com
   ```

---

## 5. Update Vercel Environment Variables

Once Render backend is deployed:

1. Go back to **Vercel Dashboard**
2. Select your project → Settings → Environment Variables
3. Add:
   ```
   VITE_API_URL=https://fintracker-api.onrender.com/api/v1
   VITE_APP_NAME=FinTracker
   VITE_APP_VERSION=1.0.0
   ```

---

## Summary Checklist

After completing all setups, you should have:

### Supabase

- [ ] Project created
- [ ] Database password saved securely
- [ ] Connection string copied
- [ ] Project URL noted

### Upstash

- [ ] Redis database created
- [ ] Connection URL copied
- [ ] Password saved

### Vercel

- [ ] GitHub connected
- [ ] Project imported
- [ ] Build settings configured
- [ ] (Environment variables - will add after backend deploy)

### Render

- [ ] GitHub connected
- [ ] Web service created
- [ ] Environment variables added
- [ ] Build commands configured
- [ ] (Will deploy after code is ready)

---

## Create `.env` File for Local Development

Once you have all the credentials, create a `.env` file in the `backend/` directory:

```bash
cd /Projects/fintracker/backend
nano .env
```

Paste this content (replace with your actual values):

```env
# Application
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database (Local - Docker)
DATABASE_URL=postgresql://fintracker_user:fintracker_password@localhost:5432/fintracker_dev

# Database (Production - Supabase) - Commented out for local dev
# DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Redis (Local - Docker)
REDIS_URL=redis://localhost:6379

# Redis (Production - Upstash) - Commented out for local dev
# REDIS_URL=rediss://default:[PASSWORD]@[endpoint].upstash.io:6379

# JWT Configuration
JWT_SECRET=local-dev-secret-change-in-production-use-openssl-rand-hex-32
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
REFRESH_TOKEN_ROTATION=true

# Encryption
ENCRYPTION_KEY=local-encryption-key-32-bytes-change-in-production

# Email (MailHog for local development)
EMAIL_HOST=localhost
EMAIL_PORT=1025
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=noreply@fintracker.local

# CORS
CORS_ORIGINS=http://localhost:5173

# Logging
LOG_LEVEL=debug

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX=5
```

Save and exit (Ctrl+X, Y, Enter)

---

## Frontend `.env` File

Create `.env` file in `frontend/` directory:

```bash
cd /Projects/fintracker/frontend
nano .env
```

Paste:

```env
# API Configuration (Local)
VITE_API_URL=http://localhost:3000/api/v1
VITE_API_TIMEOUT=30000

# Application
VITE_APP_NAME=FinTracker
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_TRACKING=false
```

---

## Verification

To verify everything is set up correctly:

1. **Supabase**: Go to SQL Editor and run:

   ```sql
   SELECT version();
   ```

   Should return PostgreSQL 16.x

2. **Upstash**: Click "Data Browser" in your Redis dashboard
   Should see "No keys yet" (empty database is good!)

3. **Vercel**: Project dashboard should show "Ready to deploy"

4. **Render**: Service dashboard should show "Waiting for first deploy"

---

## Troubleshooting

### Supabase Connection Issues

- **Issue**: Can't connect to database
- **Solution**: Check that password in connection string is URL-encoded
- **Check**: Connection pooler might be needed for serverless (we'll configure later)

### Upstash Redis Errors

- **Issue**: Connection timeout
- **Solution**: Ensure you're using `rediss://` (with double 's' for TLS)
- **Check**: Firewall not blocking port 6379

### Vercel Build Fails

- **Issue**: Build command not found
- **Solution**: Ensure Root Directory is set to `frontend`
- **Check**: package.json exists in frontend/ directory

### Render Deploy Fails

- **Issue**: Environment variables missing
- **Solution**: Double-check all required env vars are added
- **Check**: DATABASE_URL and REDIS_URL are correctly formatted

---

## Security Notes

**CRITICAL**:

- [ ] Never commit `.env` files to Git
- [ ] Use different credentials for dev, staging, production
- [ ] Rotate JWT secrets regularly (every 90 days)
- [ ] Enable 2FA on all cloud accounts
- [ ] Set up billing alerts (even on free tier)

---

## Next Steps

Once infrastructure is ready:

1. Continue to `01_LOCAL_DEVELOPMENT.md`
2. Start coding Day 1 features
3. Test locally with Docker Compose
4. Deploy to staging (Week 2)
5. Deploy to production (Week 4)

---

## Cost Monitoring

**Free Tier Limits** (as of January 2026):

| Service  | Free Tier Limit               | Monitoring                       |
| -------- | ----------------------------- | -------------------------------- |
| Supabase | 500MB DB, 2GB bandwidth       | Check database size in dashboard |
| Upstash  | 10,000 commands/day           | Monitor usage in dashboard       |
| Vercel   | Unlimited bandwidth           | No worries                       |
| Render   | Sleeps after 15min inactivity | Acceptable for MVP               |

**When to Upgrade**:

- Supabase: When DB exceeds 400MB (80% of free)
- Upstash: If commands exceed 8,000/day (80% of free)
- Render: If service needs 24/7 uptime ($7/month)

---

**Questions?** Share them and I'll help troubleshoot!

**Ready to code?** Once accounts are set up, let me know and I'll start building! 🚀
