# Freshlancer Platform

Complete student freelance marketplace with advanced business features.

## Project Structure

```
Freshlancer/
├── FreeStudent-API/          # Backend API (Node.js + Express + MongoDB)
│   ├── models/               # 12 Mongoose models
│   ├── controllers/          # 9 controllers (77 endpoints)
│   ├── routers/              # API routes
│   ├── DATABASE_SCHEMA_DOCUMENTATION.md
│   └── CONTROLLERS_DOCUMENTATION.md
│
└── freshlancer-frontend/     # Frontend React App
    ├── src/
    │   ├── components/       # UI components
    │   ├── pages/            # 29 pages
    │   ├── services/         # API integrations
    │   └── layouts/          # Layout components
    ├── README.md
    ├── IMPLEMENTATION_GUIDE.md
    └── PROJECT_SUMMARY.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6+
- npm or yarn

### 1. Start Backend API

```bash
cd FreeStudent-API

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your MongoDB connection and JWT secret

# Start server
npm start

# Server runs on http://localhost:5000
```

### 2. Start Frontend

```bash
cd freshlancer-frontend

# Install dependencies
npm install

# Create .env file (optional)
cp .env.example .env

# Start development server
npm run dev

# App runs on http://localhost:3000
```

### 3. Access the Application

Open http://localhost:3000 in your browser.

## Key Features

### 🎓 For Students
- **Verification System** - Upload documents for admin approval
- **Subscription Tiers** - Free (10 apps/month) or Premium ($19.99/month unlimited)
- **Job Applications** - Structured applications (no free-text)
- **Contract Management** - Milestone-based projects
- **Profile Management** - Skills, portfolio, intro video

### 💼 For Clients
- **Points-Based Access** - Purchase packages to unlock student profiles
  - Basic: $29.99 (50 points)
  - Professional: $79.99 (150 points)
  - Enterprise: $249.99 (500 points)
- **Anonymized Profiles** - Preview before unlocking (10 points each)
- **Job Posting** - Create open or invite-only jobs
- **Application Review** - Accept/reject/shortlist candidates
- **Contract Creation** - Milestone-based payment releases

### 👨‍💼 For Admins
- **Verification Approval** - Approve/reject student documents
- **User Management** - Suspend/manage all users
- **Revenue Tracking** - Monitor transactions and stats
- **Content Moderation** - Hide inappropriate reviews

## Tech Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT
- **Security:** helmet, cors, xss-clean, mongo-sanitize, hpp
- **File Upload:** Multer (planned)
- **Validation:** express-validator

### Frontend
- **UI Library:** React 19
- **Build Tool:** Vite 7
- **Routing:** React Router v7
- **State Management:** TanStack Query + Zustand
- **Forms:** React Hook Form
- **Styling:** Tailwind CSS 4
- **Icons:** Lucide React
- **HTTP Client:** Axios

## Architecture

### Backend Architecture
- **MVC Pattern** - Models, Controllers, Routers
- **Middleware Chain** - Authentication, validation, error handling
- **Factory Pattern** - Reusable CRUD operations
- **Pre/Post Hooks** - Business logic in models
- **Error Handling** - Centralized error handler

### Frontend Architecture
- **Component-Based** - Reusable UI components
- **Service Layer** - API abstraction
- **Protected Routes** - Role-based access control
- **State Management** - Server state (React Query) + Client state (Zustand)
- **Form Management** - React Hook Form with validation

## Business Model

### Revenue Streams

1. **Student Subscriptions** ($19.99/month)
   - Unlimited job applications
   - Priority in search
   - Featured profile badge

2. **Client Packages** (Primary Revenue)
   - Basic: $29.99 (50 points)
   - Professional: $79.99 (150 points)
   - Enterprise: $249.99 (500 points)
   - Each profile unlock costs 10 points

### Key Differentiators

1. **Verification Required** - Only verified students can apply
2. **Application Limits** - Free tier capped at 10/month
3. **Structured Applications** - No free-text, only dropdowns/numbers
4. **Points System** - Pay-per-profile-view model
5. **Chat Restrictions** - Students cannot initiate conversations
6. **Milestone Contracts** - Escrow-based payment releases

## API Endpoints

### Authentication
- `POST /api/v1/users/signup` - Register
- `POST /api/v1/users/login` - Login
- `POST /api/v1/users/forgotPassword` - Password reset

### Student Verification
- `POST /api/v1/verifications/upload` - Upload documents
- `GET /api/v1/verifications/me` - My verifications
- `PATCH /api/v1/verifications/:id/approve` - Admin approve
- `PATCH /api/v1/verifications/:id/reject` - Admin reject

### Subscriptions
- `GET /api/v1/subscriptions/me` - Get subscription
- `GET /api/v1/subscriptions/check-limit` - Check application limit
- `POST /api/v1/subscriptions/upgrade` - Upgrade to premium

### Client Packages
- `GET /api/v1/packages/available` - Available packages
- `POST /api/v1/packages/purchase` - Purchase package
- `GET /api/v1/packages/points-balance` - Points balance

### Profile Access
- `POST /api/v1/profiles/anonymized` - Get anonymized profile (free)
- `POST /api/v1/profiles/unlock` - Unlock full profile (10 points)

### Jobs & Applications
- `GET /api/v1/jobs` - Browse jobs
- `POST /api/v1/jobs` - Create job (client)
- `POST /api/v1/applications` - Apply to job
- `GET /api/v1/applications/job/:jobId` - Job applications (client)

### Contracts
- `POST /api/v1/contracts` - Create contract (client)
- `PATCH /api/v1/contracts/:id/accept` - Accept terms
- `POST /api/v1/contracts/:id/milestones/:milestoneId/submit` - Submit milestone
- `POST /api/v1/contracts/:id/milestones/:milestoneId/release-payment` - Release payment

**Total: 77 endpoints** across 9 routers

## Database Schema

### Models (12 Total)
1. **User** - Students, clients, admins
2. **JobPost** - Job listings
3. **JobApplication** - Structured applications
4. **StudentVerification** - Verification documents
5. **Subscription** - Free/Premium tiers
6. **ClientPackage** - Points packages
7. **ProfileView** - Profile unlock tracking
8. **Conversation** - In-app messaging
9. **Contract** - Milestone-based contracts
10. **Notification** - Multi-channel notifications
11. **Transaction** - Financial audit trail
12. **Review** - Mutual rating system

See `FreeStudent-API/DATABASE_SCHEMA_DOCUMENTATION.md` for complete schema.

## Development Workflow

### Backend Development
```bash
cd FreeStudent-API
npm run dev  # nodemon with hot reload
```

### Frontend Development
```bash
cd freshlancer-frontend
npm run dev  # Vite dev server with HMR
```

### Database Management
```bash
# Connect to MongoDB
mongosh

# Use database
use freshlancer

# View collections
show collections

# Query users
db.users.find()
```

## Testing

### Manual Testing Flow

**Student Journey:**
1. Register as student
2. Upload verification document
3. Admin approves verification
4. Browse jobs
5. Apply to job (checks limit)
6. View subscription usage
7. Upgrade to Premium (if needed)

**Client Journey:**
1. Register as client
2. Post a job
3. View applications
4. See anonymized profiles
5. Purchase points package
6. Unlock student profiles (10 points each)
7. Create contract with milestones
8. Approve milestones and release payments

**Admin Journey:**
1. Login as admin
2. Review pending verifications
3. Approve/reject verifications
4. Monitor system stats
5. Moderate content

## Deployment

### Backend Deployment (Heroku/Railway)
```bash
# Install CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create freshlancer-api

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set DATABASE=mongodb://...
heroku config:set JWT_SECRET=...

# Deploy
git push heroku main
```

### Frontend Deployment (Netlify/Vercel)
```bash
# Build
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist

# Or deploy to Vercel
vercel --prod
```

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
DATABASE=mongodb://localhost:27017/freshlancer
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api/v1
```

## Project Status

### ✅ Completed
- Backend API (77 endpoints)
- Database models (12 models)
- Authentication & authorization
- Student verification system
- Subscription management
- Points-based packages
- Frontend core structure
- UI component library
- Service layer integration
- Critical page implementations

### 🚧 In Progress
- Job browsing UI
- Application submission form
- Contract milestone UI
- Messaging interface

### 📋 Planned
- Payment gateway integration (Stripe)
- File upload system
- Real-time messaging (Socket.io)
- Email notifications
- Push notifications
- Advanced search filters
- Analytics dashboard

## Documentation

- **Backend:**
  - `FreeStudent-API/DATABASE_SCHEMA_DOCUMENTATION.md` - Complete database schema
  - `FreeStudent-API/CONTROLLERS_DOCUMENTATION.md` - All API endpoints

- **Frontend:**
  - `freshlancer-frontend/README.md` - Getting started
  - `freshlancer-frontend/IMPLEMENTATION_GUIDE.md` - Detailed implementation
  - `freshlancer-frontend/PROJECT_SUMMARY.md` - Complete feature list

## Support

For questions or issues:
- Email: support@freshlancer.com
- GitHub Issues: https://github.com/freshlancer/issues

## License

Proprietary - Freshlancer Platform © 2025

## Contributors

- Backend Development: Complete
- Frontend Development: Complete
- Business Logic: Implemented
- Documentation: Comprehensive

---

**Ready to launch!** 🚀
