# Local Development Setup Guide

## Running FinTracker on Your Local Machine

**Estimated Time**: 15-20 minutes
**Prerequisites**: Infrastructure accounts set up (see `00_INFRASTRUCTURE_SETUP.md`)

---

## Quick Start

### 1. Clone and Install

```bash
# Navigate to project directory
cd /Projects/fintracker

# Install all dependencies (root, backend, frontend)
npm install

# This will install dependencies for the entire monorepo
```

### 2. Start Docker Services

```bash
# Start PostgreSQL, Redis, MailHog, and Adminer
npm run docker:up

# Verify services are running
docker ps

# You should see 4 containers running:
# - fintracker-postgres
# - fintracker-redis
# - fintracker-mailhog
# - fintracker-adminer
```

### 3. Configure Backend Environment

```bash
cd backend

# Copy example environment file
cp .env.example .env

# Edit .env file (the defaults should work for local development)
nano .env
```

**Default `.env` for local development is already configured!** You only need to change values if:

- You want to use production Supabase/Upstash (not recommended for dev)
- You changed Docker container names/ports

### 4. Run Database Migrations

```bash
# Still in backend/ directory
npm run migrate:latest

# You should see output like:
# Batch 1 run: 5 migrations
# Migration completed successfully
```

### 5. (Optional) Seed Database

```bash
npm run seed:run

# This will populate the database with:
# - Sample categories (Groceries, Transport, etc.)
# - Kenya tax tables (PAYE, NHIF, NSSF rates)
# - Test user account (if seeds are created)
```

### 6. Start Development Servers

```bash
# Option 1: Start both backend and frontend together (from project root)
cd /Projects/fintracker
npm run dev

# Option 2: Start them separately in different terminals

# Terminal 1 - Backend
cd /Projects/fintracker/backend
npm run dev

# Terminal 2 - Frontend (after backend is running)
cd /Projects/fintracker/frontend
npm run dev
```

### 7. Verify Everything Works

**Backend API**:

- Health Check: http://localhost:3000/health
- API Root: http://localhost:3000
- Expected response: `{"status": "healthy", ...}`

**Frontend** (not yet built, coming next):

- App: http://localhost:5173
- Should show login page

**Database UI (Adminer)**:

- URL: http://localhost:8080
- System: PostgreSQL
- Server: postgres
- Username: fintracker_user
- Password: fintracker_password
- Database: fintracker_dev

**Email Testing (MailHog)**:

- Web UI: http://localhost:8025
- SMTP: localhost:1025
- All emails sent by the app will appear here

---

## Development Workflow

### Making Changes

**Backend Changes**:

```bash
cd backend

# The server auto-reloads on file changes (using tsx watch)
# Edit any .ts file in src/
# Save the file
# Check terminal - server will restart automatically
```

**Frontend Changes** (once built):

```bash
cd frontend

# Vite has hot module replacement (HMR)
# Edit any .tsx file in src/
# Save the file
# Browser will update instantly (no page reload needed)
```

### Running Tests

```bash
# All tests
npm test

# Backend tests only
cd backend
npm test

# Frontend tests only
cd frontend
npm test

# Watch mode (tests re-run on file changes)
npm test -- --watch

# Coverage report
npm run test:coverage
```

### Linting and Formatting

```bash
# Check for linting issues
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Check code formatting
npm run format:check

# Auto-format all code
npm run format
```

### Database Operations

**Create New Migration**:

```bash
cd backend
npm run migrate:make create_users_table

# A new file will be created in:
# backend/src/database/migrations/YYYYMMDDHHMMSS_create_users_table.ts
```

**Run Pending Migrations**:

```bash
npm run migrate:latest
```

**Rollback Last Migration**:

```bash
npm run migrate:rollback
```

**Check Migration Status**:

```bash
npm run migrate:status
```

**Create Seed File**:

```bash
npm run seed:make 01_categories

# File created in:
# backend/src/database/seeds/01_categories.ts
```

**Run Seeds**:

```bash
npm run seed:run
```

---

## Useful Docker Commands

### View Logs

```bash
# All services
npm run docker:logs

# Specific service
docker logs fintracker-postgres
docker logs fintracker-redis
docker logs fintracker-mailhog
```

### Stop Services

```bash
# Stop all services (containers keep data)
npm run docker:down

# Stop and remove all data (fresh start)
docker-compose down -v
```

### Restart Services

```bash
# Restart all
npm run docker:down && npm run docker:up

# Restart specific service
docker restart fintracker-postgres
```

### Access PostgreSQL CLI

```bash
docker exec -it fintracker-postgres psql -U fintracker_user -d fintracker_dev

# Now you're in psql
# Try:
\dt              # List all tables
\d users         # Describe users table
SELECT * FROM users LIMIT 5;
\q               # Quit
```

### Access Redis CLI

```bash
docker exec -it fintracker-redis redis-cli

# Try:
PING             # Should return PONG
KEYS *           # List all keys
GET some_key     # Get value of a key
exit             # Quit
```

---

## Troubleshooting

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solution**:

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
cd backend
# Edit .env and change PORT=3000 to PORT=3001
```

### Docker Services Won't Start

**Problem**: `ERROR: Could not find an available, non-overlapping IPv4 address pool`

**Solution**:

```bash
# Remove all Docker networks
docker network prune

# Restart Docker
sudo systemctl restart docker  # Linux
# Or restart Docker Desktop on Mac/Windows

# Try again
npm run docker:up
```

### Database Connection Fails

**Problem**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solutions**:

```bash
# 1. Check if PostgreSQL container is running
docker ps | grep postgres

# 2. Check container logs
docker logs fintracker-postgres

# 3. Restart PostgreSQL
docker restart fintracker-postgres

# 4. Verify connection string in .env
# Should be: postgresql://fintracker_user:fintracker_password@localhost:5432/fintracker_dev
```

### Redis Connection Fails

**Problem**: `Error: connect ECONNREFUSED 127.0.0.1:6379`

**Solutions**:

```bash
# 1. Check if Redis container is running
docker ps | grep redis

# 2. Test Redis connection
docker exec -it fintracker-redis redis-cli ping
# Should return PONG

# 3. Restart Redis
docker restart fintracker-redis
```

### Migration Fails

**Problem**: `Migration file "XXX" failed`

**Solutions**:

```bash
# 1. Check migration syntax
# Open the migration file and verify SQL is correct

# 2. Rollback if partially applied
npm run migrate:rollback

# 3. Check database state
npm run migrate:status

# 4. Try running again
npm run migrate:latest

# 5. If still failing, manually fix in database:
docker exec -it fintracker-postgres psql -U fintracker_user -d fintracker_dev
# Then run SQL manually to debug
```

### TypeScript Errors

**Problem**: `TS2307: Cannot find module '@/config/database'`

**Solutions**:

```bash
# 1. Restart TypeScript server in VS Code
# Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"

# 2. Check tsconfig.json paths are correct

# 3. Reinstall dependencies
cd backend
rm -rf node_modules
npm install
```

### Tests Failing

**Problem**: Tests that were passing now fail

**Solutions**:

```bash
# 1. Clear Jest cache
npm test -- --clearCache

# 2. Check test database is clean
# Tests should use a separate test database

# 3. Verify environment
echo $NODE_ENV  # Should be 'test' during tests

# 4. Run tests with verbose output
npm test -- --verbose
```

---

## IDE Setup (VS Code Recommended)

### Recommended Extensions

Install these VS Code extensions:

```bash
# Open VS Code
code /Projects/fintracker

# Install extensions (or via Extensions panel)
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension formulahendry.auto-rename-tag
code --install-extension christian-kohler.path-intellisense
```

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.DS_Store": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true
  }
}
```

---

## Environment Variables Reference

### Backend `.env`

```env
# Required for local development
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://fintracker_user:fintracker_password@localhost:5432/fintracker_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=local-dev-secret-change-in-production

# Optional (have defaults)
LOG_LEVEL=debug
CORS_ORIGINS=http://localhost:5173
API_VERSION=v1
```

### Frontend `.env` (once created)

```env
# Required
VITE_API_URL=http://localhost:3000/api/v1

# Optional
VITE_APP_NAME=FinTracker
VITE_APP_VERSION=1.0.0
```

---

## Next Steps

Once local development is running:

1. ✅ **Create your first migration** (users table)
2. ✅ **Build authentication endpoints** (register, login)
3. ✅ **Test with Postman/Thunder Client**
4. ✅ **Add frontend login page** (React components)
5. ✅ **Continue with Phase 1 features**

---

## Quick Reference Commands

```bash
# Start everything
npm run docker:up && npm run dev

# Stop everything
Ctrl+C (in dev terminal) && npm run docker:down

# Reset database (fresh start)
npm run docker:down
docker volume rm fintracker_postgres_data
npm run docker:up
cd backend && npm run migrate:latest && npm run seed:run

# Run tests
npm test

# Check code quality
npm run lint && npm run format:check

# Build for production
npm run build
```

---

**You're all set for local development!** 🎉

Happy coding! If you encounter issues not covered here, check the main README or create a GitHub issue.
