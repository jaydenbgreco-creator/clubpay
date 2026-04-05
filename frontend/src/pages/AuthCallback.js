import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuthCallback = () => {
  const navigate = useNavigate();
  const { setUser, checkAuth } = useAuth();
  const [error, setError] = useState('');

  const handleCallback = useCallback(async () => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace('#', ''));
    const sessionId = params.get('session_id');

    if (!sessionId) {
      setError('No session ID found');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/auth/google/session`,
        { session_id: sessionId },
        { withCredentials: true }
      );

      if (response.data) {
        setUser(response.data);
        const role = response.data.role;
        if (role === 'admin' || role === 'staff') {
          navigate('/dashboard');
        } else if (role === 'parent') {
          navigate('/parent');
        } else {
          navigate('/student');
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed');
      setTimeout(() => navigate('/login'), 2000);
    }
  }, [navigate, setUser]);

  useEffect(() => {
    handleCallback();
  }, [handleCallback]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        {error ? (
          <div className="text-rose-500 font-bold">{error}</div>
        ) : (
          <div>
            <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Signing you in...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
