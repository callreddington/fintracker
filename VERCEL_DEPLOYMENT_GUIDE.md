# Vercel Frontend Deployment Guide

## Quick Setup

### 1. Environment Variables

Add these environment variables in your Vercel project settings:

```env
VITE_API_URL=https://fintracker-y76x.onrender.com/api/v1
VITE_APP_NAME=FinTracker
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production
```

### 2. Project Configuration

The `vercel.json` file is already configured with:

- **Build Command**: `cd frontend && npm install && npm run build`
- **Output Directory**: `frontend/dist`
- **Install Command**: `npm install --prefix frontend`

### 3. Deploy

Push to GitHub and Vercel will automatically deploy. Or trigger a manual deployment from the Vercel dashboard.

## Vercel Project Settings

### Build & Development Settings

- **Framework Preset**: Other (manual configuration)
- **Root Directory**: Leave empty (we use `vercel.json` for configuration)
- **Build Command**: Defined in `vercel.json`
- **Output Directory**: `frontend/dist`
- **Install Command**: `npm install --prefix frontend`

### Environment Variables

Go to: **Project Settings → Environment Variables**

Add the following variables for all environments (Production, Preview, Development):

| Name               | Value                                         | Environments        |
| ------------------ | --------------------------------------------- | ------------------- |
| `VITE_API_URL`     | `https://fintracker-y76x.onrender.com/api/v1` | Production, Preview |
| `VITE_API_URL`     | `http://localhost:3000/api/v1`                | Development         |
| `VITE_APP_NAME`    | `FinTracker`                                  | All                 |
| `VITE_APP_VERSION` | `1.0.0`                                       | All                 |
| `VITE_ENVIRONMENT` | `production`                                  | Production          |
| `VITE_ENVIRONMENT` | `preview`                                     | Preview             |
| `VITE_ENVIRONMENT` | `development`                                 | Development         |

## Troubleshooting

### Issue: Build fails with monorepo errors

**Solution**: The `vercel.json` configuration ensures only the frontend is built. Make sure the file exists in the root directory.

### Issue: API calls failing

**Solution**: Check that `VITE_API_URL` is set correctly in Vercel environment variables. After adding/updating environment variables, trigger a new deployment.

### Issue: Build succeeds but app shows errors

**Solution**:

1. Check browser console for CORS errors
2. Verify the backend is running: https://fintracker-y76x.onrender.com/health
3. Ensure environment variables are set for the correct environment (Production/Preview)

## Post-Deployment Verification

After deployment, verify the frontend is working:

1. **Visit the Vercel URL** (e.g., https://fintracker.vercel.app)
2. **Test the login page**: Should load without errors
3. **Check Network tab**: API calls should go to `https://fintracker-y76x.onrender.com/api/v1`
4. **Test authentication**: Try registering and logging in

## Local Development

For local development, create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_APP_NAME=FinTracker
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=development
```

Then run:

```bash
cd frontend
npm install
npm run dev
```

## Deployment Workflow

1. **Make changes** to frontend code
2. **Test locally**: `cd frontend && npm run dev`
3. **Build locally** (optional): `npm run build`
4. **Commit and push** to GitHub
5. **Vercel auto-deploys** from the main branch
6. **Verify deployment** works correctly

## Next Steps

After frontend deployment:

1. ✅ Set up custom domain (optional)
2. ✅ Configure CORS on backend to allow Vercel domain
3. ✅ Test full authentication flow end-to-end
4. ✅ Monitor both frontend and backend deployments
