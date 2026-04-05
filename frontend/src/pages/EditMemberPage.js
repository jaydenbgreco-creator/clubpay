import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { membersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Coins, Users, ChevronLeft, Save, LayoutDashboard, History, Trophy, Scan, LogOut, Menu
} from 'lucide-react';
import { toast } from 'sonner';

const EditMemberPage = () => {
  const { memberId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    status: 'Active',
    starting_balance: 0,
    notes: ''
  });
  const [member, setMember] = useState(null);

  useEffect(() => {
    loadMember();
  }, [memberId]);

  const loadMember = async () => {
    try {
      const response = await membersApi.getById(memberId);
      const m = response.data;
      setMember(m);
      setFormData({
        first_name: m.first_name || '',
        last_name: m.last_name || '',
        status: m.status || 'Active',
        starting_balance: m.starting_balance || 0,
        notes: m.notes || ''
      });
    } catch (error) {
      toast.error('Failed to load member');
      navigate('/members');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.first_name) {
      toast.error('First Name is required');
      return;
    }
    
    setSaving(true);
    try {
      await membersApi.update(memberId, formData);
      toast.success('Member updated successfully');
      navigate('/members');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update member');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/members', icon: Users, label: 'Members' },
    { path: '/transactions', icon: History, label: 'Transactions' },
    { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { path: '/scanner', icon: Scan, label: 'Scan Station' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center">
              <Coins className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900" style={{ fontFamily: 'Libre Franklin, sans-serif' }}>ClubPay</h1>
              <p className="text-xs text-slate-500 font-medium">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="px-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
                location.pathname.startsWith('/members') && item.path === '/members'
                  ? 'bg-sky-50 text-sky-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="w-5 h-5" strokeWidth={2.5} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
              <span className="text-slate-600 font-bold">{user?.name?.[0]?.toUpperCase() || 'A'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
              <LogOut className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <main className="flex-1 lg:ml-64">
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-2">
            <Menu className="w-6 h-6 text-slate-600" />
          </button>
          <span className="font-black text-slate-900" style={{ fontFamily: 'Libre Franklin, sans-serif' }}>Edit Member</span>
          <div className="w-10" />
        </header>

        <div className="p-6 md:p-8">
          <button onClick={() => navigate('/members')} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6" data-testid="back-btn">
            <ChevronLeft className="w-5 h-5" />
            Back to Members
          </button>

          <div className="max-w-2xl">
            <h2 className="text-3xl font-black text-slate-900 mb-2" style={{ fontFamily: 'Libre Franklin, sans-serif' }} data-testid="edit-member-title">
              Edit Member
            </h2>
            <p className="text-slate-500 mb-8">Update details for {member?.display_name} ({memberId})</p>

            <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 space-y-6">
              {/* Current Balance Display */}
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
                <p className="text-amber-700 font-bold text-sm mb-1">Current Balance</p>
                <p className="text-3xl font-black text-amber-600" style={{ fontFamily: 'Libre Franklin, sans-serif' }}>
                  {member?.current_balance?.toLocaleString() || 0} <span className="text-lg">bucks</span>
                </p>
                <p className="text-xs text-amber-600 mt-2">
                  Earned: {member?.earned || 0} | Bonus: {member?.bonus || 0} | Spent: {member?.spent || 0} | Adj: {member?.adjustments || 0}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">First Name *</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="input-field"
                    placeholder="First name"
                    required
                    data-testid="first-name-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="input-field"
                    placeholder="Last name"
                    data-testid="last-name-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input-field"
                    data-testid="status-select"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Hold">On Hold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Starting Balance</label>
                  <input
                    type="number"
                    value={formData.starting_balance}
                    onChange={(e) => setFormData({ ...formData, starting_balance: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                    placeholder="0"
                    data-testid="starting-balance-input"
                  />
                  <p className="text-xs text-slate-400 mt-1">Changing this will adjust current balance</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input-field min-h-[100px]"
                  placeholder="Optional notes about this member..."
                  data-testid="notes-input"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => navigate('/members')} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2" data-testid="save-member-btn">
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" strokeWidth={2.5} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditMemberPage;
