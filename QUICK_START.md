# 🚀 Quick Start - Freshlancer Platform

## Prerequisites
- Node.js 18+
- MongoDB 6+

## One-Time Setup

### 1. Backend Setup
```bash
cd FreeStudent-API
npm install
```

Create `.env` file:
```env
NODE_ENV=development
PORT=5000
DATABASE=mongodb://localhost:27017/freshlancer
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90
```

### 2. Frontend Setup
```bash
cd freshlancer-frontend
npm install
```

## Running the Application

### Start Backend (Terminal 1)
```bash
cd FreeStudent-API
npm start
```
✅ Backend running at: `http://localhost:5000`

### Start Frontend (Terminal 2)
```bash
cd freshlancer-frontend
npm run dev
```
✅ Frontend running at: `http://localhost:3001`

## Access the Application
Open your browser: **http://localhost:3001**

## First Time Use

### 1. Register an Account
- Go to: http://localhost:3001/register
- Choose role: **Student** or **Client**
- Fill in details and submit

### 2. Test Student Flow
- Register as **Student**
- Upload verification documents at `/student/verification`
- View subscription at `/student/subscription` (Free tier: 10 apps/month)

### 3. Test Client Flow
- Register as **Client**
- View packages at `/client/packages`
- See points system (Basic/Professional/Enterprise)

### 4. Create Admin (Optional)
Connect to MongoDB:
```bash
mongosh
use freshlancer
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { role: "admin" } }
)
```

## Quick Commands

### Backend
```bash
npm start          # Start server
npm run dev        # Start with auto-restart
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
db.users.find()          # View users
show collections         # List all collections
```

## Troubleshooting

### MongoDB not running
```bash
# Windows
net start MongoDB

# Mac/Linux
sudo systemctl start mongod
```

### Port already in use
The frontend will automatically use port 3001 if 3000 is busy.

### Clear and restart
```bash
# Clear node_modules
rm -rf node_modules package-lock.json
npm install

# Clear browser cache
Ctrl + Shift + Delete
```

## Project Structure
```
Freshlancer/
├── FreeStudent-API/          # Backend (port 5000)
│   ├── models/               # 12 database models
│   ├── controllers/          # 77 API endpoints
│   └── routers/              # API routes
│
└── freshlancer-frontend/     # Frontend (port 3001)
    ├── src/
    │   ├── components/       # UI components
    │   ├── pages/            # 29 pages
    │   └── services/         # API integration
    └── public/
```

## Key URLs

### Frontend
- Login: http://localhost:3001/login
- Register: http://localhost:3001/register
- Student Dashboard: http://localhost:3001/student/dashboard
- Client Dashboard: http://localhost:3001/client/dashboard
- Admin Dashboard: http://localhost:3001/admin/dashboard

### Backend API
- Base URL: http://localhost:5000/api/v1
- Health Check: http://localhost:5000

## Test Credentials

After registering, you can test with:
- **Student:** Verify → Browse Jobs → Apply
- **Client:** Purchase Package → Post Jobs → View Applications
- **Admin:** Approve Verifications → Monitor System

## Next Steps

1. ✅ Start both servers
2. ✅ Register an account
3. ✅ Explore the dashboards
4. ✅ Test key features
5. ✅ Review documentation in README.md

## Documentation
- **Main:** `/README.md` - Full project overview
- **Setup:** `/GETTING_STARTED.md` - Detailed setup guide
- **Frontend:** `/freshlancer-frontend/README.md` - Frontend docs
- **Backend:** `/FreeStudent-API/DATABASE_SCHEMA_DOCUMENTATION.md`

## Support
Check documentation files or review error messages in terminal/console.

---

**Status:** ✅ Ready to use!

**Everything configured and tested.**
