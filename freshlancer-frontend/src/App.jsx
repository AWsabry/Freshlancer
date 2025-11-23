import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import ProtectedRoute from './components/common/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';

// Payment pages
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailed from './pages/PaymentFailed';

// Student pages
import StudentDashboard from './pages/student/Dashboard';
import StudentVerification from './pages/student/Verification';
import StudentJobs from './pages/student/Jobs';
import StudentJobDetails from './pages/student/JobDetails';
import StudentApplications from './pages/student/Applications';
import StudentApplicationDetails from './pages/student/ApplicationDetails';
import StudentContracts from './pages/student/Contracts';
import StudentSubscription from './pages/student/Subscription';
import StudentPayment from './pages/student/Payment';
import StudentMessages from './pages/student/Messages';
import StudentNotifications from './pages/student/Notifications';
import StudentProfile from './pages/student/Profile';
import StudentReviews from './pages/student/Reviews';

// Client pages
import ClientDashboard from './pages/client/Dashboard';
import ClientJobs from './pages/client/Jobs';
import ClientJobForm from './pages/client/JobForm';
import ClientJobDetails from './pages/client/JobDetails';
import ClientApplications from './pages/client/Applications';
import JobApplicationsDetail from './pages/client/JobApplicationsDetail';
import ClientContracts from './pages/client/Contracts';
import ClientPackages from './pages/client/Packages';
import ClientPayment from './pages/client/Payment';
import ClientMessages from './pages/client/Messages';
import ClientNotifications from './pages/client/Notifications';
import ClientProfile from './pages/client/Profile';
import ClientReviews from './pages/client/Reviews';
import ClientTransactions from './pages/client/Transactions';
import StudentProfileView from './pages/client/StudentProfileView';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminVerifications from './pages/admin/Verifications';
import AdminUsers from './pages/admin/Users';
import AdminApplications from './pages/admin/Applications';
import AdminJobs from './pages/admin/Jobs';
import AdminOffers from './pages/admin/Offers';
import AdminContracts from './pages/admin/Contracts';
import AdminTransactions from './pages/admin/Transactions';
import AdminReviews from './pages/admin/Reviews';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />

      {/* Payment callback routes - public but require authentication to function properly */}
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/failed" element={<PaymentFailed />} />

      {/* Student routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="verification" element={<StudentVerification />} />
        <Route path="jobs" element={<StudentJobs />} />
        <Route path="jobs/:id" element={<StudentJobDetails />} />
        <Route path="applications" element={<StudentApplications />} />
        <Route path="applications/:id" element={<StudentApplicationDetails />} />
        <Route path="contracts" element={<StudentContracts />} />
        <Route path="subscription" element={<StudentSubscription />} />
        <Route path="payment" element={<StudentPayment />} />
        <Route path="messages" element={<StudentMessages />} />
        <Route path="notifications" element={<StudentNotifications />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="reviews" element={<StudentReviews />} />
      </Route>

      {/* Client routes */}
      <Route
        path="/client"
        element={
          <ProtectedRoute allowedRoles={['client']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<ClientDashboard />} />
        <Route path="jobs" element={<ClientJobs />} />
        <Route path="jobs/new" element={<ClientJobForm />} />
        <Route path="jobs/:id" element={<ClientJobDetails />} />
        <Route path="jobs/:id/edit" element={<ClientJobForm />} />
        <Route path="applications" element={<ClientApplications />} />
        <Route path="jobs/:jobId/applications" element={<JobApplicationsDetail />} />
        <Route path="students/:studentId" element={<StudentProfileView />} />
        <Route path="contracts" element={<ClientContracts />} />
        <Route path="packages" element={<ClientPackages />} />
        <Route path="payment" element={<ClientPayment />} />
        <Route path="messages" element={<ClientMessages />} />
        <Route path="notifications" element={<ClientNotifications />} />
        <Route path="profile" element={<ClientProfile />} />
        <Route path="reviews" element={<ClientReviews />} />
        <Route path="transactions" element={<ClientTransactions />} />
      </Route>

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="applications" element={<AdminApplications />} />
        <Route path="verifications" element={<AdminVerifications />} />
        <Route path="jobs" element={<AdminJobs />} />
        <Route path="offers" element={<AdminOffers />} />
        <Route path="contracts" element={<AdminContracts />} />
        <Route path="transactions" element={<AdminTransactions />} />
        <Route path="reviews" element={<AdminReviews />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to={isAuthenticated ? '/student/dashboard' : '/login'} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
