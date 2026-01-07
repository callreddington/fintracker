# Redis Connection Fix Guide

## Problem Identified

Redis (Upstash) is failing to connect with error: **"Socket closed unexpectedly"**

**Root Cause**: Upstash requires TLS for external connections, but the Redis URL uses `redis://` instead of `rediss://` (with TLS).

---

## Solution: Update REDIS_URL on Render

### Option 1: Use REDISS Protocol (Recommended)

1. **Go to Render Dashboard**: https://dashboard.render.com/
2. **Open your backend service**: `fintracker-backend`
3. **Go to Environment tab**
4. **Find REDIS_URL** and click **Edit**
5. **Change** from:

   ```
   redis://default:PASSWORD@easy-husky-28091.upstash.io:6379
   ```

   **To** (add extra 's' for TLS):

   ```
   rediss://default:PASSWORD@easy-husky-28091.upstash.io:6379
   ```

6. **Click Save**
7. **Render will automatically redeploy** (takes ~2-3 minutes)

### Option 2: Get REST API URL from Upstash (Alternative)

If Option 1 doesn't work, you can use Upstash's REST API:

1. **Go to Upstash Console**: https://console.upstash.com/
2. **Select your database**: `easy-husky-28091`
3. **Go to REST API tab**
4. **Copy the connection URL**
5. **Update REDIS_URL on Render** with the REST API URL

---

## Testing the Fix

### Step 1: Wait for Render Deployment

After updating REDIS_URL, wait for Render to redeploy (check Logs tab).

### Step 2: Verify Connection

Look for this in the deployment logs:

```
✅ SUCCESS: Redis client ready
✅ SUCCESS: Redis connection established
```

**No more errors**: `Socket closed unexpectedly` should be gone.

### Step 3: Test Redis Functionality

Run this command to verify Redis is working:

```bash
curl -X POST 'https://fintracker-y76x.onrender.com/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email":"production-test@example.com","password":"TestPass123@"}'
```

Check Render logs - you should see Redis operations succeed.

---

## Why This Happened

**Upstash Security Requirement**:

- Upstash **requires TLS** for all external connections
- `redis://` = unencrypted connection (only works on localhost)
- `rediss://` = encrypted TLS connection (required for Upstash)

**The Code is Correct**:

- Our `redis.ts` configuration is fine
- It just needs the correct URL protocol

---

## Current Impact (Before Fix)

**Good News**: Application still works! ✅

- ✅ Authentication functional (tokens stored in PostgreSQL)
- ✅ Login/logout working
- ✅ Rate limiting working (using in-memory fallback)
- ✅ All API endpoints operational

**What's Missing** (until Redis is fixed):

- ❌ Session data not cached (slower but functional)
- ❌ Rate limiting resets on server restart
- ❌ No distributed caching (not critical for MVP)

---

## Verification Checklist

After applying the fix:

- [ ] Updated REDIS_URL to use `rediss://` protocol
- [ ] Render deployment completed successfully
- [ ] Logs show "Redis connection established"
- [ ] No "Socket closed unexpectedly" errors
- [ ] Authentication still works
- [ ] Health endpoint responds: https://fintracker-y76x.onrender.com/health

---

## Your Current Upstash Details

**Database Name**: `easy-husky-28091`
**Host**: `easy-husky-28091.upstash.io`
**Port**: `6379` (standard)
**TLS**: Required ✅

**Correct URL Format**:

```
rediss://default:[YOUR_PASSWORD]@easy-husky-28091.upstash.io:6379
```

Replace `[YOUR_PASSWORD]` with your actual Upstash password (the long string starting with `AW27AA...`).

---

## Alternative: Make Redis Optional (Quick Fix)

If you want to proceed without Redis for now, you can update the backend to make Redis completely optional:

**This is already implemented!** The backend gracefully handles Redis failures and continues running.

Just leave Redis as-is and everything will work using PostgreSQL for tokens.

---

## Next Steps

**Choose one**:

1. **Fix Redis Now** (Recommended):
   - Update REDIS_URL on Render with `rediss://` protocol
   - Wait 2-3 minutes for deployment
   - Verify logs show successful connection

2. **Skip Redis for Now**:
   - Leave as-is
   - Everything works with PostgreSQL fallback
   - Fix later when needed for caching optimization

**My Recommendation**: Fix it now since it's a 1-minute change! Just add the extra 's' to make it `rediss://`.
