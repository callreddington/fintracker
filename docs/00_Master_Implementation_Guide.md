# Personal Finance Tracker - Master Implementation Guide

## Document Structure

This implementation guide consists of separate phase documents, each buildable and testable independently:

---

## Phase 0: Environment Setup and Development Infrastructure

**File:** `Phase_0_Environment_Setup.md`

**Purpose:** Complete development environment before writing code

**Key Deliverables:**

- GitHub repository with branch protection
- Docker Compose (PostgreSQL, Redis, MailHog, Adminer)
- Supabase database configuration
- Upstash Redis setup
- Vercel frontend hosting
- Railway backend hosting
- CI/CD pipeline (GitHub Actions)
- Code quality tools (ESLint, Prettier, Husky)
- Setup scripts and documentation

**Time Estimate:** 2-3 days

---

## Phase 1: Foundation and Core Infrastructure (Enhanced)

**File:** `Phase_1_Foundation_Enhanced.md`

**Purpose:** Secure authentication and bulletproof ledger engine

**Critical Enhancements from Original:**
✅ Transaction lifecycle states (DRAFT → POSTED → VOID)
✅ Idempotency keys for duplicate prevention
✅ Hashed refresh tokens with rotation
✅ Rate limiting on authentication
✅ Multi-currency foundation
✅ DECIMAL(18,4) precision
✅ Optimistic locking
✅ TOTP MFA support
✅ Ledger invariant monitoring

**Key Modules:**

- Module 1.1: Authentication (enhanced security)
- Module 1.2: Ledger Engine (lifecycle + idempotency)
- Module 1.3: Monitoring and Health Checks

**Time Estimate:** 2 weeks

---

## Phase 2: Income and Expense Management (Enhanced)

**File:** `Phase_2_Income_Expense_Enhanced.md`

**Critical Enhancements from Original:**
✅ Effective-dated PAYE tax tables (KRA rate changes)
✅ Tax relief validation (KRA limits enforced)
✅ Receipt attachment support
✅ Split transaction capability
✅ Enhanced merchant normalization

**Key Modules:**

- Module 2.1: PAYE Calculator (versioned tax tables)
- Module 2.2: Income Management
- Module 2.3: Expense Tracking (with splits)
- Module 2.4: Budget Management (with rollover)
- Module 2.5: SMS Parsing (M-Pesa & banks)
- Module 2.6: Informal Loans (simple & compound interest)

**Time Estimate:** 2 weeks

---

## Phase 3: Financial Planning and Analysis (Enhanced)

**File:** `Phase_3_Financial_Planning_Enhanced.md`

**Critical Enhancements from Original:**
✅ Investment cost basis tracking
✅ Dividend/interest separate tracking (tax treatment)
✅ Goal progress formula clarification
✅ Asset revaluation suggestions

**Key Modules:**

- Module 3.1: Goals and Savings
- Module 3.2: Investment Portfolio (with cost basis)
- Module 3.3: Net Worth Tracking
- Module 3.4: Financial Projections
- Module 3.5: Insights Engine (rule-based)

**Time Estimate:** 2 weeks

---

## Phase 4: Automation and Intelligence (Enhanced)

**File:** `Phase_4_Automation_Intelligence_Enhanced.md`

**Critical Enhancements from Original:**
✅ Rule testing/dry-run mode
✅ Rule versioning (audit trail)
✅ ML confidence scoring
✅ Notification batching (immediate vs digest)

**Key Modules:**

- Module 4.1: Rule Engine (with testing)
- Module 4.2: SMS Parsing Automation
- Module 4.3: Predictive Insights (with confidence)
- Module 4.4: Smart Notifications

**Time Estimate:** 2 weeks

---

## Phase 5: Reconciliation, Export, and Production (Enhanced)

**File:** `Phase_5_Production_Ready_Enhanced.md`

**Critical Enhancements from Original:**
✅ Export retry logic with dead letter queue
✅ Automated backup integrity verification
✅ Complete security headers (CSP policy)
✅ Circuit breaker for external services

**Key Modules:**

- Module 5.1: Account Reconciliation
- Module 5.2: Data Export System (all formats)
- Module 5.3: Compliance and Audit
- Module 5.4: Performance Optimization
- Module 5.5: Production Deployment

**Time Estimate:** 2 weeks

---

## Implementation Timeline

**Total Estimated Time: 10-12 weeks**

### Sprint Breakdown

**Sprint 0 (1 week):** Environment Setup

- All hosting platforms configured
- Development environment tested
- CI/CD pipeline working

**Sprint 1-2 (2 weeks):** Phase 1 - Foundation

- Authentication with MFA
- Ledger with lifecycle states
- Monitoring setup

**Sprint 3-4 (2 weeks):** Phase 2 - Income & Expenses

- PAYE calculator
- Expense tracking
- SMS parsing

**Sprint 5-6 (2 weeks):** Phase 3 - Financial Planning

- Goals and investments
- Net worth tracking
- Insights engine

**Sprint 7-8 (2 weeks):** Phase 4 - Automation

- Rule engine
- Predictive features
- Smart notifications

**Sprint 9-10 (2 weeks):** Phase 5 - Production Ready

- Reconciliation
- Export system
- Performance optimization
- Security hardening

**Sprint 11-12 (2 weeks):** Testing & Hardening

- Load testing
- Security audit
- User acceptance testing
- Documentation finalization

---

## Cross-Cutting Concerns

### Security Requirements (All Phases)

**Authentication & Authorization:**

- JWT with 15-minute access tokens
- Refresh token rotation
- TOTP MFA for sensitive operations
- Row-level security in PostgreSQL

**Data Protection:**

- Encryption at rest (sensitive fields)
- TLS 1.3 in transit
- Hashed passwords (bcrypt, 12 rounds)
- Hashed refresh tokens (SHA-256)

**Rate Limiting:**

- Auth endpoints: 5/15min per IP
- API endpoints: 100/15min per user
- Export endpoints: 10/hour per user

**Input Validation:**

- Zod schemas for all API inputs
- Parameterized queries only
- Output encoding
- CSRF protection

### Error Handling (All Phases)

**Error Categories:**

- **4xx Client Errors**: User fixable
- **5xx Server Errors**: System issues
- **Retriable**: Network, temporary failures
- **Non-Retriable**: Validation, logic errors

**Error Response Format:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "User-friendly message",
    "field": "email",
    "details": {...},
    "correlation_id": "uuid",
    "timestamp": "2024-01-04T10:30:00Z"
  }
}
```

**Logging:**

- ERROR: All errors with stack traces
- WARN: Suspicious activity, degraded performance
- INFO: State changes, important events
- DEBUG: Detailed flow (development only)

### Testing Strategy (All Phases)

**Test Pyramid:**

- **70% Unit Tests**: Pure functions, business logic
- **20% Integration Tests**: API endpoints, database
- **10% E2E Tests**: User journeys, browser automation

**Coverage Requirements:**

- Overall: 80% minimum
- Financial logic: 100% required
- Critical paths: 100% required

**Test Types:**

- **Unit**: Jest + Jest coverage
- **Integration**: Supertest + test database
- **E2E**: Cypress + MailHog
- **Load**: k6 or Artillery
- **Security**: OWASP ZAP

### Performance Requirements (All Phases)

**API Response Times:**

- P50: <200ms
- P95: <500ms
- P99: <1000ms

**Database:**

- Query timeout: 1000ms
- Connection pool: 10-20 connections
- Slow query log: >100ms

**Frontend:**

- First Contentful Paint: <1.5s
- Time to Interactive: <3.5s
- Lighthouse Score: >90

---

## Critical Success Factors

### For Claude Code Implementation

1. **Read the phase document fully before coding**
   - Understand the module dependencies
   - Note the critical enhancements
   - Review API contracts

2. **Start with tests (TDD approach)**
   - Write failing test first
   - Implement minimum code to pass
   - Refactor for quality

3. **Respect the architecture**
   - Routes → Controllers → Services → Repositories
   - No business logic in controllers
   - No database access outside repositories

4. **Use TypeScript strictly**
   - No `any` types
   - Explicit return types
   - Interface everything

5. **Financial correctness over speed**
   - Use Decimal.js, never floats
   - Validate double-entry always
   - Check balances after every operation

6. **Security is non-negotiable**
   - Hash everything sensitive
   - Validate all inputs
   - Rate limit all endpoints
   - Log security events

7. **Make it observable**
   - Structured logging
   - Correlation IDs
   - Metrics on everything
   - Health checks

8. **Document as you build**
   - Update OpenAPI spec
   - Comment complex logic only
   - Update README for setup changes

---

## Key Design Principles

### The Ledger Principles

1. **Ledger is immutable truth** - No edits, only VOID and replace
2. **Double-entry is sacred** - Debits MUST equal credits
3. **Use Decimal math only** - Never floats for money
4. **Audit everything** - Complete trail of all changes
5. **Currency explicit always** - Never assume currency

### The Security Principles

1. **Defense in depth** - Security at every layer
2. **Least privilege** - Minimum access required
3. **Hash everything sensitive** - Passwords, tokens, secrets
4. **Rate limit everything** - Prevent abuse
5. **Trust no input** - Validate everything

### The Reliability Principles

1. **Idempotency everywhere** - Retries are safe
2. **Fail fast** - Return errors immediately
3. **Circuit breakers** - Graceful degradation
4. **Retry with backoff** - Don't hammer failing services
5. **Monitor everything** - Know when things break

### The Code Quality Principles

1. **Explicit over implicit** - Clear is better than clever
2. **Single responsibility** - One function, one job
3. **Type safety** - TypeScript strict mode
4. **Test first** - TDD when possible
5. **Document why, not what** - Code shows what, comments show why

---

## Documentation Structure

```
docs/
├── setup/
│   ├── local-development.md
│   ├── supabase-setup.md
│   ├── vercel-deployment.md
│   └── railway-deployment.md
├── api/
│   ├── openapi.yaml
│   ├── authentication.md
│   ├── ledger.md
│   ├── transactions.md
│   └── ...
├── architecture/
│   ├── overview.md
│   ├── database-schema.md
│   ├── security-model.md
│   └── deployment.md
├── guides/
│   ├── paye-calculator.md
│   ├── sms-parsing.md
│   ├── reconciliation.md
│   └── ...
└── runbooks/
    ├── incident-response.md
    ├── deployment.md
    └── common-tasks.md
```

---

## Appendix: Technology Choices Rationale

### Why Express.js + TypeScript?

- Type safety for financial calculations
- Large ecosystem
- Excellent AI code generation support
- Easy serverless deployment

### Why PostgreSQL?

- ACID compliance (critical for finance)
- Row-level security
- JSONB for flexibility
- Excellent performance
- Mature and stable

### Why Redis?

- Fast session storage
- Cache for computed values
- Rate limiting support
- Pub/sub for real-time features

### Why React + Vite?

- Fast development experience
- Excellent TypeScript support
- Large component ecosystem
- Good mobile performance

### Why Supabase?

- PostgreSQL with batteries included
- Free tier sufficient for personal use
- Automatic backups (paid tier)
- Real-time subscriptions
- File storage included

### Why Vercel?

- Zero-config React deployment
- Free tier unlimited
- Automatic HTTPS and CDN
- Preview deployments
- Excellent DX

### Why Railway?

- Full-stack in one place
- Simple Node.js deployment
- Built-in PostgreSQL (or use external)
- Automatic HTTPS
- Good monitoring

---

## Getting Started

1. **Clone repository**
2. **Read Phase 0** - Complete environment setup
3. **Read Phase 1** - Understand foundation architecture
4. **Run setup script** - `./scripts/setup-dev.sh`
5. **Start Phase 1 implementation**
6. **Test continuously**
7. **Deploy to staging after each phase**
8. **Production deployment after Phase 5**

---

## Support and Feedback

For issues, questions, or suggestions:

- GitHub Issues: Technical bugs and feature requests
- Discussions: Architecture questions and design decisions
- Wiki: Evolving documentation and learnings

---

**Remember: Financial correctness > Speed. User trust > Feature count.**

Build it right, not fast. Test everything. Document decisions. Ship confidently.
