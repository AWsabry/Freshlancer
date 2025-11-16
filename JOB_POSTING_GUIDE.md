# Job Posting Guide - FreeStudent Platform

## Overview
This guide ensures clients can successfully post jobs that work correctly throughout the entire system.

## Required Fields for Job Posting

### 1. Job Post Body Structure

When creating a job post via `POST /jobs`, the request body must include:

```json
{
  "title": "string (5-100 characters)",
  "description": "string (20-2000 characters)",
  "category": "string (from allowed categories)",
  "skillsRequired": ["array of strings (1-10 skills)"],
  "budget": {
    "min": "number (minimum: 1)",
    "max": "number (minimum: 1, must be >= min)",
    "currency": "string (default: 'USD')"
  },
  "projectDuration": "string (from allowed durations)",
  "deadline": "date (must be in the future)",
  "experienceLevel": "string (Beginner/Intermediate/Advanced)",
  "applicationType": "string (default: 'open')"
}
```

### 2. Allowed Values

#### Categories
- Web Development
- Mobile Development
- Data Science
- Machine Learning
- UI/UX Design
- Content Writing
- Digital Marketing
- Graphic Design
- Video Editing
- Translation
- Research
- Other

#### Experience Levels
- Beginner
- Intermediate
- Advanced

#### Project Durations
- Less than 1 week
- 1-2 weeks
- 2-4 weeks
- 1-3 months
- More than 3 months

#### Application Types
- open (default) - Open to all students
- invite-only - Only invited students can apply

#### Status Values (Auto-managed)
- open (default when created)
- in_progress (when work begins)
- completed (when job is finished)
- cancelled (if job is cancelled)

#### Budget Currency (36 options)

**Major Currencies:**
- USD (default) - US Dollar
- EUR - Euro
- EGP - Egyptian Pound
- GBP - British Pound

**Middle East:**
- AED - UAE Dirham
- SAR - Saudi Riyal
- QAR - Qatari Riyal
- KWD - Kuwaiti Dinar
- BHD - Bahraini Dinar
- OMR - Omani Rial
- JOD - Jordanian Dinar
- LBP - Lebanese Pound
- ILS - Israeli Shekel
- TRY - Turkish Lira

**Africa:**
- ZAR - South African Rand
- MAD - Moroccan Dirham
- TND - Tunisian Dinar
- DZD - Algerian Dinar
- NGN - Nigerian Naira
- KES - Kenyan Shilling
- GHS - Ghanaian Cedi
- UGX - Ugandan Shilling
- TZS - Tanzanian Shilling
- ETB - Ethiopian Birr

**Europe:**
- CHF - Swiss Franc
- SEK - Swedish Krona
- NOK - Norwegian Krone
- DKK - Danish Krone
- PLN - Polish Zloty
- CZK - Czech Koruna
- HUF - Hungarian Forint
- RON - Romanian Leu
- BGN - Bulgarian Lev
- HRK - Croatian Kuna
- RUB - Russian Ruble
- UAH - Ukrainian Hryvnia

### 3. Auto-Generated Fields

The following fields are automatically set by the system:

- `client` - Set from authenticated user's ID
- `slug` - Generated from title
- `status` - Defaults to 'open'
- `applicationsCount` - Defaults to 0
- `createdAt` - Current timestamp
- `updatedAt` - Current timestamp
- `featured` - Defaults to false
- `urgent` - Defaults to false
- `invitesSent` - Defaults to 0

### 4. Validation Rules

#### Title
- Required
- Minimum 5 characters
- Maximum 100 characters
- Will be slugified for URLs

#### Description
- Required
- Minimum 20 characters
- Maximum 2000 characters

#### Skills Required
- Required
- Must have at least 1 skill
- Maximum 10 skills
- Each skill is a string

#### Budget
- Both min and max are required
- Must be positive numbers (minimum $1)
- Max must be greater than or equal to min
- Currency defaults to USD

#### Deadline
- Required
- Must be a future date
- Format: YYYY-MM-DD or ISO date string

### 5. Example Request Body

```json
{
  "title": "Full-Stack Web Developer for E-commerce Platform",
  "description": "We are looking for an experienced full-stack developer to build a modern e-commerce platform. The project includes user authentication, product catalog, shopping cart, payment integration, and admin dashboard. Must have experience with React, Node.js, and MongoDB.",
  "category": "Web Development",
  "skillsRequired": [
    "React",
    "Node.js",
    "MongoDB",
    "Express",
    "REST API"
  ],
  "budget": {
    "min": 500,
    "max": 1000,
    "currency": "EGP"
  },
  "projectDuration": "1-3 months",
  "deadline": "2025-12-31",
  "experienceLevel": "Advanced",
  "applicationType": "open"
}
```

### 6. Frontend Form Implementation

The client job posting form ([JobForm.jsx](freshlancer-frontend/src/pages/client/JobForm.jsx)) correctly implements all required fields:

- ✅ Title input with validation
- ✅ Description textarea with validation
- ✅ Category dropdown with all allowed values
- ✅ Skills input with add/remove functionality
- ✅ Budget min/max inputs with validation
- ✅ Currency selector with 36 currency options
- ✅ Project duration dropdown
- ✅ Deadline date picker with future date validation
- ✅ Experience level dropdown
- ✅ Application type selection

### 7. Backend Validation

The backend ([jobPostModel.js](FreeStudent-API/models/jobPostModel.js)) enforces:

- ✅ All required fields are present
- ✅ String length constraints
- ✅ Enum value validation
- ✅ Budget range validation (max >= min)
- ✅ Future date validation for deadline
- ✅ Skills array length (1-10)
- ✅ Auto-generation of slug from title

### 8. Common Errors and Solutions

#### Error: "Job post must have a title"
**Solution:** Ensure the `title` field is included and is between 5-100 characters

#### Error: "Maximum budget must be greater than or equal to minimum budget"
**Solution:** Ensure `budget.max` is greater than or equal to `budget.min`

#### Error: "Deadline must be in the future"
**Solution:** Select a date that is after today

#### Error: "Job post must have between 1 and 10 skills"
**Solution:** Add at least one skill and ensure no more than 10 skills

#### Error: "Invalid category selected"
**Solution:** Use one of the allowed category values listed above

#### Error: "Experience level must be Beginner, Intermediate, or Advanced"
**Solution:** Use exactly one of the three allowed experience levels

### 9. Job Posting Flow

1. **Client clicks "Post New Job"** → Navigates to `/client/jobs/new`
2. **Client fills form** → All required fields validated on frontend
3. **Client submits form** → Frontend sends POST request to `/jobs`
4. **Backend validates** → Checks all validations and constraints
5. **Job created** → Saved to database with auto-generated fields
6. **Client redirected** → Back to jobs list with success message
7. **Job visible to students** → Appears in student job browsing with status 'open'

### 10. Integration Points

The job posting integrates with:

- **Student Job Browsing** - Students see all 'open' jobs
- **Application System** - Students can apply to jobs
- **Notification System** - Notifies relevant parties
- **Search/Filter** - Jobs are searchable by category, skills, budget
- **Admin Dashboard** - Admins can view all jobs

### 11. Points System (Clients)

Note: Job posting may consume points from the client's package. Ensure clients have sufficient points before posting.

## Testing Checklist

Before deploying, verify:

- [ ] Client can create job with all required fields
- [ ] Validation errors show for missing/invalid fields
- [ ] Budget validation works (max >= min)
- [ ] Deadline validation rejects past dates
- [ ] Skills can be added/removed (1-10 limit)
- [ ] Created job appears in client's job list
- [ ] Created job appears in student job browse (with status 'open')
- [ ] Job data structure matches backend model
- [ ] All enum values are accepted
- [ ] Client can edit their own jobs
- [ ] Students can apply to the job
- [ ] Status updates work correctly (open → in_progress → completed)

## Status Consistency

**IMPORTANT:** The system uses **underscores** for status values:
- ✅ `open`
- ✅ `in_progress` (NOT `in-progress`)
- ✅ `completed`
- ✅ `cancelled`

All frontend components have been updated to use the correct underscore format.
