import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { Toaster } from 'sonner';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AuthCallback from './pages/AuthCallback';
import AdminDashboard from './pages/AdminDashboard';
import MembersPage from './pages/MembersPage';
import AddMemberPage from './pages/AddMemberPage';
import EditMemberPage from './pages/EditMemberPage';
import BulkImportPage from './pages/BulkImportPage';
import TransactionsPage from './pages/TransactionsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ScannerPage from './pages/ScannerPage';
import StudentDashboard from './pages/StudentDashboard';
import ParentDashboard from './pages/ParentDashboard';
import StaffManagementPage from './pages/StaffManagementPage';
import SettingsPage from './pages/SettingsPage';

import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // If user data was passed from AuthCallback, use it
  if (location.state?.user) {
    return children;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect based on role
    if (user.role === 'student') return <Navigate to="/student" replace />;
    if (user.role === 'parent') return <Navigate to="/parent" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    if (user.role === 'admin' || user.role === 'staff') {
      return <Navigate to="/dashboard" replace />;
    }
    if (user.role === 'student') {
      return <Navigate to="/student" replace />;
    }
    if (user.role === 'parent') {
      return <Navigate to="/parent" replace />;
    }
  }

  return children;
};

// Router component that handles OAuth callback synchronously
function AppRouter() {
  const location = useLocation();

  // Check URL fragment (not query params) for session_id - MUST be synchronous
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Admin/Staff Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={['admin', 'staff']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/members" element={
        <ProtectedRoute allowedRoles={['admin', 'staff']}>
          <MembersPage />
        </ProtectedRoute>
      } />
      <Route path="/members/new" element={
        <ProtectedRoute allowedRoles={['admin', 'staff']}>
          <AddMemberPage />
        </ProtectedRoute>
      } />
      <Route path="/members/:memberId/edit" element={
        <ProtectedRoute allowedRoles={['admin', 'staff']}>
          <EditMemberPage />
        </ProtectedRoute>
      } />
      <Route path="/members/import" element={
        <ProtectedRoute allowedRoles={['admin', 'staff']}>
          <BulkImportPage />
        </ProtectedRoute>
      } />
      <Route path="/transactions" element={
        <ProtectedRoute allowedRoles={['admin', 'staff']}>
          <TransactionsPage />
        </ProtectedRoute>
      } />
      <Route path="/leaderboard" element={
        <ProtectedRoute>
          <LeaderboardPage />
        </ProtectedRoute>
      } />
      <Route path="/scanner" element={
        <ProtectedRoute allowedRoles={['admin', 'staff']}>
          <ScannerPage />
        </ProtectedRoute>
      } />

      {/* Admin Only Routes */}
      <Route path="/admin/staff" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <StaffManagementPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/settings" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <SettingsPage />
        </ProtectedRoute>
      } />

      {/* Student Routes */}
      <Route path="/student" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentDashboard />
        </ProtectedRoute>
      } />

      {/* Parent Routes */}
      <Route path="/parent" element={
        <ProtectedRoute allowedRoles={['parent']}>
          <ParentDashboard />
        </ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRouter />
          <Toaster 
            position="top-right" 
            toastOptions={{
              style: {
                borderRadius: '16px',
                fontFamily: 'DM Sans, sans-serif'
              }
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;
