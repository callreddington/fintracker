# Phase 3: Financial Planning and Analysis (Enhanced)

## Overview

Phase 3 shifts from recording the past to guiding the future with **enhanced investment tracking, explicit goal formulas, and rule-based insights**. This phase prioritizes explainability and user control over automation.

**Critical Enhancements from Original:**
✅ Investment cost basis tracking (capital gains tax calculation)
✅ Dividend/interest separate tracking (different tax treatment)
✅ Goal progress formula clarification (transparent calculations)
✅ Asset revaluation suggestions (not automatic)
✅ Enhanced portfolio performance metrics

---

## Module 3.1: Goals and Savings with Investment Linking (Enhanced)

### Functional Requirements

**Goal Types:**

- **Savings Goals**: Target amount with deadline
- **Expense Goals**: Plan for specific purchase
- **Investment Goals**: Return-based targets
- **Debt Payoff Goals**: Loan elimination timeline

**Goal Progress Calculation (Explicit Formula):**

```
Progress Percentage = (Current Balance + Scheduled Contributions) / Target Amount × 100

Where:
- Current Balance = Sum of linked account balances
- Scheduled Contributions = Future contributions already committed
- Target Amount = User-defined goal amount
```

**Contributions:**

- **Manual**: User transfers to goal accounts manually
- **Scheduled**: Recurring transfers (linked to income)
- **Round-ups**: Spare change allocation (optional)
- **Windfalls**: Bonuses, tax refunds directed to goals

**Investment Linking:**

- Link goal to investment accounts
- Track market value changes
- Project goal completion based on historical returns
- Alert when projected completion date shifts significantly

**Milestone Tracking:**

- Goals can have milestones (25%, 50%, 75%, 100%)
- Celebration notifications on milestone achievement
- Visual progress indicators

### API Endpoints Specification

**POST /api/v1/goals**

Creates financial goal with investment linking.

Request body:

```json
{
  "name": "House Down Payment",
  "goal_type": "SAVINGS",
  "target_amount": "2000000.00",
  "currency": "KES",
  "target_date": "2026-12-31",

  "linked_accounts": [
    {
      "account_id": "uuid-savings-account",
      "account_type": "BANK"
    },
    {
      "account_id": "uuid-money-market-fund",
      "account_type": "INVESTMENT"
    }
  ],

  "scheduled_contributions": [
    {
      "amount": "50000.00",
      "frequency": "MONTHLY",
      "source_account_id": "uuid-salary-account",
      "start_date": "2024-02-01"
    }
  ],

  "milestones": [
    { "percentage": 25, "label": "Quarter way!" },
    { "percentage": 50, "label": "Halfway there!" },
    { "percentage": 75, "label": "Almost there!" },
    { "percentage": 100, "label": "Goal achieved!" }
  ],

  "notes": "Saving for house in Nairobi suburbs"
}
```

Response 201:

```json
{
  "goal": {
    "id": "uuid",
    "name": "House Down Payment",
    "target_amount": "2000000.00",
    "current_balance": "150000.00",
    "progress_percentage": 7.5,
    "projected_completion_date": "2027-03-15",
    "on_track": false,
    "shortfall_amount": "350000.00",
    "months_remaining": 35,
    "required_monthly_contribution": "52857.14"
  }
}
```

---

**GET /api/v1/goals/{id}/progress**

Gets detailed goal progress with explicit calculation breakdown.

Path parameters:

- id: UUID

Response 200:

```json
{
  "goal_id": "uuid",
  "target_amount": "2000000.00",
  "target_date": "2026-12-31",

  "current_status": {
    "linked_account_balances": {
      "Savings Account": "100000.00",
      "Money Market Fund": "50000.00",
      "total": "150000.00"
    },

    "scheduled_contributions_future": {
      "monthly_contribution": "50000.00",
      "months_remaining": 35,
      "total_future_contributions": "1750000.00"
    },

    "projected_total": "1900000.00",
    "shortfall": "100000.00",

    "progress_calculation": {
      "formula": "(Current Balance + Scheduled Contributions) / Target × 100",
      "current_balance": "150000.00",
      "scheduled_contributions": "1750000.00",
      "target_amount": "2000000.00",
      "progress_percentage": 95.0
    }
  },

  "investment_performance": {
    "total_invested": "120000.00",
    "current_value": "150000.00",
    "unrealized_gain": "30000.00",
    "return_percentage": 25.0,
    "annualized_return": 8.5
  },

  "milestones_achieved": [{ "percentage": 25, "achieved_date": "2024-06-15" }],

  "next_milestone": {
    "percentage": 50,
    "amount_required": "1000000.00",
    "amount_to_go": "850000.00",
    "estimated_date": "2025-08-01"
  },

  "recommendations": [
    "Increase monthly contribution by 2,857 to reach goal on time",
    "Consider higher-yield investment for money market allocation",
    "On current track, goal will be achieved 3 months late"
  ]
}
```

---

### Database Schema

**Table: goals** (enhanced)

```sql
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  goal_type VARCHAR(50) CHECK (goal_type IN (
    'SAVINGS', 'EXPENSE', 'INVESTMENT', 'DEBT_PAYOFF'
  )),

  target_amount DECIMAL(18,4) NOT NULL CHECK (target_amount > 0),
  currency CHAR(3) DEFAULT 'KES',
  target_date DATE,

  -- Progress tracking
  current_balance DECIMAL(18,4) DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0,

  -- Projections
  projected_completion_date DATE,
  on_track BOOLEAN DEFAULT TRUE,

  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN (
    'ACTIVE', 'COMPLETED', 'ABANDONED', 'PAUSED'
  )),

  notes TEXT,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,

  version INTEGER DEFAULT 1
);

CREATE INDEX idx_goals_user ON goals(user_id);
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_goals_target_date ON goals(target_date) WHERE status = 'ACTIVE';
```

---

**Table: goal_linked_accounts**

```sql
CREATE TABLE goal_linked_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,

  account_type VARCHAR(50) CHECK (account_type IN (
    'BANK', 'INVESTMENT', 'MOBILE_MONEY', 'CASH'
  )),

  linked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_goal_account UNIQUE (goal_id, account_id)
);

CREATE INDEX idx_goal_accounts_goal ON goal_linked_accounts(goal_id);
CREATE INDEX idx_goal_accounts_account ON goal_linked_accounts(account_id);
```

---

**Table: goal_contributions**

```sql
CREATE TABLE goal_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,

  contribution_type VARCHAR(50) CHECK (contribution_type IN (
    'MANUAL', 'SCHEDULED', 'ROUND_UP', 'WINDFALL'
  )),

  amount DECIMAL(18,4) NOT NULL CHECK (amount > 0),
  contribution_date DATE NOT NULL,

  source_account_id UUID REFERENCES accounts(id),
  transaction_id UUID REFERENCES transactions(id),

  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_goal_contributions_goal ON goal_contributions(goal_id);
CREATE INDEX idx_goal_contributions_date ON goal_contributions(contribution_date);
```

---

**Table: goal_milestones**

```sql
CREATE TABLE goal_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,

  milestone_percentage DECIMAL(5,2) NOT NULL CHECK (
    milestone_percentage >= 0 AND milestone_percentage <= 100
  ),
  label VARCHAR(255),

  achieved BOOLEAN DEFAULT FALSE,
  achieved_date DATE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_goal_milestones_goal ON goal_milestones(goal_id);
CREATE INDEX idx_goal_milestones_achieved ON goal_milestones(achieved);
```

---

## Module 3.2: Investment Portfolio with Cost Basis (Enhanced)

### Functional Requirements

**Cost Basis Tracking:**

For each investment holding, track:

- **Purchase price** (original cost)
- **Purchase date** (for long-term vs short-term gains)
- **Purchase fees** (brokerage, transaction fees)
- **Quantity purchased**
- **Running average cost** (for multiple purchases)

This enables accurate capital gains calculation:

```
Capital Gain = (Sale Price - Average Cost Basis - Sale Fees) × Quantity
```

**Dividend and Interest Separate Tracking:**

Kenya tax treatment differs:

- **Dividends**: 5% withholding tax (typically withheld at source)
- **Interest**: 15% withholding tax
- **Capital Gains**: 5% on disposal of securities (suspended currently, but track)

System tracks:

- Dividend income separately from capital gains
- Interest income separately
- Withholding tax amounts
- Net amounts received

**Investment Types:**

- Stocks (NSE listed)
- Bonds (Government, Corporate)
- Money Market Funds
- SACCOs
- REITs
- Cryptocurrency (future)

**Corporate Actions:**

- Stock splits (adjust cost basis)
- Bonus shares (adjust quantity, basis)
- Rights issues (new purchases)
- Mergers/acquisitions

### API Endpoints Specification

**POST /api/v1/investments/holdings**

Records investment purchase with cost basis.

Request body:

```json
{
  "security_id": "uuid-safaricom-stock",
  "transaction_type": "BUY",
  "quantity": "100",
  "price_per_unit": "28.50",
  "purchase_date": "2024-01-04",

  "fees": {
    "brokerage": "285.00",
    "exchange_fee": "50.00",
    "total": "335.00"
  },

  "total_cost": "3185.00",
  "settlement_account_id": "uuid-bank-account",

  "notes": "First Safaricom purchase"
}
```

Response 201:

```json
{
  "holding": {
    "id": "uuid",
    "security": {
      "id": "uuid",
      "name": "Safaricom PLC",
      "ticker": "SCOM",
      "exchange": "NSE"
    },
    "quantity": "100",
    "average_cost_basis": "31.85",
    "total_cost": "3185.00",
    "current_price": "30.00",
    "current_value": "3000.00",
    "unrealized_gain_loss": "-185.00",
    "unrealized_gain_loss_percentage": -5.81
  }
}
```

---

**POST /api/v1/investments/dividends**

Records dividend income with withholding tax.

Request body:

```json
{
  "holding_id": "uuid-safaricom-holding",
  "dividend_per_share": "1.20",
  "quantity": "100",
  "gross_dividend": "120.00",
  "withholding_tax": "6.00",
  "net_dividend": "114.00",
  "payment_date": "2024-01-15",

  "receiving_account_id": "uuid-bank-account"
}
```

Response 201:

```json
{
  "dividend_entry": {
    "id": "uuid",
    "holding": "Safaricom PLC - 100 shares",
    "gross_amount": "120.00",
    "withholding_tax": "6.00",
    "net_amount": "114.00",
    "effective_tax_rate": 5.0,
    "transaction_id": "uuid"
  }
}
```

---

**POST /api/v1/investments/holdings/{id}/sell**

Records investment sale with capital gains calculation.

Path parameters:

- id: UUID (holding ID)

Request body:

```json
{
  "quantity": "50",
  "price_per_unit": "32.00",
  "sale_date": "2024-01-20",

  "fees": {
    "brokerage": "160.00",
    "exchange_fee": "25.00",
    "capital_gains_tax": "80.00",
    "total": "265.00"
  },

  "settlement_account_id": "uuid-bank-account"
}
```

Response 200:

```json
{
  "sale_transaction": {
    "id": "uuid",
    "quantity_sold": "50",
    "sale_price": "32.00",
    "gross_proceeds": "1600.00",
    "fees": "265.00",
    "net_proceeds": "1335.00",

    "cost_basis_calculation": {
      "average_cost_per_unit": "31.85",
      "total_cost_basis": "1592.50",
      "capital_gain": "7.50",
      "gain_percentage": 0.47,
      "holding_period_days": 16,
      "holding_period_type": "SHORT_TERM"
    },

    "tax_summary": {
      "capital_gains_tax_rate": 5.0,
      "capital_gains_tax": "80.00",
      "net_gain_after_tax": "-72.50"
    }
  },

  "remaining_holding": {
    "quantity": "50",
    "average_cost_basis": "31.85",
    "current_value": "1500.00"
  }
}
```

---

**GET /api/v1/investments/portfolio/summary**

Comprehensive portfolio summary with performance metrics.

Query parameters:

- as_of_date: ISO date (optional, default today)

Response 200:

```json
{
  "portfolio_summary": {
    "as_of_date": "2024-01-20",

    "total_invested": "3185.00",
    "current_value": "1500.00",
    "unrealized_gain_loss": "-1685.00",
    "unrealized_return_percentage": -52.9,

    "realized_gains": "7.50",
    "dividend_income_ytd": "114.00",
    "interest_income_ytd": "0.00",
    "total_return_ytd": "121.50",

    "tax_summary": {
      "dividend_tax_withheld": "6.00",
      "capital_gains_tax_paid": "80.00",
      "total_tax_paid": "86.00"
    }
  },

  "holdings_breakdown": [
    {
      "security": "Safaricom PLC",
      "quantity": "50",
      "avg_cost": "31.85",
      "current_price": "30.00",
      "current_value": "1500.00",
      "unrealized_gain": "-92.50",
      "allocation_percentage": 100.0
    }
  ],

  "asset_allocation": {
    "by_type": {
      "stocks": 100.0,
      "bonds": 0.0,
      "money_market": 0.0
    },
    "by_sector": {
      "telecommunications": 100.0
    }
  },

  "performance_metrics": {
    "time_weighted_return": -52.9,
    "money_weighted_return": -49.12,
    "annualized_return": -365.0,
    "sharpe_ratio": null,
    "max_drawdown": -52.9
  }
}
```

---

### Database Schema

**Table: securities**

```sql
CREATE TABLE securities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Security identification
  ticker VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  security_type VARCHAR(50) CHECK (security_type IN (
    'STOCK', 'BOND', 'MONEY_MARKET', 'REIT', 'SACCO', 'CRYPTO'
  )),

  -- Exchange
  exchange VARCHAR(50),
  sector VARCHAR(100),

  -- Metadata
  currency CHAR(3) DEFAULT 'KES',
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_ticker_exchange UNIQUE (ticker, exchange)
);

CREATE INDEX idx_securities_type ON securities(security_type);
CREATE INDEX idx_securities_ticker ON securities(ticker);
```

---

**Table: investment_holdings** (enhanced with cost basis)

```sql
CREATE TABLE investment_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  security_id UUID NOT NULL REFERENCES securities(id),

  -- Quantity
  quantity DECIMAL(18,4) NOT NULL CHECK (quantity >= 0),

  -- Cost basis tracking
  total_cost DECIMAL(18,4) NOT NULL,
  average_cost_per_unit DECIMAL(18,4) NOT NULL,
  total_fees_paid DECIMAL(18,4) DEFAULT 0,

  -- Current valuation
  current_price DECIMAL(18,4),
  current_value DECIMAL(18,4),
  last_price_update TIMESTAMP WITH TIME ZONE,

  -- Performance
  unrealized_gain_loss DECIMAL(18,4),
  unrealized_return_percentage DECIMAL(10,4),

  -- Account linkage
  investment_account_id UUID REFERENCES accounts(id),

  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN (
    'ACTIVE', 'CLOSED'
  )),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  version INTEGER DEFAULT 1
);

CREATE INDEX idx_holdings_user ON investment_holdings(user_id);
CREATE INDEX idx_holdings_security ON investment_holdings(security_id);
CREATE INDEX idx_holdings_account ON investment_holdings(investment_account_id);
```

---

**Table: investment_transactions** (enhanced)

```sql
CREATE TABLE investment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  holding_id UUID REFERENCES investment_holdings(id),
  security_id UUID NOT NULL REFERENCES securities(id),

  transaction_type VARCHAR(20) CHECK (transaction_type IN (
    'BUY', 'SELL', 'DIVIDEND', 'INTEREST', 'SPLIT', 'BONUS', 'RIGHTS'
  )),

  -- Transaction details
  transaction_date DATE NOT NULL,
  quantity DECIMAL(18,4),
  price_per_unit DECIMAL(18,4),

  -- Amounts
  gross_amount DECIMAL(18,4) NOT NULL,
  fees DECIMAL(18,4) DEFAULT 0,
  tax DECIMAL(18,4) DEFAULT 0,
  net_amount DECIMAL(18,4) NOT NULL,

  -- For dividend/interest
  withholding_tax DECIMAL(18,4) DEFAULT 0,

  -- For sales
  cost_basis DECIMAL(18,4),
  capital_gain DECIMAL(18,4),

  -- Ledger integration
  ledger_transaction_id UUID REFERENCES transactions(id),

  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  version INTEGER DEFAULT 1
);

CREATE INDEX idx_investment_txns_user ON investment_transactions(user_id);
CREATE INDEX idx_investment_txns_holding ON investment_transactions(holding_id);
CREATE INDEX idx_investment_txns_date ON investment_transactions(transaction_date);
CREATE INDEX idx_investment_txns_type ON investment_transactions(transaction_type);
```

---

**Table: dividend_payments** (separate tracking for tax)

```sql
CREATE TABLE dividend_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  holding_id UUID NOT NULL REFERENCES investment_holdings(id),

  payment_date DATE NOT NULL,
  dividend_per_share DECIMAL(18,4) NOT NULL,
  quantity DECIMAL(18,4) NOT NULL,

  gross_dividend DECIMAL(18,4) NOT NULL,
  withholding_tax DECIMAL(18,4) NOT NULL,
  net_dividend DECIMAL(18,4) NOT NULL,

  receiving_account_id UUID REFERENCES accounts(id),
  investment_transaction_id UUID REFERENCES investment_transactions(id),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dividends_user ON dividend_payments(user_id);
CREATE INDEX idx_dividends_holding ON dividend_payments(holding_id);
CREATE INDEX idx_dividends_date ON dividend_payments(payment_date);
```

---

## Module 3.3: Net Worth Tracking with Asset Revaluation

### Functional Requirements

**Net Worth Calculation:**

```
Net Worth = Total Assets - Total Liabilities

Assets:
- Bank account balances
- Investment holdings (current market value)
- Cash holdings
- Loans given (receivables)
- Physical assets (user-valued)

Liabilities:
- Loans received (payables)
- Credit card balances
- Other debts
```

**Asset Revaluation Suggestions:**

System suggests (not auto-updates) revaluation when:

- Investment prices available from market data (suggest update)
- Asset hasn't been revalued in 90+ days (remind user)
- Significant market movements detected (alert user)

User must explicitly accept revaluation.

**Historical Net Worth:**

- Monthly snapshots automatically saved
- Chart showing net worth trend
- Comparison to previous periods

### API Endpoints Specification

**GET /api/v1/net-worth**

Calculates current net worth with asset breakdown.

Query parameters:

- as_of_date: ISO date (optional, default today)

Response 200:

```json
{
  "net_worth_summary": {
    "as_of_date": "2024-01-20",
    "total_assets": "523450.00",
    "total_liabilities": "125000.00",
    "net_worth": "398450.00"
  },

  "assets_breakdown": {
    "liquid_assets": {
      "bank_accounts": "200000.00",
      "mobile_money": "15000.00",
      "cash": "5000.00",
      "total": "220000.00"
    },
    "investments": {
      "stocks": "1500.00",
      "money_market": "150000.00",
      "saccos": "50000.00",
      "total": "201500.00"
    },
    "receivables": {
      "loans_given": "50000.00",
      "total": "50000.00"
    },
    "physical_assets": {
      "vehicle": "0.00",
      "property": "0.00",
      "total": "0.00"
    }
  },

  "liabilities_breakdown": {
    "loans_received": "100000.00",
    "credit_cards": "0.00",
    "other_debts": "25000.00",
    "total": "125000.00"
  },

  "revaluation_suggestions": [
    {
      "asset_type": "INVESTMENT",
      "asset_name": "Safaricom PLC",
      "last_updated": "2024-01-04",
      "suggested_price": "30.00",
      "current_recorded_price": "28.50",
      "value_difference": "-92.50",
      "reason": "Market price available"
    }
  ]
}
```

---

### Database Schema

**Table: net_worth_snapshots**

```sql
CREATE TABLE net_worth_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  snapshot_date DATE NOT NULL,

  -- Totals
  total_assets DECIMAL(18,4) NOT NULL,
  total_liabilities DECIMAL(18,4) NOT NULL,
  net_worth DECIMAL(18,4) NOT NULL,

  -- Breakdown (JSONB for flexibility)
  assets_breakdown JSONB NOT NULL,
  liabilities_breakdown JSONB NOT NULL,

  -- Period comparison
  change_from_previous_month DECIMAL(18,4),
  change_percentage DECIMAL(10,4),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_user_snapshot_date UNIQUE (user_id, snapshot_date)
);

CREATE INDEX idx_net_worth_user_date ON net_worth_snapshots(user_id, snapshot_date DESC);
```

---

## Module 3.4: Financial Insights Engine (Rule-Based)

### Functional Requirements

**Insight Categories:**

1. **Spending Patterns**
   - "Your grocery spending increased 30% this month"
   - "You spent most on weekends (65% of total)"
   - "Top merchant: Naivas (15 transactions, 25K spent)"

2. **Budget Performance**
   - "You're 85% through January but only spent 60% of grocery budget - well done!"
   - "Entertainment budget exceeded by 2,500 (25%)"
   - "3 categories under budget, 2 over budget"

3. **Savings Progress**
   - "At current rate, you'll reach house down payment goal 3 months late"
   - "Increase monthly contribution by 2,857 to stay on track"
   - "You saved 18% of income this month (goal: 20%)"

4. **Income Trends**
   - "Income decreased 10% from last month"
   - "PAYE increased due to bonus payment"
   - "Net income YTD: 1.2M (average 100K/month)"

5. **Debt Management**
   - "You can pay off loan 6 months early with current repayment rate"
   - "Interest paid this year: 15K (could save with refinancing)"

**Insight Rules:**

- **Plain language**: No jargon
- **Actionable**: Include what user can do
- **Contextual**: Relevant to user's actual situation
- **Timely**: Based on recent activity
- **Optional**: User can dismiss/mute categories

### API Endpoints Specification

**GET /api/v1/insights**

Retrieves personalized insights based on rules.

Query parameters:

- category: string (optional) - filter by category
- period: string (default "current_month")

Response 200:

```json
{
  "insights": [
    {
      "id": "uuid",
      "category": "SPENDING_PATTERN",
      "priority": "MEDIUM",
      "title": "Grocery spending up 30%",
      "description": "You spent 39,000 on groceries this month vs 30,000 last month (+9,000)",
      "insight_type": "COMPARISON",
      "affected_period": "2024-01",
      "action_suggestions": [
        "Review grocery budget allocation",
        "Check for one-time bulk purchases",
        "Consider meal planning to reduce costs"
      ],
      "data": {
        "current_month": "39000.00",
        "previous_month": "30000.00",
        "change_amount": "9000.00",
        "change_percentage": 30.0
      },
      "created_at": "2024-01-20T10:00:00Z",
      "dismissed": false
    },
    {
      "id": "uuid",
      "category": "GOAL_PROGRESS",
      "priority": "HIGH",
      "title": "House goal behind schedule",
      "description": "At current savings rate, you'll reach your 2M house goal 3 months late (Mar 2027 instead of Dec 2026)",
      "insight_type": "PROJECTION",
      "affected_goal_id": "uuid",
      "action_suggestions": [
        "Increase monthly contribution from 50K to 52,857",
        "Add windfalls (bonuses, refunds) to goal",
        "Review investment allocation for better returns"
      ],
      "data": {
        "target_date": "2026-12-31",
        "projected_date": "2027-03-15",
        "delay_days": 74,
        "current_monthly": "50000.00",
        "required_monthly": "52857.14"
      },
      "created_at": "2024-01-20T10:00:00Z",
      "dismissed": false
    }
  ],
  "summary": {
    "total_insights": 15,
    "by_priority": {
      "HIGH": 2,
      "MEDIUM": 8,
      "LOW": 5
    },
    "by_category": {
      "SPENDING_PATTERN": 5,
      "BUDGET_PERFORMANCE": 4,
      "GOAL_PROGRESS": 2,
      "SAVINGS": 2,
      "INCOME": 2
    }
  }
}
```

---

### Database Schema

**Table: insights**

```sql
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  category VARCHAR(50) CHECK (category IN (
    'SPENDING_PATTERN', 'BUDGET_PERFORMANCE', 'GOAL_PROGRESS',
    'SAVINGS', 'INCOME', 'DEBT_MANAGEMENT', 'INVESTMENT'
  )),

  priority VARCHAR(20) CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),

  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  insight_type VARCHAR(50),

  -- Contextual data
  affected_period VARCHAR(20),
  affected_goal_id UUID REFERENCES goals(id),
  affected_budget_id UUID REFERENCES budgets(id),

  action_suggestions TEXT[],
  insight_data JSONB,

  -- User interaction
  dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_insights_user ON insights(user_id);
CREATE INDEX idx_insights_category ON insights(category);
CREATE INDEX idx_insights_priority ON insights(priority);
CREATE INDEX idx_insights_dismissed ON insights(dismissed);
```

---

## Test Plan

### Unit Tests

**Goal Progress Calculation:**

- Formula validation (current + scheduled / target × 100)
- Edge cases (over-funded goals, negative progress)
- Projection calculations
- Milestone detection

**Cost Basis Tracking:**

- Average cost calculation with multiple purchases
- Capital gains calculation (sale price - cost basis - fees)
- Stock split adjustments
- Bonus share adjustments

**Dividend Tax Calculation:**

- 5% withholding tax on gross dividend
- Net dividend = gross - withholding
- Year-to-date dividend income totaling

**Net Worth Calculation:**

- Asset totals (all categories)
- Liability totals
- Net worth = assets - liabilities
- Period comparison logic

**Insights Generation:**

- Spending increase detection (>20% change)
- Budget variance calculation
- Goal timeline projection
- Action suggestion logic

**Target: 90%+ coverage on financial calculations**

### Integration Tests

**Goal with Investments:**

1. Create savings goal linked to investment account
2. Record investment purchase
3. Record dividend payment
4. Check goal progress includes investment value
5. Verify milestone achievement

**Portfolio Performance:**

1. Buy 100 shares at 28.50
2. Receive dividend (1.20/share)
3. Sell 50 shares at 32.00
4. Verify cost basis, capital gain, tax calculations
5. Check remaining holding value

**Net Worth Snapshot:**

1. Create bank account with 100K
2. Create investment holding (10K)
3. Create loan received (50K liability)
4. Calculate net worth (100K + 10K - 50K = 60K)
5. Verify snapshot saved correctly

**Insight Generation:**

1. Spend 40K on groceries (budget 30K)
2. System generates overspend insight
3. User increases budget to 40K
4. New insight: "Budget adjusted appropriately"

### End-to-End Tests

**Investment Journey:**

1. User opens investment account
2. Transfers 10K to account
3. Buys Safaricom shares
4. Receives dividend
5. Links to house goal
6. Views net worth including investment
7. Checks goal progress
8. Receives insight about goal timeline

**Goal Achievement:**

1. Create emergency fund goal (100K)
2. Set up monthly contribution (10K)
3. Make 10 contributions
4. System detects goal completion
5. Milestone notifications sent
6. Goal marked as completed
7. Historical progress visible

---

## Deliverables Checklist

- [ ] Goal creation with investment linking
- [ ] Goal progress tracking with explicit formula
- [ ] Milestone tracking and notifications
- [ ] Investment purchase with cost basis
- [ ] Dividend/interest separate tracking
- [ ] Capital gains calculation on sale
- [ ] Portfolio performance metrics
- [ ] Net worth calculation
- [ ] Asset revaluation suggestions
- [ ] Historical net worth snapshots
- [ ] Rule-based insights generation
- [ ] Insight categorization and prioritization
- [ ] Unit tests (90%+ financial logic)
- [ ] Integration tests (all flows)
- [ ] API documentation updated

---

## Next Steps

After Phase 3 completion, proceed to **Phase 4: Automation and Intelligence** with robust financial planning foundation.
