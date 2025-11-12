# Freshlancer Frontend Implementation Guide

## Overview

This guide explains how the frontend implements the Freshlancer business model with all key features and workflows.

## Architecture

### State Management Strategy

1. **Server State** - TanStack Query (React Query)
   - Caching API responses
   - Automatic refetching
   - Optimistic updates
   - Loading/error states

2. **Client State** - Zustand
   - Authentication state
   - User data
   - Simple, minimal store

3. **Form State** - React Hook Form
   - Validation
   - Error handling
   - Form submission

### Routing Structure

```
/ (redirect based on auth)
├── /login
├── /register
│
├── /student/* (Protected - students only)
│   ├── /dashboard
│   ├── /verification (CRITICAL - must complete first)
│   ├── /jobs
│   ├── /jobs/:id
│   ├── /applications
│   ├── /contracts
│   ├── /subscription
│   ├── /messages
│   ├── /notifications
│   ├── /profile
│   └── /reviews
│
├── /client/* (Protected - clients only)
│   ├── /dashboard
│   ├── /jobs
│   ├── /jobs/new
│   ├── /jobs/:id/edit
│   ├── /applications
│   ├── /contracts
│   ├── /packages (CRITICAL - points system)
│   ├── /messages
│   ├── /notifications
│   ├── /profile
│   ├── /reviews
│   └── /transactions
│
└── /admin/* (Protected - admin only)
    ├── /dashboard
    ├── /verifications (CRITICAL - approval workflow)
    ├── /users
    ├── /jobs
    ├── /contracts
    ├── /transactions
    └── /reviews
```

## Critical Business Flows

### 1. Student Onboarding Flow

```
1. Register → (role: student)
2. Redirect to /student/verification
3. Upload verification documents
4. Wait for admin approval (24-48 hours)
5. Once approved → Can browse and apply for jobs
```

**Implementation:**
- `pages/student/Verification.jsx`
- Checks `verificationStatus` from API
- Shows upload form if not verified
- Displays pending/approved/rejected status

**Key Code:**
```jsx
const { data: verificationStatus } = useQuery({
  queryKey: ['verificationStatus'],
  queryFn: () => verificationService.getVerificationStatus(),
});

const isVerified = verificationStatus?.data?.isVerified;

// Block job applications until verified
if (!isVerified) {
  return <Alert message="Please complete verification first" />;
}
```

### 2. Application Limit Enforcement (Free vs Premium)

```
Free Tier:
- 10 applications/month
- Resets monthly
- Block after limit

Premium Tier ($19.99/month):
- Unlimited applications
- Priority support
- Featured badge
```

**Implementation:**
- `pages/student/Subscription.jsx`
- Check limit before applying: `subscriptionService.checkApplicationLimit()`
- Show upgrade prompt when nearing limit

**Key Code:**
```jsx
const { data: subscription } = useQuery({
  queryKey: ['subscription'],
  queryFn: () => subscriptionService.getMySubscription(),
});

const applicationsRemaining =
  subscription.applicationLimitPerMonth - subscription.applicationsUsedThisMonth;

// Before applying
if (applicationsRemaining <= 0) {
  alert('Upgrade to Premium for unlimited applications');
  return;
}
```

### 3. Points-Based Profile Access (Core Monetization)

```
Client Flow:
1. Browse job applications
2. See anonymized student profiles (free preview)
   - Shows: skills, experience level, rating
   - Hides: name, email, contact info
3. Purchase package to get points
4. Unlock full profile (costs 10 points)
5. View name, email, portfolio, intro video
```

**Package Pricing:**
- Basic: $29.99 → 50 points (5 profiles)
- Professional: $79.99 → 150 points (15 profiles)
- Enterprise: $249.99 → 500 points (50 profiles)

**Implementation:**
- `pages/client/Packages.jsx`
- `services/profileService.js`

**Key Code:**
```jsx
// Get anonymized profile (free)
const anonymizedProfile = await profileService.getAnonymizedProfile(
  studentId, jobPostId
);

// Unlock full profile (costs 10 points)
const handleUnlock = async () => {
  // Check points balance
  const balance = await packageService.getPointsBalance();
  if (balance.pointsRemaining < 10) {
    alert('Insufficient points. Purchase a package.');
    return;
  }

  // Unlock profile
  await profileService.unlockProfile(studentId, jobPostId);

  // Refresh balance
  queryClient.invalidateQueries(['pointsBalance']);
};
```

### 4. Structured Applications (No Free Text)

**Business Rule:** Students cannot write free-text in applications. Only structured data (dropdowns, numbers).

**Implementation:**
- Application form uses only `<Select>` components
- No `<textarea>` or free `<input type="text">`

**Example Application Form:**
```jsx
<Select
  label="Approach"
  options={[
    { value: 'Agile', label: 'Agile Methodology' },
    { value: 'Waterfall', label: 'Waterfall' },
    { value: 'Iterative', label: 'Iterative Development' }
  ]}
  {...register('approach')}
/>

<Select
  label="Delivery Frequency"
  options={[
    { value: 'Daily', label: 'Daily Updates' },
    { value: 'Weekly', label: 'Weekly Updates' }
  ]}
  {...register('deliveryFrequency')}
/>

<Input
  label="Budget"
  type="number"
  min={0}
  {...register('proposedBudget')}
/>
```

### 5. Chat Restriction (Students Cannot Initiate)

**Business Rule:** Only clients/admins can start conversations. Students can only respond.

**Implementation:**
- `conversationService.createConversation()` - Restricted endpoint
- Router-level protection: `authController.restrictTo('client', 'admin')`
- UI hides "Start Conversation" button for students

**Key Code:**
```jsx
// In ConversationList.jsx
const { user } = useAuthStore();

return (
  <div>
    {user.role !== 'student' && (
      <Button onClick={handleStartConversation}>
        Start New Conversation
      </Button>
    )}
  </div>
);
```

### 6. Contract & Milestone Management

```
Contract Flow:
1. Client creates contract with milestones
2. Both parties accept terms
3. Student submits milestone deliverables
4. Client approves milestone
5. Client releases payment
6. Repeat for all milestones
7. Contract marked as completed
```

**Implementation:**
- `pages/student/Contracts.jsx` - Student view
- `pages/client/Contracts.jsx` - Client view
- Milestone status: pending → submitted → approved → paid

**Key Code:**
```jsx
// Student submits milestone
const submitMilestone = async (contractId, milestoneId, deliverables) => {
  await contractService.submitMilestone(contractId, milestoneId, deliverables);
  alert('Milestone submitted for review');
};

// Client approves and releases payment
const approveMilestone = async (contractId, milestoneId) => {
  await contractService.approveMilestone(contractId, milestoneId);
  await contractService.releaseMilestonePayment(contractId, milestoneId);
  alert('Payment released to student');
};
```

## Component Library

### Common Components

All components are in `src/components/common/`

#### Button
```jsx
<Button
  variant="primary|secondary|outline|danger|success"
  size="sm|md|lg"
  loading={boolean}
  disabled={boolean}
>
  Click Me
</Button>
```

#### Input
```jsx
<Input
  label="Email"
  type="email"
  placeholder="your@email.com"
  error="Error message"
  required
  {...register('email')}
/>
```

#### Select
```jsx
<Select
  label="Choose Option"
  options={[
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' }
  ]}
  placeholder="Select..."
  error="Error message"
  {...register('option')}
/>
```

#### Card
```jsx
<Card
  title="Card Title"
  actions={<Button>Action</Button>}
>
  Card content
</Card>
```

#### Badge
```jsx
<Badge variant="success|warning|error|info|primary">
  Status
</Badge>
```

#### Modal
```jsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  size="sm|md|lg|xl"
>
  Modal content
</Modal>
```

#### Alert
```jsx
<Alert
  type="success|error|warning|info"
  title="Alert Title"
  message="Alert message"
/>
```

#### Loading
```jsx
<Loading text="Loading..." />
```

## Service Layer

All API calls go through service files in `src/services/`

### Service Pattern

```jsx
// services/exampleService.js
import api from './api';

export const exampleService = {
  getAll: async (params) => {
    return api.get('/endpoint', { params });
  },

  getOne: async (id) => {
    return api.get(`/endpoint/${id}`);
  },

  create: async (data) => {
    return api.post('/endpoint', data);
  },

  update: async (id, data) => {
    return api.patch(`/endpoint/${id}`, data);
  },

  delete: async (id) => {
    return api.delete(`/endpoint/${id}`);
  },
};
```

### Using Services with React Query

```jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exampleService } from '../services/exampleService';

const MyComponent = () => {
  const queryClient = useQueryClient();

  // Fetch data
  const { data, isLoading, error } = useQuery({
    queryKey: ['examples'],
    queryFn: () => exampleService.getAll(),
  });

  // Mutate data
  const mutation = useMutation({
    mutationFn: (data) => exampleService.create(data),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries(['examples']);
      alert('Success!');
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  return (
    <Button
      onClick={() => mutation.mutate({ name: 'Test' })}
      loading={mutation.isPending}
    >
      Submit
    </Button>
  );
};
```

## Form Handling with React Hook Form

```jsx
import { useForm } from 'react-hook-form';

const MyForm = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  const onSubmit = async (data) => {
    // Handle form submission
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        label="Email"
        type="email"
        error={errors.email?.message}
        {...register('email', {
          required: 'Email is required',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Invalid email',
          },
        })}
      />

      <Input
        label="Password"
        type="password"
        error={errors.password?.message}
        {...register('password', {
          required: 'Password is required',
          minLength: {
            value: 8,
            message: 'Min 8 characters',
          },
        })}
      />

      <Button type="submit">Submit</Button>
    </form>
  );
};
```

## Protected Routes

```jsx
import ProtectedRoute from './components/common/ProtectedRoute';

<Route
  path="/student/*"
  element={
    <ProtectedRoute allowedRoles={['student']}>
      <DashboardLayout />
    </ProtectedRoute>
  }
>
  <Route path="dashboard" element={<StudentDashboard />} />
</Route>
```

## Next Steps for Production

### 1. Payment Gateway Integration

Replace placeholder payment mutations with actual Stripe/PayPal:

```jsx
// Install Stripe
npm install @stripe/stripe-js @stripe/react-stripe-js

// Create payment intent
const handlePurchase = async (packageType, price) => {
  const { clientSecret } = await packageService.createPaymentIntent({
    packageType,
    amount: price * 100, // cents
  });

  // Show Stripe checkout
  const stripe = await stripePromise;
  const { error } = await stripe.confirmCardPayment(clientSecret);

  if (!error) {
    alert('Purchase successful!');
  }
};
```

### 2. Real-time Messaging

Add Socket.io for live chat:

```bash
npm install socket.io-client
```

```jsx
// src/services/socket.js
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

socket.on('new_message', (message) => {
  // Update UI
});
```

### 3. File Upload

Add file upload for verification documents and portfolios:

```jsx
<Input
  type="file"
  accept=".pdf,.jpg,.png"
  onChange={(e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    uploadMutation.mutate(formData);
  }}
/>
```

### 4. Analytics

Add Google Analytics or Mixpanel:

```bash
npm install react-ga4
```

```jsx
// Track page views
useEffect(() => {
  ReactGA.send({ hitType: 'pageview', page: location.pathname });
}, [location]);
```

### 5. Error Boundary

Add error boundary for better error handling:

```jsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
```

### 6. Performance Optimization

- Add lazy loading for routes
- Implement virtual scrolling for long lists
- Add service worker for PWA
- Optimize images

### 7. Testing

Add testing framework:

```bash
npm install -D vitest @testing-library/react
```

```jsx
// Button.test.jsx
import { render, fireEvent } from '@testing-library/react';
import Button from './Button';

test('button clicks', () => {
  const handleClick = vi.fn();
  const { getByText } = render(
    <Button onClick={handleClick}>Click</Button>
  );

  fireEvent.click(getByText('Click'));
  expect(handleClick).toHaveBeenCalled();
});
```

## Deployment Checklist

- [ ] Set environment variables
- [ ] Build production bundle (`npm run build`)
- [ ] Test production build locally (`npm run preview`)
- [ ] Configure CORS on backend for production domain
- [ ] Set up CDN for static assets
- [ ] Enable HTTPS
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Configure analytics
- [ ] Set up CI/CD pipeline
- [ ] Test all critical flows end-to-end

## Common Issues & Solutions

### Issue: "Network Error"
**Solution:** Backend not running or wrong API URL

### Issue: "401 Unauthorized"
**Solution:** Token expired, clear localStorage and login again

### Issue: Tailwind styles not working
**Solution:** Check `tailwind.config.js` content paths

### Issue: Components not rendering
**Solution:** Check for console errors, ensure all imports correct

## Support

For questions or issues, contact the development team.
