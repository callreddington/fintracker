# Phase 0: Environment Setup and Development Infrastructure

## Overview

This phase establishes the complete development environment, tooling, CI/CD pipeline, and hosting infrastructure before any application code is written. It ensures all team members (human and AI) work in a consistent, reproducible environment with proper version control, testing frameworks, and deployment automation.

---

## Module 0.1: Version Control and Repository Setup

### Repository Structure

```
finance-tracker/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-staging.yml
│       └── deploy-production.yml
├── backend/
│   ├── src/
│   ├── tests/
│   ├── migrations/
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   ├── public/
│   ├── tests/
│   ├── package.json
│   └── vite.config.ts
├── docs/
│   ├── api/
│   ├── architecture/
│   └── setup/
├── scripts/
│   ├── setup-dev.sh
│   ├── seed-data.sh
│   └── reset-db.sh
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

### GitHub Repository Configuration

**Repository Settings:**

- Repository name: `personal-finance-tracker`
- Visibility: Private (initially)
- Default branch: `main`
- Branch protection rules for `main`:
  - Require pull request reviews (1 approval minimum)
  - Require status checks to pass before merging
  - Require branches to be up to date before merging
  - Include administrators in restrictions

**Branch Strategy:**

- `main` - Production-ready code
- `staging` - Integration testing branch
- `feature/*` - Feature development branches
- `hotfix/*` - Emergency production fixes

**GitHub Actions Secrets:**

- `DATABASE_URL_STAGING`
- `DATABASE_URL_PRODUCTION`
- `JWT_SECRET_STAGING`
- `JWT_SECRET_PRODUCTION`
- `ENCRYPTION_KEY_STAGING`
- `ENCRYPTION_KEY_PRODUCTION`
- `VERCEL_TOKEN`
- `SUPABASE_ACCESS_TOKEN`

---

## Module 0.2: Local Development Environment

### Prerequisites Installation

**Required Software:**

- Node.js 20.x LTS
- PostgreSQL 16.x
- Redis 7.x
- Git 2.40+
- Docker & Docker Compose
- Visual Studio Code (recommended)

### Docker Compose Configuration

**Services:**

1. **PostgreSQL** - Main database
   - Port: 5432
   - Database: `finance_tracker_dev`
   - User: `dev_user`
   - Password: `dev_password` (local only)
   - Volumes: Persistent data storage

2. **Redis** - Session and cache storage
   - Port: 6379
   - Persistence: RDB snapshots

3. **MailHog** - Email testing
   - SMTP Port: 1025
   - Web UI: http://localhost:8025

4. **Adminer** - Database management UI
   - Port: 8080
   - Direct PostgreSQL access

**Docker Compose File Structure:**

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: finance_tracker_dev
      POSTGRES_USER: dev_user
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dev_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  mailhog:
    image: mailhog/mailhog:latest
    ports:
      - "1025:1025" # SMTP
      - "8025:8025" # Web UI

  adminer:
    image: adminer:latest
    ports:
      - "8080:8080"
    environment:
      ADMINER_DEFAULT_SERVER: postgres

volumes:
  postgres_data:
  redis_data:
```

### Environment Variables

**`.env.example` for Backend:**

```
# Application
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database
DATABASE_URL=postgresql://dev_user:dev_password@localhost:5432/finance_tracker_dev
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Encryption
ENCRYPTION_KEY=your-32-byte-hex-encryption-key-change-in-production

# Email (MailHog for dev)
EMAIL_HOST=localhost
EMAIL_PORT=1025
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=noreply@financetracker.local

# CORS
CORS_ORIGINS=http://localhost:5173

# Logging
LOG_LEVEL=debug

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**`.env.example` for Frontend:**

```
# API Configuration
VITE_API_URL=http://localhost:3000/api/v1
VITE_API_TIMEOUT=30000

# Application
VITE_APP_NAME=Personal Finance Tracker
VITE_APP_VERSION=0.1.0

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_TRACKING=false
```

### Setup Scripts

**`scripts/setup-dev.sh`:**

```bash
#!/bin/bash
set -e

echo "🚀 Setting up development environment..."

# Start Docker services
echo "📦 Starting Docker services..."
docker-compose up -d

# Wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL..."
until docker-compose exec -T postgres pg_isready -U dev_user; do
  sleep 1
done

# Install backend dependencies
echo "📚 Installing backend dependencies..."
cd backend
npm install

# Run database migrations
echo "🗄️  Running database migrations..."
npm run migrate:latest

# Seed development data
echo "🌱 Seeding development data..."
npm run seed:run

# Install frontend dependencies
echo "🎨 Installing frontend dependencies..."
cd ../frontend
npm install

echo "✅ Development environment ready!"
echo ""
echo "📝 Next steps:"
echo "   1. Backend: cd backend && npm run dev"
echo "   2. Frontend: cd frontend && npm run dev"
echo "   3. MailHog UI: http://localhost:8025"
echo "   4. Adminer: http://localhost:8080"
```

**`scripts/seed-data.sh`:**

```bash
#!/bin/bash
# Seeds realistic test data for development

echo "🌱 Seeding development data..."

# User accounts
# Income transactions
# Expense transactions
# Budgets
# Goals
# Sample reconciliation data
```

**`scripts/reset-db.sh`:**

```bash
#!/bin/bash
# Resets database to clean state

echo "⚠️  WARNING: This will delete all data!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" = "yes" ]; then
  npm run migrate:rollback:all
  npm run migrate:latest
  npm run seed:run
  echo "✅ Database reset complete"
fi
```

---

## Module 0.3: Backend Technology Stack

### Core Framework

**FastAPI (Python) OR Express.js (Node.js)**

**Recommendation: Express.js with TypeScript**

**Reasons:**

- TypeScript provides excellent type safety for financial calculations
- Large ecosystem for Node.js packages
- Better AI code generation support
- Easier deployment to Vercel/Railway

**Key Dependencies:**

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "typescript": "^5.3.0",
    "@types/express": "^4.17.0",
    "pg": "^8.11.0",
    "redis": "^4.6.0",
    "bcrypt": "^5.1.0",
    "jsonwebtoken": "^9.0.0",
    "decimal.js": "^10.4.0",
    "zod": "^3.22.0",
    "winston": "^3.11.0",
    "express-rate-limit": "^7.1.0",
    "helmet": "^7.1.0",
    "cors": "^2.8.0",
    "dotenv": "^16.3.0"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "@types/jest": "^29.5.0",
    "supertest": "^6.3.0",
    "ts-node": "^10.9.0",
    "nodemon": "^3.0.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0"
  }
}
```

### Database Migration Tool

**Knex.js** for migrations and query building

**Setup:**

```javascript
// knexfile.ts
module.exports = {
  development: {
    client: "postgresql",
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: "./migrations",
      tableName: "knex_migrations",
    },
    seeds: {
      directory: "./seeds",
    },
  },
};
```

### ORM/Query Builder

**Options:**

1. **Knex.js** - SQL query builder (recommended for full control)
2. **Prisma** - Type-safe ORM with excellent TypeScript support
3. **TypeORM** - Traditional ORM pattern

**Recommendation: Knex.js** for financial app precision

### Testing Framework

**Jest** with **Supertest** for API testing

**Configuration:**

```javascript
// jest.config.js
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

---

## Module 0.4: Frontend Technology Stack

### Core Framework

**React 18+ with Vite**

**Key Dependencies:**

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.0",
    "decimal.js": "^10.4.0",
    "date-fns": "^2.30.0",
    "recharts": "^2.10.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    "@tanstack/react-query": "^5.14.0",
    "zustand": "^4.4.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "typescript": "^5.3.0",
    "@types/react": "^18.2.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0",
    "tailwindcss": "^3.4.0"
  }
}
```

### UI Component Library

**Options:**

1. **Shadcn/ui** - Copy-paste components (recommended)
2. **Material-UI** - Complete component system
3. **Chakra UI** - Simple and accessible

**Recommendation: Shadcn/ui** for customization

### State Management

**Zustand** for global state
**React Query** for server state

### Styling

**Tailwind CSS** for utility-first styling

**Configuration:**

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {...},
        secondary: {...}
      }
    }
  }
}
```

---

## Module 0.5: Database Hosting - Supabase

### Why Supabase?

- **PostgreSQL 16** with extensions
- **Free tier**: 500MB database, 2GB bandwidth
- **Row Level Security** built-in
- **Real-time subscriptions** for live updates
- **Authentication** (optional - we're building custom)
- **Storage** for receipt uploads
- **Automatic backups** on paid tiers

### Supabase Setup

**1. Create Project:**

- Sign up at https://supabase.com
- Create new project: `finance-tracker-dev`
- Region: Choose closest to Nairobi (Europe West recommended)
- Database password: Generate strong password

**2. Connection Details:**

```
Host: db.[project-ref].supabase.co
Port: 5432
Database: postgres
User: postgres
Password: [your-password]
Connection Mode: Session (not Transaction)
```

**3. Environment Configuration:**

```bash
# Direct connection
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# Connection pooler (for serverless)
DATABASE_URL_POOLER=postgresql://postgres:[password]@db.[project-ref].supabase.co:6543/postgres?pgbouncer=true
```

**4. Enable Extensions:**

```sql
-- Run in SQL Editor
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For better indexing
```

**5. Row Level Security:**

```sql
-- Enable RLS on all tables (run after migrations)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
-- ... etc for all tables
```

### Supabase CLI Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to project
supabase link --project-ref [your-project-ref]

# Generate TypeScript types from database
supabase gen types typescript --linked > types/supabase.ts
```

---

## Module 0.6: Redis Hosting - Upstash

### Why Upstash?

- **Serverless Redis** with per-request pricing
- **Free tier**: 10,000 commands/day
- **Global replication** for low latency
- **REST API** for serverless functions
- **Built-in persistence**

### Upstash Setup

**1. Create Database:**

- Sign up at https://upstash.com
- Create Redis database
- Region: Global (for best Kenya access)
- Type: Regional (cheaper for dev)

**2. Connection Details:**

```bash
# Redis URL
REDIS_URL=redis://default:[password]@[endpoint]:6379

# REST API (for serverless)
UPSTASH_REDIS_REST_URL=https://[endpoint].upstash.io
UPSTASH_REDIS_REST_TOKEN=[token]
```

**3. Usage Example:**

```typescript
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

// Store refresh token
await redis.setex(`refresh_token:${userId}`, 604800, tokenHash);
```

---

## Module 0.7: Frontend Hosting - Vercel

### Why Vercel?

- **Zero-config deployment** for React/Vite
- **Free tier**: Unlimited bandwidth
- **Automatic HTTPS** and CDN
- **Preview deployments** for PRs
- **Environment variables** per environment

### Vercel Setup

**1. Install Vercel CLI:**

```bash
npm install -g vercel
```

**2. Link Project:**

```bash
cd frontend
vercel link
```

**3. Configure Project:**

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_API_URL": "@api-url"
  }
}
```

**4. Deploy:**

```bash
# Development preview
vercel

# Production
vercel --prod
```

**5. Custom Domain:**

- Add domain in Vercel dashboard
- Configure DNS records
- Automatic SSL certificate

---

## Module 0.8: Backend Hosting - Railway

### Why Railway?

- **Full-stack hosting** in one place
- **Free tier**: $5 credit/month
- **PostgreSQL included** (or use Supabase)
- **Automatic deployments** from GitHub
- **Environment variables** management
- **Built-in monitoring**

### Railway Setup

**1. Create Project:**

- Sign up at https://railway.app
- Create new project from GitHub repo
- Select `backend` directory as root

**2. Configure Service:**

```toml
# railway.toml
[build]
builder = "NIXPACKS"
buildCommand = "npm install && npm run build"

[deploy]
startCommand = "npm run start"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[[healthcheck]]
path = "/api/v1/health"
port = 3000
timeout = 10
```

**3. Environment Variables:**

- Add all production environment variables
- Link Supabase database URL
- Link Upstash Redis URL
- Generate production JWT secrets

**4. Custom Domain:**

- Add custom domain
- Configure DNS
- Railway provides SSL automatically

---

## Module 0.9: CI/CD Pipeline

### GitHub Actions Workflow

**`.github/workflows/ci.yml`:**

```yaml
name: CI

on:
  pull_request:
    branches: [main, staging]
  push:
    branches: [main, staging]

jobs:
  backend-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        working-directory: backend
        run: npm ci

      - name: Run linting
        working-directory: backend
        run: npm run lint

      - name: Run type checking
        working-directory: backend
        run: npm run type-check

      - name: Run migrations
        working-directory: backend
        run: npm run migrate:latest
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/test_db

      - name: Run tests
        working-directory: backend
        run: npm run test:coverage
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: backend/coverage/lcov.info

  frontend-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Run linting
        working-directory: frontend
        run: npm run lint

      - name: Run type checking
        working-directory: frontend
        run: npm run type-check

      - name: Build
        working-directory: frontend
        run: npm run build

      - name: Run tests
        working-directory: frontend
        run: npm run test:coverage
```

**`.github/workflows/deploy-production.yml`:**

```yaml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: backend

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: "--prod"
          working-directory: frontend
```

---

## Module 0.10: Code Quality Tools

### ESLint Configuration

**`.eslintrc.js`:**

```javascript
module.exports = {
  parser: "@typescript-eslint/parser",
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  rules: {
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "no-console": ["warn", { allow: ["warn", "error"] }],
  },
};
```

### Prettier Configuration

**`.prettierrc`:**

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### Husky Pre-commit Hooks

```bash
# Install
npm install -D husky lint-staged

# Configure
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

**`package.json` addition:**

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

---

## Module 0.11: Documentation Setup

### API Documentation

**Swagger/OpenAPI** with automatic generation

```bash
npm install swagger-ui-express swagger-jsdoc
```

**Served at:** `http://localhost:3000/api-docs`

### README Template

````markdown
# Personal Finance Tracker

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose

### Setup

```bash
git clone [repo-url]
cd personal-finance-tracker
./scripts/setup-dev.sh
```
````

### Running Locally

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### Testing

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

## Architecture

See [docs/architecture/](docs/architecture/)

## API Documentation

http://localhost:3000/api-docs

```

---

## Deliverables Checklist

- [ ] GitHub repository created and configured
- [ ] Docker Compose setup tested locally
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Supabase project created and connected
- [ ] Upstash Redis created and connected
- [ ] Vercel project linked
- [ ] Railway project created
- [ ] CI/CD pipeline configured
- [ ] Pre-commit hooks working
- [ ] Setup scripts tested
- [ ] Documentation reviewed
- [ ] All team members have access

---

## Next Steps

After Phase 0 completion, proceed to **Phase 1: Foundation and Core Infrastructure** where actual application code begins.
```
