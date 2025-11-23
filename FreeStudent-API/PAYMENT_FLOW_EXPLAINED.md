# Payment Flow Documentation

## Overview
This document explains how the Paymob payment integration works and the separation between checking payment status and actually upgrading subscriptions.

## Key Endpoints

### 1. `/api/v1/subscriptions/upgrade` (POST)
**Purpose**: Create a payment intention and return payment URL

**What it does**:
- Creates/updates subscription record (status: `pending`)
- Creates transaction record (status: `pending`)
- Calls Paymob API to create payment intention
- Stores `intentionId` in transaction metadata
- Returns `paymentUrl` and `intentionId` to frontend

**Response**:
```json
{
  "status": "success",
  "data": {
    "subscription": {...},
    "transaction": {...},
    "paymentUrl": "https://accept.paymob.com/...",
    "intentionId": "pi_test_xxx",
    "clientSecret": "xxx"
  }
}
```

---

### 2. `/api/v1/paymob/success` (GET) - PUBLIC
**Purpose**: Paymob redirects here after successful payment (browser redirect)

**What it does**:
- Receives `intentionId` from Paymob redirect
- Finds transaction by `intentionId`
- Updates transaction status to `completed`
- **Does NOT upgrade subscription** (this is key!)
- Redirects to frontend: `/payment/success?id={intentionId}`

**Important**: This endpoint only marks the transaction as completed. The actual subscription upgrade happens later.

---

### 3. `/api/v1/paymob/payment-status` (GET) - PUBLIC
**Purpose**: Check payment status (READ-ONLY)

**What it does**:
- Receives `intentionId` as query parameter
- Finds transaction by `intentionId`
- Returns payment status from database
- **Does NOT modify anything**
- **Does NOT upgrade subscription**

**Response**:
```json
{
  "status": "success",
  "data": {
    "intentionId": "pi_test_xxx",
    "transactionId": "xxx",
    "paymentStatus": "PROCESSED",
    "isPaid": true,
    "amount": 200,
    "currency": "EGP",
    "type": "subscription_payment",
    "completedAt": "2025-01-15T10:00:00.000Z",
    "user": {...}
  }
}
```

**Use case**: Frontend can call this endpoint to check if payment is completed without triggering any upgrades.

---

### 4. `/api/v1/paymob/complete-success` (GET) - PUBLIC
**Purpose**: Actually upgrade subscription/package (ONE-TIME ACTION)

**What it does**:
- Receives `intentionId` as query parameter
- Finds transaction by `intentionId`
- Updates transaction status to `completed` (if not already)
- **Upgrades subscription to premium** OR **adds points to client account**
- Updates user profile
- Creates success notification
- Returns success response

**For subscription payments**:
- Sets `subscription.plan = 'premium'`
- Sets `subscription.status = 'active'`
- Sets `user.studentProfile.subscriptionTier = 'premium'`
- Sets expiry date to 1 month from now
- Creates notification

**For package purchases**:
- Sets `package.paymentStatus = 'completed'`
- Adds points to `user.clientProfile.pointsRemaining`
- Creates notification

**Response**:
```json
{
  "status": "success",
  "message": "Payment processed successfully",
  "data": {
    "intentionId": "pi_test_xxx",
    "transactionId": "xxx",
    "isPaid": true,
    "paymentStatus": "PROCESSED",
    "amount": 200,
    "currency": "EGP",
    "type": "subscription_payment",
    "completedAt": "2025-01-15T10:00:00.000Z",
    "user": {
      "id": "xxx",
      "name": "John Doe",
      "email": "john@example.com",
      "subscriptionTier": "premium"
    }
  }
}
```

**Important**: This endpoint should only be called ONCE per payment. It's idempotent (safe to call multiple times) but should only upgrade the first time.

---

### 5. `/api/v1/paymob/webhook` (POST) - PUBLIC
**Purpose**: Paymob sends webhook notifications here (server-to-server)

**What it does**:
- Receives webhook data from Paymob
- Processes webhook payload
- Updates transaction status based on webhook data
- Upgrades subscription/package if payment is successful
- Logs detailed payment information

**Note**: Webhooks are optional. The main flow uses redirects.

---

## Complete Payment Flow

```
1. Frontend calls /api/v1/subscriptions/upgrade
   └─> Returns: paymentUrl + intentionId
   └─> Transaction status: pending

2. Frontend redirects user to paymentUrl (Paymob payment page)

3. User completes payment on Paymob

4. Paymob redirects to /api/v1/paymob/success?id={intentionId}
   └─> Updates transaction to completed
   └─> Does NOT upgrade subscription yet
   └─> Redirects to /payment/success?id={intentionId}

5. Frontend PaymentSuccess.jsx receives intentionId
   └─> Shows "Processing Payment..." loading screen
   └─> Calls /api/v1/paymob/complete-success?id={intentionId}
   └─> This ACTUALLY upgrades the subscription
   └─> Shows success message
   └─> Auto-redirects to subscription page after 5 seconds
```

---

## Why This Separation?

### Problem
If you manually visit `/api/v1/paymob/payment-status?id=xxx`, you don't want to trigger a subscription upgrade just by checking the status.

### Solution
- **`/payment-status`**: Read-only status check (safe to call anytime)
- **`/complete-success`**: Actually performs the upgrade (called once by frontend after payment)

This separation ensures:
1. You can check payment status without side effects
2. Subscription upgrade only happens when explicitly triggered by frontend
3. Clear logging of when upgrade actually happens
4. Better control over the payment flow

---

## Testing the Flow

### 1. Create Payment
```bash
POST /api/v1/subscriptions/upgrade
Body: {
  "currency": "EGP",
  "billingCycle": "monthly"
}
```

### 2. Check Status (Read-Only)
```bash
GET /api/v1/paymob/payment-status?id=pi_test_xxx
# Safe to call multiple times, won't upgrade subscription
```

### 3. Complete Payment (Upgrade)
```bash
GET /api/v1/paymob/complete-success?id=pi_test_xxx
# This WILL upgrade the subscription
# Should only be called once per payment
```

---

## Console Logs

### When `/success` is called (Paymob redirect):
```
=== PAYMENT SUCCESS CALLBACK ===
Intention ID: pi_test_xxx
Transaction found: 67xxx
Transaction updated to completed
Payment verified by Paymob redirect - actual upgrade will happen when frontend calls /complete-success
```

### When `/complete-success` is called (Frontend):
```
=== COMPLETE PAYMENT SUCCESS ===
Timestamp: 2025-01-15T10:00:00.000Z
Intention ID: pi_test_xxx
✅ Transaction found: 67xxx
Transaction type: subscription_payment
Current status: completed

=== UPGRADING SUBSCRIPTION TO PREMIUM ===
Subscription found: 67xxx
Current plan: free
✅ Subscription upgraded to: premium
End date: 2025-02-15T10:00:00.000Z
Updating user studentProfile to premium
✅ User profile upgraded to premium
Expiry date: 2025-02-15T10:00:00.000Z
✅ Notification created
=== SUBSCRIPTION UPGRADE COMPLETE ===
```

---

## Frontend Components

### PaymentSuccess.jsx
When user lands on `/payment/success?id={intentionId}`:

1. Shows loading spinner: "Processing Payment..."
2. Calls `/complete-success?id={intentionId}`
3. Upgrades subscription on backend
4. Shows success message
5. Auto-redirects after 5 seconds

---

## Important Notes

1. **`/payment-status`** is READ-ONLY - safe to call anytime
2. **`/complete-success`** performs the actual upgrade - call once per payment
3. **`/success`** is the Paymob redirect endpoint - just marks transaction as completed
4. All Paymob callback endpoints are PUBLIC (no authentication required)
5. Frontend handles the final upgrade trigger via `/complete-success`
