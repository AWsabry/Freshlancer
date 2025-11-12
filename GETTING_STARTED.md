# Getting Started with Freshlancer

## Quick Start Guide

This guide will help you get the Freshlancer platform running on your local machine in minutes.

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 18 or higher ([Download](https://nodejs.org/))
- **MongoDB** 6 or higher ([Download](https://www.mongodb.com/try/download/community))
- **npm** (comes with Node.js)

## Step-by-Step Setup

### 1. Clone/Download the Project

If you haven't already, ensure you have the Freshlancer directory:

```bash
cd d:/Freshlancer
```

You should see two directories:
- `FreeStudent-API/` (Backend)
- `freshlancer-frontend/` (Frontend)

### 2. Set Up MongoDB

#### Option A: Local MongoDB
```bash
# Start MongoDB service
# Windows:
net start MongoDB

# Mac/Linux:
sudo systemctl start mongod
```

#### Option B: MongoDB Atlas (Cloud)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Get connection string
4. Use in backend .env file

### 3. Set Up Backend API

```bash
# Navigate to backend directory
cd FreeStudent-API

# Install dependencies (first time only)
npm install

# Create environment file
cp .env.example .env
```

Edit `.env` file:
```env
NODE_ENV=development
PORT=5000
DATABASE=mongodb://localhost:27017/freshlancer
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90
```

**Important:** Change `JWT_SECRET` to a random string!

```bash
# Start the backend server
npm start

# You should see:
# Server running on port 5000
# Database connected successfully
```

### 4. Set Up Frontend

Open a **NEW terminal window** (keep backend running):

```bash
# Navigate to frontend directory
cd d:/Freshlancer/freshlancer-frontend

# Install dependencies (first time only)
npm install

# Create environment file (optional)
cp .env.example .env

# Start the development server
npm run dev

# You should see:
# VITE ready in XXXms
# Local: http://localhost:3000
```

### 5. Open the Application

Open your browser and go to:
```
http://localhost:3000
```

You should see the Freshlancer login page!

## First Steps

### Create Your First Admin User

1. Register a new account at http://localhost:3000/register
2. Choose role: **Client** (for testing purposes)
3. Complete registration

**Manual Admin Creation (Optional):**
To create an admin user directly in the database:

```bash
# Connect to MongoDB
mongosh

# Use the database
use freshlancer

# Update a user to admin
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { role: "admin" } }
)
```

### Test Student Flow

1. Register as **Student**
2. You'll be redirected to `/student/verification`
3. Upload a verification document
4. Use admin account to approve it
5. Browse jobs and apply

### Test Client Flow

1. Register as **Client**
2. Go to `/client/packages`
3. View available packages
4. Post a job (when implemented)
5. Review applications

## Common Issues & Solutions

### Issue: "Cannot connect to MongoDB"
**Solution:**
- Check if MongoDB is running: `mongosh`
- Verify connection string in `.env`
- Try MongoDB Atlas cloud option

### Issue: "Port 5000 already in use"
**Solution:**
```bash
# Change port in backend .env
PORT=5001

# Update frontend proxy in vite.config.js
target: 'http://localhost:5001'
```

### Issue: "npm install fails"
**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and try again
rm -rf node_modules package-lock.json
npm install
```

### Issue: "CORS errors in browser"
**Solution:**
- Ensure backend is running
- Check proxy configuration in `vite.config.js`
- Clear browser cache

### Issue: "Module not found" errors
**Solution:**
```bash
# Reinstall dependencies
npm install

# Restart dev server
npm run dev
```

## Directory Structure

```
Freshlancer/
├── FreeStudent-API/              # Backend (Port 5000)
│   ├── models/                   # Database models
│   ├── controllers/              # Request handlers
│   ├── routers/                  # API routes
│   ├── utils/                    # Helper functions
│   ├── app.js                    # Express app
│   ├── server.js                 # Server entry
│   └── package.json
│
├── freshlancer-frontend/         # Frontend (Port 3000)
│   ├── src/
│   │   ├── components/           # UI components
│   │   ├── pages/                # Page components
│   │   ├── services/             # API calls
│   │   ├── stores/               # State management
│   │   ├── layouts/              # Layout components
│   │   ├── App.jsx               # Main app
│   │   └── main.jsx              # Entry point
│   ├── public/                   # Static assets
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── README.md                     # Main documentation
└── GETTING_STARTED.md           # This file
```

## Development Workflow

### Running Both Servers

**Terminal 1 (Backend):**
```bash
cd FreeStudent-API
npm start
```

**Terminal 2 (Frontend):**
```bash
cd freshlancer-frontend
npm run dev
```

### Making Changes

#### Backend Changes:
1. Edit files in `FreeStudent-API/`
2. Server auto-restarts (nodemon)
3. Test with Postman or frontend

#### Frontend Changes:
1. Edit files in `freshlancer-frontend/src/`
2. Browser auto-refreshes (Vite HMR)
3. Changes appear instantly

## Testing the Application

### 1. Test Authentication
- Register new user
- Login
- Check if token is stored in localStorage (DevTools → Application → Local Storage)

### 2. Test Student Verification
- Login as student
- Go to Verification page
- Upload document
- Check status

### 3. Test Subscription System
- Login as student
- Go to Subscription page
- View current plan (should be Free)
- Check application limit

### 4. Test Client Packages
- Login as client
- Go to Packages page
- View available packages
- Test purchase flow (placeholder)

### 5. Test API Endpoints

Use tools like Postman or curl:

```bash
# Health check
curl http://localhost:5000

# Login
curl -X POST http://localhost:5000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get profile (with token)
curl http://localhost:5000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Database Management

### View Data
```bash
# Connect to MongoDB
mongosh

# Switch to database
use freshlancer

# List collections
show collections

# View users
db.users.find().pretty()

# View verifications
db.studentverifications.find().pretty()

# Count documents
db.users.countDocuments()
```

### Clear Data
```bash
# Drop entire database (⚠️ Warning: deletes all data!)
use freshlancer
db.dropDatabase()

# Delete specific collection
db.users.deleteMany({})
```

## Deployment (Production)

### Backend Deployment

**Option 1: Heroku**
```bash
heroku create freshlancer-api
heroku config:set NODE_ENV=production
heroku config:set DATABASE=mongodb+srv://...
heroku config:set JWT_SECRET=...
git push heroku main
```

**Option 2: Railway**
```bash
railway login
railway init
railway up
```

### Frontend Deployment

**Option 1: Netlify**
```bash
cd freshlancer-frontend
npm run build
netlify deploy --prod --dir=dist
```

**Option 2: Vercel**
```bash
cd freshlancer-frontend
npm run build
vercel --prod
```

## Next Steps

Now that you have the platform running:

1. **Explore the Code:**
   - Backend: `FreeStudent-API/controllers/`
   - Frontend: `freshlancer-frontend/src/pages/`

2. **Read Documentation:**
   - `DATABASE_SCHEMA_DOCUMENTATION.md` - Database structure
   - `CONTROLLERS_DOCUMENTATION.md` - API endpoints
   - `IMPLEMENTATION_GUIDE.md` - Frontend implementation

3. **Implement Missing Features:**
   - Job browsing page
   - Application submission form
   - Contract milestone UI
   - Messaging system
   - Payment gateway integration

4. **Add Enhancements:**
   - File upload for documents
   - Real-time messaging (Socket.io)
   - Email notifications
   - Push notifications
   - Advanced search

## Useful Commands

### Backend
```bash
npm start          # Start server
npm run dev        # Start with nodemon (auto-restart)
npm test           # Run tests (if available)
```

### Frontend
```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview production build
```

### Database
```bash
mongosh                    # Connect to MongoDB
use freshlancer           # Switch to database
show collections          # List all collections
db.users.find()          # Query users
```

## Resources

- **Backend Docs:** `FreeStudent-API/CONTROLLERS_DOCUMENTATION.md`
- **Frontend Docs:** `freshlancer-frontend/README.md`
- **API Testing:** Use Postman or Thunder Client
- **MongoDB GUI:** MongoDB Compass
- **React DevTools:** Browser extension for debugging

## Support

If you encounter issues:

1. Check this guide
2. Review error messages in terminal/browser console
3. Check MongoDB connection
4. Verify all dependencies are installed
5. Restart both servers

## Success Checklist

✅ MongoDB installed and running
✅ Backend dependencies installed (`npm install`)
✅ Backend .env file created
✅ Backend server running on port 5000
✅ Frontend dependencies installed
✅ Frontend server running on port 3000
✅ Can access http://localhost:3000
✅ Can register a new user
✅ Can login successfully

**If all checked, you're ready to develop!** 🎉

---

**Need Help?** Check the documentation or review the code comments.
