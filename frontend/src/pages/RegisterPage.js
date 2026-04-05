import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Coins, UserPlus, AlertCircle } from 'lucide-react';

const formatApiErrorDetail = (detail) => {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
};

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const user = await register(formData.email, formData.password, formData.name, formData.role);
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-500 rounded-3xl mb-4 shadow-lg">
            <Coins className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight" style={{ fontFamily: 'Libre Franklin, sans-serif' }}>
            Club Bucks
          </h1>
          <p className="text-slate-500 mt-2">Create your account</p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700" data-testid="register-error">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-field"
                placeholder="Your full name"
                required
                data-testid="register-name-input"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                placeholder="your@email.com"
                required
                data-testid="register-email-input"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">I am a...</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="input-field"
                data-testid="register-role-select"
              >
                <option value="student">Student</option>
                <option value="parent">Parent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field"
                placeholder="Create a password"
                required
                data-testid="register-password-input"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input-field"
                placeholder="Confirm your password"
                required
                data-testid="register-confirm-password-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
              data-testid="register-submit-btn"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-5 h-5" strokeWidth={2.5} />
                  Create Account
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 mt-6 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-sky-500 font-bold hover:text-sky-600" data-testid="login-link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
