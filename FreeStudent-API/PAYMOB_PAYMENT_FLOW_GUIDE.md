# Paymob Payment Flow - Postman Collection Guide

This guide explains how to use the Postman collection to test the complete Paymob payment flow for subscription upgrades.

## 📋 Prerequisites

1. **Import the Collection**
   - Open Postman
   - Click "Import" → Select `Paymob_Payment_Flow.postman_collection.json`
   - The collection will appear in your workspace

2. **Set Environment Variables**
   - Create a new environment or use the default
   - Set the following variables:
     ```
     base_url = http://localhost:8000 (or your API URL)
     auth_token = (your JWT token from login)
     intention_id = (will be auto-set after Step 1)
     transaction_id = (will be auto-set after Step 1)
     ```

3. **Get Authentication Token**
   - First, login as a student user to get the JWT token
   - Copy the token and set it in the `auth_token` environment variable

---

## 🔄 Complete Payment Flow

### **Step 1: Initiate Subscription Upgrade**

**Request:** `POST /api/v1/subscriptions/upgrade`

**Description:**
- Creates a premium subscription (status: pending)
- Creates a transaction (status: pending)
- Creates Paymob payment intention
- Returns payment URL and intention ID

**What to do:**
1. Run the request "Upgrade to Premium (EGP)"
2. The response will include:
   - `paymentUrl`: URL to redirect user to Paymob
   - `intentionId`: Save this! (automatically saved to `intention_id` variable)
   - `transaction`: Transaction ID

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "paymentUrl": "https://accept.paymob.com/payment/...",
    "intentionId": "pi_test_9399040f087b41d0b8c7ac37a2d56c5a",
    "transaction": "...",
    "clientSecret": "..."
  }
}
```

**Note:** In a real scenario, the user would be redirected to `paymentUrl` to complete payment on Paymob.

---

### **Step 2A: Paymob Webhook (PRIMARY - Automatic)**

**Request:** `POST /api/v1/paymob/webhook`

**Description:**
- This is called **automatically by Paymob** when payment is processed
- Updates transaction status to 'completed' if payment successful
- Upgrades subscription to premium
- Updates user profile to premium tier

**What to do:**
1. Use "Simulate Paymob Webhook - Success" to test
2. **Important:** Replace `{{intention_id}}` in the request body with the actual intention ID from Step 1
3. Update the `order.id` field in the webhook payload:
   ```json
   {
     "order": {
       "id": "pi_test_9399040f087b41d0b8c7ac37a2d56c5a"  // Use your intention_id
     }
   }
   ```

**What happens:**
- ✅ Transaction status → `'completed'`
- ✅ `isPaid` → `true`
- ✅ Subscription → `plan: 'premium'`, `status: 'active'`
- ✅ User profile → `subscriptionTier: 'premium'`
- ✅ Notification created

**Expected Response:**
```json
{
  "status": "success",
  "message": "Webhook processed successfully"
}
```

---

### **Step 2B: Success Redirect (FALLBACK)**

**Request:** `GET /api/v1/paymob/success?id={intention_id}`

**Description:**
- This is called when Paymob redirects the user back after payment
- Acts as a fallback if webhook hasn't been processed yet
- Does the same updates as the webhook

**What to do:**
1. Run "Payment Success Redirect"
2. The `intention_id` variable should already be set from Step 1
3. This will redirect to your frontend URL

**What happens:**
- ✅ Transaction status → `'completed'`
- ✅ Subscription → `plan: 'premium'`, `status: 'active'`
- ✅ User profile → `subscriptionTier: 'premium'`
- ✅ Redirects to frontend

**Expected Response:**
- HTTP 302 Redirect to: `${FRONTEND_URL}/payment/processing?id=${intention_id}`

---

### **Step 3: Check Payment Status**

**Request:** `GET /api/v1/paymob/payment-status?id={intention_id}`

**Description:**
- Frontend polls this endpoint to check if payment was successful
- Returns `isPaid: true` if payment completed
- Returns payment status from database

**What to do:**
1. Run "Get Payment Status"
2. The `intention_id` variable should already be set from Step 1
3. Check the `isPaid` field in the response

**Expected Response (Success):**
```json
{
  "status": "success",
  "data": {
    "intentionId": "pi_test_9399040f087b41d0b8c7ac37a2d56c5a",
    "paymentStatus": "PROCESSED",
    "isPaid": true,
    "transactionId": "...",
    "amount": 100,
    "currency": "EGP",
    "type": "subscription_payment",
    "completedAt": 1234567890
  }
}
```

**Expected Response (Pending):**
```json
{
  "status": "success",
  "data": {
    "paymentStatus": "PENDING",
    "isPaid": false,
    ...
  }
}
```

---

## 🔍 Testing the Complete Flow

### **Option 1: Test with Webhook (Recommended)**

1. **Step 1:** Run "Upgrade to Premium (EGP)"
   - Copy the `intentionId` from response
   - Set it in `intention_id` variable

2. **Step 2A:** Run "Simulate Paymob Webhook - Success"
   - Update `order.id` in request body with your `intention_id`
   - This simulates Paymob calling your webhook

3. **Step 3:** Run "Get Payment Status"
   - Should return `isPaid: true`
   - Payment status should be `PROCESSED`

### **Option 2: Test with Success Redirect**

1. **Step 1:** Run "Upgrade to Premium (EGP)"
   - Copy the `intentionId` from response

2. **Step 2B:** Run "Payment Success Redirect"
   - Uses `intention_id` from Step 1
   - Updates transaction and subscription

3. **Step 3:** Run "Get Payment Status"
   - Should return `isPaid: true`

---

## 📊 Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: User Initiates Upgrade                             │
│ POST /api/v1/subscriptions/upgrade                        │
│ → Creates subscription (pending)                           │
│ → Creates transaction (pending)                             │
│ → Creates Paymob payment intention                          │
│ → Returns paymentUrl + intentionId                         │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ User completes payment on Paymob                            │
└─────────────────────────────────────────────────────────────┘
                        ↓
        ┌───────────────────────┐
        │                       │
        ↓                       ↓
┌──────────────────┐   ┌──────────────────┐
│ Step 2A: Webhook │   │ Step 2B: Success │
│ (PRIMARY)        │   │ (FALLBACK)       │
│                  │   │                  │
│ POST /webhook    │   │ GET /success     │
│                  │   │                  │
│ ✅ isPaid = true │   │ ✅ isPaid = true│
│ ✅ Premium       │   │ ✅ Premium       │
└──────────────────┘   └──────────────────┘
        │                       │
        └───────────┬───────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Frontend Checks Status                              │
│ GET /api/v1/paymob/payment-status?id={intention_id}         │
│ → Returns isPaid: true                                      │
│ → Shows success message                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Points

1. **Webhook is PRIMARY:** Paymob automatically calls the webhook when payment is processed
2. **Success Redirect is FALLBACK:** User is redirected here after payment (may happen before webhook)
3. **Both update the same data:** Either endpoint can complete the upgrade
4. **isPaid is derived:** `isPaid = transaction.status === 'completed'`
5. **Frontend should poll:** After redirect, frontend should poll `/payment-status` to confirm

---

## 🐛 Troubleshooting

### Issue: "Transaction not found"
- **Solution:** Make sure you're using the correct `intention_id` from Step 1
- Check that the intention ID is set in the environment variable

### Issue: "isPaid is still false"
- **Solution:** Make sure you've run Step 2A (webhook) or Step 2B (success redirect)
- Check the transaction status in the database

### Issue: "Webhook not working"
- **Solution:** 
  - Verify the webhook URL is correct in Paymob dashboard
  - Check that the `order.id` in webhook payload matches your `intention_id`
  - Ensure `success: true` and `pending: false` in webhook payload

### Issue: "Authentication required"
- **Solution:** 
  - Make sure `auth_token` is set in environment variables
  - Login first to get a valid JWT token
  - Note: Webhook and success endpoints don't require authentication

---

## 📝 Environment Variables

Make sure these are set in your Postman environment:

| Variable | Description | Example |
|----------|-------------|---------|
| `base_url` | Your API base URL | `http://localhost:8000` |
| `auth_token` | JWT token from login | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `intention_id` | Payment intention ID | `pi_test_9399040f087b41d0b8c7ac37a2d56c5a` |
| `transaction_id` | Transaction ID | Auto-set from Step 1 |

---

## ✅ Verification Checklist

After completing the flow, verify:

- [ ] Transaction status is `'completed'`
- [ ] `isPaid` is `true` in payment status response
- [ ] Subscription `plan` is `'premium'`
- [ ] Subscription `status` is `'active'`
- [ ] User `studentProfile.subscriptionTier` is `'premium'`
- [ ] Notification was created
- [ ] Frontend receives `isPaid: true` when polling

---

## 📚 Additional Resources

- **Paymob API Documentation:** [Paymob Docs](https://docs.paymob.com)
- **Collection File:** `Paymob_Payment_Flow.postman_collection.json`
- **API Routes:** See `routers/paymobRouter.js`
- **Controller Logic:** See `controllers/paymobController.js`

---

**Happy Testing! 🚀**

