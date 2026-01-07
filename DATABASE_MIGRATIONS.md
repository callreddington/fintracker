# Database Migrations Complete

## Created Migrations (6 Total)

### 1. Users Table ✅

**File**: `20260107090040_create_users_table.ts`

**Purpose**: User authentication and profile management

**Schema**:

- `id` (UUID, PK) - Auto-generated with `gen_random_uuid()`
- `email` (VARCHAR, UNIQUE, NOT NULL) - User login email
- `password_hash` (VARCHAR, NOT NULL) - Bcryptjs hashed password
- `full_name` (VARCHAR, NOT NULL) - User's display name
- `email_verified` (BOOLEAN, DEFAULT FALSE) - Email verification status
- `email_verified_at` (TIMESTAMP, NULL) - Verification timestamp
- `created_at`, `updated_at` (TIMESTAMP) - Auto-managed timestamps

**Features**:

- ✅ Unique email constraint
- ✅ Indexed email for fast lookups
- ✅ Auto-updating `updated_at` trigger

---

### 2. Refresh Tokens Table ✅

**File**: `20260107090109_create_refresh_tokens_table.ts`

**Purpose**: Secure JWT refresh token management with rotation

**Schema**:

- `id` (UUID, PK)
- `user_id` (UUID, FK → users) - CASCADE on delete
- `token_hash` (VARCHAR, UNIQUE, NOT NULL) - Hashed refresh token
- `expires_at` (TIMESTAMP, NOT NULL) - Token expiration
- `is_revoked` (BOOLEAN, DEFAULT FALSE) - Revocation flag
- `revoked_at` (TIMESTAMP, NULL) - Revocation timestamp
- `created_at` (TIMESTAMP) - Creation time

**Features**:

- ✅ Tokens stored as hashes (never plaintext)
- ✅ Indexed on `user_id`, `token_hash`, `expires_at`
- ✅ Cascade delete when user is deleted

---

### 3. Accounts Table ✅

**File**: `20260107090136_create_accounts_table.ts`

**Purpose**: Chart of accounts for double-entry ledger system

**Schema**:

- `id` (UUID, PK)
- `user_id` (UUID, FK → users) - CASCADE on delete
- `name` (VARCHAR, NOT NULL) - e.g., "KCB Savings", "M-Pesa"
- `account_number` (VARCHAR, NULL) - Optional account number
- `type` (ENUM, NOT NULL) - ASSET | LIABILITY | INCOME | EXPENSE | EQUITY
- `subtype` (VARCHAR, NOT NULL) - BANK, CASH, MPESA, SALARY, GROCERIES, etc.
- `currency` (CHAR(3), DEFAULT 'KES') - Currency code
- `is_active` (BOOLEAN, DEFAULT TRUE) - Active status
- `description` (TEXT, NULL) - Optional notes
- `metadata` (JSONB, NULL) - Flexible JSON storage
- `created_at`, `updated_at` (TIMESTAMP)

**Features**:

- ✅ Supports all account types for double-entry bookkeeping
- ✅ Indexed on `user_id`, `type`, `is_active`
- ✅ JSONB for flexible metadata (bank details, etc.)
- ✅ Auto-updating timestamps

**Account Types**:

- **ASSET**: BANK, CASH, MPESA, INVESTMENT
- **LIABILITY**: LOAN, CREDIT_CARD
- **INCOME**: SALARY, BUSINESS, INVESTMENT_INCOME
- **EXPENSE**: GROCERIES, TRANSPORT, UTILITIES, etc.
- **EQUITY**: CAPITAL, RETAINED_EARNINGS

---

### 4. Transactions Table ✅

**File**: `20260107090217_create_transactions_table.ts`

**Purpose**: Transaction headers with lifecycle management

**Schema**:

- `id` (UUID, PK)
- `user_id` (UUID, FK → users) - CASCADE on delete
- `description` (VARCHAR(500), NOT NULL) - Transaction description
- `notes` (TEXT, NULL) - Additional notes
- `transaction_date` (DATE, NOT NULL) - User-specified date
- `status` (ENUM, DEFAULT 'DRAFT') - DRAFT | POSTED | VOID
- `posted_at` (TIMESTAMP, NULL) - Posting timestamp
- `voided_at` (TIMESTAMP, NULL) - Voiding timestamp
- `idempotency_key` (VARCHAR, UNIQUE, NULL) - Duplicate prevention
- `metadata` (JSONB, NULL) - Additional data
- `created_at`, `updated_at` (TIMESTAMP)

**Features**:

- ✅ Transaction lifecycle: DRAFT → POSTED → VOID
- ✅ Idempotency support (prevent duplicate transactions)
- ✅ Indexed on `user_id`, `transaction_date`, `status`
- ✅ POSTED transactions are immutable (enforced in application)
- ✅ VOID creates reversing entries (not deletion)

**Status Flow**:

- **DRAFT**: Work in progress, can be edited/deleted
- **POSTED**: Finalized, affects balances, immutable
- **VOID**: Cancelled, reversing entries created

---

### 5. Ledger Entries Table ✅

**File**: `20260107090251_create_ledger_entries_table.ts`

**Purpose**: Double-entry bookkeeping entries (DEBIT/CREDIT)

**Schema**:

- `id` (UUID, PK)
- `transaction_id` (UUID, FK → transactions) - CASCADE on delete
- `account_id` (UUID, FK → accounts) - RESTRICT on delete
- `entry_type` (ENUM, NOT NULL) - DEBIT | CREDIT
- `amount` (DECIMAL(18,4), NOT NULL) - Monetary amount
- `currency` (CHAR(3), NOT NULL) - Currency code
- `description` (VARCHAR(500), NULL) - Entry-specific description
- `created_at` (TIMESTAMP)

**Features**:

- ✅ **DECIMAL(18,4)** for financial precision (no floating-point errors)
- ✅ **CHECK constraint**: Amount must be positive
- ✅ **Database trigger**: Enforces debits = credits for POSTED transactions
- ✅ Indexed on `transaction_id`, `account_id`, `account_id + created_at`
- ✅ Prevents account deletion if entries exist (RESTRICT)

**Double-Entry Example**:

```
Transaction: Salary Payment (KES 150,000)
Entry 1: DEBIT   Bank Account          KES 150,000 (Asset increases)
Entry 2: CREDIT  Salary Income         KES 150,000 (Income increases)
Total:   DEBIT = CREDIT = KES 150,000  ✅ Balanced
```

**Balance Checking Trigger**:

- Automatically validates that debits = credits when status is POSTED
- Throws exception if transaction is unbalanced
- Only checks POSTED transactions (DRAFT can be unbalanced)

---

### 6. Categories Table ✅

**File**: `20260107090324_create_categories_table.ts`

**Purpose**: Organize income and expenses into categories

**Schema**:

- `id` (UUID, PK)
- `user_id` (UUID, FK → users, NULL for system) - CASCADE on delete
- `name` (VARCHAR(100), NOT NULL)
- `description` (TEXT, NULL)
- `type` (ENUM, NOT NULL) - INCOME | EXPENSE
- `parent_id` (UUID, FK → categories, NULL) - For subcategories
- `icon` (VARCHAR(50), NULL) - Icon name (Lucide icons)
- `color` (CHAR(7), NULL) - Hex color code (#RRGGBB)
- `is_system` (BOOLEAN, DEFAULT FALSE) - Pre-defined, cannot delete
- `is_active` (BOOLEAN, DEFAULT TRUE)
- `created_at`, `updated_at` (TIMESTAMP)

**Features**:

- ✅ **System categories** (shared by all users)
- ✅ **User-defined categories** (custom per user)
- ✅ **Hierarchical** (parent/child categories)
- ✅ **UI-ready** (icon + color for frontend)
- ✅ Unique constraint: `(user_id, name, type)`

**Default System Categories**:

**Expenses** (8):

- 🛒 Groceries (#10B981 - Green)
- 🚗 Transport (#3B82F6 - Blue)
- ⚡ Utilities (#F59E0B - Orange)
- 🎬 Entertainment (#8B5CF6 - Purple)
- ❤️ Healthcare (#EF4444 - Red)
- 📚 Education (#06B6D4 - Cyan)
- 🍴 Dining (#EC4899 - Pink)
- 🛍️ Shopping (#14B8A6 - Teal)

**Income** (4):

- 💼 Salary (#10B981 - Green)
- 📈 Business (#3B82F6 - Blue)
- 💰 Investments (#F59E0B - Orange)
- ➕ Other Income (#8B5CF6 - Purple)

---

## Database Features

### Auto-Generated Values

- ✅ UUIDs with `gen_random_uuid()` (PostgreSQL native)
- ✅ Timestamps with `CURRENT_TIMESTAMP`
- ✅ Auto-updating `updated_at` via trigger

### Data Integrity

- ✅ **Foreign keys** with appropriate CASCADE/RESTRICT
- ✅ **Unique constraints** on emails, tokens, idempotency keys
- ✅ **CHECK constraints** on amounts (must be positive)
- ✅ **ENUM types** for status fields (type-safe)

### Performance Optimizations

- ✅ **Indexes** on all foreign keys
- ✅ **Composite indexes** for common queries (user_id + date, user_id + type)
- ✅ **Unique indexes** for fast lookups (email, token_hash)

### Accounting Features

- ✅ **Double-entry enforcement** via database trigger
- ✅ **DECIMAL precision** (18,4) for financial calculations
- ✅ **Transaction lifecycle** (DRAFT/POSTED/VOID)
- ✅ **Idempotency** for safe retries
- ✅ **Audit trail** (created_at, updated_at, posted_at, voided_at)

---

## Running Migrations

### Prerequisites

1. **Supabase database** configured (you have this! ✅)
2. **Database URL** in backend `.env` file

### Setup Environment

```bash
cd /Projects/fintracker/backend

# Create .env file with your Supabase credentials
cat > .env << 'EOF'
NODE_ENV=development
PORT=3000

# Your Supabase DATABASE_URL from UserActions.txt
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Your Upstash REDIS_URL from UserActions.txt
REDIS_URL=rediss://default:[PASSWORD]@[HOST]:6379

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# API Configuration
API_VERSION=v1
CORS_ORIGINS=http://localhost:5173

# Logging
LOG_LEVEL=debug
EOF
```

### Run Migrations

```bash
cd /Projects/fintracker/backend

# Check migration status
npm run migrate:status

# Run all pending migrations
npm run migrate:latest

# You should see:
# Batch 1 run: 6 migrations
# ✅ 20260107090040_create_users_table.ts
# ✅ 20260107090109_create_refresh_tokens_table.ts
# ✅ 20260107090136_create_accounts_table.ts
# ✅ 20260107090217_create_transactions_table.ts
# ✅ 20260107090251_create_ledger_entries_table.ts
# ✅ 20260107090324_create_categories_table.ts
```

### Rollback (if needed)

```bash
# Rollback last batch
npm run migrate:rollback

# Check status
npm run migrate:status
```

---

## Verify Migrations

### Connect to Supabase

1. Go to https://supabase.com/dashboard
2. Open your project
3. Go to **Table Editor**
4. You should see 7 tables:
   - ✅ `users`
   - ✅ `refresh_tokens`
   - ✅ `accounts`
   - ✅ `transactions`
   - ✅ `ledger_entries`
   - ✅ `categories`
   - ✅ `knex_migrations` (system table)

### Check Categories

```sql
SELECT name, type, color FROM categories WHERE is_system = true ORDER BY type, name;

-- Should return 12 default categories (8 expenses + 4 income)
```

### Test Triggers

```sql
-- Create a test user
INSERT INTO users (email, password_hash, full_name)
VALUES ('test@example.com', 'test-hash', 'Test User');

-- Wait 5 seconds, then update
UPDATE users SET full_name = 'Updated Name' WHERE email = 'test@example.com';

-- Check that updated_at changed
SELECT email, created_at, updated_at FROM users WHERE email = 'test@example.com';
-- updated_at should be > created_at ✅
```

---

## Next Steps

With migrations complete, you can now:

### 1. Start Backend Server

```bash
cd /Projects/fintracker/backend
npm run dev

# Server starts on http://localhost:3000
# Health check: curl http://localhost:3000/health
```

### 2. Build Authentication Module (Next Priority)

- User registration endpoint
- Login endpoint
- JWT token generation
- Refresh token rotation
- Password hashing with bcryptjs

### 3. Build Ledger Engine

- Create accounts
- Create transactions
- Post transactions (validate double-entry balance)
- Calculate account balances

### 4. Connect Frontend

- Wire up login/register forms
- Protected routes with JWT
- Dashboard with real data from API

---

## Migration Files Created

```
backend/src/database/migrations/
├── 20260107090040_create_users_table.ts
├── 20260107090109_create_refresh_tokens_table.ts
├── 20260107090136_create_accounts_table.ts
├── 20260107090217_create_transactions_table.ts
├── 20260107090251_create_ledger_entries_table.ts
└── 20260107090324_create_categories_table.ts
```

**Total**: 6 migrations
**Lines of Code**: ~600+
**Tables Created**: 6 core tables
**System Data**: 12 default categories

---

## Database Schema Diagram

```
┌─────────────┐
│    users    │──┐
└─────────────┘  │
                 │ 1
                 ├──── refresh_tokens (n)
                 │
                 │ 1
                 ├──── accounts (n)
                 │       │
                 │       │ 1
                 │       └──── ledger_entries (n)
                 │               │
                 │ 1             │ n
                 └──── transactions ───┘
                         (1 : n)

categories (system + user-defined)
```

---

**Migrations are production-ready and can be run on your Supabase database!** 🎉

See your Supabase credentials in `/Projects/fintracker/UserActions.txt` to connect.
