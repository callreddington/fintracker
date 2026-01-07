# Phase 2: Income and Expense Management (Enhanced)

## Overview

Phase 2 introduces real-world financial behavior tracking for Kenyan employees with **enhanced tax compliance, receipt management, and flexible transaction handling**. This phase prioritizes legal correctness and auditability over automation.

**Critical Enhancements from Original:**
✅ Effective-dated PAYE tax tables (handles KRA rate changes)
✅ Tax relief validation (enforces KRA limits)
✅ Receipt attachment support (tax audit documentation)
✅ Split transaction capability (multi-category purchases)
✅ Enhanced merchant normalization database
✅ Budget rollover logic

---

## Module 2.1: PAYE Calculator with Versioned Tax Tables (Enhanced)

### Functional Requirements

**Effective-Dated Tax Tables:**

The enhanced PAYE calculator maintains historical tax rates with effective dates, ensuring:

- Correct calculations for past periods when rates were different
- Accurate year-end tax reconciliation
- Compliance with KRA rate changes
- Audit trail of which tax rates were applied when

**Tax Table Structure:**

1. **PAYE Bands** (progressive taxation)
   - Effective date tracking
   - Each band has: lower bound, upper bound, rate, effective_from, effective_to
   - System automatically selects correct band based on transaction date
   - Historical rates preserved indefinitely

2. **NHIF Contributions**
   - Gross salary ranges with corresponding contributions
   - Effective date tracking (NHIF rates change occasionally)
   - Maximum contribution cap

3. **NSSF Contributions**
   - Tier I and Tier II limits with rates
   - Effective date tracking
   - New NSSF Act 2013 rates vs old rates

4. **Housing Levy**
   - Current rate: 1.5% of gross pay
   - Effective from January 2024
   - Optional for those with mortgage (system tracks)

**Tax Relief Validation:**

System enforces KRA limits on tax reliefs:

- **Personal Relief**: KES 2,400/month (standard for all)
- **Insurance Relief**: Maximum 15% of premium, capped at KES 5,000/month
- **Pension/Provident Fund**: Maximum 30% of gross pay or KES 20,000/month
- **Mortgage Interest Relief**: Maximum KES 25,000/month
- **NHIF Relief**: 15% of NHIF paid up to KES 900/month

System validates user-entered reliefs against these limits and warns/blocks over-claiming.

**Calculation Override with Audit:**

Users can override auto-calculated PAYE values when:

- Employer uses different rates (grandfathered old NSSF)
- Special tax situations (tax holidays, relief for persons with disability)
- Corrections needed after posting

All overrides require:

- Reason for override
- Original calculated value stored
- Override user and timestamp recorded
- Audit log entry created

### API Endpoints Specification

**GET /api/v1/paye/tax-tables**

Retrieves tax tables effective for a specific date.

Query parameters:

- effective_date: ISO date (required) - date for which to retrieve rates
- table_type: enum (optional) - 'PAYE', 'NHIF', 'NSSF', 'HOUSING_LEVY', 'ALL'

Request headers:

- Authorization: Bearer {access_token}

Response 200:

```json
{
  "effective_date": "2024-01-04",
  "paye_bands": [
    {
      "lower_bound": "0.00",
      "upper_bound": "24000.00",
      "rate": "10.00",
      "effective_from": "2023-01-01",
      "effective_to": null
    },
    {
      "lower_bound": "24001.00",
      "upper_bound": "32333.00",
      "rate": "25.00",
      "effective_from": "2023-01-01",
      "effective_to": null
    }
  ],
  "nhif_bands": [...],
  "nssf_config": {...},
  "housing_levy": {...}
}
```

---

**POST /api/v1/paye/calculate**

Calculates PAYE and statutory deductions for given gross salary.

Request body:

```json
{
  "gross_salary": "150000.00",
  "calculation_date": "2024-01-04",
  "tax_reliefs": {
    "insurance_premium": "5000.00",
    "pension_contribution": "15000.00",
    "mortgage_interest": "0.00"
  },
  "nssf_opt_out": false,
  "has_mortgage": false
}
```

Response 200:

```json
{
  "calculation_summary": {
    "gross_salary": "150000.00",
    "taxable_income": "135000.00",
    "paye_before_relief": "32500.00",
    "total_relief": "3150.00",
    "paye_after_relief": "29350.00",
    "nhif": "1700.00",
    "nssf": "2160.00",
    "housing_levy": "2250.00",
    "total_deductions": "35460.00",
    "net_salary": "114540.00"
  },
  "calculation_breakdown": {
    "paye_bands_applied": [
      {
        "band": "0 - 24,000",
        "rate": "10%",
        "amount": "2400.00"
      },
      {
        "band": "24,001 - 32,333",
        "rate": "25%",
        "amount": "2083.25"
      },
      {
        "band": "32,334 - 500,000",
        "rate": "30%",
        "amount": "30750.00"
      }
    ],
    "reliefs_applied": {
      "personal_relief": "2400.00",
      "insurance_relief": "750.00",
      "pension_relief": "0.00"
    },
    "reliefs_validation": {
      "insurance_relief_requested": "750.00",
      "insurance_relief_max": "5000.00",
      "insurance_relief_applied": "750.00",
      "pension_relief_requested": "4500.00",
      "pension_relief_max": "20000.00",
      "pension_relief_applied": "0.00"
    }
  },
  "tax_tables_used": {
    "paye_table_version": "2023-01-01",
    "nhif_table_version": "2023-01-01",
    "nssf_table_version": "2024-01-01"
  }
}
```

---

**POST /api/v1/income/salary**

Records salary income with automatic PAYE calculation and override support.

Request headers:

- Authorization: Bearer {access_token}
- Idempotency-Key: {uuid}

Request body:

```json
{
  "income_date": "2024-01-31",
  "employer_id": "uuid",
  "gross_salary": "150000.00",
  "payment_method": "BANK_TRANSFER",
  "bank_account_id": "uuid",

  "auto_calculate_deductions": true,

  "manual_overrides": {
    "paye": {
      "override": false,
      "value": "0.00",
      "reason": ""
    },
    "nhif": {
      "override": false,
      "value": "0.00",
      "reason": ""
    }
  },

  "additional_deductions": [
    {
      "name": "Loan Repayment",
      "amount": "5000.00",
      "is_statutory": false
    }
  ],

  "allowances": [
    {
      "name": "Housing Allowance",
      "amount": "20000.00",
      "is_taxable": true
    }
  ],

  "notes": "January 2024 salary"
}
```

Response 201:

```json
{
  "income_entry": {
    "id": "uuid",
    "income_date": "2024-01-31",
    "gross_salary": "150000.00",
    "total_allowances": "20000.00",
    "taxable_income": "170000.00",
    "paye": "29350.00",
    "nhif": "1700.00",
    "nssf": "2160.00",
    "housing_levy": "2250.00",
    "other_deductions": "5000.00",
    "net_salary": "129540.00",
    "status": "DRAFT",
    "calculation_method": "AUTO",
    "overrides_applied": false
  },
  "ledger_preview": {
    "entries": [
      {
        "account": "Bank Account",
        "debit": "129540.00",
        "credit": "0.00"
      },
      {
        "account": "Gross Salary Income",
        "debit": "0.00",
        "credit": "150000.00"
      },
      {
        "account": "PAYE Payable",
        "debit": "0.00",
        "credit": "29350.00"
      }
    ]
  }
}
```

---

### Database Schema

**Table: paye_tax_bands**

```sql
CREATE TABLE paye_tax_bands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Band definition
  lower_bound DECIMAL(18,4) NOT NULL,
  upper_bound DECIMAL(18,4) NOT NULL,
  rate DECIMAL(5,2) NOT NULL CHECK (rate >= 0 AND rate <= 100),

  -- Effective dates
  effective_from DATE NOT NULL,
  effective_to DATE,

  -- Metadata
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Ensure no overlapping bands for same period
  CONSTRAINT check_bounds CHECK (upper_bound > lower_bound),
  EXCLUDE USING gist (
    numrange(lower_bound::numeric, upper_bound::numeric, '[]') WITH &&,
    daterange(effective_from, effective_to, '[]') WITH &&
  )
);

CREATE INDEX idx_paye_bands_effective ON paye_tax_bands(effective_from, effective_to);
```

---

**Table: nhif_rates**

```sql
CREATE TABLE nhif_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Salary range
  gross_salary_min DECIMAL(18,4) NOT NULL,
  gross_salary_max DECIMAL(18,4) NOT NULL,
  contribution_amount DECIMAL(18,4) NOT NULL,

  -- Effective dates
  effective_from DATE NOT NULL,
  effective_to DATE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_nhif_rates_effective ON nhif_rates(effective_from, effective_to);
```

---

**Table: nssf_configuration**

```sql
CREATE TABLE nssf_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tier limits and rates
  tier_i_limit DECIMAL(18,4) NOT NULL,
  tier_i_rate DECIMAL(5,4) NOT NULL,
  tier_ii_limit DECIMAL(18,4) NOT NULL,
  tier_ii_rate DECIMAL(5,4) NOT NULL,

  -- Effective dates
  effective_from DATE NOT NULL,
  effective_to DATE,

  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_nssf_config_effective ON nssf_configuration(effective_from, effective_to);
```

---

**Table: income_entries** (enhanced)

```sql
CREATE TABLE income_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Income details
  income_date DATE NOT NULL,
  income_type VARCHAR(50) NOT NULL CHECK (income_type IN (
    'SALARY', 'BONUS', 'COMMISSION', 'BUSINESS', 'INVESTMENT', 'OTHER'
  )),

  -- For salary type
  employer_id UUID REFERENCES employers(id),
  gross_amount DECIMAL(18,4) NOT NULL,
  currency CHAR(3) DEFAULT 'KES' NOT NULL,

  -- Deductions
  paye_amount DECIMAL(18,4) DEFAULT 0,
  nhif_amount DECIMAL(18,4) DEFAULT 0,
  nssf_amount DECIMAL(18,4) DEFAULT 0,
  housing_levy_amount DECIMAL(18,4) DEFAULT 0,
  other_deductions DECIMAL(18,4) DEFAULT 0,

  net_amount DECIMAL(18,4) NOT NULL,

  -- Calculation tracking
  calculation_method VARCHAR(20) CHECK (calculation_method IN ('AUTO', 'MANUAL')),
  paye_table_version DATE,
  nhif_table_version DATE,
  nssf_table_version DATE,

  -- Overrides tracking
  paye_override BOOLEAN DEFAULT FALSE,
  paye_override_reason TEXT,
  nhif_override BOOLEAN DEFAULT FALSE,
  nhif_override_reason TEXT,

  -- Ledger integration
  transaction_id UUID REFERENCES transactions(id),
  status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'POSTED', 'VOID')),

  -- Payment details
  payment_method VARCHAR(50),
  bank_account_id UUID REFERENCES accounts(id),

  notes TEXT,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  posted_at TIMESTAMP WITH TIME ZONE,

  version INTEGER DEFAULT 1
);

CREATE INDEX idx_income_user_date ON income_entries(user_id, income_date DESC);
CREATE INDEX idx_income_employer ON income_entries(employer_id);
CREATE INDEX idx_income_status ON income_entries(status);
CREATE INDEX idx_income_transaction ON income_entries(transaction_id);
```

---

## Module 2.2: Expense Tracking with Splits and Receipts (Enhanced)

### Functional Requirements

**Split Transaction Support:**

Allow single expense to be allocated across multiple categories:

- Restaurant bill: 60% Food, 40% Entertainment
- Shopping: 70% Groceries, 20% Household, 10% Personal Care
- Each split must have percentage or fixed amount
- Total splits must equal 100% or full expense amount
- Ledger creates separate entries for each split

**Receipt Attachment Support:**

- Upload receipts as images (JPG, PNG) or PDFs
- Maximum 5MB per receipt
- OCR extraction for future enhancement (text extraction)
- Store in Supabase Storage or S3
- Multiple receipts per expense
- Receipt required for expenses above KES 10,000 (configurable)

**Enhanced Merchant Normalization:**

Merchant database with:

- Primary merchant name
- Aliases (SMS variations like "MPESA SAFARICOM" → "Safaricom")
- Default category assignment
- Logo/icon
- User can create custom merchants
- System learns from user categorization (optional ML later)

### API Endpoints Specification

**POST /api/v1/expenses**

Creates expense with optional splits and receipt attachments.

Request headers:

- Authorization: Bearer {access_token}
- Idempotency-Key: {uuid}

Request body (multipart/form-data for receipts):

```json
{
  "expense_date": "2024-01-04",
  "amount": "5000.00",
  "currency": "KES",
  "merchant_name": "Naivas Supermarket",
  "description": "Weekly grocery shopping",
  "payment_account_id": "uuid-mpesa",
  "payment_method": "MOBILE_MONEY",

  "split_by_category": true,
  "splits": [
    {
      "category_id": "uuid-groceries",
      "amount": "3500.00",
      "percentage": 70,
      "notes": "Food items"
    },
    {
      "category_id": "uuid-household",
      "amount": "1000.00",
      "percentage": 20,
      "notes": "Cleaning supplies"
    },
    {
      "category_id": "uuid-personal-care",
      "amount": "500.00",
      "percentage": 10,
      "notes": "Toiletries"
    }
  ],

  "tags": ["groceries", "weekly"],
  "receipt_required": false,
  "status": "DRAFT"
}

Files:
- receipts[]: File[] (optional, max 5 files, 5MB each)
```

Response 201:

```json
{
  "expense": {
    "id": "uuid",
    "expense_date": "2024-01-04",
    "amount": "5000.00",
    "merchant": {
      "id": "uuid",
      "name": "Naivas Supermarket",
      "normalized_name": "Naivas",
      "default_category": "Groceries"
    },
    "splits": [...],
    "receipts": [
      {
        "id": "uuid",
        "filename": "receipt_20240104.jpg",
        "file_size": 2048576,
        "url": "https://storage.../receipts/...",
        "uploaded_at": "2024-01-04T10:30:00Z"
      }
    ],
    "status": "DRAFT"
  }
}
```

---

**GET /api/v1/expenses/merchants**

Lists merchants with search and auto-complete support.

Query parameters:

- search: string (optional) - search merchant names
- limit: integer (default 20)
- include_aliases: boolean (default true)

Response 200:

```json
{
  "merchants": [
    {
      "id": "uuid",
      "name": "Naivas Supermarket",
      "aliases": ["NAIVAS", "NAIVAS SPM", "NAIVAS LTD"],
      "default_category_id": "uuid",
      "logo_url": "https://...",
      "transaction_count": 45,
      "last_used": "2024-01-04"
    }
  ]
}
```

---

**POST /api/v1/expenses/receipts/ocr**

Extracts text from receipt image (future enhancement placeholder).

Request (multipart/form-data):

- receipt: File (required)

Response 200:

```json
{
  "extracted_data": {
    "merchant_name": "Naivas Supermarket",
    "amount": "5000.00",
    "date": "2024-01-04",
    "items": [
      { "description": "Milk 2L", "amount": "200.00" },
      { "description": "Bread", "amount": "60.00" }
    ],
    "confidence": 0.92
  },
  "raw_text": "NAIVAS SUPERMARKET\n..."
}
```

---

### Database Schema

**Table: expenses** (enhanced)

```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Expense details
  expense_date DATE NOT NULL,
  amount DECIMAL(18,4) NOT NULL CHECK (amount > 0),
  currency CHAR(3) DEFAULT 'KES' NOT NULL,

  -- Merchant
  merchant_id UUID REFERENCES merchants(id),
  merchant_raw_name VARCHAR(255) NOT NULL,

  description TEXT,

  -- Payment
  payment_account_id UUID REFERENCES accounts(id),
  payment_method VARCHAR(50),

  -- Splits
  has_splits BOOLEAN DEFAULT FALSE,

  -- Receipts
  has_receipts BOOLEAN DEFAULT FALSE,
  receipt_required BOOLEAN DEFAULT FALSE,

  -- Categorization (for non-split expenses)
  category_id UUID REFERENCES categories(id),

  -- Budget tracking
  budget_id UUID REFERENCES budgets(id),

  -- Ledger
  transaction_id UUID REFERENCES transactions(id),
  status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'POSTED', 'VOID')),

  -- Tags
  tags TEXT[],

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  posted_at TIMESTAMP WITH TIME ZONE,

  version INTEGER DEFAULT 1
);

CREATE INDEX idx_expenses_user_date ON expenses(user_id, expense_date DESC);
CREATE INDEX idx_expenses_merchant ON expenses(merchant_id);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_tags ON expenses USING gin(tags);
```

---

**Table: expense_splits**

```sql
CREATE TABLE expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,

  category_id UUID NOT NULL REFERENCES categories(id),
  amount DECIMAL(18,4) NOT NULL CHECK (amount > 0),
  percentage DECIMAL(5,2) CHECK (percentage >= 0 AND percentage <= 100),

  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expense_splits_expense ON expense_splits(expense_id);
CREATE INDEX idx_expense_splits_category ON expense_splits(category_id);

-- Constraint: sum of splits equals parent expense amount
-- Enforced at application level with transaction
```

---

**Table: receipts**

```sql
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,

  -- File details
  filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,

  -- OCR data (future)
  ocr_text TEXT,
  ocr_confidence DECIMAL(3,2),
  ocr_extracted_data JSONB,

  -- Storage
  storage_provider VARCHAR(50) DEFAULT 'SUPABASE',
  storage_url TEXT NOT NULL,

  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  uploaded_by UUID REFERENCES users(id)
);

CREATE INDEX idx_receipts_expense ON receipts(expense_id);
```

---

**Table: merchants**

```sql
CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Primary name
  name VARCHAR(255) NOT NULL UNIQUE,
  normalized_name VARCHAR(255) NOT NULL,

  -- Aliases (for SMS parsing)
  aliases TEXT[],

  -- Default categorization
  default_category_id UUID REFERENCES categories(id),

  -- Branding
  logo_url TEXT,
  website VARCHAR(255),

  -- Stats
  transaction_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,

  -- User-specific or global
  user_id UUID REFERENCES users(id),
  is_global BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_merchants_normalized ON merchants(normalized_name);
CREATE INDEX idx_merchants_aliases ON merchants USING gin(aliases);
CREATE INDEX idx_merchants_user ON merchants(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_merchants_global ON merchants(is_global) WHERE is_global = TRUE;
```

---

## Module 2.3: Budget Management with Rollover (Enhanced)

### Functional Requirements

**Budget Rollover Logic:**

- **Monthly budgets**: Unused amount can roll to next month
- **Quarterly/Annual**: Unused distributed across remaining periods
- **Rollover cap**: Maximum 50% of budget can roll (prevents hoarding)
- **Rollover expiry**: Rolled amounts expire after 3 months if unused

**Budget Types:**

- Fixed monthly amount
- Variable based on income percentage
- Envelope budgeting (zero-based)
- Rolling 30-day budget

**Budget Alerts:**

- 50% spent: Notification
- 80% spent: Warning
- 100% spent: Alert
- Over budget: Critical alert with overage amount

### API Endpoints Specification

**POST /api/v1/budgets**

Creates budget with optional rollover configuration.

Request body:

```json
{
  "name": "Groceries Budget",
  "budget_type": "MONTHLY",
  "amount": "30000.00",
  "currency": "KES",
  "category_ids": ["uuid-groceries"],

  "period_start": "2024-01-01",
  "period_end": "2024-12-31",

  "rollover_enabled": true,
  "rollover_cap_percentage": 50,
  "rollover_expiry_months": 3,

  "alert_thresholds": {
    "warning_percentage": 80,
    "critical_percentage": 100
  }
}
```

Response 201:

```json
{
  "budget": {
    "id": "uuid",
    "name": "Groceries Budget",
    "amount": "30000.00",
    "rollover_config": {...},
    "current_period": {
      "period": "2024-01",
      "allocated": "30000.00",
      "spent": "0.00",
      "remaining": "30000.00",
      "rolled_from_previous": "0.00"
    }
  }
}
```

---

**GET /api/v1/budgets/{id}/performance**

Gets budget performance with rollover tracking.

Path parameters:

- id: UUID

Query parameters:

- period: string (format: YYYY-MM)

Response 200:

```json
{
  "budget_id": "uuid",
  "period": "2024-01",
  "allocated_amount": "30000.00",
  "rolled_from_previous": "5000.00",
  "total_available": "35000.00",
  "spent": "22000.00",
  "remaining": "13000.00",
  "utilization_percentage": 62.86,
  "projected_rollover": "13000.00",
  "actual_rollover_allowed": "13000.00",
  "rollover_cap_reached": false,

  "previous_periods": [
    {
      "period": "2023-12",
      "allocated": "30000.00",
      "spent": "20000.00",
      "rolled_forward": "5000.00"
    }
  ],

  "spending_by_category": [...],
  "top_expenses": [...]
}
```

---

### Database Schema

**Table: budgets** (enhanced)

```sql
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  budget_type VARCHAR(50) CHECK (budget_type IN (
    'MONTHLY', 'QUARTERLY', 'ANNUAL', 'ROLLING_30DAY'
  )),

  amount DECIMAL(18,4) NOT NULL CHECK (amount > 0),
  currency CHAR(3) DEFAULT 'KES',

  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Rollover configuration
  rollover_enabled BOOLEAN DEFAULT FALSE,
  rollover_cap_percentage DECIMAL(5,2) DEFAULT 50,
  rollover_expiry_months INTEGER DEFAULT 3,

  -- Alerts
  alert_threshold_warning DECIMAL(5,2) DEFAULT 80,
  alert_threshold_critical DECIMAL(5,2) DEFAULT 100,

  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'COMPLETED')),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  version INTEGER DEFAULT 1,

  CONSTRAINT check_period CHECK (period_end > period_start)
);

CREATE INDEX idx_budgets_user ON budgets(user_id);
CREATE INDEX idx_budgets_period ON budgets(period_start, period_end);
CREATE INDEX idx_budgets_status ON budgets(status);
```

---

**Table: budget_periods** (tracks monthly performance)

```sql
CREATE TABLE budget_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,

  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  allocated_amount DECIMAL(18,4) NOT NULL,
  rolled_from_previous DECIMAL(18,4) DEFAULT 0,
  total_available DECIMAL(18,4) NOT NULL,

  spent_amount DECIMAL(18,4) DEFAULT 0,
  remaining_amount DECIMAL(18,4) NOT NULL,

  rolled_to_next DECIMAL(18,4) DEFAULT 0,
  rollover_expired DECIMAL(18,4) DEFAULT 0,

  status VARCHAR(20) CHECK (status IN ('ACTIVE', 'COMPLETED')),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_budget_period UNIQUE (budget_id, period_start)
);

CREATE INDEX idx_budget_periods_budget ON budget_periods(budget_id);
CREATE INDEX idx_budget_periods_dates ON budget_periods(period_start, period_end);
```

---

## Module 2.4: SMS Parsing for Automated Transaction Entry (Enhanced)

### Functional Requirements

**Supported SMS Formats:**

1. **M-Pesa Formats:**
   - Received: "ABC123 Confirmed. You have received Ksh5,000.00 from JOHN DOE..."
   - Sent: "ABC123 Confirmed. Ksh500.00 sent to JANE DOE..."
   - Withdrawal: "ABC123 Confirmed. Ksh1,000.00 withdrawn from Agent..."
   - Paybill: "ABC123 Confirmed. Ksh2,000.00 paid to KPLC..."

2. **Bank SMS Formats:**
   - Equity Bank: "Your A/C XXX123 has been credited with KES 5,000.00..."
   - KCB: "Amount KES1,000.00 debited from A/C XXX456..."
   - Co-op Bank: "You have received KES3,000.00..."

3. **Airtel Money, T-Kash** (similar patterns)

**Parsing Logic:**

- Regex patterns for each provider
- Extract: amount, transaction type, merchant/person, date/time, balance
- Create expense/income entry automatically
- Match merchant to database for categorization
- Link to appropriate accounts (M-Pesa wallet, bank account)
- Mark as "SMS_PARSED" for user review before posting

**User Workflow:**

1. User forwards SMS or copies text
2. System parses and creates DRAFT transaction
3. User reviews, adjusts category if needed
4. User posts transaction (or auto-post if rule configured)

### API Endpoints Specification

**POST /api/v1/transactions/parse-sms**

Parses SMS message and creates draft transaction.

Request body:

```json
{
  "sms_text": "ABC123 Confirmed. Ksh500.00 sent to NAIVAS SPM...",
  "received_at": "2024-01-04T10:30:00Z",
  "sender": "MPESA"
}
```

Response 200:

```json
{
  "parsed_data": {
    "transaction_code": "ABC123",
    "type": "EXPENSE",
    "amount": "500.00",
    "merchant": "Naivas Supermarket",
    "merchant_id": "uuid",
    "suggested_category": "Groceries",
    "date": "2024-01-04",
    "time": "10:30:00",
    "balance_after": "15000.00",
    "confidence": 0.95
  },
  "transaction_draft": {
    "id": "uuid",
    "status": "DRAFT",
    "source": "SMS_PARSED",
    "requires_review": true
  }
}
```

---

### Database Schema

**Table: sms_transactions** (audit trail)

```sql
CREATE TABLE sms_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- SMS details
  sms_text TEXT NOT NULL,
  sms_sender VARCHAR(50) NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Parsed data
  parsed_data JSONB,
  parsing_confidence DECIMAL(3,2),
  parsing_errors TEXT[],

  -- Created transaction
  transaction_id UUID REFERENCES transactions(id),

  -- Status
  status VARCHAR(20) CHECK (status IN (
    'PARSED', 'TRANSACTION_CREATED', 'REVIEWED', 'IGNORED', 'FAILED'
  )),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sms_transactions_user ON sms_transactions(user_id);
CREATE INDEX idx_sms_transactions_status ON sms_transactions(status);
```

---

## Module 2.5: Informal Loans Management (Enhanced)

### Functional Requirements

**Loan Types:**

- Loans Given (Assets)
- Loans Received (Liabilities)

**Interest Calculation:**

- **Simple Interest**: Principal × Rate × Time
- **Compound Interest**: Principal × (1 + Rate)^Time
- Both supported, user selects at loan creation

**Features:**

- Principal tracking
- Interest accrual (manual or automatic)
- Repayment schedule (optional)
- Partial payments supported
- Grace period configuration
- Reminder notifications

### API Endpoints Specification

**POST /api/v1/loans**

Creates informal loan record.

Request body:

```json
{
  "loan_type": "GIVEN",
  "borrower_name": "John Doe",
  "principal_amount": "50000.00",
  "currency": "KES",
  "interest_rate": "10.00",
  "interest_type": "SIMPLE",
  "loan_date": "2024-01-04",
  "due_date": "2024-07-04",
  "grace_period_days": 0,
  "notes": "Friend emergency loan"
}
```

Response 201:

```json
{
  "loan": {
    "id": "uuid",
    "loan_type": "GIVEN",
    "principal": "50000.00",
    "interest_accrued": "0.00",
    "total_due": "50000.00",
    "amount_paid": "0.00",
    "balance": "50000.00",
    "status": "ACTIVE"
  }
}
```

---

### Database Schema

**Table: informal_loans** (enhanced)

```sql
CREATE TABLE informal_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  loan_type VARCHAR(20) CHECK (loan_type IN ('GIVEN', 'RECEIVED')),

  -- Parties
  borrower_name VARCHAR(255),
  lender_name VARCHAR(255),

  -- Amounts
  principal_amount DECIMAL(18,4) NOT NULL CHECK (principal_amount > 0),
  currency CHAR(3) DEFAULT 'KES',

  -- Interest
  interest_rate DECIMAL(5,2) DEFAULT 0,
  interest_type VARCHAR(20) CHECK (interest_type IN ('NONE', 'SIMPLE', 'COMPOUND')),
  interest_accrued DECIMAL(18,4) DEFAULT 0,

  -- Dates
  loan_date DATE NOT NULL,
  due_date DATE,
  grace_period_days INTEGER DEFAULT 0,

  -- Repayment
  amount_paid DECIMAL(18,4) DEFAULT 0,
  balance DECIMAL(18,4) NOT NULL,

  -- Ledger
  asset_account_id UUID REFERENCES accounts(id),
  liability_account_id UUID REFERENCES accounts(id),

  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN (
    'ACTIVE', 'PAID', 'DEFAULTED', 'CANCELLED'
  )),

  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  version INTEGER DEFAULT 1
);

CREATE INDEX idx_loans_user ON informal_loans(user_id);
CREATE INDEX idx_loans_type ON informal_loans(loan_type);
CREATE INDEX idx_loans_status ON informal_loans(status);
CREATE INDEX idx_loans_due ON informal_loans(due_date) WHERE status = 'ACTIVE';
```

---

## Test Plan

### Unit Tests

**PAYE Calculator:**

- Tax calculation for various salary levels (10K, 50K, 100K, 500K, 1M)
- Tax band transitions (edge cases at boundaries)
- Relief validation (over-limit scenarios)
- Historical rate application (different effective dates)
- Override tracking

**Expense Splits:**

- Split validation (sum equals total)
- Percentage calculation
- Ledger entry creation for each split

**SMS Parsing:**

- M-Pesa format variations
- Bank SMS formats (multiple banks)
- Amount extraction with commas
- Merchant name normalization
- Error handling for malformed SMS

**Interest Calculations:**

- Simple interest formula
- Compound interest formula
- Partial year calculations
- Grace period handling

**Target: 90%+ coverage on financial calculations**

### Integration Tests

**Income Flow:**

1. Create salary entry with auto-calculation
2. Review PAYE breakdown
3. Post to ledger
4. Verify bank account balance increased
5. Verify income account credited

**Expense with Splits:**

1. Create expense with 3 category splits
2. Upload 2 receipts
3. Post to ledger
4. Verify 3 separate ledger entries created
5. Verify budget tracking updated for each category

**SMS Parsing:**

1. Submit M-Pesa SMS
2. Review parsed transaction
3. Adjust category
4. Post transaction
5. Verify ledger updated

**Budget Rollover:**

1. Create January budget 30K
2. Spend 20K in January
3. System calculates 10K rollover
4. February available = 30K + 10K
5. Verify rollover tracked correctly

### End-to-End Tests

**Monthly Salary Cycle:**

1. User receives SMS of salary deposit
2. Parse SMS creates draft income
3. User reviews and adds allowances
4. System calculates PAYE/NHIF/NSSF
5. User posts income
6. Verify net salary in bank account
7. Export payslip PDF

**Shopping Trip:**

1. User shops at Naivas (5000 KES)
2. Upload receipt photo
3. Split expense: 70% Groceries, 30% Household
4. Post expense
5. Verify budget updated for both categories
6. Check remaining budget
7. Receive alert if over 80%

---

## Deliverables Checklist

- [ ] PAYE calculator with versioned tax tables
- [ ] Tax relief validation
- [ ] Salary income entry with overrides
- [ ] Expense creation with split support
- [ ] Receipt upload and storage
- [ ] Merchant database and normalization
- [ ] Budget creation with rollover logic
- [ ] Budget performance tracking
- [ ] SMS parsing for M-Pesa and banks
- [ ] Informal loan tracking (simple & compound)
- [ ] Unit tests (90%+ financial logic)
- [ ] Integration tests (all flows)
- [ ] API documentation updated

---

## Next Steps

After Phase 2 completion, proceed to **Phase 3: Financial Planning and Analysis** with solid income/expense tracking foundation.
