# Ledger API Testing Guide

## ✅ What We Built

The **Core Ledger Engine** - a double-entry accounting system that:

- Creates accounts (bank, M-Pesa, income, expense)
- Records transactions with automatic balance validation
- Ensures debits always equal credits (accounting rule)
- Provides real-time account balances

---

## 🚀 API Endpoints

Base URL: `https://fintracker-y76x.onrender.com/api/v1`

### Authentication Required

All ledger endpoints require authentication. First, login to get access token:

```bash
# Login
curl -X POST 'https://fintracker-y76x.onrender.com/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email":"production-test@example.com","password":"TestPass123@"}'
```

Save the `accessToken` from response.

---

## 📋 Test Scenario: Record a Salary Payment

Let's simulate receiving a salary of KES 100,000 into your M-Pesa account.

### Step 1: Create Accounts

First, create the accounts we need for double-entry bookkeeping.

#### Create M-Pesa Account (ASSET)

```bash
curl -X POST 'https://fintracker-y76x.onrender.com/api/v1/ledger/accounts' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "M-Pesa Account",
    "type": "ASSET",
    "subtype": "MPESA",
    "description": "My M-Pesa wallet"
  }'
```

**Expected Response**:

```json
{
  "success": true,
  "account": {
    "id": "uuid-1234...",
    "name": "M-Pesa Account",
    "type": "ASSET",
    "subtype": "MPESA",
    "currency": "KES",
    "is_active": true
  }
}
```

Save the `id` as `MPESA_ACCOUNT_ID`.

#### Create Salary Income Account (INCOME)

```bash
curl -X POST 'https://fintracker-y76x.onrender.com/api/v1/ledger/accounts' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Salary Income",
    "type": "INCOME",
    "subtype": "SALARY",
    "description": "Monthly salary"
  }'
```

Save the `id` as `SALARY_ACCOUNT_ID`.

---

### Step 2: Record Salary Transaction

Now record a salary payment of KES 100,000.

**Double-entry accounting**:

- **DEBIT** M-Pesa (Asset increases) = +100,000
- **CREDIT** Salary Income (Income increases) = +100,000

```bash
curl -X POST 'https://fintracker-y76x.onrender.com/api/v1/ledger/transactions' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "description": "January 2026 Salary",
    "transaction_date": "2026-01-07",
    "notes": "Monthly salary payment",
    "entries": [
      {
        "account_id": "MPESA_ACCOUNT_ID",
        "entry_type": "DEBIT",
        "amount": 100000,
        "description": "Salary received"
      },
      {
        "account_id": "SALARY_ACCOUNT_ID",
        "entry_type": "CREDIT",
        "amount": 100000,
        "description": "Salary earned"
      }
    ]
  }'
```

**Expected Response**:

```json
{
  "success": true,
  "transaction": {
    "id": "txn-uuid...",
    "description": "January 2026 Salary",
    "transaction_date": "2026-01-07",
    "status": "POSTED",
    "posted_at": "2026-01-07T...",
    "entries": [
      {
        "account_id": "...",
        "account_name": "M-Pesa Account",
        "entry_type": "DEBIT",
        "amount": "100000.0000"
      },
      {
        "account_id": "...",
        "account_name": "Salary Income",
        "entry_type": "CREDIT",
        "amount": "100000.0000"
      }
    ]
  }
}
```

---

### Step 3: Check Account Balance

```bash
# Check M-Pesa balance
curl -X GET 'https://fintracker-y76x.onrender.com/api/v1/ledger/accounts/MPESA_ACCOUNT_ID/balance' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

**Expected Response**:

```json
{
  "success": true,
  "balance": {
    "account_id": "...",
    "account_name": "M-Pesa Account",
    "account_type": "ASSET",
    "current_balance": "100000.0000",
    "entry_count": 1,
    "last_transaction_date": "2026-01-07"
  }
}
```

---

## 🧪 Test Scenario 2: Pay Rent

Record paying rent of KES 30,000 from M-Pesa.

### Step 1: Create Rent Expense Account

```bash
curl -X POST 'https://fintracker-y76x.onrender.com/api/v1/ledger/accounts' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Rent Expense",
    "type": "EXPENSE",
    "subtype": "HOUSING",
    "description": "Monthly rent payments"
  }'
```

Save the `id` as `RENT_ACCOUNT_ID`.

### Step 2: Record Rent Payment

**Double-entry accounting**:

- **CREDIT** M-Pesa (Asset decreases) = -30,000
- **DEBIT** Rent Expense (Expense increases) = +30,000

```bash
curl -X POST 'https://fintracker-y76x.onrender.com/api/v1/ledger/transactions' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "description": "January 2026 Rent Payment",
    "transaction_date": "2026-01-07",
    "entries": [
      {
        "account_id": "RENT_ACCOUNT_ID",
        "entry_type": "DEBIT",
        "amount": 30000,
        "description": "Rent paid"
      },
      {
        "account_id": "MPESA_ACCOUNT_ID",
        "entry_type": "CREDIT",
        "amount": 30000,
        "description": "Rent payment via M-Pesa"
      }
    ]
  }'
```

### Step 3: Check Updated Balance

```bash
curl -X GET 'https://fintracker-y76x.onrender.com/api/v1/ledger/accounts/MPESA_ACCOUNT_ID/balance' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

**Expected**: `current_balance` should be `70000.0000` (100,000 - 30,000)

---

## 📊 List All Accounts

```bash
curl -X GET 'https://fintracker-y76x.onrender.com/api/v1/ledger/accounts' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

**Filter by type**:

```bash
# Get only ASSET accounts
curl -X GET 'https://fintracker-y76x.onrender.com/api/v1/ledger/accounts?type=ASSET' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

---

## 📜 List All Transactions

```bash
curl -X GET 'https://fintracker-y76x.onrender.com/api/v1/ledger/transactions' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

**Filter by date range**:

```bash
curl -X GET 'https://fintracker-y76x.onrender.com/api/v1/ledger/transactions?from_date=2026-01-01&to_date=2026-01-31' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

---

## 🚫 Test Validation: Unbalanced Transaction

Try creating a transaction where debits != credits:

```bash
curl -X POST 'https://fintracker-y76x.onrender.com/api/v1/ledger/transactions' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "description": "Invalid Transaction",
    "transaction_date": "2026-01-07",
    "entries": [
      {
        "account_id": "MPESA_ACCOUNT_ID",
        "entry_type": "DEBIT",
        "amount": 100000
      },
      {
        "account_id": "SALARY_ACCOUNT_ID",
        "entry_type": "CREDIT",
        "amount": 50000
      }
    ]
  }'
```

**Expected Error**:

```json
{
  "error": "Transaction validation failed: Transaction not balanced: Debits (100000.0000) != Credits (50000.0000)"
}
```

✅ **This proves the double-entry validation works!**

---

## 🔄 Void a Transaction

If you need to cancel a transaction:

```bash
curl -X POST 'https://fintracker-y76x.onrender.com/api/v1/ledger/transactions/TRANSACTION_ID/void' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "reason": "Payment cancelled"
  }'
```

---

## 🎯 Quick Test Script

Save this as `test_ledger.sh`:

```bash
#!/bin/bash

API_URL="https://fintracker-y76x.onrender.com/api/v1"

# 1. Login
echo "1. Logging in..."
TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"production-test@example.com","password":"TestPass123@"}' \
  | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')

echo "Token: $TOKEN"

# 2. Create M-Pesa account
echo -e "\n2. Creating M-Pesa account..."
MPESA_ID=$(curl -s -X POST "$API_URL/ledger/accounts" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"M-Pesa","type":"ASSET","subtype":"MPESA"}' \
  | grep -o '"id":"[^"]*' | sed 's/"id":"//')

echo "M-Pesa Account ID: $MPESA_ID"

# 3. Create Salary account
echo -e "\n3. Creating Salary account..."
SALARY_ID=$(curl -s -X POST "$API_URL/ledger/accounts" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Salary","type":"INCOME","subtype":"SALARY"}' \
  | grep -o '"id":"[^"]*' | sed 's/"id":"//')

echo "Salary Account ID: $SALARY_ID"

# 4. Record salary transaction
echo -e "\n4. Recording salary transaction..."
curl -s -X POST "$API_URL/ledger/transactions" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{
    \"description\":\"Test Salary\",
    \"transaction_date\":\"2026-01-07\",
    \"entries\":[
      {\"account_id\":\"$MPESA_ID\",\"entry_type\":\"DEBIT\",\"amount\":100000},
      {\"account_id\":\"$SALARY_ID\",\"entry_type\":\"CREDIT\",\"amount\":100000}
    ]
  }" | python3 -m json.tool

# 5. Check balance
echo -e "\n5. Checking M-Pesa balance..."
curl -s -X GET "$API_URL/ledger/accounts/$MPESA_ID/balance" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

Run with: `bash test_ledger.sh`

---

## ✅ Success Criteria

After testing, you should see:

1. ✅ Accounts created successfully
2. ✅ Transactions posted with status "POSTED"
3. ✅ Account balances calculated correctly
4. ✅ Unbalanced transactions rejected with error
5. ✅ List endpoints return data
6. ✅ Double-entry accounting validated

---

## 🎉 What's Next?

Now that the ledger is working, we can build on top of it:

- **Phase 2**: Income & PAYE calculator
- **Phase 2**: Expense tracking with categories
- **Phase 2**: Budgets module
- **Phase 3**: Goals and savings
- **Phase 3**: Investment portfolio tracking

The double-entry ledger provides the solid foundation for all financial tracking! 🚀
