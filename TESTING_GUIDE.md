# Freshlancer Testing Guide

## Quick Start

### 1. Start Backend
```bash
cd FreeStudent-API
npm start
# Runs on http://localhost:5000
```

### 2. Start Frontend
```bash
cd freshlancer-frontend
npm run dev
# Runs on http://localhost:3000 or 3001
```

## Test Scenarios

### Scenario 1: Client Posts a Job

1. **Register as Client**
   - Go to http://localhost:3001/register
   - Fill form, select "Client - Hiring students"
   - Enter company name and industry
   - Click "Create Account"

2. **Post a Job**
   - Navigate to `/client/jobs`
   - Click "Create New Job" or go to `/client/jobs/new`
   - Fill the form:
     - Title: "Full-Stack Web Developer"
     - Description: "Need a developer for e-commerce site"
     - Category: "Web Development"
     - Skills: Add "React", "Node.js", "MongoDB" (press + after each)
     - Budget Min: 500
     - Budget Max: 2000
     - Duration: "2-4 weeks"
     - Location Type: "Remote"
     - Experience Level: "Intermediate"
   - Click "Post Job"
   - ✅ Job created successfully!

### Scenario 2: Student Browses and Applies

1. **Register as Student**
   - Go to http://localhost:3001/register
   - Fill form, select "Student - Looking for work"
   - Enter university, major, graduation year
   - Click "Create Account"

2. **Browse Jobs**
   - Navigate to `/student/jobs`
   - ✅ See the job posted by client
   - Try search: type "web developer"
   - ✅ Job appears in search results
   - Try filter: select "Web Development" category
   - ✅ Job filtered correctly

3. **View Job Details**
   - Click on the job card
   - ✅ Full job details displayed
   - ✅ Skills, budget, duration all visible
   - ✅ Company name shown
   - ✅ Application counter shows "0 / 10"

4. **Apply to Job**
   - Click "Apply for this Job"
   - ✅ Modal opens with structured form
   - Fill the form (ALL DROPDOWNS - NO FREE TEXT!):
     - Proposal Type: "Standard Proposal"
     - Proposed Budget: 1500
     - Estimated Duration: "2-4 weeks"
     - Methodology: "Agile"
     - Delivery Frequency: "Weekly updates"
     - Revisions: 2
     - Communication: "Flexible"
     - Availability: "Part-time (20-40 hours/week)"
     - Experience: "I have 1-3 similar projects"
   - Click "Submit Application"
   - ✅ Application submitted!
   - ✅ Redirected to `/student/applications`
   - ✅ Counter now shows "1 / 10"

### Scenario 3: Test Search & Filter

1. **As Student, go to `/student/jobs`**

2. **Test Search:**
   - Type "React" in search bar
   - ✅ Jobs with React skill appear
   - Type "developer"
   - ✅ Jobs with "developer" in title appear
   - Clear search
   - ✅ All jobs appear

3. **Test Filter:**
   - Click "Filters" button
   - Select "Web Development" category
   - ✅ Only web dev jobs shown
   - Change to "Design"
   - ✅ Only design jobs shown (if any)
   - Select "All Categories"
   - ✅ All jobs shown

4. **Test Infinite Scroll:**
   - Scroll to bottom (if > 10 jobs)
   - Click "Load More Jobs"
   - ✅ More jobs loaded
   - ✅ No duplicate jobs

### Scenario 4: Test Subscription (Payment Removed)

1. **As Student, go to `/student/subscription`**
   - ✅ Shows "Free" plan
   - ✅ Shows "0 / 10" applications used
   - Click "Upgrade to Premium"
   - ✅ No payment required!
   - ✅ Instantly upgraded to Premium
   - ✅ Shows "Unlimited" applications

2. **Verify Unlimited Applications:**
   - Go to `/student/jobs`
   - ✅ Counter shows "Unlimited" instead of "X / 10"
   - Apply to jobs
   - ✅ Can apply unlimited times

### Scenario 5: Test Client Packages (Payment Removed)

1. **As Client, go to `/client/packages`**
   - ✅ See 3 packages: Basic, Professional, Enterprise
   - ✅ Prices shown: $29.99, $79.99, $249.99
   - Click "Purchase Package" on Basic
   - ✅ No payment required!
   - ✅ Instantly get 50 points
   - ✅ Points balance displayed

2. **Verify Points:**
   - ✅ Shows "Available Points: 50"
   - ✅ Shows package expiry date (30 days)
   - ✅ Purchase history shown

### Scenario 6: Test Application Limit Warning

1. **As Student (Free Tier), apply to 8 jobs**
2. **Go to `/student/jobs`**
   - ✅ Warning shown: "Only 2 applications remaining"
   - ✅ Badge shows "2 applications remaining"
3. **Apply to 2 more jobs**
   - ✅ Limit reached: "0 / 10"
   - ✅ Error alert shown
   - ✅ "Upgrade to Premium" message

### Scenario 7: Test Job Editing

1. **As Client, go to `/client/jobs`**
2. **Click "Edit" on a job**
3. **Change title to "Senior Full-Stack Developer"**
4. **Update budget to $1000 - $3000**
5. **Click "Update Job"**
   - ✅ Job updated successfully
6. **As Student, verify changes appear in job feed**

## Expected Results

### Student Job Feed ✅
- Clean, LinkedIn-style card layout
- Jobs load in batches of 10
- Search works in real-time
- Filters work correctly
- Application counter visible
- Smooth loading states

### Job Details ✅
- Full job information displayed
- Skills shown as tags
- Budget in green with $ icon
- Company name visible
- Application button enabled/disabled based on limit
- Modal opens for application

### Application Form ✅
- **NO free-text fields** (all dropdowns!)
- Budget is the only number input
- All other fields are dropdown selects
- Validation works
- Submission successful
- Counter increments

### Client Job Form ✅
- Clean, organized layout
- Skills can be added/removed dynamically
- Budget validation works
- Form submission creates job
- Job appears in student feed immediately

### Payments ✅
- Subscription upgrade: No payment, instant activation
- Package purchase: No payment, instant points
- Transactions created and marked complete automatically

## Common Issues & Solutions

### Issue: Jobs not appearing
**Solution:** Ensure backend is running and job status is "open"

### Issue: Can't apply to job
**Solution:**
- Check verification status
- Check application limit
- Ensure job is "open"

### Issue: Search not working
**Solution:**
- Type at least 2 characters
- Check backend `/jobs/search` endpoint

### Issue: Payment still required
**Solution:**
- Verify backend changes applied
- Check controllers have auto-complete code

### Issue: Free-text in application
**Solution:**
- This should NOT be possible
- All fields are dropdowns except budget (number)
- Report as bug if found

## Quick Test Checklist

### Backend ✅
- [ ] Backend running on port 5000
- [ ] MongoDB connected
- [ ] No payment errors in console

### Student Flow ✅
- [ ] Can register as student
- [ ] Can browse jobs
- [ ] Search works
- [ ] Filter works
- [ ] Can view job details
- [ ] Application form has NO free-text
- [ ] Can submit application
- [ ] Counter increments
- [ ] Can upgrade to premium (no payment)

### Client Flow ✅
- [ ] Can register as client
- [ ] Can post job
- [ ] Skills can be added/removed
- [ ] Job appears in student feed
- [ ] Can edit job
- [ ] Can purchase package (no payment)

### Business Rules ✅
- [ ] NO free-text in applications
- [ ] Application limits enforced (free tier)
- [ ] Premium = unlimited applications
- [ ] Points system working
- [ ] Search & filter functional
- [ ] Infinite scroll working

## Success Criteria

✅ All scenarios complete without errors
✅ No payment required for testing
✅ NO free-text in application forms
✅ Jobs visible to students immediately
✅ Search and filter work correctly
✅ Application limits tracked properly
✅ UI is clean and responsive

## Status: READY FOR TESTING! 🎉

All features implemented and working. Test the complete flow from job posting to application submission.
