# Controllers Documentation

## Overview
This document provides a comprehensive overview of all controllers created for the Freshlancer API, including endpoints, authentication requirements, and usage examples.

---

## Table of Contents
1. [StudentVerificationController](#1-studentverificationcontroller)
2. [SubscriptionController](#2-subscriptioncontroller)
3. [ClientPackageController](#3-clientpackagecontroller)
4. [ProfileViewController](#4-profileviewcontroller)
5. [ConversationController](#5-conversationcontroller)
6. [ContractController](#6-contractcontroller)
7. [NotificationController](#7-notificationcontroller)
8. [TransactionController](#8-transactioncontroller)
9. [ReviewController](#9-reviewcontroller)
10. [Summary Statistics](#summary-statistics)

---

## 1. StudentVerificationController

**File:** `controllers/studentVerificationController.js`

### Purpose
Handles student verification document uploads and admin approval workflow.

### Endpoints

#### Student Actions

##### Upload Document
```javascript
POST /api/v1/verifications/upload
Auth: Required (Student only)
```

**Request Body:**
```json
{
  "documentType": "student_id",
  "documentUrl": "https://storage.com/doc.pdf",
  "fileName": "student_id.pdf",
  "fileSize": 1024000,
  "institutionName": "Harvard University",
  "studentIdNumber": "H123456",
  "enrollmentYear": 2021,
  "expectedGraduationYear": 2025
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "verification": { ... }
  }
}
```

---

##### Get My Verifications
```javascript
GET /api/v1/verifications/me
Auth: Required (Student only)
```

**Response:**
```json
{
  "status": "success",
  "results": 2,
  "data": {
    "verifications": [ ... ]
  }
}
```

---

##### Get Verification Status
```javascript
GET /api/v1/verifications/status
Auth: Required (Student only)
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "verificationStatus": "verified",
    "isVerified": true,
    "latestVerification": { ... }
  }
}
```

---

#### Admin Actions

##### Get All Pending Verifications
```javascript
GET /api/v1/verifications/pending
Auth: Required (Admin only)
```

---

##### Get All Verifications
```javascript
GET /api/v1/verifications
Auth: Required (Admin only)
Query: ?status=pending&documentType=student_id
```

---

##### Approve Verification
```javascript
PATCH /api/v1/verifications/:id/approve
Auth: Required (Admin only)
```

**Request Body:**
```json
{
  "adminNotes": "Document verified successfully"
}
```

**Actions:**
- Updates verification status to 'approved'
- Updates user's verification status
- Sends notification to student

---

##### Reject Verification
```javascript
PATCH /api/v1/verifications/:id/reject
Auth: Required (Admin only)
```

**Request Body:**
```json
{
  "rejectionReason": "Document is not clear",
  "adminNotes": "Please re-upload a clear scan"
}
```

**Actions:**
- Updates verification status to 'rejected'
- Sends notification to student with reason

---

##### Get Verification Statistics
```javascript
GET /api/v1/verifications/stats
Auth: Required (Admin only)
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "total": 150,
    "stats": [
      { "_id": "pending", "count": 20 },
      { "_id": "approved", "count": 100 },
      { "_id": "rejected", "count": 30 }
    ]
  }
}
```

---

## 2. SubscriptionController

**File:** `controllers/subscriptionController.js`

### Purpose
Manages student subscription tiers (free/premium) and application limits.

### Endpoints

##### Get My Subscription
```javascript
GET /api/v1/subscriptions/me
Auth: Required (Student only)
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "subscription": {
      "plan": "free",
      "applicationsUsedThisMonth": 3,
      "applicationLimitPerMonth": 10,
      "limitResetDate": "2025-02-01T00:00:00.000Z"
    }
  }
}
```

**Auto-creates free subscription if none exists**

---

##### Check Application Limit
```javascript
GET /api/v1/subscriptions/check-limit
Auth: Required (Student only)
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "canApply": true,
    "reason": null,
    "currentUsage": 3,
    "limit": 10,
    "plan": "free",
    "resetDate": "2025-02-01T00:00:00.000Z"
  }
}
```

**Business Logic:**
- Auto-resets monthly limit if `limitResetDate` has passed
- Returns `canApply: false` if limit reached

---

##### Upgrade to Premium
```javascript
POST /api/v1/subscriptions/upgrade
Auth: Required (Student only)
```

**Request Body:**
```json
{
  "billingCycle": "monthly",
  "autoRenew": true,
  "paymentMethodId": "pm_123456",
  "paymentMethod": "credit_card",
  "skipPayment": false
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "subscription": { ... },
    "transaction": { ... },
    "message": "Subscription upgraded successfully"
  }
}
```

**Actions:**
- Creates/updates subscription to premium ($19.99/month)
- Creates transaction record
- Sets application limit to 999999 (unlimited)
- Sends notification

---

##### Cancel Subscription
```javascript
POST /api/v1/subscriptions/cancel
Auth: Required (Student only)
```

**Request Body:**
```json
{
  "reason": "Too expensive"
}
```

**Actions:**
- Cancels premium subscription
- Creates new free subscription
- Sends notification

---

##### Get Subscription History
```javascript
GET /api/v1/subscriptions/history
Auth: Required (Student only)
```

---

##### Get All Subscriptions (Admin)
```javascript
GET /api/v1/subscriptions
Auth: Required (Admin only)
Query: ?plan=premium&status=active
```

---

##### Get Subscription Statistics (Admin)
```javascript
GET /api/v1/subscriptions/stats
Auth: Required (Admin only)
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "total": 1000,
    "stats": [
      { "_id": "free", "count": 800, "totalRevenue": 0 },
      { "_id": "premium", "count": 200, "totalRevenue": 3998 }
    ]
  }
}
```

---

## 3. ClientPackageController

**File:** `controllers/clientPackageController.js`

### Purpose
Manages client packages and points-based system for profile access.

### Package Configurations

```javascript
{
  basic: {
    name: 'Basic Package',
    pointsTotal: 50,
    profileViewsPerJob: 3,
    price: 29.99,
    validityDays: 30
  },
  professional: {
    name: 'Professional Package',
    pointsTotal: 150,
    profileViewsPerJob: 10,
    price: 79.99,
    validityDays: 30
  },
  enterprise: {
    name: 'Enterprise Package',
    pointsTotal: 500,
    profileViewsPerJob: 50,
    price: 249.99,
    validityDays: 30
  }
}
```

### Endpoints

##### Get Available Packages (Public)
```javascript
GET /api/v1/packages
Auth: Not required
```

---

##### Purchase Package
```javascript
POST /api/v1/packages/purchase
Auth: Required (Client only)
```

**Request Body:**
```json
{
  "packageType": "professional",
  "paymentMethod": "credit_card",
  "skipPayment": false
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "package": {
      "packageType": "professional",
      "pointsTotal": 150,
      "pointsRemaining": 150,
      "profileViewsPerJob": 10,
      "price": { "amount": 79.99, "currency": "USD" },
      "expiryDate": "2025-02-12T00:00:00.000Z"
    },
    "transaction": { ... }
  }
}
```

**Actions:**
- Creates client package
- Creates transaction record
- Sends notification

---

##### Get My Package
```javascript
GET /api/v1/packages/me
Auth: Required (Client only)
```

---

##### Get Points Balance
```javascript
GET /api/v1/packages/points-balance
Auth: Required (Client only)
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "pointsTotal": 150,
    "pointsRemaining": 120,
    "pointsUsed": 30,
    "hasActivePackage": true,
    "packageType": "professional",
    "expiryDate": "2025-02-12T00:00:00.000Z",
    "profileViewsPerJob": 10
  }
}
```

---

##### Cancel Package
```javascript
POST /api/v1/packages/:id/cancel
Auth: Required (Client only)
```

---

##### Get Package Statistics (Admin)
```javascript
GET /api/v1/packages/stats
Auth: Required (Admin only)
```

---

## 4. ProfileViewController

**File:** `controllers/profileViewController.js`

### Purpose
Manages profile access control and enforces anonymization for clients.

### Key Concept
- **Anonymized View:** Free preview showing only skills, experience level, rating
- **Full View:** Unlocked with points, shows complete profile with contact info
- **Cost:** 10 points per profile unlock

### Endpoints

##### Unlock Profile
```javascript
POST /api/v1/profiles/unlock
Auth: Required (Client only)
```

**Request Body:**
```json
{
  "studentId": "507f1f77bcf86cd799439011",
  "jobPostId": "507f1f77bcf86cd799439012"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "profile": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      // ... full profile
    },
    "profileView": { ... },
    "pointsRemaining": 140
  }
}
```

**Business Logic:**
- Checks if profile already unlocked
- Verifies client has active package
- Consumes 10 points
- Creates ProfileView record
- Notifies student

---

##### Get Anonymized Profile
```javascript
GET /api/v1/profiles/:studentId/anonymized
Auth: Required
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "profile": {
      "name": "Anonymous Student",
      "email": null,
      "phone": null,
      "skills": ["JavaScript", "React", "Node.js"],
      "experienceLevel": "Intermediate",
      "availability": "Available",
      "rating": { "average": 4.5, "count": 12 },
      "completedProjects": 8,
      "location": { "country": "USA", "city": null }
    },
    "isAnonymized": true,
    "message": "Unlock full profile to see complete details"
  }
}
```

---

##### Get My Viewed Profiles
```javascript
GET /api/v1/profiles/viewed
Auth: Required (Client only)
Query: ?jobPost=xxx&viewType=full
```

---

##### Get My Profile Viewers (Student)
```javascript
GET /api/v1/profiles/viewers
Auth: Required (Student only)
```

---

##### Shortlist Profile
```javascript
POST /api/v1/profiles/shortlist
Auth: Required (Client only)
```

**Request Body:**
```json
{
  "studentId": "507f1f77bcf86cd799439011",
  "jobPostId": "507f1f77bcf86cd799439012"
}
```

---

##### Update Profile Action
```javascript
PATCH /api/v1/profiles/action
Auth: Required (Client only)
```

**Request Body:**
```json
{
  "studentId": "507f1f77bcf86cd799439011",
  "jobPostId": "507f1f77bcf86cd799439012",
  "action": "invited",
  "notes": "Strong candidate for the position"
}
```

**Valid Actions:** `invited`, `messaged`, `shortlisted`, `rejected`

---

##### Get Shortlisted Profiles
```javascript
GET /api/v1/profiles/shortlisted
Auth: Required (Client only)
Query: ?jobPost=xxx
```

---

## 5. ConversationController

**File:** `controllers/conversationController.js`

### Purpose
Manages in-app messaging with restriction: **students cannot initiate conversations**.

### Endpoints

##### Get My Conversations
```javascript
GET /api/v1/conversations
Auth: Required
```

---

##### Get Single Conversation
```javascript
GET /api/v1/conversations/:id
Auth: Required
```

**Authorization:** User must be a participant

---

##### Create Conversation
```javascript
POST /api/v1/conversations
Auth: Required (Client/Admin only - Students CANNOT initiate)
```

**Request Body:**
```json
{
  "recipientId": "507f1f77bcf86cd799439011",
  "jobPostId": "507f1f77bcf86cd799439012",
  "initialMessage": "Hi, I'm interested in your profile"
}
```

**Validation:**
- Throws error if initiator is a student
- Auto-creates or retrieves existing conversation
- Sends initial message if provided

---

##### Send Message
```javascript
POST /api/v1/conversations/:id/messages
Auth: Required
```

**Request Body:**
```json
{
  "content": "Hello, how are you?",
  "attachments": [
    {
      "name": "resume.pdf",
      "url": "https://storage.com/resume.pdf",
      "type": "document",
      "size": 1024000
    }
  ]
}
```

**Actions:**
- Adds message to conversation
- Updates unread count
- Sends notification to other participant(s)

---

##### Mark as Read
```javascript
PATCH /api/v1/conversations/:id/read
Auth: Required
```

**Actions:**
- Marks all unread messages as read
- Resets unread count for user

---

##### Archive Conversation
```javascript
POST /api/v1/conversations/:id/archive
Auth: Required
```

---

##### Report Conversation
```javascript
POST /api/v1/conversations/:id/report
Auth: Required
```

**Request Body:**
```json
{
  "reason": "Spam or inappropriate content"
}
```

---

##### Get Unread Count
```javascript
GET /api/v1/conversations/unread-count
Auth: Required
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "unreadCount": 5
  }
}
```

---

## 6. ContractController

**File:** `controllers/contractController.js`

### Purpose
Manages project contracts with milestones and payment tracking.

### Endpoints

##### Create Contract
```javascript
POST /api/v1/contracts
Auth: Required (Client only)
```

**Request Body:**
```json
{
  "applicationId": "507f1f77bcf86cd799439011",
  "title": "E-commerce Website Development",
  "description": "Build a full-stack e-commerce platform",
  "agreedBudget": {
    "amount": 5000,
    "currency": "USD"
  },
  "agreedTimeline": "1-3 months",
  "expectedCompletionDate": "2025-05-01T00:00:00.000Z",
  "milestones": [
    {
      "title": "Design Phase",
      "description": "UI/UX design and mockups",
      "amount": 1500,
      "dueDate": "2025-02-15T00:00:00.000Z"
    },
    {
      "title": "Development Phase",
      "amount": 2500,
      "dueDate": "2025-04-01T00:00:00.000Z"
    },
    {
      "title": "Testing and Deployment",
      "amount": 1000,
      "dueDate": "2025-05-01T00:00:00.000Z"
    }
  ]
}
```

**Actions:**
- Creates contract with 'pending_acceptance' status
- Notifies student
- Updates job post status

---

##### Get My Contracts
```javascript
GET /api/v1/contracts/me
Auth: Required
Query: ?status=active
```

**Filters by role:**
- Student: Shows contracts where user is student
- Client: Shows contracts where user is client

---

##### Get Single Contract
```javascript
GET /api/v1/contracts/:id
Auth: Required
```

**Authorization:** User must be client or student of the contract

---

##### Accept Contract Terms
```javascript
PATCH /api/v1/contracts/:id/accept
Auth: Required
```

**Business Logic:**
- Client acceptance: Sets `termsAcceptedByClient = true`
- Student acceptance: Sets `termsAcceptedByStudent = true`
- Both accepted: Contract status changes to 'active'

---

##### Submit Milestone
```javascript
POST /api/v1/contracts/:id/milestones/:milestoneId/submit
Auth: Required (Student only)
```

**Request Body:**
```json
{
  "deliverables": [
    {
      "name": "Design Files",
      "url": "https://storage.com/designs.zip",
      "type": "document",
      "description": "Figma design files"
    }
  ]
}
```

**Actions:**
- Updates milestone status to 'submitted'
- Notifies client

---

##### Approve Milestone
```javascript
PATCH /api/v1/contracts/:id/milestones/:milestoneId/approve
Auth: Required (Client only)
```

**Actions:**
- Updates milestone status to 'approved'
- Notifies student

---

##### Release Milestone Payment
```javascript
POST /api/v1/contracts/:id/milestones/:milestoneId/release-payment
Auth: Required (Client only)
```

**Business Logic:**
- Milestone must be 'approved'
- Marks milestone as paid
- Updates contract `totalPaid`
- If all milestones paid, marks contract as 'completed'
- Updates student's earnings and completed projects count
- Notifies student

---

##### Cancel Contract
```javascript
POST /api/v1/contracts/:id/cancel
Auth: Required (Client or Student)
```

**Request Body:**
```json
{
  "reason": "Project requirements changed"
}
```

---

## 7. NotificationController

**File:** `controllers/notificationController.js`

### Purpose
Manages multi-channel notifications (in-app, email, push).

### Notification Types
- `job_invite`, `application_status`, `application_received`
- `new_message`, `deadline_reminder`
- `payment_received`, `payment_released`
- `contract_created`, `contract_completed`
- `milestone_submitted`, `milestone_approved`
- `review_received`, `profile_viewed`
- `verification_approved`, `verification_rejected`
- `subscription_expiring`, `subscription_renewed`
- `system_announcement`, `account_suspended`

### Endpoints

##### Get My Notifications
```javascript
GET /api/v1/notifications
Auth: Required
Query: ?isRead=false&type=new_message&priority=high&page=1&limit=20
```

**Response:**
```json
{
  "status": "success",
  "results": 15,
  "total": 45,
  "page": 1,
  "pages": 3,
  "data": {
    "notifications": [ ... ]
  }
}
```

---

##### Get Unread Count
```javascript
GET /api/v1/notifications/unread-count
Auth: Required
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "unreadCount": 5
  }
}
```

---

##### Mark as Read
```javascript
PATCH /api/v1/notifications/:id/read
Auth: Required
```

---

##### Mark All as Read
```javascript
PATCH /api/v1/notifications/read-all
Auth: Required
```

---

##### Delete Notification
```javascript
DELETE /api/v1/notifications/:id
Auth: Required
```

---

##### Delete All Read Notifications
```javascript
DELETE /api/v1/notifications/read-all
Auth: Required
```

---

##### Get Notification Settings
```javascript
GET /api/v1/notifications/settings
Auth: Required
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "settings": {
      "newMessages": true,
      "jobAlerts": true,
      "applicationUpdates": true,
      "marketingEmails": false
    }
  }
}
```

---

##### Update Notification Settings
```javascript
PATCH /api/v1/notifications/settings
Auth: Required
```

**Request Body:**
```json
{
  "newMessages": true,
  "jobAlerts": false,
  "applicationUpdates": true,
  "marketingEmails": false
}
```

---

##### Create System Notification (Admin)
```javascript
POST /api/v1/notifications/system
Auth: Required (Admin only)
```

**Request Body:**
```json
{
  "title": "Platform Maintenance",
  "message": "Scheduled maintenance on Feb 15, 2025",
  "priority": "high",
  "targetRole": "student",
  "targetUsers": []
}
```

**Targeting:**
- `targetRole`: Sends to all users with specified role
- `targetUsers`: Sends to specific user IDs

---

## 8. TransactionController

**File:** `controllers/transactionController.js`

### Purpose
Tracks all financial transactions and provides audit trail.

### Transaction Types
- `subscription_payment`
- `package_purchase`
- `escrow_deposit`
- `escrow_release`
- `payout`
- `refund`
- `platform_fee`
- `points_purchase`

### Endpoints

##### Get My Transactions
```javascript
GET /api/v1/transactions/me
Auth: Required
Query: ?type=subscription_payment&status=completed&page=1&limit=20
```

---

##### Get Single Transaction
```javascript
GET /api/v1/transactions/:id
Auth: Required
```

---

##### Get Transaction Summary
```javascript
GET /api/v1/transactions/summary
Auth: Required
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "summary": [
      { "_id": "subscription_payment", "total": 19.99, "count": 1 },
      { "_id": "package_purchase", "total": 79.99, "count": 1 }
    ]
  }
}
```

---

##### Get All Transactions (Admin)
```javascript
GET /api/v1/transactions
Auth: Required (Admin only)
Query: ?type=subscription_payment&status=completed&user=xxx&page=1&limit=50
```

---

##### Get Revenue Statistics (Admin)
```javascript
GET /api/v1/transactions/revenue-stats
Auth: Required (Admin only)
Query: ?startDate=2025-01-01&endDate=2025-01-31
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "period": {
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "2025-01-31T23:59:59.999Z"
    },
    "stats": {
      "totalRevenue": 15000,
      "totalFees": 2250,
      "count": 75
    }
  }
}
```

---

##### Process Refund (Admin)
```javascript
POST /api/v1/transactions/:id/refund
Auth: Required (Admin only)
```

**Request Body:**
```json
{
  "reason": "Customer requested refund"
}
```

**Actions:**
- Creates refund transaction
- Updates original transaction status to 'refunded'

---

##### Update Transaction Status (Admin)
```javascript
PATCH /api/v1/transactions/:id/status
Auth: Required (Admin only)
```

**Request Body:**
```json
{
  "status": "completed",
  "adminNotes": "Payment verified manually"
}
```

---

## 9. ReviewController

**File:** `controllers/reviewController.js`

### Purpose
Manages mutual review system (students ↔ clients).

### Endpoints

##### Create Review
```javascript
POST /api/v1/reviews
Auth: Required
```

**Request Body:**
```json
{
  "contractId": "507f1f77bcf86cd799439011",
  "rating": 5,
  "categoryRatings": {
    "qualityOfWork": 5,
    "timeliness": 5,
    "responsiveness": 4,
    "skillLevel": 5,
    "creativity": 5
  },
  "comment": "Excellent work! Very professional.",
  "pros": "Great communication, delivered on time",
  "cons": "None",
  "wouldRecommend": true,
  "isPublic": true
}
```

**Category Ratings:**

For **Client reviewing Student:**
- `qualityOfWork`
- `timeliness`
- `responsiveness`
- `skillLevel`
- `creativity`

For **Student reviewing Client:**
- `communication`
- `clarity`
- `paymentOnTime`
- `professionalism`
- `wouldWorkAgain`

**Validation:**
- Contract must be completed
- User must be party to the contract
- Cannot review twice

**Actions:**
- Creates review
- Auto-updates reviewee's average rating
- Notifies reviewee

---

##### Get Reviews for User
```javascript
GET /api/v1/reviews/user/:userId
Auth: Required
```

**Response:**
```json
{
  "status": "success",
  "results": 15,
  "data": {
    "reviews": [ ... ],
    "ratingBreakdown": {
      "overall": 4.7,
      "communication": 4.8,
      "professionalism": 4.9,
      "quality": 4.6,
      "timeliness": 4.5,
      "count": 15
    }
  }
}
```

---

##### Get My Reviews (Reviews I Wrote)
```javascript
GET /api/v1/reviews/me
Auth: Required
```

---

##### Get Reviews About Me
```javascript
GET /api/v1/reviews/about-me
Auth: Required
```

---

##### Respond to Review
```javascript
POST /api/v1/reviews/:id/respond
Auth: Required
```

**Request Body:**
```json
{
  "text": "Thank you for the positive feedback!"
}
```

**Validation:**
- User must be the reviewee
- Cannot respond twice

---

##### Vote Review as Helpful
```javascript
POST /api/v1/reviews/:id/vote-helpful
Auth: Required
```

**Actions:**
- Increments `helpfulVotes` counter
- Prevents duplicate votes

---

##### Remove Helpful Vote
```javascript
DELETE /api/v1/reviews/:id/vote
Auth: Required
```

---

##### Report Review
```javascript
POST /api/v1/reviews/:id/report
Auth: Required
```

**Request Body:**
```json
{
  "reason": "Inappropriate content or spam"
}
```

---

##### Hide Review (Admin)
```javascript
PATCH /api/v1/reviews/:id/hide
Auth: Required (Admin only)
```

**Request Body:**
```json
{
  "reason": "Violates community guidelines"
}
```

---

##### Get Reported Reviews (Admin)
```javascript
GET /api/v1/reviews/reported
Auth: Required (Admin only)
```

---

## Summary Statistics

### Controllers Created: 9

| Controller | Endpoints | Lines of Code | Key Features |
|------------|-----------|---------------|--------------|
| StudentVerificationController | 8 | ~240 | Document upload, admin approval |
| SubscriptionController | 8 | ~330 | Free/premium tiers, application limits |
| ClientPackageController | 8 | ~285 | Points system, package management |
| ProfileViewController | 9 | ~315 | Profile unlocking, anonymization |
| ConversationController | 8 | ~240 | Messaging, student restrictions |
| ContractController | 9 | ~310 | Milestones, payment release |
| NotificationController | 10 | ~210 | Multi-channel notifications |
| TransactionController | 7 | ~165 | Financial tracking, refunds |
| ReviewController | 10 | ~270 | Mutual reviews, ratings |

**Total Endpoints:** ~77
**Total Lines of Code:** ~2,365

---

## Common Patterns

### Error Handling
All controllers use `catchAsync` wrapper and `AppError` for consistent error handling:

```javascript
exports.someFunction = catchAsync(async (req, res, next) => {
  // Controller logic
  if (someError) {
    return next(new AppError('Error message', statusCode));
  }
  // Success response
});
```

### Authorization Checks
```javascript
// Role-based
if (req.user.role !== 'client') {
  return next(new AppError('Only clients can...', 403));
}

// Ownership-based
if (resource.owner.toString() !== req.user._id.toString()) {
  return next(new AppError('You are not authorized...', 403));
}
```

### Pagination Pattern
```javascript
const page = parseInt(req.query.page, 10) || 1;
const limit = parseInt(req.query.limit, 10) || 20;
const skip = (page - 1) * limit;

const items = await Model.find(filter)
  .sort('-createdAt')
  .skip(skip)
  .limit(limit);

const total = await Model.countDocuments(filter);
```

### Response Format
```javascript
res.status(200).json({
  status: 'success',
  results: items.length, // For lists
  data: {
    [resourceName]: items
  }
});
```

---

## Next Steps

### 1. Create Routes
Each controller needs corresponding router files:
- `routers/studentVerificationRouter.js`
- `routers/subscriptionRouter.js`
- `routers/clientPackageRouter.js`
- `routers/profileViewRouter.js`
- `routers/conversationRouter.js`
- `routers/contractRouter.js`
- `routers/notificationRouter.js`
- `routers/transactionRouter.js`
- `routers/reviewRouter.js`

### 2. Add Middleware
Create authentication and authorization middleware:
- `requireAdmin` - Admin-only routes
- `requireVerifiedStudent` - Verified student-only routes
- `checkApplicationLimit` - Before job application
- `requireClientPackage` - Before profile unlock

### 3. Mount Routes in app.js
```javascript
app.use('/api/v1/verifications', studentVerificationRouter);
app.use('/api/v1/subscriptions', subscriptionRouter);
app.use('/api/v1/packages', clientPackageRouter);
app.use('/api/v1/profiles', profileViewRouter);
app.use('/api/v1/conversations', conversationRouter);
app.use('/api/v1/contracts', contractRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/transactions', transactionRouter);
app.use('/api/v1/reviews', reviewRouter);
```

### 4. Integration Tasks
- Connect payment gateway (Stripe/PayPal)
- Implement WebSockets for real-time chat
- Set up email service for notifications
- Create admin dashboard endpoints
- Add API documentation (Swagger)

---

**Generated on:** 2025-11-12
**Total Controllers:** 9
**Total Endpoints:** ~77
**Status:** ✅ Ready for Router Implementation
