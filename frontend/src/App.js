import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'sonner';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import MembersPage from './pages/MembersPage';
import AddMemberPage from './pages/AddMemberPage';
import TransactionsPage from './pages/TransactionsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ScannerPage from './pages/ScannerPage';
import StudentDashboard from './pages/StudentDashboard';

import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

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

function AppRoutes() {
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

      {/* Student Routes */}
      <Route path="/student" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentDashboard />
        </ProtectedRoute>
      } />

      {/* Parent Routes - Placeholder */}
      <Route path="/parent" element={
        <ProtectedRoute allowedRoles={['parent']}>
          <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 max-w-md text-center">
              <h2 className="text-2xl font-black text-slate-900 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Parent Dashboard
              </h2>
              <p className="text-slate-500">Coming soon! Link your child's account to view their balance.</p>
            </div>
          </div>
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
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
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
  );
}

export default App;
