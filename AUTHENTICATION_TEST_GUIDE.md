# Authentication Testing Guide

## 🎯 Complete End-to-End Authentication Test

Follow these steps to verify the full authentication flow is working.

---

## Test 1: Registration Flow ✅

### Step 1: Open Registration Page

Visit: **https://fintracker-frontend-one.vercel.app/register**

### Step 2: Open Browser Developer Tools

- Press `F12` (or Right-click → Inspect)
- Go to **Console** tab (watch for errors)
- Go to **Network** tab (watch API calls)

### Step 3: Fill Registration Form

**Test Credentials:**

```
Full Name: Test User Demo
Email: testdemo@example.com
Password: SecurePass123@
Confirm Password: SecurePass123@
```

### Step 4: Submit and Verify

1. Click **"Create Account"** button
2. Watch the **Network** tab - you should see:
   - `POST` request to `https://fintracker-y76x.onrender.com/api/v1/auth/register`
   - Status: `200 OK` or `201 Created`
3. Check **Console** - should show no errors
4. You should be redirected to: `/login?registered=true`

### Expected Results:

- ✅ Button shows "Creating Account..." while loading
- ✅ API call succeeds (200/201 status)
- ✅ Redirect to login page
- ❌ No CORS errors in console
- ❌ No network errors

### If Registration Fails:

**Check Console for errors:**

- **CORS Error**: Means CORS_ORIGINS not configured on Render
- **Network Error**: Means backend is down or unreachable
- **400 Bad Request**: Check if validation errors are shown
- **409 Conflict**: Email already exists (use different email)

---

## Test 2: Login Flow ✅

### Step 1: Open Login Page

Visit: **https://fintracker-frontend-one.vercel.app/login**

### Step 2: Use Test Credentials

**Option A - Use account you just created:**

```
Email: testdemo@example.com
Password: SecurePass123@
```

**Option B - Use pre-existing test account:**

```
Email: production-test@example.com
Password: TestPass123@
```

### Step 3: Submit and Verify

1. Click **"Sign In"** button
2. Watch the **Network** tab:
   - `POST` to `https://fintracker-y76x.onrender.com/api/v1/auth/login`
   - Status: `200 OK`
   - Response should include `accessToken` and `refreshToken`
3. Watch **Console** - should show no errors
4. You should be redirected to `/dashboard`

### Step 4: Check Token Storage

1. In Developer Tools, go to **Application** tab (Chrome) or **Storage** tab (Firefox)
2. Expand **Local Storage** → `https://fintracker-frontend-one.vercel.app`
3. Verify these items exist:
   - `accessToken` - Long JWT string starting with "eyJ..."
   - `refreshToken` - Long JWT string starting with "eyJ..."
   - `user` - JSON object with user data

### Expected Results:

- ✅ Button shows "Signing in..." while loading
- ✅ API call succeeds (200 status)
- ✅ Tokens stored in localStorage
- ✅ Redirect to dashboard
- ✅ Dashboard shows your data
- ❌ No CORS errors
- ❌ No authentication errors

---

## Test 3: Dashboard Access (Protected Route) ✅

### Step 1: Verify Dashboard Loads

After successful login, you should see:

- Navigation sidebar on the left
- Dashboard content on the right
- "Welcome to FinTracker" heading
- Financial summary cards (all showing KES 0.00)

### Step 2: Check API Calls

1. Open **Network** tab
2. Look for API calls being made:
   - Should see requests with `Authorization: Bearer <token>` header
3. Check if any protected endpoints are being called

### Expected Results:

- ✅ Dashboard renders without errors
- ✅ Navigation works
- ✅ No "unauthorized" errors
- ✅ JWT token is included in API requests

---

## Test 4: Token Persistence ✅

### Step 1: Refresh the Page

1. While on the dashboard, press `F5` or `Ctrl+R`
2. Page should reload

### Expected Results:

- ✅ You remain logged in
- ✅ Dashboard loads immediately
- ✅ No redirect to login page
- ✅ Tokens still in localStorage

---

## Test 5: Manual Token Testing (Advanced) ✅

### Test Access Token

```bash
# Replace <YOUR_ACCESS_TOKEN> with the token from localStorage
curl -X GET 'https://fintracker-y76x.onrender.com/api/v1/users/me' \
  -H 'Authorization: Bearer <YOUR_ACCESS_TOKEN>' \
  -H 'Content-Type: application/json'
```

**Expected Response:**

```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "testdemo@example.com",
    "full_name": "Test User Demo",
    "email_verified": false,
    "created_at": "...",
    "updated_at": "..."
  }
}
```

---

## Test 6: Error Handling ✅

### Test Invalid Login

1. Go to `/login`
2. Enter wrong credentials:
   ```
   Email: wrong@example.com
   Password: WrongPassword123
   ```
3. Click "Sign In"

**Expected Results:**

- ❌ Should NOT redirect
- ✅ Error message displays: "Invalid email or password" or similar
- ✅ Form remains editable
- ✅ No console errors

### Test Password Validation

1. Go to `/register`
2. Enter:
   ```
   Password: 123
   Confirm Password: 123
   ```
3. Click "Create Account"

**Expected Results:**

- ✅ Error message: "Password must be at least 8 characters long"
- ❌ No API call made
- ✅ Form validation works

### Test Password Mismatch

1. Go to `/register`
2. Enter:
   ```
   Password: SecurePass123@
   Confirm Password: DifferentPass123@
   ```
3. Click "Create Account"

**Expected Results:**

- ✅ Error message: "Passwords do not match"
- ❌ No API call made

---

## Common Issues & Solutions

### Issue 1: CORS Error

**Error in Console:**

```
Access to XMLHttpRequest at 'https://fintracker-y76x.onrender.com/api/v1/auth/login'
from origin 'https://fintracker-frontend-one.vercel.app' has been blocked by CORS policy
```

**Solution:**

1. Go to Render Dashboard
2. Open your backend service
3. Go to Environment tab
4. Verify `CORS_ORIGINS` includes: `https://fintracker-frontend-one.vercel.app`
5. Redeploy backend if needed

---

### Issue 2: Network Timeout

**Error:** Request takes too long or times out

**Solution:**

1. Check if backend is running: https://fintracker-y76x.onrender.com/health
2. Render free tier can "spin down" - first request after inactivity takes ~30s
3. Wait and try again

---

### Issue 3: 500 Internal Server Error

**Error:** API returns 500 status

**Solution:**

1. Check Render logs for backend errors
2. Verify environment variables are set
3. Check database connection (Supabase)

---

### Issue 4: Tokens Not Saving

**Error:** localStorage is empty after login

**Solution:**

1. Check browser settings - localStorage must be enabled
2. Try in Incognito/Private mode
3. Clear browser cache and try again
4. Check Console for JavaScript errors

---

## Success Checklist ✅

After completing all tests, you should have:

- ✅ Successfully registered a new account
- ✅ Successfully logged in
- ✅ Tokens stored in localStorage
- ✅ Dashboard loads and displays
- ✅ Token persists after page refresh
- ✅ No CORS errors in console
- ✅ API calls succeed with 200 status
- ✅ Error messages display correctly
- ✅ Form validation works

---

## Next Steps After Testing

Once all tests pass:

1. ✅ Mark authentication as complete
2. 🔄 Start implementing next features:
   - PAYE calculator
   - Income management
   - Expense tracking
   - Budgets module

3. 📊 Monitor production:
   - Check Render logs
   - Monitor Vercel analytics
   - Track user registrations

---

## Quick Test URLs

- **Frontend**: https://fintracker-frontend-one.vercel.app
- **Login**: https://fintracker-frontend-one.vercel.app/login
- **Register**: https://fintracker-frontend-one.vercel.app/register
- **Backend Health**: https://fintracker-y76x.onrender.com/health
- **Backend API**: https://fintracker-y76x.onrender.com/api/v1

---

## Test Accounts

**Pre-created account:**

- Email: production-test@example.com
- Password: TestPass123@

**Create your own:**

- Use any email (doesn't need to be real)
- Password must have: 8+ chars, uppercase, lowercase, number, special char
