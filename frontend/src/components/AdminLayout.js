import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useClub } from '../context/ClubContext';
import {
  Coins, Users, LogOut, LayoutDashboard, Trophy, Scan,
  History, Menu, Shield, Settings, Building2, ChevronDown
} from 'lucide-react';

const AdminLayout = ({ children, title, subtitle, actions }) => {
  const { user, logout, isAdmin } = useAuth();
  const { settings } = useSettings();
  const { clubs, activeClub, switchClub } = useClub();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clubDropdownOpen, setClubDropdownOpen] = useState(false);

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
              <h1 className="text-xl font-black text-slate-900" style={{ fontFamily: 'Nunito, sans-serif' }}>{settings?.app_name || 'Club Bucks'}</h1>
              <p className="text-xs text-slate-500 font-medium">{isAdmin ? 'Admin Panel' : 'Staff Panel'}</p>
            </div>
          </div>
        </div>

        {/* Club Selector */}
        {clubs.length > 0 && (
          <div className="px-4 mb-3">
            <div className="relative">
              <button
                onClick={() => setClubDropdownOpen(!clubDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                data-testid="club-selector"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="font-bold text-sm text-slate-700 truncate">{activeClub?.name || 'Select Club'}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${clubDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {clubDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-lg border border-slate-200 z-50 py-1 max-h-48 overflow-y-auto">
                  {clubs.map((club) => (
                    <button
                      key={club.id}
                      onClick={() => { switchClub(club); setClubDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                        activeClub?.id === club.id
                          ? 'bg-sky-50 text-sky-700'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                      data-testid={`club-option-${club.id}`}
                    >
                      {club.name}
                      <span className="text-xs text-slate-400 ml-2">({club.member_count || 0})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

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
          <div className="flex items-center gap-2">
            <Coins className="w-6 h-6 text-amber-500" />
            <span className="font-black text-slate-900" style={{ fontFamily: 'Nunito, sans-serif' }}>{settings?.app_name || 'Club Bucks'}</span>
          </div>
          <div className="w-10" />
        </header>

        <div className="p-6 md:p-8">
          {(title || actions) && (
            <div className="flex items-center justify-between mb-8">
              <div>
                {title && (
                  <h2 className="text-3xl font-black text-slate-900" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {title}
                  </h2>
                )}
                {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}
              </div>
              {actions && <div className="flex gap-3">{actions}</div>}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
};

export { AdminLayout };
