import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuthCallback = () => {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = window.location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);
      
      if (!sessionIdMatch) {
        navigate('/login');
        return;
      }

      const sessionId = sessionIdMatch[1];

      try {
        const response = await axios.post(
          `${API_URL}/api/auth/google/session`,
          { session_id: sessionId },
          { withCredentials: true }
        );

        const user = response.data;
        
        // Clear the hash from URL
        window.history.replaceState(null, '', window.location.pathname);

        // Redirect based on role
        if (user.role === 'admin' || user.role === 'staff') {
          navigate('/dashboard', { state: { user } });
        } else if (user.role === 'parent') {
          navigate('/parent', { state: { user } });
        } else {
          navigate('/student', { state: { user } });
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login');
      }
    };

    processAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-500 rounded-3xl mb-4 shadow-lg animate-pulse">
          <Coins className="w-10 h-10 text-white" strokeWidth={2.5} />
        </div>
        <p className="text-slate-600 font-medium">Signing you in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
