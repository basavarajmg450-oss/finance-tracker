# RESTful API Documentation

Base URL: `http://localhost:5000/api`

## Authentication Standard
- **Header**: `Authorization: Bearer <jwt_token>`
- **Cookie**: `token=<jwt_token>; HttpOnly; SameSite=Lax`

All private endpoints require valid JWT authentication. Cross-user isolation is enforced server-side.

---

## 1. Authentication Endpoints

### `POST /api/auth/register`
Creates a new user account.
- **Rate Limit**: 30 req / 15 min
- **Request Body**:
  ```json
  {
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "password": "Password123!",
    "preferredCurrency": "USD"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "message": "Registration successful",
    "token": "eyJhbGciOi...",
    "user": {
      "_id": "67a...",
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "preferredCurrency": "USD"
    }
  }
  ```

### `POST /api/auth/login`
Authenticates user credentials.
- **Request Body**:
  ```json
  {
    "email": "alice@example.com",
    "password": "Password123!"
  }
  ```
- **Response `200 OK`**: Returns token and user object.

### `GET /api/auth/me`
Fetches profile of currently authenticated user.

### `POST /api/auth/logout`
Clears session token cookie.

---

## 2. Transactions API

### `GET /api/transactions`
List transactions with query filters, search, and pagination.
- **Query Params**:
  - `page` (number, default: 1)
  - `limit` (number, default: 10)
  - `type` ('income' | 'expense')
  - `category` (string)
  - `paymentMethod` (string)
  - `startDate` (ISO Date)
  - `endDate` (ISO Date)
  - `search` (keyword search in description)
  - `sortBy` ('transactionDate' | 'amount')
  - `sortOrder` ('asc' | 'desc')

### `POST /api/transactions`
Creates a new transaction.
- **Request Body**:
  ```json
  {
    "type": "expense",
    "amount": 45.50,
    "category": "Food",
    "description": "Weekly grocery supermarket",
    "transactionDate": "2026-10-09",
    "paymentMethod": "Credit Card",
    "notes": "Organic fruits and dairy"
  }
  ```

### `GET /api/transactions/:id`
Fetch single transaction by ID (enforcing user ownership).

### `PATCH /api/transactions/:id`
Update transaction details.

### `DELETE /api/transactions/:id`
Delete transaction and recalculate balances.

---

## 3. Dashboard & Analytics API

### `GET /api/dashboard/summary`
Returns live financial telemetry and smart insights.
- **Query Params**: `period` ('this_month' | 'last_month' | 'last_3_months' | 'this_year' | 'all')
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "totalIncome": 4500.00,
      "totalExpenses": 1820.50,
      "netCashFlow": 2679.50,
      "currentBalance": 12850.00,
      "savingsRate": 59.54,
      "budgetSummary": {
        "totalBudgeted": 2200.00,
        "totalSpent": 1820.50,
        "remaining": 379.50,
        "usagePercent": 82.75
      },
      "insights": [ ... ],
      "recentTransactions": [ ... ]
    }
  }
  ```

### `GET /api/analytics/overview`
Aggregated breakdown of categories, daily spending average, and 6-month historical trends.

### `GET /api/analytics/category-breakdown`
Returns spending percentage, total amount, and transaction counts per category.

### `GET /api/analytics/monthly-trends`
Returns monthly bucketed income, expense, and savings rate.

---

## 4. Budgets API

### `GET /api/budgets`
- **Query Params**: `month` (1-12), `year` (YYYY)
- Returns allocated amount, actual spent, remaining, and `isNearLimit` (80%), `isExceeded` (100%) flags.

### `POST /api/budgets`
- **Request Body**:
  ```json
  {
    "category": "Food",
    "amount": 500,
    "month": 10,
    "year": 2026
  }
  ```

---

## 5. Goals API

### `GET /api/goals`
List savings goals with progress percentage and remaining amounts.

### `POST /api/goals`
Create new savings target.

### `POST /api/goals/:id/contributions`
Record atomic deposit using `$inc` operator.
- **Request Body**:
  ```json
  {
    "amount": 200,
    "contributionDate": "2026-10-09",
    "notes": "Monthly payroll allocation"
  }
  ```

---

## 6. Recurring Automation API

### `GET /api/recurring-transactions`
List active recurring rules.

### `POST /api/recurring-transactions`
Create automated schedule.

### `POST /api/recurring-transactions/trigger-process`
Execute scheduler on-demand with idempotency deduplication guarantee.

---

## 7. Reports & Export API

### `GET /api/reports/summary`
Comprehensive financial statement for specified period.

### `GET /api/reports/export/csv`
Streams sanitized CSV with RFC 4180 escaping and Formula Injection protection (`'`, `=`, `+`, `-`, `@`).
