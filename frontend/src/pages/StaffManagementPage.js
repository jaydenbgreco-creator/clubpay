import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Coins, Users, UserPlus, Edit2, Trash2, Key, Shield,
  LayoutDashboard, History, Trophy, Scan, LogOut, Menu, Settings, X
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const StaffManagementPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/staff`, {
        withCredentials: true
      });
      setStaff(response.data);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Admin access required');
        navigate('/dashboard');
      } else {
        toast.error('Failed to load staff');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('All fields are required');
      return;
    }
    
    setSaving(true);
    try {
      await axios.post(`${API_URL}/api/admin/staff`, formData, {
        withCredentials: true
      });
      toast.success('Staff member created!');
      setShowAddModal(false);
      setFormData({ name: '', email: '', password: '' });
      loadStaff();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create staff');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStaff = async () => {
    if (!formData.name) {
      toast.error('Name is required');
      return;
    }
    
    setSaving(true);
    try {
      const updateData = { name: formData.name };
      if (formData.password) {
        updateData.password = formData.password;
      }
      
      await axios.put(`${API_URL}/api/admin/staff/${selectedStaff.user_id}`, updateData, {
        withCredentials: true
      });
      toast.success('Staff member updated!');
      setShowEditModal(false);
      setSelectedStaff(null);
      setFormData({ name: '', email: '', password: '' });
      loadStaff();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update staff');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStaff = async (staffMember) => {
    if (!window.confirm(`Are you sure you want to delete ${staffMember.name}?`)) return;
    
    try {
      await axios.delete(`${API_URL}/api/admin/staff/${staffMember.user_id}`, {
        withCredentials: true
      });
      toast.success('Staff member deleted');
      loadStaff();
    } catch (error) {
      toast.error('Failed to delete staff');
    }
  };

  const openEditModal = (staffMember) => {
    setSelectedStaff(staffMember);
    setFormData({ name: staffMember.name, email: staffMember.email, password: '' });
    setShowEditModal(true);
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
    { path: '/admin/staff', icon: Shield, label: 'Staff' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

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
                location.pathname === item.path
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
          <span className="font-black text-slate-900" style={{ fontFamily: 'Libre Franklin, sans-serif' }}>Staff Management</span>
          <div className="w-10" />
        </header>

        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-3xl font-black text-slate-900" style={{ fontFamily: 'Libre Franklin, sans-serif' }} data-testid="staff-title">
                <Shield className="w-8 h-8 text-sky-500 inline mr-2" />
                Staff Management
              </h2>
              <p className="text-slate-500">Manage your team's access</p>
            </div>
            <button
              onClick={() => { setFormData({ name: '', email: '', password: '' }); setShowAddModal(true); }}
              className="btn-primary flex items-center gap-2"
              data-testid="add-staff-btn"
            >
              <UserPlus className="w-5 h-5" strokeWidth={2.5} />
              Add Staff
            </button>
          </div>

          {/* Info box */}
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 mb-6">
            <p className="text-sky-800 text-sm">
              <strong>Staff members can:</strong> Add/edit members, record transactions, scan QR codes<br />
              <strong>Only you (Admin) can:</strong> Manage staff accounts, change app settings, delete data
            </p>
          </div>

          {/* Staff List */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : staff.length === 0 ? (
              <div className="p-12 text-center">
                <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No staff members yet</p>
                <p className="text-sm text-slate-400 mt-2">Add your first staff member to help manage Club Bucks</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {staff.map((s) => (
                  <div key={s.user_id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors" data-testid={`staff-row-${s.user_id}`}>
                    <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center">
                      <span className="text-sky-600 font-bold text-lg">{s.name?.[0]?.toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900">{s.name}</p>
                      <p className="text-sm text-slate-500">{s.email}</p>
                    </div>
                    <span className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-bold">Staff</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(s)}
                        className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"
                        title="Edit"
                        data-testid={`edit-staff-${s.user_id}`}
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(s)}
                        className="p-2 text-rose-400 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Delete"
                        data-testid={`delete-staff-${s.user_id}`}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()} data-testid="add-staff-modal">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-900" style={{ fontFamily: 'Libre Franklin, sans-serif' }}>
                <UserPlus className="w-5 h-5 text-sky-500 inline mr-2" />
                Add Staff Member
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="Staff member's name"
                  data-testid="staff-name-input"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                  placeholder="staff@example.com"
                  data-testid="staff-email-input"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field"
                  placeholder="Create a password"
                  data-testid="staff-password-input"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleCreateStaff} disabled={saving} className="btn-primary flex-1" data-testid="create-staff-btn">
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : 'Create Staff'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditModal && selectedStaff && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()} data-testid="edit-staff-modal">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-900" style={{ fontFamily: 'Libre Franklin, sans-serif' }}>
                <Edit2 className="w-5 h-5 text-sky-500 inline mr-2" />
                Edit Staff Member
              </h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  data-testid="edit-staff-name-input"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="input-field opacity-50 cursor-not-allowed"
                />
                <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  <Key className="w-4 h-4 inline mr-1" />
                  New Password (optional)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field"
                  placeholder="Leave blank to keep current"
                  data-testid="edit-staff-password-input"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowEditModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleUpdateStaff} disabled={saving} className="btn-primary flex-1" data-testid="update-staff-btn">
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : 'Update Staff'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagementPage;
