import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    if (window.location.hash?.includes('session_id=')) {
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        withCredentials: true
      });
      setUser(response.data);
    } catch {
      setUser(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (email, password) => {
    const response = await axios.post(`${API_URL}/api/auth/login`, 
      { email, password },
      { withCredentials: true }
    );
    setUser(response.data);
    return response.data;
  }, []);

  const loginWithGoogle = useCallback(() => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  }, []);

  const register = useCallback(async (email, password, name, role = 'student') => {
    const response = await axios.post(`${API_URL}/api/auth/register`,
      { email, password, name, role },
      { withCredentials: true }
    );
    setUser(response.data);
    return response.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
    } catch {
      // Logout failed silently - clear local state anyway
    }
    setUser(false);
  }, []);

  const isAdmin = user && user.role === 'admin';
  const isStaff = user && (user.role === 'admin' || user.role === 'staff');
  const isStudent = user && user.role === 'student';
  const isParent = user && user.role === 'parent';

  const contextValue = useMemo(() => ({
    user,
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
    checkAuth,
    isAdmin,
    isStaff,
    isStudent,
    isParent,
    setUser
  }), [user, loading, login, loginWithGoogle, register, logout, checkAuth, isAdmin, isStaff, isStudent, isParent]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
