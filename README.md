# FinTracker 💰

**Personal Finance Tracker for Kenyan Employees**

A professional-grade web application for tracking income, expenses, investments, and financial goals. Built specifically for the Kenyan financial ecosystem with support for PAYE tax calculations, M-Pesa SMS parsing, NSE stock tracking, and KRA compliance.

---

## Features

### Phase 1: Foundation ✅

- **Authentication**: Secure registration and login with JWT tokens
- **Double-Entry Ledger**: Immutable accounting with transaction lifecycle (DRAFT → POSTED → VOID)
- **Account Management**: Bank accounts, M-Pesa, income/expense categories
- **Multi-Currency Support**: KES, USD, EUR with exchange rate tracking

### Phase 2: Income & Expenses ✅

- **PAYE Calculator**: Automatic tax calculation with versioned KRA tax tables
- **Statutory Deductions**: NHIF, NSSF, Housing Levy with current rates
- **Expense Tracking**: Split transactions, merchant database, receipt attachments
- **Budget Management**: Monthly budgets with rollover and alerts
- **SMS Parsing**: Auto-import from M-Pesa and bank SMS messages

### Phase 3: Financial Planning ✅

- **Goals & Savings**: Track financial goals with milestone notifications
- **Investment Portfolio**: NSE stocks with cost basis tracking and dividend management
- **Net Worth Tracking**: Comprehensive asset/liability dashboard
- **Insights Engine**: Rule-based financial insights and spending patterns

---

## Tech Stack

**Backend**:

- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 16 (Supabase)
- **Cache**: Redis 7 (Upstash)
- **ORM**: Knex.js (migrations and queries)
- **Testing**: Jest + Supertest

**Frontend**:

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand + React Query
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts

**Infrastructure**:

- **Database Hosting**: Supabase (Free Tier)
- **Cache Hosting**: Upstash (Free Tier)
- **Frontend Hosting**: Vercel (Free Tier)
- **Backend Hosting**: Render (Free Tier)
- **CI/CD**: GitHub Actions

---

## Getting Started

### Prerequisites

- **Node.js**: v20.0.0 or higher
- **npm**: v10.0.0 or higher
- **Docker**: v24.0.0 or higher (for local development)
- **Git**: Latest version

Check your versions:

```bash
node --version  # Should be v20.x.x or higher
npm --version   # Should be v10.x.x or higher
docker --version  # Should be 24.x.x or higher
```

### Installation

1. **Clone the repository**:

```bash
git clone https://github.com/callreddington/personal-finance-tracker.git
cd personal-finance-tracker
```

2. **Install dependencies**:

```bash
npm install
```

3. **Start Docker services** (PostgreSQL, Redis, MailHog, Adminer):

```bash
npm run docker:up
```

Verify services are running:

- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- MailHog Web UI: http://localhost:8025
- Adminer (Database UI): http://localhost:8080
  - System: PostgreSQL
  - Server: postgres
  - Username: fintracker_user
  - Password: fintracker_password
  - Database: fintracker_dev

4. **Set up environment variables**:

Backend `.env` file:

```bash
cd backend
cp .env.example .env
# Edit .env with your configuration (see docs/guides/00_INFRASTRUCTURE_SETUP.md)
```

Frontend `.env` file:

```bash
cd frontend
cp .env.example .env
# Edit .env with API URL (default: http://localhost:3000/api/v1)
```

5. **Run database migrations**:

```bash
cd backend
npm run migrate:latest
```

6. **Seed initial data** (optional):

```bash
npm run seed:run
```

7. **Start development servers**:

```bash
# From project root
npm run dev

# Or start individually:
npm run dev:backend   # Backend API on http://localhost:3000
npm run dev:frontend  # Frontend app on http://localhost:5173
```

8. **Open the application**:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api/v1
- API Health Check: http://localhost:3000/api/v1/health

---

## Project Structure

```
fintracker/
├── backend/                  # Express.js API
│   ├── src/
│   │   ├── config/          # Configuration (database, redis, env)
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── modules/         # Business logic modules
│   │   │   ├── auth/       # Authentication
│   │   │   ├── ledger/     # Ledger engine
│   │   │   ├── income/     # PAYE, salary
│   │   │   ├── expense/    # Expenses, budgets
│   │   │   ├── goals/      # Goals and savings
│   │   │   ├── investments/ # Portfolio management
│   │   │   ├── insights/   # Net worth, insights
│   │   │   └── sms/        # SMS parsing
│   │   ├── database/
│   │   │   ├── migrations/ # Database migrations
│   │   │   └── seeds/      # Seed data
│   │   ├── utils/          # Utility functions
│   │   ├── types/          # TypeScript types
│   │   ├── app.ts          # Express app setup
│   │   └── server.ts       # Server entry point
│   ├── tests/              # Test files
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── ui/        # shadcn components
│   │   │   ├── auth/      # Auth components
│   │   │   ├── dashboard/ # Dashboard
│   │   │   ├── transactions/
│   │   │   ├── budgets/
│   │   │   ├── goals/
│   │   │   └── layout/    # Navigation, theme
│   │   ├── pages/         # Route pages
│   │   ├── lib/           # API client, utils
│   │   ├── hooks/         # Custom hooks
│   │   ├── store/         # Zustand stores
│   │   ├── types/         # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── docs/                    # Documentation
│   ├── guides/             # Setup and user guides
│   └── architecture/       # Technical documentation
├── docker-compose.yml      # Local development services
├── .gitignore
├── package.json            # Monorepo configuration
└── README.md
```

---

## Development

### Available Scripts

**Root (Monorepo)**:

```bash
npm run dev              # Start both backend and frontend
npm run build            # Build both backend and frontend
npm run test             # Run all tests
npm run lint             # Lint all code
npm run format           # Format code with Prettier
npm run docker:up        # Start Docker services
npm run docker:down      # Stop Docker services
```

**Backend**:

```bash
cd backend
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm run start            # Start production server
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
npm run migrate:make     # Create new migration
npm run migrate:latest   # Run migrations
npm run migrate:rollback # Rollback last migration
npm run seed:make        # Create seed file
npm run seed:run         # Run seeds
npm run lint             # Run ESLint
```

**Frontend**:

```bash
cd frontend
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm test                 # Run tests
npm run lint             # Run ESLint
```

### Code Quality

**Linting**:

```bash
npm run lint             # Check all code
npm run lint:fix         # Auto-fix issues
```

**Formatting**:

```bash
npm run format           # Format all files
npm run format:check     # Check formatting
```

**Testing**:

```bash
npm test                 # Run all tests
npm run test:coverage    # Generate coverage report
```

### Git Workflow

**Branching Strategy**:

```
main (production)
  └── develop (staging)
      ├── feature/feature-name
      ├── fix/bug-description
      └── chore/task-description
```

**Commit Convention** (Conventional Commits):

```bash
feat: add PAYE calculator with versioned tax tables
fix: correct double-entry validation logic
docs: add API documentation for /auth/register
test: add unit tests for SMS parser
chore: update dependencies
refactor: simplify ledger balance calculation
```

**Pre-commit Hooks** (via Husky):

- Linting (ESLint)
- Formatting (Prettier)
- Type checking (TypeScript)
- Commit message validation (commitlint)

---

## Testing

### Running Tests

```bash
# All tests
npm test

# Backend tests only
npm run test:backend

# Frontend tests only
npm run test:frontend

# With coverage
npm run test:coverage

# Watch mode
npm test -- --watch
```

### Test Coverage Goals

- **Unit Tests**: 70% minimum
- **Integration Tests**: 20% minimum
- **E2E Tests**: 10% minimum
- **Overall**: 80%+ coverage

---

## Deployment

### Environment Setup

See `docs/guides/00_INFRASTRUCTURE_SETUP.md` for detailed infrastructure setup.

### Deploy to Staging

```bash
git push origin develop
# Automatically deploys to Render (backend) and Vercel (frontend) preview
```

### Deploy to Production

```bash
git checkout main
git merge develop
git push origin main
# Automatically deploys to production via GitHub Actions
```

### Environment Variables

**Backend (Render)**:

- `NODE_ENV=production`
- `DATABASE_URL` (Supabase connection string)
- `REDIS_URL` (Upstash connection string)
- `JWT_SECRET` (64-char random string)
- `FRONTEND_URL` (Vercel production URL)

**Frontend (Vercel)**:

- `VITE_API_URL` (Render backend URL)
- `VITE_APP_NAME=FinTracker`
- `VITE_APP_VERSION=1.0.0`

---

## Documentation

### Guides

- [Infrastructure Setup](docs/guides/00_INFRASTRUCTURE_SETUP.md) - Cloud services setup
- [Local Development](docs/guides/01_LOCAL_DEVELOPMENT.md) - Development environment
- [Database Setup](docs/guides/02_DATABASE_SETUP.md) - Database configuration
- [API Reference](docs/guides/03_API_REFERENCE.md) - API endpoints documentation
- [Deployment Guide](docs/guides/04_DEPLOYMENT.md) - Production deployment

### Architecture

- [System Design](docs/architecture/SYSTEM_DESIGN.md)
- [Database Schema](docs/architecture/DATABASE_SCHEMA.md)
- [API Design](docs/architecture/API_DESIGN.md)
- [Security](docs/architecture/SECURITY.md)

---

## Contributing

### Development Workflow

1. **Create a feature branch**:

```bash
git checkout -b feature/your-feature-name
```

2. **Make changes and commit**:

```bash
git add .
git commit -m "feat: add your feature description"
```

3. **Push to GitHub**:

```bash
git push origin feature/your-feature-name
```

4. **Create Pull Request**:

- Go to GitHub
- Create PR from your branch to `develop`
- Wait for CI checks to pass
- Request review

5. **After approval**:

- Merge to `develop`
- Delete feature branch

### Code Style

- **TypeScript**: Strict mode enabled
- **Naming**: camelCase for variables, PascalCase for classes/components
- **Comments**: JSDoc for public functions
- **File naming**: kebab-case for files

---

## Troubleshooting

### Common Issues

**Docker services won't start**:

```bash
docker-compose down -v  # Remove volumes
docker-compose up -d    # Restart
```

**Database migration errors**:

```bash
cd backend
npm run migrate:rollback  # Rollback last migration
npm run migrate:latest    # Re-run migrations
```

**Port already in use**:

```bash
# Find process using port 3000
lsof -i :3000
# Kill the process
kill -9 <PID>
```

**npm install fails**:

```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**Type errors in IDE**:

```bash
# Restart TypeScript server in VS Code
Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

### Getting Help

- **Issues**: https://github.com/callreddington/personal-finance-tracker/issues
- **Discussions**: https://github.com/callreddington/personal-finance-tracker/discussions

---

## Security

### Reporting Vulnerabilities

Please email security issues to: [your-email]@example.com

Do NOT create public GitHub issues for security vulnerabilities.

### Security Features

- **Authentication**: JWT with refresh token rotation
- **Password Hashing**: Bcrypt (12 rounds)
- **Rate Limiting**: 5 login attempts per 15 minutes
- **Input Validation**: Zod schemas on all endpoints
- **SQL Injection Protection**: Parameterized queries via Knex
- **XSS Protection**: Output encoding, CSP headers
- **CSRF Protection**: SameSite cookies, CSRF tokens

---

## License

MIT License - see [LICENSE](LICENSE) file for details

---

## Roadmap

### v1.0 (Current - January 2026)

- [x] Authentication and authorization
- [x] Ledger engine with double-entry bookkeeping
- [x] PAYE calculator with KRA compliance
- [x] Expense tracking and budgets
- [x] M-Pesa SMS parsing
- [x] Goals and savings tracking
- [x] Investment portfolio basics
- [x] Net worth dashboard

### v1.1 (Q2 2026)

- [ ] Advanced reconciliation system
- [ ] Data export (CSV, Excel, PDF)
- [ ] KRA tax documentation export
- [ ] Mobile responsive improvements
- [ ] Performance optimizations

### v1.2 (Q3 2026)

- [ ] M-Pesa Daraja API integration
- [ ] Bank API integration (open banking)
- [ ] Receipt OCR scanning
- [ ] Advanced investment analytics
- [ ] Loan amortization calculator

### v2.0 (Q4 2026)

- [ ] Mobile apps (React Native)
- [ ] Family accounts (multi-user)
- [ ] Financial advisor dashboard
- [ ] Machine learning insights
- [ ] Multi-currency improvements

---

## Acknowledgments

- Built with ❤️ for Kenyan employees
- Inspired by the need for better financial management tools in Kenya
- Special thanks to the open-source community

---

## Contact

- **GitHub**: [@callreddington](https://github.com/callreddington)
- **Repository**: [personal-finance-tracker](https://github.com/callreddington/personal-finance-tracker)

---

**Made in Kenya 🇰🇪 | Powered by TypeScript, React, and PostgreSQL**
