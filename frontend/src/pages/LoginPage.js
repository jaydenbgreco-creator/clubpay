import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, AlertCircle } from 'lucide-react';

const formatApiErrorDetail = (detail) => {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
};

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'admin' || user.role === 'staff') {
        navigate('/dashboard');
      } else if (user.role === 'parent') {
        navigate('/parent');
      } else {
        navigate('/student');
      }
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #e1eef9 0%, #bfdff1 50%, #e1eef9 100%)' }}>
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Brand Logo */}
        <div className="text-center mb-8">
          <img src="/brand/logo-horizontal.png" alt="Boys & Girls Clubs" className="h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: 'Libre Franklin, sans-serif', color: '#004b87' }}>
            ClubPay
          </h1>
          <p className="text-sm font-semibold mt-1" style={{ color: '#0080c6' }}>Digital Bucks</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8">
          {/* Google Sign In */}
          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 rounded-full py-3 px-6 font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all mb-6"
            data-testid="google-login-btn"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-400">or sign in with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700" data-testid="login-error">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="your@email.com"
                required
                data-testid="login-email-input"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Enter your password"
                required
                data-testid="login-password-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
              data-testid="login-submit-btn"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" strokeWidth={2.5} />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 mt-6 text-sm">
          Need an account?{' '}
          <Link to="/register" className="font-bold hover:underline" style={{ color: '#0080c6' }} data-testid="register-link">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
