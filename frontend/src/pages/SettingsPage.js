import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import {
  Coins, Settings, Palette, Type, Sun, Moon, Save,
  LayoutDashboard, Users, History, Trophy, Scan, LogOut, Menu, Shield, Check
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const colorPresets = [
  { name: 'Sky Blue', primary: '#0ea5e9', accent: '#f59e0b' },
  { name: 'Emerald', primary: '#10b981', accent: '#f59e0b' },
  { name: 'Purple', primary: '#8b5cf6', accent: '#ec4899' },
  { name: 'Rose', primary: '#f43f5e', accent: '#f59e0b' },
  { name: 'Orange', primary: '#f97316', accent: '#0ea5e9' },
  { name: 'Indigo', primary: '#6366f1', accent: '#f59e0b' },
];

const SettingsPage = () => {
  const { user, logout } = useAuth();
  const { settings, refreshSettings } = useSettings();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    app_name: 'Club Bucks',
    primary_color: '#0ea5e9',
    accent_color: '#f59e0b',
    theme: 'light'
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        app_name: settings.app_name || 'Club Bucks',
        primary_color: settings.primary_color || '#0ea5e9',
        accent_color: settings.accent_color || '#f59e0b',
        theme: settings.theme || 'light'
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.put(`${API_URL}/api/settings`, formData, {
        withCredentials: true
      });
      toast.success('Settings saved!');
      refreshSettings();
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Admin access required');
      } else {
        toast.error('Failed to save settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const applyColorPreset = (preset) => {
    setFormData({
      ...formData,
      primary_color: preset.primary,
      accent_color: preset.accent
    });
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
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: formData.accent_color }}>
              <Coins className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900" style={{ fontFamily: 'Nunito, sans-serif' }}>{formData.app_name}</h1>
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
              style={location.pathname === item.path ? { backgroundColor: formData.primary_color } : {}}
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
          <span className="font-black text-slate-900" style={{ fontFamily: 'Nunito, sans-serif' }}>Settings</span>
          <div className="w-10" />
        </header>

        <div className="p-6 md:p-8 max-w-3xl">
          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-900" style={{ fontFamily: 'Nunito, sans-serif' }} data-testid="settings-title">
              <Settings className="w-8 h-8 inline mr-2" style={{ color: formData.primary_color }} />
              App Settings
            </h2>
            <p className="text-slate-500">Customize your Club Bucks experience</p>
          </div>

          {/* App Name */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-6">
            <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
              <Type className="w-5 h-5" style={{ color: formData.primary_color }} />
              App Name
            </h3>
            <input
              type="text"
              value={formData.app_name}
              onChange={(e) => setFormData({ ...formData, app_name: e.target.value })}
              className="input-field text-xl font-bold"
              placeholder="Club Bucks"
              data-testid="app-name-input"
            />
            <p className="text-sm text-slate-400 mt-2">This name appears in the header and login page</p>
          </div>

          {/* Color Theme */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-6">
            <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5" style={{ color: formData.primary_color }} />
              Color Theme
            </h3>
            
            {/* Presets */}
            <p className="text-sm font-bold text-slate-600 mb-3">Quick Presets</p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
              {colorPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyColorPreset(preset)}
                  className={`relative p-3 rounded-2xl border-2 transition-all ${
                    formData.primary_color === preset.primary
                      ? 'border-slate-900'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  data-testid={`preset-${preset.name.toLowerCase().replace(' ', '-')}`}
                >
                  <div className="flex gap-1 justify-center mb-2">
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.primary }} />
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.accent }} />
                  </div>
                  <p className="text-xs font-bold text-slate-600 text-center">{preset.name}</p>
                  {formData.primary_color === preset.primary && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-slate-900 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Custom Colors */}
            <p className="text-sm font-bold text-slate-600 mb-3">Custom Colors</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Primary Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="w-12 h-12 rounded-xl cursor-pointer border-2 border-slate-200"
                    data-testid="primary-color-input"
                  />
                  <input
                    type="text"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="input-field flex-1 font-mono"
                    placeholder="#0ea5e9"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Accent Color (Coins)</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.accent_color}
                    onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                    className="w-12 h-12 rounded-xl cursor-pointer border-2 border-slate-200"
                    data-testid="accent-color-input"
                  />
                  <input
                    type="text"
                    value={formData.accent_color}
                    onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                    className="input-field flex-1 font-mono"
                    placeholder="#f59e0b"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Theme Mode */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-6">
            <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
              {formData.theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              Theme Mode
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setFormData({ ...formData, theme: 'light' })}
                className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-3 ${
                  formData.theme === 'light'
                    ? 'border-slate-900 bg-slate-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                data-testid="theme-light-btn"
              >
                <Sun className="w-6 h-6 text-amber-500" />
                <span className="font-bold text-slate-900">Light</span>
              </button>
              <button
                onClick={() => setFormData({ ...formData, theme: 'dark' })}
                className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-3 ${
                  formData.theme === 'dark'
                    ? 'border-slate-900 bg-slate-800 text-white'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                data-testid="theme-dark-btn"
              >
                <Moon className="w-6 h-6 text-indigo-400" />
                <span className="font-bold">Dark</span>
              </button>
            </div>
            <p className="text-sm text-slate-400 mt-3">Note: Dark mode is coming soon!</p>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-6">
            <h3 className="font-black text-slate-900 mb-4">Preview</h3>
            <div className="bg-slate-100 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: formData.accent_color }}>
                  <Coins className="w-5 h-5 text-white" />
                </div>
                <span className="font-black text-slate-900" style={{ fontFamily: 'Nunito, sans-serif' }}>{formData.app_name}</span>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 rounded-full text-white font-bold text-sm" style={{ backgroundColor: formData.primary_color }}>
                  Primary Button
                </button>
                <button className="px-4 py-2 rounded-full text-white font-bold text-sm" style={{ backgroundColor: formData.accent_color }}>
                  Accent Button
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full text-white rounded-full font-bold py-4 flex items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ backgroundColor: formData.primary_color }}
            data-testid="save-settings-btn"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
