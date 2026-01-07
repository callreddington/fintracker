# Phase 1: Foundation and Core Infrastructure (Enhanced)

## Overview

Phase 1 establishes the fundamental architecture with **enhanced security, transaction lifecycle management, and financial correctness** upon which all other modules depend. This enhanced version incorporates critical production-readiness features including idempotency protection, refresh token security, rate limiting, multi-currency foundation, and transaction state management.

**Critical Enhancements from Original:**

- Transaction lifecycle states (DRAFT → POSTED → VOID)
- Idempotency keys for duplicate prevention
- Hashed refresh tokens with rotation
- Rate limiting on authentication endpoints
- Multi-currency foundation (fields added)
- DECIMAL(18,4) precision for financial calculations
- Optimistic locking for concurrent updates
- TOTP MFA support
- Ledger invariant monitoring

---

## Module 1.1: Authentication and User Management (Enhanced)

### Functional Requirements

**Enhanced Security Features:**

1. **Multi-Factor Authentication (TOTP)**
   - Optional TOTP setup for enhanced account security
   - QR code generation for authenticator apps (Google Authenticator, Authy)
   - Backup codes generated during MFA setup (10 single-use codes)
   - MFA required for sensitive operations (changing email, password)

2. **Refresh Token Security**
   - Tokens hashed using SHA-256 before storage
   - Stored in PostgreSQL (not Redis plaintext)
   - Automatic rotation on each use
   - Old tokens invalidated immediately
   - Maximum 5 concurrent sessions per user

3. **Rate Limiting**
   - Login endpoint: 5 attempts per 15 minutes per IP
   - Registration endpoint: 3 attempts per hour per IP
   - Password reset: 3 attempts per hour per email
   - Account locked after 5 failed login attempts for 30 minutes
   - Progressive delays on repeated failures

4. **Session Management**
   - Device fingerprinting for suspicious login detection
   - Session metadata: IP address, user agent, last activity
   - Ability to view and revoke active sessions
   - Automatic session cleanup of expired tokens

**Registration enhancements:**

- Email verification required before full access
- Password strength validation (zxcvbn score >= 3)
- Detect and prevent disposable email addresses
- CAPTCHA integration option for bot prevention

**Login enhancements:**

- Suspicious login detection (new device, new location)
- Email notification on new device login
- Remember device option (30-day trusted device token)

### API Endpoints Specification

**POST /api/v1/auth/register**

Creates new user account with email verification workflow.

Request body:

- email: string (required, valid email format)
- password: string (required, min 8 chars, complexity requirements)
- full_name: string (required, max 100 chars)
- phone_number: string (optional, E.164 format)

Response 201:

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "email_verified": false,
    "created_at": "2024-01-04T10:30:00Z"
  },
  "message": "Verification email sent"
}
```

Errors:

- 400: Validation errors (weak password, invalid email)
- 409: Email already exists
- 429: Too many registration attempts
- 500: Server error

---

**POST /api/v1/auth/login**

Authenticates user credentials and returns access tokens.

Request body:

- email: string (required)
- password: string (required)
- device_fingerprint: string (optional, for device tracking)
- mfa_code: string (required if MFA enabled, 6 digits)

Response 200:

```json
{
  "access_token": "jwt-token",
  "refresh_token": "secure-refresh-token",
  "token_type": "bearer",
  "expires_in": 900,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "email_verified": true,
    "mfa_enabled": false
  },
  "session_id": "uuid"
}
```

Errors:

- 401: Invalid credentials
- 403: Email not verified OR MFA code required/invalid
- 429: Too many login attempts, account temporarily locked
- 500: Server error

---

**POST /api/v1/auth/refresh**

Generates new access token using valid refresh token with automatic rotation.

Request body:

- refresh_token: string (required)

Response 200:

```json
{
  "access_token": "new-jwt-token",
  "refresh_token": "new-refresh-token",
  "token_type": "bearer",
  "expires_in": 900
}
```

**Important:** Old refresh token is invalidated immediately. Client must store new refresh token.

Errors:

- 401: Invalid, expired, or already-used refresh token
- 500: Server error

---

**POST /api/v1/auth/mfa/setup**

Initiates MFA setup by generating TOTP secret and QR code.

Request headers:

- Authorization: Bearer {access_token}

Response 200:

```json
{
  "secret": "base32-encoded-secret",
  "qr_code_url": "data:image/png;base64,...",
  "backup_codes": [
    "12345-67890",
    "23456-78901",
    ...
  ]
}
```

**Next step:** User must call `/auth/mfa/verify` with code from authenticator app to complete setup.

---

**POST /api/v1/auth/mfa/verify**

Completes MFA setup by verifying TOTP code.

Request headers:

- Authorization: Bearer {access_token}

Request body:

- mfa_code: string (required, 6 digits)
- secret: string (required, from setup response)

Response 200:

```json
{
  "message": "MFA enabled successfully",
  "backup_codes": ["12345-67890", ...],
  "recovery_codes_count": 10
}
```

Errors:

- 400: Invalid MFA code
- 409: MFA already enabled
- 500: Server error

---

**GET /api/v1/auth/sessions**

Lists all active sessions for the authenticated user.

Request headers:

- Authorization: Bearer {access_token}

Response 200:

```json
{
  "sessions": [
    {
      "id": "uuid",
      "device_info": "Chrome on Windows",
      "ip_address": "192.168.1.1",
      "last_active": "2024-01-04T10:30:00Z",
      "created_at": "2024-01-01T08:00:00Z",
      "is_current": true
    }
  ]
}
```

---

**DELETE /api/v1/auth/sessions/{session_id}**

Revokes a specific session (logout from specific device).

Path parameters:

- session_id: UUID (required)

Response 204: No content (success)

Errors:

- 404: Session not found or already revoked
- 500: Server error

---

### Database Schema Specification

**Table: users** (enhanced)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20),
  email_verified BOOLEAN DEFAULT FALSE NOT NULL,

  -- MFA fields
  mfa_enabled BOOLEAN DEFAULT FALSE NOT NULL,
  mfa_secret VARCHAR(255),

  -- Account security
  failed_login_attempts INTEGER DEFAULT 0 NOT NULL,
  account_locked_until TIMESTAMP WITH TIME ZONE,

  -- Profile
  preferred_currency CHAR(3) DEFAULT 'KES' NOT NULL,
  timezone VARCHAR(50) DEFAULT 'Africa/Nairobi' NOT NULL,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  last_login_at TIMESTAMP WITH TIME ZONE,

  -- Optimistic locking
  version INTEGER DEFAULT 1 NOT NULL,

  CONSTRAINT check_currency_code CHECK (length(preferred_currency) = 3)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_locked_until ON users(account_locked_until)
  WHERE account_locked_until IS NOT NULL;
```

---

**Table: refresh_tokens** (enhanced with hashing and rotation)

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Hashed token (never store plaintext)
  token_hash VARCHAR(64) NOT NULL UNIQUE,

  -- Session tracking
  session_id UUID NOT NULL UNIQUE,
  device_fingerprint VARCHAR(255),
  ip_address INET NOT NULL,
  user_agent TEXT,

  -- Token lifecycle
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  rotated_from UUID REFERENCES refresh_tokens(id),
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_reason VARCHAR(50),

  CONSTRAINT check_not_revoked_and_expired
    CHECK (revoked_at IS NULL OR expires_at > revoked_at)
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_session ON refresh_tokens(session_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- Cleanup job for expired tokens
CREATE INDEX idx_refresh_tokens_cleanup
  ON refresh_tokens(expires_at)
  WHERE revoked_at IS NULL;
```

---

**Table: mfa_backup_codes**

```sql
CREATE TABLE mfa_backup_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash VARCHAR(64) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_mfa_backup_user ON mfa_backup_codes(user_id);
CREATE INDEX idx_mfa_backup_unused ON mfa_backup_codes(user_id, used_at)
  WHERE used_at IS NULL;
```

---

**Table: login_attempts** (for rate limiting and security monitoring)

```sql
CREATE TABLE login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  failure_reason VARCHAR(100),
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_login_attempts_email_time
  ON login_attempts(email, attempted_at DESC);
CREATE INDEX idx_login_attempts_ip_time
  ON login_attempts(ip_address, attempted_at DESC);

-- Partition by month for performance
CREATE INDEX idx_login_attempts_cleanup
  ON login_attempts(attempted_at);
```

---

## Module 1.2: Ledger Engine Core (Enhanced)

### Functional Requirements Enhancement

**Transaction Lifecycle States:**

The enhanced ledger implements explicit state management for all transactions:

1. **DRAFT** - Transaction being created
   - Can be edited freely
   - Not reflected in account balances
   - Can be deleted without audit trail
   - Used for multi-step transaction creation

2. **PENDING** - Submitted for processing
   - Cannot be edited
   - Not yet reflected in balances
   - Used for transactions requiring approval or async processing
   - Can be POSTED or VOIDED

3. **POSTED** - Committed to ledger
   - Immutable - cannot be edited or deleted
   - Reflected in all account balances
   - Only action allowed: VOID with reason

4. **VOID** - Cancelled transaction
   - Original entries remain visible
   - Opposite entries created to reverse effect
   - Requires void_reason (audit trail)
   - Terminal state

5. **REVERSED** - Original transaction that was reversed
   - Linked to VOID transaction that reversed it
   - Terminal state

**Idempotency Protection:**

All transaction creation endpoints require idempotency key:

- Client generates UUID for each transaction attempt
- System checks if transaction with same key already exists
- Returns existing transaction if found (prevents duplicates)
- 24-hour idempotency window
- Separate table tracks idempotency keys

**Enhanced Decimal Precision:**

- All monetary amounts: DECIMAL(18,4)
- Supports cryptocurrencies and forex with high precision
- Rounding rules: Banker's rounding (ROUND_HALF_EVEN)
- Currency conversion requires explicit rates

**Multi-Currency Support:**

- Every transaction has explicit currency
- Every account has primary currency
- Cross-currency transactions require FX rate
- System prevents accidental cross-currency posting without rate

**Optimistic Locking:**

- All financial records have version field
- Updates require current version number
- Concurrent update detection prevents lost updates
- Failed updates return 409 Conflict with latest version

### API Endpoints Specification (Enhanced)

**POST /api/v1/ledger/transactions**

Creates new transaction with idempotency protection and lifecycle management.

Request headers:

- Authorization: Bearer {access_token}
- Idempotency-Key: {uuid} (required)

Request body:

```json
{
  "transaction_date": "2024-01-04",
  "posting_date": "2024-01-04",
  "currency": "KES",
  "description": "Salary payment for January 2024",
  "reference_number": "PAY-2024-01-001",
  "status": "DRAFT",
  "entries": [
    {
      "account_id": "uuid-bank-account",
      "amount": "150000.00",
      "entry_type": "DEBIT",
      "entry_description": "Gross salary received"
    },
    {
      "account_id": "uuid-salary-income",
      "amount": "150000.00",
      "entry_type": "CREDIT",
      "entry_description": "January salary"
    }
  ]
}
```

Response 201 (new transaction):

```json
{
  "transaction": {
    "id": "uuid",
    "transaction_date": "2024-01-04",
    "posting_date": "2024-01-04",
    "currency": "KES",
    "status": "DRAFT",
    "description": "Salary payment...",
    "reference_number": "PAY-2024-01-001",
    "total_debits": "150000.0000",
    "total_credits": "150000.0000",
    "is_balanced": true,
    "entries": [...],
    "created_by": "uuid-user",
    "created_at": "2024-01-04T10:30:00Z",
    "version": 1
  },
  "idempotent": false
}
```

Response 200 (existing transaction from idempotency key):

```json
{
  "transaction": {...},
  "idempotent": true
}
```

Errors:

- 400: Validation errors (imbalanced entries, invalid accounts, closed accounts, missing currency)
- 401: Unauthorized
- 409: Concurrent update detected (optimistic locking)
- 500: Server error

---

**PATCH /api/v1/ledger/transactions/{id}/status**

Transitions transaction between lifecycle states.

Path parameters:

- id: UUID (required)

Request headers:

- Authorization: Bearer {access_token}

Request body:

```json
{
  "status": "POSTED",
  "version": 1,
  "metadata": {
    "void_reason": "Duplicate entry"
  }
}
```

Response 200:

```json
{
  "transaction": {
    "id": "uuid",
    "status": "POSTED",
    "posted_at": "2024-01-04T10:35:00Z",
    "posted_by": "uuid-user",
    "version": 2
  }
}
```

Errors:

- 400: Invalid state transition (e.g., POSTED → DRAFT not allowed)
- 404: Transaction not found
- 409: Version mismatch (concurrent update)
- 422: Missing required metadata (e.g., void_reason for VOID)
- 500: Server error

---

**POST /api/v1/ledger/transactions/{id}/void**

Voids a posted transaction by creating reversing entries.

Path parameters:

- id: UUID (required)

Request headers:

- Authorization: Bearer {access_token}

Request body:

```json
{
  "reason": "Customer refund processed",
  "void_date": "2024-01-04"
}
```

Response 200:

```json
{
  "original_transaction": {
    "id": "uuid-original",
    "status": "REVERSED",
    "reversed_at": "2024-01-04T10:40:00Z",
    "reversed_by": "uuid-user"
  },
  "void_transaction": {
    "id": "uuid-void",
    "status": "VOID",
    "reverses_transaction_id": "uuid-original",
    "void_reason": "Customer refund processed",
    "entries": [...]
  }
}
```

Errors:

- 400: Transaction not in POSTED status
- 404: Transaction not found
- 422: Missing void reason
- 500: Server error

---

**GET /api/v1/ledger/accounts/{id}/balance**

Retrieves current balance for specific account with currency information.

Path parameters:

- id: UUID (required)

Query parameters:

- as_of_date: ISO 8601 date (optional, for historical balance)
- include_pending: boolean (default false, include PENDING transactions)

Request headers:

- Authorization: Bearer {access_token}

Response 200:

```json
{
  "account_id": "uuid",
  "account_name": "Bank Account - Equity Bank",
  "account_type": "ASSET",
  "account_code": "1100-001",
  "currency": "KES",
  "balance": "235450.7500",
  "pending_balance": "5000.0000",
  "available_balance": "230450.7500",
  "as_of_date": "2024-01-04",
  "last_transaction_date": "2024-01-03",
  "transaction_count": 147
}
```

---

### Database Schema Specification (Enhanced)

**Table: accounts** (enhanced with currency and locking)

```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Account identification
  account_code VARCHAR(50) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  account_type VARCHAR(20) NOT NULL CHECK (account_type IN (
    'ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'
  )),

  -- Hierarchy
  parent_account_id UUID REFERENCES accounts(id),

  -- Multi-currency support
  currency CHAR(3) NOT NULL DEFAULT 'KES',

  -- Status
  status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL CHECK (status IN (
    'ACTIVE', 'CLOSED', 'SUSPENDED'
  )),

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  closed_at TIMESTAMP WITH TIME ZONE,

  -- Optimistic locking
  version INTEGER DEFAULT 1 NOT NULL,

  CONSTRAINT unique_user_account_code UNIQUE (user_id, account_code)
);

CREATE INDEX idx_accounts_user ON accounts(user_id);
CREATE INDEX idx_accounts_type ON accounts(account_type);
CREATE INDEX idx_accounts_parent ON accounts(parent_account_id);
CREATE INDEX idx_accounts_currency ON accounts(currency);
CREATE INDEX idx_accounts_status ON accounts(status);
```

---

**Table: transactions** (enhanced with lifecycle and idempotency)

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  -- Transaction details
  transaction_date DATE NOT NULL,
  posting_date DATE NOT NULL,
  currency CHAR(3) NOT NULL,
  description TEXT NOT NULL,
  reference_number VARCHAR(100),

  -- Lifecycle management
  status VARCHAR(20) DEFAULT 'DRAFT' NOT NULL CHECK (status IN (
    'DRAFT', 'PENDING', 'POSTED', 'VOID', 'REVERSED'
  )),

  -- State transition tracking
  posted_at TIMESTAMP WITH TIME ZONE,
  posted_by UUID REFERENCES users(id),
  voided_at TIMESTAMP WITH TIME ZONE,
  voided_by UUID REFERENCES users(id),
  void_reason TEXT,

  -- Reversal tracking
  reverses_transaction_id UUID REFERENCES transactions(id),
  reversed_by_transaction_id UUID REFERENCES transactions(id),

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

  -- Optimistic locking
  version INTEGER DEFAULT 1 NOT NULL,

  CONSTRAINT check_void_has_reason
    CHECK (status != 'VOID' OR void_reason IS NOT NULL),
  CONSTRAINT check_posted_has_date
    CHECK (status != 'POSTED' OR posted_at IS NOT NULL)
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_posting ON transactions(posting_date);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_currency ON transactions(currency);
CREATE INDEX idx_transactions_reference ON transactions(reference_number);
CREATE INDEX idx_transactions_reverses ON transactions(reverses_transaction_id);
```

---

**Table: ledger_entries** (enhanced with precision)

```sql
CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE RESTRICT,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,

  -- Entry details
  entry_type VARCHAR(10) NOT NULL CHECK (entry_type IN ('DEBIT', 'CREDIT')),
  amount DECIMAL(18,4) NOT NULL CHECK (amount >= 0),
  entry_description TEXT,

  -- Currency tracking
  currency CHAR(3) NOT NULL,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

  CONSTRAINT check_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_ledger_account ON ledger_entries(account_id);
CREATE INDEX idx_ledger_transaction ON ledger_entries(transaction_id);
CREATE INDEX idx_ledger_account_created ON ledger_entries(account_id, created_at DESC);

-- Optimized for balance calculations
CREATE INDEX idx_ledger_balance_calc
  ON ledger_entries(account_id, entry_type, amount)
  WHERE transaction_id IN (
    SELECT id FROM transactions WHERE status = 'POSTED'
  );
```

---

**Table: idempotency_keys**

```sql
CREATE TABLE idempotency_keys (
  key VARCHAR(64) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Store the result
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL,
  response_body JSONB NOT NULL,

  -- Expiry
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (
    CURRENT_TIMESTAMP + INTERVAL '24 hours'
  )
);

CREATE INDEX idx_idempotency_user ON idempotency_keys(user_id);
CREATE INDEX idx_idempotency_expires ON idempotency_keys(expires_at);

-- Automatic cleanup of expired keys
CREATE INDEX idx_idempotency_cleanup
  ON idempotency_keys(expires_at)
  WHERE expires_at < CURRENT_TIMESTAMP;
```

---

## Module 1.3: Monitoring and Health Checks

### Ledger Invariant Monitoring

**Scheduled Job: Verify Ledger Balance**

Runs every hour to check double-entry invariant:

```sql
-- Query to find imbalanced transactions
SELECT
  t.id,
  t.transaction_date,
  t.description,
  SUM(CASE WHEN le.entry_type = 'DEBIT' THEN le.amount ELSE 0 END) as total_debits,
  SUM(CASE WHEN le.entry_type = 'CREDIT' THEN le.amount ELSE 0 END) as total_credits,
  SUM(CASE WHEN le.entry_type = 'DEBIT' THEN le.amount ELSE -le.amount END) as balance
FROM transactions t
JOIN ledger_entries le ON t.id = le.transaction_id
WHERE t.status = 'POSTED'
GROUP BY t.id, t.transaction_date, t.description
HAVING SUM(CASE WHEN le.entry_type = 'DEBIT' THEN le.amount ELSE -le.amount END) != 0;
```

If any imbalanced transactions found: **CRITICAL ALERT** to operations team.

---

**Health Check Endpoint**

**GET /api/v1/health**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-04T10:30:00Z",
  "version": "1.0.0",
  "checks": {
    "database": {
      "status": "healthy",
      "latency_ms": 12
    },
    "redis": {
      "status": "healthy",
      "latency_ms": 3
    },
    "ledger_balance": {
      "status": "healthy",
      "last_check": "2024-01-04T10:00:00Z",
      "imbalanced_count": 0
    }
  }
}
```

---

## Test Plan (Enhanced)

### Unit Tests

**Authentication Module:**

- Password hashing and verification
- JWT token generation and validation
- Refresh token hashing and rotation
- MFA TOTP code generation and validation
- Rate limiting logic
- Account lockout logic

**Ledger Module:**

- Transaction state transitions (all valid and invalid paths)
- Double-entry balance validation
- Idempotency key checking
- Decimal precision calculations
- Currency validation
- Optimistic locking

**Target Coverage: 90%+**

### Integration Tests

**Auth Flow:**

1. Register → Verify Email → Login → Refresh Token → Logout
2. Register → Login (unverified) → Should fail
3. Login with MFA → Should require TOTP code
4. 6 failed logins → Account locked → Wait 30min → Can login
5. Refresh token → Use old token again → Should fail

**Ledger Flow:**

1. Create DRAFT transaction → Update → POST → Verify balance
2. POST transaction → Try to edit → Should fail
3. POST transaction → VOID → Verify reversing entries
4. Concurrent updates with optimistic locking → One should fail with 409
5. Duplicate idempotency key → Should return existing transaction

**Target: All critical paths covered**

### End-to-End Tests

**Scenario: Complete User Journey**

1. User registers account
2. Verifies email
3. Logs in
4. Sets up MFA
5. Creates bank account
6. Creates salary income account
7. Records first salary transaction (DRAFT)
8. Reviews transaction
9. Posts transaction
10. Verifies account balance updated
11. Logs out
12. Logs in with MFA

**Target: Top 5 user scenarios**

---

## Deliverables Checklist

- [ ] Enhanced authentication with MFA support
- [ ] Refresh token security with hashing and rotation
- [ ] Rate limiting on all auth endpoints
- [ ] Transaction lifecycle implementation
- [ ] Idempotency key protection
- [ ] Multi-currency foundation (fields added)
- [ ] DECIMAL(18,4) precision
- [ ] Optimistic locking on financial records
- [ ] Ledger invariant monitoring job
- [ ] Health check endpoint
- [ ] Comprehensive unit tests (90%+ coverage)
- [ ] Integration tests for critical paths
- [ ] E2E tests for top scenarios
- [ ] API documentation updated
- [ ] Database migrations tested

---

## Next Steps

After Phase 1 completion, proceed to **Phase 2: Income and Expense Management** with confidence in the secure, correct foundation.
