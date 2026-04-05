import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useClub } from '../context/ClubContext';
import { clubsApi } from '../services/api';
import { toast } from 'sonner';
import {
  Coins, Users, LogOut, LayoutDashboard, Trophy, Scan,
  History, Menu, Shield, Settings, Plus, Pencil, Trash2,
  Building2, X
} from 'lucide-react';

const ClubManagementPage = () => {
  const { user, logout, isAdmin } = useAuth();
  const { settings } = useSettings();
  const { clubs, activeClub, switchClub, refreshClubs } = useClub();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClub, setEditingClub] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const baseNavItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/members', icon: Users, label: 'Members' },
    { path: '/transactions', icon: History, label: 'Transactions' },
    { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { path: '/scanner', icon: Scan, label: 'Scan Station' },
  ];

  const navItems = isAdmin
    ? [...baseNavItems,
        { path: '/admin/clubs', icon: Building2, label: 'Clubs' },
        { path: '/admin/staff', icon: Shield, label: 'Staff' },
        { path: '/admin/settings', icon: Settings, label: 'Settings' }
      ]
    : baseNavItems;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSaving(true);
    try {
      if (editingClub) {
        await clubsApi.update(editingClub.id, formData);
        toast.success('Club updated');
      } else {
        await clubsApi.create(formData);
        toast.success('Club created');
      }
      refreshClubs();
      setShowAddModal(false);
      setEditingClub(null);
      setFormData({ name: '', description: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save club');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (club) => {
    if (!window.confirm(`Delete "${club.name}"? This cannot be undone.`)) return;
    try {
      await clubsApi.delete(club.id);
      toast.success('Club deleted');
      refreshClubs();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete club');
    }
  };

  const openEdit = (club) => {
    setEditingClub(club);
    setFormData({ name: club.name, description: club.description || '' });
    setShowAddModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: settings?.accent_color || '#f59e0b' }}>
              <Coins className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900" style={{ fontFamily: 'Libre Franklin, sans-serif' }}>{settings?.app_name || 'ClubPay'}</h1>
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
                  ? 'text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
              style={location.pathname === item.path ? { backgroundColor: settings?.primary_color || '#0ea5e9' } : {}}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
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
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-500 transition-colors" data-testid="logout-btn">
              <LogOut className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="flex-1 lg:ml-64">
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-2" data-testid="mobile-menu-btn">
            <Menu className="w-6 h-6 text-slate-600" />
          </button>
          <span className="font-black text-slate-900" style={{ fontFamily: 'Libre Franklin, sans-serif' }}>Clubs</span>
          <div className="w-10" />
        </header>

        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black text-slate-900" style={{ fontFamily: 'Libre Franklin, sans-serif' }} data-testid="clubs-title">
                Clubs
              </h2>
              <p className="text-slate-500 mt-1">{clubs.length} club{clubs.length !== 1 ? 's' : ''} total</p>
            </div>
            <button
              onClick={() => { setEditingClub(null); setFormData({ name: '', description: '' }); setShowAddModal(true); }}
              className="btn-primary flex items-center gap-2"
              data-testid="add-club-btn"
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
              Add Club
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clubs.map((club) => (
              <div
                key={club.id}
                className={`bg-white rounded-3xl shadow-sm border-2 p-6 transition-all hover:shadow-md cursor-pointer ${
                  activeClub?.id === club.id ? 'border-sky-400' : 'border-slate-100'
                }`}
                onClick={() => switchClub(club)}
                data-testid={`club-card-${club.id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center">
                    <Building2 className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(club); }}
                      className="p-2 text-slate-400 hover:text-sky-500 transition-colors rounded-xl hover:bg-slate-50"
                      data-testid={`edit-club-${club.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(club); }}
                      className="p-2 text-slate-400 hover:text-rose-500 transition-colors rounded-xl hover:bg-slate-50"
                      data-testid={`delete-club-${club.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-1" style={{ fontFamily: 'Libre Franklin, sans-serif' }}>
                  {club.name}
                </h3>
                {club.description && (
                  <p className="text-sm text-slate-500 mb-3">{club.description}</p>
                )}
                <div className="flex items-center gap-2 mt-4">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-bold text-slate-600">{club.member_count || 0} members</span>
                </div>
                {activeClub?.id === club.id && (
                  <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 bg-sky-50 text-sky-600 text-xs font-bold rounded-full">
                    Active
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-900" style={{ fontFamily: 'Libre Franklin, sans-serif' }}>
                {editingClub ? 'Edit Club' : 'Add New Club'}
              </h3>
              <button onClick={() => { setShowAddModal(false); setEditingClub(null); }} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Club Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none transition-all"
                  placeholder="e.g. STEM Club"
                  required
                  data-testid="club-name-input"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none transition-all"
                  placeholder="Brief description of the club"
                  rows={3}
                  data-testid="club-desc-input"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingClub(null); }}
                  className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 btn-primary"
                  data-testid="save-club-btn"
                >
                  {saving ? 'Saving...' : editingClub ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubManagementPage;
