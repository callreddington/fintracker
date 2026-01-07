# Phase 4: Automation and Intelligence (Enhanced)

## Overview

Phase 4 introduces intelligent automation while maintaining **explainability, user control, and reversibility**. This enhanced version prioritizes trust through transparency over convenience through autonomy.

**Critical Enhancements from Original:**
✅ Rule testing/dry-run mode (test before enabling)
✅ Rule versioning (complete audit trail)
✅ ML confidence scoring (transparent predictions)
✅ Notification batching (immediate vs digest)
✅ Override and correction tracking

---

## Module 4.1: Rule Engine with Testing (Enhanced)

### Functional Requirements

**Rule Types:**

1. **Auto-Categorization Rules**
   - IF merchant contains "Naivas" THEN category = "Groceries"
   - IF amount > 10,000 AND merchant = "School" THEN category = "Education"
   - IF description contains "fuel" THEN category = "Transportation"

2. **Auto-Tagging Rules**
   - IF category = "Groceries" AND amount > 20,000 THEN add tag "bulk-shopping"
   - IF merchant = "Pharmacy" THEN add tag "health"

3. **Budget Alert Rules**
   - IF category spending > 80% of budget THEN notify
   - IF total monthly spending > income THEN alert "overspending"

4. **Goal Contribution Rules**
   - IF income received THEN transfer 10% to emergency fund
   - IF expense < budgeted THEN transfer savings to house goal

**Rule Testing (Dry-Run Mode):**

Before activating rule, user can:

- Test against last 30/60/90 days of historical transactions
- See what would have happened if rule was active
- Review matching transactions
- Adjust rule parameters
- Approve or discard

**Rule Versioning:**

Every rule change creates new version:

- Version 1: Original rule
- Version 2: User adjusted threshold from 80% to 85%
- Version 3: User added additional condition

System maintains:

- Complete version history
- Which version was active when
- Which transactions were affected by which version
- Ability to see "what categorization was based on this rule v2"

**Rule Priority and Conflicts:**

When multiple rules match:

- Higher priority rules execute first
- User sets priority (1-100, higher = more important)
- Conflict resolution: Use first matching rule (by priority)
- Option to stack rules (apply all matching) or exclusive (apply one)

**Rule Sources:**

- **User-created**: Custom rules
- **System-suggested**: Based on patterns (user approves)
- **Template**: Pre-built rules user can customize

### API Endpoints Specification

**POST /api/v1/rules**

Creates new rule with dry-run testing.

Request body:

```json
{
  "name": "Auto-categorize Naivas as Groceries",
  "rule_type": "AUTO_CATEGORIZE",
  "enabled": false,

  "conditions": [
    {
      "field": "merchant_name",
      "operator": "CONTAINS",
      "value": "naivas",
      "case_sensitive": false
    }
  ],

  "actions": [
    {
      "action_type": "SET_CATEGORY",
      "category_id": "uuid-groceries"
    },
    {
      "action_type": "ADD_TAG",
      "tag": "auto-categorized"
    }
  ],

  "priority": 50,
  "conflict_resolution": "FIRST_MATCH",

  "test_before_enable": true,
  "test_period_days": 30
}
```

Response 201:

```json
{
  "rule": {
    "id": "uuid",
    "name": "Auto-categorize Naivas as Groceries",
    "version": 1,
    "enabled": false,
    "status": "TESTING"
  },

  "dry_run_results": {
    "test_period": {
      "start_date": "2023-12-20",
      "end_date": "2024-01-20",
      "total_transactions": 450
    },

    "matches_found": 12,

    "sample_matches": [
      {
        "transaction_id": "uuid",
        "date": "2024-01-15",
        "merchant": "NAIVAS SUPERMARKET",
        "amount": "5000.00",
        "current_category": "Uncategorized",
        "would_be_category": "Groceries",
        "confidence": 1.0
      },
      {
        "transaction_id": "uuid",
        "date": "2024-01-08",
        "merchant": "Naivas SPM",
        "amount": "3500.00",
        "current_category": "Shopping",
        "would_be_category": "Groceries",
        "confidence": 1.0
      }
    ],

    "impact_summary": {
      "transactions_affected": 12,
      "categories_changed": {
        "Uncategorized": 8,
        "Shopping": 3,
        "Other": 1
      },
      "potential_time_saved_minutes": 6
    }
  }
}
```

---

**POST /api/v1/rules/{id}/enable**

Enables rule after dry-run approval.

Path parameters:

- id: UUID

Request body:

```json
{
  "confirmed": true,
  "apply_to_historical": false,
  "historical_start_date": "2024-01-01"
}
```

Response 200:

```json
{
  "rule": {
    "id": "uuid",
    "enabled": true,
    "enabled_at": "2024-01-20T10:00:00Z",
    "version": 1
  },

  "activation_summary": {
    "will_apply_to_future_transactions": true,
    "applied_to_historical": false,
    "effective_from": "2024-01-20T10:00:00Z"
  }
}
```

---

**PATCH /api/v1/rules/{id}**

Updates rule (creates new version).

Path parameters:

- id: UUID

Request body:

```json
{
  "name": "Auto-categorize Naivas as Groceries (Updated)",
  "conditions": [
    {
      "field": "merchant_name",
      "operator": "CONTAINS",
      "value": "naivas",
      "case_sensitive": false
    },
    {
      "field": "amount",
      "operator": "LESS_THAN",
      "value": "50000.00"
    }
  ],
  "test_before_enable": true
}
```

Response 200:

```json
{
  "rule": {
    "id": "uuid",
    "version": 2,
    "previous_version": 1,
    "changes": [
      "Added condition: amount < 50000",
      "Updated name"
    ],
    "status": "TESTING",
    "enabled": false
  },

  "dry_run_results": {
    "test_period": {...},
    "matches_found": 11,
    "difference_from_v1": {
      "fewer_matches": 1,
      "reason": "1 transaction had amount > 50,000"
    }
  }
}
```

---

**GET /api/v1/rules/{id}/history**

Gets complete version history of rule.

Response 200:

```json
{
  "rule_id": "uuid",
  "current_version": 2,

  "versions": [
    {
      "version": 1,
      "created_at": "2024-01-20T10:00:00Z",
      "created_by": "uuid-user",
      "enabled_from": "2024-01-20T10:05:00Z",
      "enabled_to": "2024-01-25T15:30:00Z",
      "conditions": [...],
      "actions": [...],
      "transactions_affected": 15,
      "changes_from_previous": null
    },
    {
      "version": 2,
      "created_at": "2024-01-25T15:30:00Z",
      "created_by": "uuid-user",
      "enabled_from": "2024-01-25T15:45:00Z",
      "enabled_to": null,
      "conditions": [...],
      "actions": [...],
      "transactions_affected": 8,
      "changes_from_previous": [
        "Added amount condition"
      ]
    }
  ]
}
```

---

**GET /api/v1/transactions/{id}/rule-audit**

Shows which rules affected a transaction.

Response 200:

```json
{
  "transaction_id": "uuid",
  "rules_applied": [
    {
      "rule_id": "uuid",
      "rule_name": "Auto-categorize Naivas as Groceries",
      "rule_version": 2,
      "applied_at": "2024-01-25T16:00:00Z",
      "actions_taken": [
        {
          "action": "SET_CATEGORY",
          "from": "Uncategorized",
          "to": "Groceries"
        },
        {
          "action": "ADD_TAG",
          "tag": "auto-categorized"
        }
      ],
      "can_override": true
    }
  ],

  "manual_overrides": [
    {
      "overridden_at": "2024-01-26T10:00:00Z",
      "overridden_by": "uuid-user",
      "field": "category",
      "from": "Groceries",
      "to": "Household",
      "reason": "This was cleaning supplies, not groceries"
    }
  ]
}
```

---

### Database Schema

**Table: rules** (enhanced with versioning)

```sql
CREATE TABLE rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(50) CHECK (rule_type IN (
    'AUTO_CATEGORIZE', 'AUTO_TAG', 'BUDGET_ALERT', 'GOAL_CONTRIBUTION'
  )),

  -- Current version
  current_version INTEGER DEFAULT 1 NOT NULL,

  -- Rule definition (current version)
  conditions JSONB NOT NULL,
  actions JSONB NOT NULL,

  -- Priority and conflict handling
  priority INTEGER DEFAULT 50 CHECK (priority BETWEEN 1 AND 100),
  conflict_resolution VARCHAR(20) CHECK (conflict_resolution IN (
    'FIRST_MATCH', 'STACK_ALL'
  )),

  -- Status
  enabled BOOLEAN DEFAULT FALSE,
  enabled_at TIMESTAMP WITH TIME ZONE,
  disabled_at TIMESTAMP WITH TIME ZONE,

  -- Testing
  test_status VARCHAR(20) CHECK (test_status IN (
    'NOT_TESTED', 'TESTING', 'APPROVED', 'REJECTED'
  )),
  last_test_at TIMESTAMP WITH TIME ZONE,

  -- Stats
  total_matches INTEGER DEFAULT 0,
  successful_applications INTEGER DEFAULT 0,
  failed_applications INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  version INTEGER DEFAULT 1
);

CREATE INDEX idx_rules_user ON rules(user_id);
CREATE INDEX idx_rules_type ON rules(rule_type);
CREATE INDEX idx_rules_enabled ON rules(enabled) WHERE enabled = TRUE;
CREATE INDEX idx_rules_priority ON rules(priority DESC);
```

---

**Table: rule_versions** (complete version history)

```sql
CREATE TABLE rule_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES rules(id) ON DELETE CASCADE,

  version_number INTEGER NOT NULL,

  -- Version snapshot
  name VARCHAR(255) NOT NULL,
  conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  priority INTEGER NOT NULL,

  -- Lifecycle
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  enabled_from TIMESTAMP WITH TIME ZONE,
  enabled_to TIMESTAMP WITH TIME ZONE,

  -- Changes from previous
  changes_description TEXT[],

  -- Stats for this version
  transactions_affected INTEGER DEFAULT 0,

  CONSTRAINT unique_rule_version UNIQUE (rule_id, version_number)
);

CREATE INDEX idx_rule_versions_rule ON rule_versions(rule_id, version_number DESC);
CREATE INDEX idx_rule_versions_active ON rule_versions(rule_id, enabled_from, enabled_to);
```

---

**Table: rule_applications** (audit trail of rule executions)

```sql
CREATE TABLE rule_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  rule_id UUID NOT NULL REFERENCES rules(id),
  rule_version INTEGER NOT NULL,
  transaction_id UUID NOT NULL REFERENCES transactions(id),

  applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- What happened
  actions_taken JSONB NOT NULL,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,

  -- Override tracking
  overridden BOOLEAN DEFAULT FALSE,
  overridden_at TIMESTAMP WITH TIME ZONE,
  overridden_by UUID REFERENCES users(id),
  override_reason TEXT
);

CREATE INDEX idx_rule_applications_rule ON rule_applications(rule_id);
CREATE INDEX idx_rule_applications_transaction ON rule_applications(transaction_id);
CREATE INDEX idx_rule_applications_date ON rule_applications(applied_at);
```

---

## Module 4.2: Predictive Intelligence with Confidence Scoring (Enhanced)

### Functional Requirements

**Prediction Types:**

1. **Spending Predictions**
   - "Based on patterns, you'll likely spend 32K on groceries this month"
   - Confidence: 85% (based on 6 months of data)

2. **Budget Projections**
   - "At current rate, you'll exceed entertainment budget by 15%"
   - Confidence: 78% (12 days of data, 18 days remaining)

3. **Income Timing**
   - "Salary typically arrives on 25th, expect around then"
   - Confidence: 95% (consistent for 12 months)

4. **Anomaly Detection**
   - "Transaction of 15K at midnight is unusual for you"
   - Confidence: 92% (never happened before)

**Confidence Scoring:**

All predictions include:

- **Confidence percentage** (0-100%)
- **Explanation** ("Based on 6 months of similar spending")
- **Data quality** ("High - consistent patterns detected")
- **Recommendation** ("Prediction reliable, plan accordingly" vs "Low confidence, use as rough guide")

**Feedback Loop:**

- User can mark predictions as "accurate" or "inaccurate"
- System learns from corrections
- Confidence adjusts based on historical accuracy
- Poor performing models disabled automatically

**Transparency:**

Every prediction shows:

- How it was calculated
- What data was used
- Why this confidence level
- Historical accuracy of similar predictions

### API Endpoints Specification

**GET /api/v1/predictions/spending**

Predicts spending for current period with confidence.

Query parameters:

- category_id: UUID (optional, predict specific category)
- period: string (default "current_month")

Response 200:

```json
{
  "predictions": [
    {
      "category": "Groceries",
      "category_id": "uuid",

      "prediction": {
        "predicted_amount": "32000.00",
        "confidence_percentage": 85,
        "confidence_level": "HIGH",

        "range": {
          "low_estimate": "28000.00",
          "high_estimate": "36000.00",
          "most_likely": "32000.00"
        }
      },

      "explanation": {
        "method": "HISTORICAL_AVERAGE",
        "data_used": "Last 6 months of grocery spending",
        "pattern_detected": "Consistent monthly spending between 28K-35K",
        "factors_considered": [
          "Day of month (shopping typically mid-month and month-end)",
          "Seasonal variations (January typically 10% higher)",
          "Recent trend (slight increase last 3 months)"
        ]
      },

      "current_status": {
        "days_into_period": 20,
        "spent_so_far": "22000.00",
        "predicted_remaining": "10000.00",
        "on_track": true
      },

      "historical_accuracy": {
        "similar_predictions_made": 6,
        "accurate_within_10_percent": 5,
        "accuracy_rate": 83.3
      },

      "recommendation": "Prediction is reliable. Budget 32K for groceries this month."
    }
  ]
}
```

---

**POST /api/v1/predictions/{id}/feedback**

Provides feedback on prediction accuracy.

Path parameters:

- id: UUID (prediction ID)

Request body:

```json
{
  "actual_amount": "31500.00",
  "accurate": true,
  "deviation_percentage": 1.6,
  "notes": "Very close prediction, well done"
}
```

Response 200:

```json
{
  "feedback_recorded": true,
  "prediction_id": "uuid",
  "model_performance_updated": true,

  "updated_metrics": {
    "model_accuracy_rate": 84.2,
    "total_predictions": 7,
    "accurate_predictions": 6
  }
}
```

---

**GET /api/v1/predictions/anomalies**

Detects unusual transactions with confidence.

Query parameters:

- period: string (default "last_7_days")
- min_confidence: integer (default 70, only show anomalies with confidence >= this)

Response 200:

```json
{
  "anomalies": [
    {
      "transaction_id": "uuid",
      "transaction_date": "2024-01-20",
      "amount": "15000.00",
      "merchant": "Unknown Merchant",
      "time": "23:45:00",

      "anomaly_type": "UNUSUAL_AMOUNT",
      "confidence": 92,

      "reasons": [
        "Amount 3x higher than typical transactions",
        "Merchant not recognized in your history",
        "Time of day unusual (you typically don't shop after 9pm)",
        "No similar transaction in last 12 months"
      ],

      "comparison": {
        "your_typical_amount": "5000.00",
        "your_typical_merchants": ["Naivas", "Carrefour", "QuickMart"],
        "your_typical_times": "10:00-20:00"
      },

      "suggested_actions": [
        "Verify this transaction is legitimate",
        "Check if card was used by someone else",
        "Report if suspicious"
      ]
    }
  ],

  "summary": {
    "total_anomalies": 1,
    "by_type": {
      "UNUSUAL_AMOUNT": 1,
      "UNUSUAL_MERCHANT": 0,
      "UNUSUAL_TIME": 0,
      "DUPLICATE_SUSPECTED": 0
    }
  }
}
```

---

### Database Schema

**Table: predictions**

```sql
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  prediction_type VARCHAR(50) CHECK (prediction_type IN (
    'SPENDING', 'INCOME', 'BUDGET_PROJECTION', 'ANOMALY'
  )),

  -- What was predicted
  category_id UUID REFERENCES categories(id),
  period_start DATE,
  period_end DATE,

  predicted_amount DECIMAL(18,4),
  predicted_date DATE,

  -- Confidence
  confidence_percentage INTEGER CHECK (confidence_percentage BETWEEN 0 AND 100),
  confidence_level VARCHAR(20) CHECK (confidence_level IN ('LOW', 'MEDIUM', 'HIGH')),

  -- Model info
  model_name VARCHAR(100),
  model_version VARCHAR(50),

  -- Explanation
  explanation JSONB,
  data_used JSONB,

  -- Actuals (filled in later)
  actual_amount DECIMAL(18,4),
  actual_date DATE,
  accuracy_percentage DECIMAL(5,2),

  -- Feedback
  user_feedback VARCHAR(20) CHECK (user_feedback IN (
    'ACCURATE', 'INACCURATE', 'NOT_PROVIDED'
  )),
  feedback_notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  evaluated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_predictions_user ON predictions(user_id);
CREATE INDEX idx_predictions_type ON predictions(prediction_type);
CREATE INDEX idx_predictions_period ON predictions(period_start, period_end);
CREATE INDEX idx_predictions_feedback ON predictions(user_feedback);
```

---

**Table: anomaly_detections**

```sql
CREATE TABLE anomaly_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id),

  anomaly_type VARCHAR(50) CHECK (anomaly_type IN (
    'UNUSUAL_AMOUNT', 'UNUSUAL_MERCHANT', 'UNUSUAL_TIME',
    'UNUSUAL_FREQUENCY', 'DUPLICATE_SUSPECTED', 'POTENTIAL_FRAUD'
  )),

  confidence_percentage INTEGER CHECK (confidence_percentage BETWEEN 0 AND 100),

  reasons JSONB NOT NULL,
  comparison_data JSONB,

  -- User action
  reviewed BOOLEAN DEFAULT FALSE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  user_action VARCHAR(50) CHECK (user_action IN (
    'CONFIRMED_LEGITIMATE', 'MARKED_SUSPICIOUS', 'REPORTED_FRAUD', 'IGNORED'
  )),

  detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_anomaly_user ON anomaly_detections(user_id);
CREATE INDEX idx_anomaly_transaction ON anomaly_detections(transaction_id);
CREATE INDEX idx_anomaly_reviewed ON anomaly_detections(reviewed);
```

---

## Module 4.3: Smart Notifications with Batching (Enhanced)

### Functional Requirements

**Notification Priorities:**

1. **Immediate (Real-time)**
   - Anomaly detected (potential fraud)
   - Account balance critical low (<1,000)
   - Large transaction posted (>50,000)
   - Goal milestone achieved

2. **Important (Within 1 hour)**
   - Budget 100% spent
   - Bill due in 24 hours
   - Income expected but not received
   - Investment significant movement (>10%)

3. **Informational (Daily digest)**
   - Budget 80% spent warning
   - Spending pattern insights
   - Goal progress updates
   - Weekly/monthly summaries

4. **Low Priority (Weekly digest)**
   - Suggestions for improvement
   - New features available
   - Optional tips and tricks

**Batching Logic:**

- **Immediate**: Send right away (push notification, email)
- **Important**: Batch and send within 1 hour
- **Informational**: Send once daily (morning digest at 8am)
- **Low**: Send once weekly (Sunday evening)

User configures:

- Which priorities to receive
- Delivery channels (push, email, SMS, in-app only)
- Quiet hours (no notifications 10pm-7am)
- Digest timing preferences

**Notification Channels:**

- **Push**: Mobile app (future)
- **Email**: Always available
- **SMS**: High priority only (costs money)
- **In-app**: Always visible

### API Endpoints Specification

**POST /api/v1/notifications/preferences**

Configures notification preferences.

Request body:

```json
{
  "enabled_priorities": ["IMMEDIATE", "IMPORTANT", "INFORMATIONAL"],

  "channels": {
    "IMMEDIATE": ["EMAIL", "IN_APP"],
    "IMPORTANT": ["EMAIL", "IN_APP"],
    "INFORMATIONAL": ["IN_APP"],
    "LOW": []
  },

  "digest_settings": {
    "daily_digest_time": "08:00",
    "weekly_digest_day": "SUNDAY",
    "weekly_digest_time": "18:00"
  },

  "quiet_hours": {
    "enabled": true,
    "start": "22:00",
    "end": "07:00",
    "emergency_override": true
  },

  "category_preferences": {
    "budget_alerts": true,
    "goal_updates": true,
    "insights": true,
    "anomaly_detection": true,
    "income_reminders": false,
    "marketing": false
  }
}
```

Response 200:

```json
{
  "preferences_updated": true,
  "effective_immediately": true,

  "summary": {
    "total_enabled": 3,
    "immediate_notifications": ["Anomaly detected", "Large transaction"],
    "batched_notifications": ["Daily digest at 8am", "Weekly digest Sunday 6pm"]
  }
}
```

---

**GET /api/v1/notifications**

Gets notifications with filtering.

Query parameters:

- status: enum (UNREAD, READ, ARCHIVED)
- priority: enum (optional filter)
- from_date: ISO date (optional)
- limit: integer (default 50)

Response 200:

```json
{
  "notifications": [
    {
      "id": "uuid",
      "priority": "IMMEDIATE",
      "category": "ANOMALY_DETECTED",

      "title": "Unusual transaction detected",
      "message": "A transaction of 15,000 at 11:45pm is unusual for you",

      "data": {
        "transaction_id": "uuid",
        "amount": "15000.00",
        "confidence": 92
      },

      "actions": [
        {
          "action": "REVIEW_TRANSACTION",
          "label": "Review Transaction",
          "url": "/transactions/uuid"
        },
        {
          "action": "MARK_SAFE",
          "label": "Mark as Safe"
        }
      ],

      "channels_sent": ["EMAIL", "IN_APP"],
      "created_at": "2024-01-20T23:50:00Z",
      "read_at": null,
      "status": "UNREAD"
    }
  ],

  "summary": {
    "total": 15,
    "unread": 5,
    "by_priority": {
      "IMMEDIATE": 1,
      "IMPORTANT": 4,
      "INFORMATIONAL": 8,
      "LOW": 2
    }
  }
}
```

---

### Database Schema

**Table: notifications**

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  priority VARCHAR(20) CHECK (priority IN (
    'IMMEDIATE', 'IMPORTANT', 'INFORMATIONAL', 'LOW'
  )),

  category VARCHAR(50) NOT NULL,

  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,

  -- Contextual data
  data JSONB,

  -- Actions
  actions JSONB,

  -- Delivery
  channels_sent TEXT[],
  sent_at TIMESTAMP WITH TIME ZONE,

  -- User interaction
  status VARCHAR(20) DEFAULT 'UNREAD' CHECK (status IN (
    'UNREAD', 'READ', 'ARCHIVED', 'DISMISSED'
  )),
  read_at TIMESTAMP WITH TIME ZONE,
  acted_on BOOLEAN DEFAULT FALSE,
  action_taken VARCHAR(100),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

---

**Table: notification_preferences**

```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Priority enablement
  enabled_priorities TEXT[] DEFAULT ARRAY['IMMEDIATE', 'IMPORTANT', 'INFORMATIONAL'],

  -- Channel mapping
  channel_config JSONB NOT NULL,

  -- Digest settings
  daily_digest_time TIME,
  weekly_digest_day VARCHAR(10),
  weekly_digest_time TIME,

  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  emergency_override BOOLEAN DEFAULT TRUE,

  -- Category preferences
  category_preferences JSONB NOT NULL,

  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_user_prefs UNIQUE (user_id)
);
```

---

## Test Plan

### Unit Tests

**Rule Matching:**

- Condition evaluation (CONTAINS, EQUALS, GREATER_THAN, etc.)
- Multiple conditions (AND/OR logic)
- Priority ordering
- Conflict resolution (FIRST_MATCH vs STACK_ALL)

**Dry-Run Simulation:**

- Historical transaction matching
- Impact calculation
- Sample generation

**Prediction Algorithms:**

- Moving average calculation
- Seasonal adjustment
- Confidence scoring
- Range estimation (low/high/most likely)

**Anomaly Detection:**

- Statistical outlier detection (amount, time, merchant)
- Pattern deviation scoring
- Confidence calculation

**Notification Batching:**

- Priority-based batching
- Quiet hours enforcement
- Digest assembly
- Channel selection

**Target: 90%+ coverage on rule and prediction logic**

### Integration Tests

**Rule Lifecycle:**

1. Create rule in testing mode
2. Run dry-run on 30 days history
3. Review results
4. Enable rule
5. Process new transaction (rule applies)
6. Verify action taken
7. User overrides rule action
8. Override recorded in audit trail

**Prediction with Feedback:**

1. Generate spending prediction
2. Month completes
3. Compare actual vs predicted
4. Calculate accuracy
5. User provides feedback
6. Model accuracy updated
7. Next prediction uses updated model

**Notification Flow:**

1. Anomaly detected (immediate)
2. Notification created with IMMEDIATE priority
3. Sent via configured channels (email, in-app)
4. User reads notification
5. User takes action (mark safe)
6. Notification marked as acted upon

**Rule Versioning:**

1. Create rule v1, enable
2. 10 transactions processed with v1
3. Update rule (creates v2)
4. v2 tested in dry-run
5. v2 enabled
6. 5 transactions processed with v2
7. View rule history showing both versions
8. View transaction showing which version was applied

### End-to-End Tests

**Auto-Categorization Journey:**

1. User creates Naivas auto-categorization rule
2. Tests against last 30 days
3. Sees 12 matches
4. Approves and enables
5. New Naivas transaction occurs
6. System auto-categorizes
7. User reviews and confirms
8. Later, user refines rule to exclude amounts >50K
9. Tests refinement
10. Enables updated rule
11. Larger transaction NOT auto-categorized (as expected)

**Anomaly to Investigation:**

1. Large unusual transaction at midnight
2. System detects anomaly (92% confidence)
3. Immediate notification sent
4. User reviews transaction
5. Confirms legitimate (bulk purchase)
6. Marks as safe
7. System learns (future bulk purchases less anomalous)
8. Anomaly detection improves

---

## Deliverables Checklist

- [ ] Rule engine with condition/action builder
- [ ] Dry-run testing mode
- [ ] Rule versioning system
- [ ] Rule application audit trail
- [ ] Priority and conflict resolution
- [ ] Spending prediction with confidence
- [ ] Anomaly detection with scoring
- [ ] Prediction feedback loop
- [ ] Model performance tracking
- [ ] Notification creation and delivery
- [ ] Priority-based batching
- [ ] Quiet hours and preferences
- [ ] Multi-channel support
- [ ] Unit tests (90%+ rule/prediction logic)
- [ ] Integration tests (all flows)
- [ ] API documentation updated

---

## Next Steps

After Phase 4 completion, proceed to **Phase 5: Reconciliation, Export, and Production Readiness** to finalize the application for deployment.
