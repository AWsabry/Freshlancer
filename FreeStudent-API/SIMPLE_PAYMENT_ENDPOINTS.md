# Simple Payment Endpoints

Two endpoints to handle the complete payment flow:

## 1. Create Payment (Subscription Upgrade)

**Endpoint:** `POST /api/v1/subscriptions/upgrade`

**Authentication:** Required (Student role)

**Request Body:**
```json
{
  "currency": "EGP",
  "billingCycle": "monthly",
  "autoRenew": true,
  "paymentMethod": "credit_card",
  "billingData": {
    "firstName": "Ahmed",
    "lastName": "Mohamed",
    "email": "ahmed@example.com",
    "phoneNumber": "+201234567890",
    "apartment": "Apt 5B",
    "floor": "3rd Floor",
    "street": "123 Main Street",
    "building": "Building A",
    "country": "EGY",
    "state": "Cairo"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "subscription": {...},
    "transaction": "...",
    "paymentUrl": "https://accept.paymob.com/payment/...",
    "intentionId": "pi_test_9399040f087b41d0b8c7ac37a2d56c5a",
    "clientSecret": "...",
    "message": "Please complete payment with Paymob"
  }
}
```

**What it does:**
- Creates/updates subscription with `status: 'pending'` and `plan: 'premium'`
- Creates transaction with `status: 'pending'` and `type: 'subscription_payment'`
- Creates Paymob payment intention
- Returns `paymentUrl` to redirect user to Paymob

---

## 2. Complete Payment Success (Updates Everything)

**Endpoint:** `GET /api/v1/paymob/complete-success?id={intentionId}`

**Authentication:** Not required (public endpoint)

**Query Parameters:**
- `id` (required): Payment intention ID from Step 1

**Example:**
```
GET /api/v1/paymob/complete-success?id=pi_test_9399040f087b41d0b8c7ac37a2d56c5a
```

**Response:**
```json
{
  "status": "success",
  "message": "Payment processed successfully",
  "data": {
    "intentionId": "pi_test_9399040f087b41d0b8c7ac37a2d56c5a",
    "transactionId": "...",
    "isPaid": true,
    "paymentStatus": "PROCESSED",
    "amount": 100,
    "currency": "EGP",
    "type": "subscription_payment",
    "completedAt": 1234567890,
    "user": {
      "id": "...",
      "name": "Ahmed Mohamed",
      "email": "ahmed@example.com",
      "subscriptionTier": "premium"
    }
  }
}
```

**What it does:**
1. ✅ Finds transaction by `intentionId`
2. ✅ Updates `transaction.status = 'completed'`
3. ✅ Sets `isPaid = true`
4. ✅ Updates subscription: `plan: 'premium'`, `status: 'active'`
5. ✅ Updates user: `studentProfile.subscriptionTier = 'premium'`
6. ✅ Creates notification
7. ✅ Returns complete success response

---

## Complete Flow

```
1. POST /api/v1/subscriptions/upgrade
   ↓
   User redirected to Paymob payment page
   ↓
   User completes payment
   ↓
2. GET /api/v1/paymob/complete-success?id={intentionId}
   ↓
   ✅ Everything updated (transaction, subscription, user)
   ✅ Returns success with isPaid: true
```

---

## Usage Example

### Step 1: Create Payment
```bash
curl -X POST http://localhost:8000/api/v1/subscriptions/upgrade \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currency": "EGP",
    "billingCycle": "monthly"
  }'
```

**Response includes:**
- `paymentUrl`: Redirect user here
- `intentionId`: Save this for Step 2

### Step 2: After Payment Success
```bash
curl -X GET "http://localhost:8000/api/v1/paymob/complete-success?id=pi_test_9399040f087b41d0b8c7ac37a2d56c5a"
```

**Response confirms:**
- `isPaid: true`
- User upgraded to premium
- All updates completed

---

## Notes

- **Step 1** requires authentication (Student role)
- **Step 2** is public (no authentication required)
- Step 2 can be called by:
  - Frontend after user returns from Paymob
  - Paymob webhook (if configured)
  - Manual verification

---

## Error Responses

### Step 2 - Transaction Not Found
```json
{
  "status": "fail",
  "message": "Transaction not found"
}
```

### Step 2 - User Not Found
```json
{
  "status": "fail",
  "message": "User not found"
}
```

### Step 2 - Missing Intention ID
```json
{
  "status": "fail",
  "message": "Payment intention ID is required"
}
```

