# Vercel Environment Variable Fix

## Problem Identified

The frontend is getting a **404 error** when trying to register because `VITE_API_URL` is not set correctly on Vercel.

**Test Result**: Backend works perfectly ✅

- Tested: `https://fintracker-y76x.onrender.com/api/v1/auth/register`
- Response: 201 Created with user data

**Frontend Issue**: The environment variable is missing or wrong on Vercel ❌

---

## Solution: Set VITE_API_URL on Vercel

### Step 1: Check Current Value

1. Visit the debug page: https://fintracker-frontend-one.vercel.app/debug
2. Look at what `VITE_API_URL` is set to
3. It should be: `https://fintracker-y76x.onrender.com/api/v1`

### Step 2: Fix on Vercel Dashboard

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Open your project**: `fintracker-frontend` (or similar name)
3. **Click Settings** tab
4. **Click Environment Variables** (left sidebar)
5. **Find VITE_API_URL** or add it if missing:

   **Key**: `VITE_API_URL`
   **Value**: `https://fintracker-y76x.onrender.com/api/v1`

   **Important**:
   - ✅ Include `/api/v1` at the end
   - ✅ Use `https://` (not `http://`)
   - ❌ NO trailing slash

6. **Select all environments**: Production, Preview, Development
7. **Click Save**

### Step 3: Redeploy

After saving the environment variable:

1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the **3 dots menu** (⋮)
4. Click **"Redeploy"**
5. **Check "Use existing build cache"** ❌ (uncheck this!)
6. Click **Redeploy**

**Why uncheck cache?** Environment variables are baked into the build, so we need a fresh build.

### Step 4: Wait for Deployment (2-3 minutes)

Watch the deployment logs for:

- ✅ "Building..."
- ✅ "Deploying..."
- ✅ "Ready"

---

## Verification

### Test 1: Check Debug Page

```
Visit: https://fintracker-frontend-one.vercel.app/debug
```

Should show:

```
VITE_API_URL: https://fintracker-y76x.onrender.com/api/v1
Expected API_URL: https://fintracker-y76x.onrender.com/api/v1
```

✅ They should match!

### Test 2: Try Registration

```
Visit: https://fintracker-frontend-one.vercel.app/register
```

1. Fill in the form:
   - Full Name: `Test User Fix`
   - Email: `testfix@example.com`
   - Password: `SecurePass123@`
   - Confirm Password: `SecurePass123@`

2. Click **"Create Account"**

3. Should see:
   - ✅ Button shows "Creating Account..."
   - ✅ No 404 error in console
   - ✅ Redirect to `/login?registered=true`

### Test 3: Check Browser Console

Press **F12** → **Console** tab

Should NOT see:

- ❌ "Request failed with status code 404"
- ❌ Any CORS errors

Should see:

- ✅ Successful POST to `https://fintracker-y76x.onrender.com/api/v1/auth/register`
- ✅ Status: 201 Created

---

## Quick Reference: Correct Environment Variables

On **Vercel** (Frontend):

| Variable         | Value                                         | Required |
| ---------------- | --------------------------------------------- | -------- |
| VITE_API_URL     | `https://fintracker-y76x.onrender.com/api/v1` | ✅ YES   |
| VITE_ENVIRONMENT | `production`                                  | Optional |
| VITE_APP_NAME    | `FinTracker`                                  | Optional |

**Remove these** (if they exist on Vercel):

- ❌ DATABASE_URL (backend only)
- ❌ SUPABASE_ANON_KEY (backend only)
- ❌ JWT_SECRET (backend only)

---

## Common Mistakes

### Mistake 1: Trailing Slash

```bash
# ❌ WRONG
VITE_API_URL=https://fintracker-y76x.onrender.com/api/v1/

# ✅ CORRECT
VITE_API_URL=https://fintracker-y76x.onrender.com/api/v1
```

### Mistake 2: Missing /api/v1

```bash
# ❌ WRONG
VITE_API_URL=https://fintracker-y76x.onrender.com

# ✅ CORRECT
VITE_API_URL=https://fintracker-y76x.onrender.com/api/v1
```

### Mistake 3: Not Rebuilding

After changing environment variables, you MUST redeploy **without cache** for changes to take effect.

---

## Troubleshooting

### Issue: Debug page still shows "NOT SET"

**Solution**:

1. Verify you saved the environment variable
2. Ensure you selected "Production" environment
3. Redeploy without cache

### Issue: Still getting 404 after fixing

**Solution**:

1. Hard refresh the page: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear browser cache
3. Try incognito/private window

### Issue: CORS error instead of 404

**Solution**: Check that CORS_ORIGINS is set on Render backend:

```
CORS_ORIGINS=https://fintracker-frontend-one.vercel.app
```

---

## Next Steps

Once VITE_API_URL is fixed:

1. ✅ Registration will work
2. ✅ Login will work
3. ✅ All API calls will succeed
4. 🎯 Ready to continue development!

---

## Summary of Commands

**Check what frontend sees**:

```
Visit: https://fintracker-frontend-one.vercel.app/debug
```

**Test backend directly** (to confirm it works):

```bash
curl -X POST 'https://fintracker-y76x.onrender.com/api/v1/auth/register' \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"TestPass123@","full_name":"Test User"}'
```

Expected: `{"success":true,"user":{...}}`
