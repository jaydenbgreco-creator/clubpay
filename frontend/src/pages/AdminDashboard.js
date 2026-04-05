import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useClub } from '../context/ClubContext';
import { dashboardApi, membersApi, transactionsApi } from '../services/api';
import {
  Coins, Users, TrendingUp, ArrowUpRight, ArrowDownRight,
  QrCode, Plus, LogOut, LayoutDashboard, Trophy, Scan,
  UserPlus, History, Menu, X, ChevronRight, Shield, Settings,
  Building2, ChevronDown
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, logout, isAdmin } = useAuth();
  const { settings } = useSettings();
  const { clubs, activeClub, switchClub } = useClub();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clubDropdownOpen, setClubDropdownOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const primaryColor = settings?.primary_color || '#0080c6';

  const loadDashboardData = useCallback(async () => {
    if (!activeClub) return;
    try {
      const clubId = activeClub.id;
      const [statsRes, leaderboardRes, transactionsRes] = await Promise.all([
        dashboardApi.getStats(clubId),
        dashboardApi.getLeaderboard(5, clubId),
        dashboardApi.getRecentTransactions(5, clubId)
      ]);
      setStats(statsRes.data);
      setLeaderboard(leaderboardRes.data);
      setRecentTransactions(transactionsRes.data);
    } catch {
      // Dashboard data load failed silently
    } finally {
      setLoading(false);
    }
  }, [activeClub]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

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

  // Add admin-only items
  const navItems = isAdmin 
    ? [...baseNavItems, 
        { path: '/admin/clubs', icon: Building2, label: 'Clubs' },
        { path: '/admin/staff', icon: Shield, label: 'Staff' },
        { path: '/admin/settings', icon: Settings, label: 'Settings' }
      ]
    : baseNavItems;

  const StatCard = ({ icon: Icon, label, value, color = 'sky', subValue, trend }) => (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 card-hover" data-testid={`stat-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-2xl bg-${color}-100 flex items-center justify-center`}>
          <Icon className={`w-6 h-6 text-${color}-500`} strokeWidth={2.5} />
        </div>
        {trend && (
          <span className={`flex items-center text-sm font-bold ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trend > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-slate-500 text-sm font-medium">{label}</p>
        <p className="text-3xl font-black text-slate-900 mt-1" style={{ fontFamily: 'Libre Franklin, sans-serif' }}>
          {value}
        </p>
        {subValue && <p className="text-slate-400 text-sm mt-1">{subValue}</p>}
      </div>
    </div>
  );

  const getMedalClass = (index) => {
    if (index === 0) return 'medal-gold';
    if (index === 1) return 'medal-silver';
    if (index === 2) return 'medal-bronze';
    return 'bg-slate-100 text-slate-600';
  };

  const getTransactionBadge = (type) => {
    const badges = {
      earn: 'badge-earn',
      spend: 'badge-spend',
      bonus: 'badge-bonus',
      adjustment: 'badge-adjustment'
    };
    return badges[type] || 'badge-adjustment';
  };

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
        <div className="p-5">
          <div className="flex items-center gap-3">
            <img src="/brand/logo-horizontal.png" alt="BGCA" className="h-10 w-auto" />
          </div>
          <p className="text-xs font-semibold mt-1 ml-1" style={{ color: primaryColor, fontFamily: 'Libre Franklin, sans-serif' }}>{settings?.app_name || 'ClubPay'}</p>
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
              style={location.pathname === item.path ? { backgroundColor: primaryColor } : {}}
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

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64">
        {/* Mobile header */}
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-2" data-testid="mobile-menu-btn">
            <Menu className="w-6 h-6 text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <Coins className="w-6 h-6 text-amber-500" />
            <span className="font-black text-slate-900" style={{ fontFamily: 'Libre Franklin, sans-serif' }}>ClubPay</span>
          </div>
          <div className="w-10" />
        </header>

        <div className="p-6 md:p-8">
          {/* Welcome section */}
          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-900" style={{ fontFamily: 'Libre Franklin, sans-serif' }} data-testid="dashboard-title">
              Welcome back, {user?.name?.split(' ')[0] || 'Admin'}!
            </h2>
            <p className="text-slate-500 mt-1">Here's what's happening with ClubPay today.</p>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Link to="/scanner" className="btn-primary flex items-center gap-2" data-testid="quick-scan-btn">
              <Scan className="w-5 h-5" strokeWidth={2.5} />
              Scan Station
            </Link>
            <Link to="/members/new" className="btn-secondary flex items-center gap-2" data-testid="quick-add-member-btn">
              <UserPlus className="w-5 h-5" strokeWidth={2.5} />
              Add Member
            </Link>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard icon={Users} label="Active Members" value={stats?.active_members || 0} color="sky" />
            <StatCard icon={Coins} label="Total Bucks" value={stats?.current_bucks?.toLocaleString() || 0} color="amber" />
            <StatCard icon={TrendingUp} label="Earned Today" value={stats?.total_earned?.toLocaleString() || 0} color="emerald" />
            <StatCard icon={History} label="Transactions Today" value={stats?.transactions_today || 0} color="violet" />
          </div>

          {/* Two column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Leaderboard */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6" data-testid="leaderboard-card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-900" style={{ fontFamily: 'Libre Franklin, sans-serif' }}>
                  <Trophy className="w-5 h-5 text-amber-500 inline mr-2" />
                  Top Earners
                </h3>
                <Link to="/leaderboard" className="text-sky-500 font-bold text-sm hover:text-sky-600 flex items-center gap-1">
                  View All <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-3">
                {leaderboard.map((member, index) => (
                  <div key={member.member_id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors" data-testid={`leaderboard-item-${index}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${getMedalClass(index)}`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate">{member.display_name}</p>
                      <p className="text-xs text-slate-500">{member.member_id}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black" style={{ color: '#84bd00', fontFamily: 'Libre Franklin, sans-serif' }}>
                        {member.current_balance?.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">bucks</p>
                    </div>
                  </div>
                ))}
                {leaderboard.length === 0 && (
                  <p className="text-center text-slate-400 py-8">No members yet</p>
                )}
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6" data-testid="recent-transactions-card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-900" style={{ fontFamily: 'Libre Franklin, sans-serif' }}>
                  <History className="w-5 h-5 text-sky-500 inline mr-2" />
                  Recent Activity
                </h3>
                <Link to="/transactions" className="text-sky-500 font-bold text-sm hover:text-sky-600 flex items-center gap-1">
                  View All <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-3">
                {recentTransactions.map((txn) => (
                  <div key={txn.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors" data-testid={`transaction-item-${txn.id}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${txn.amount >= 0 ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                      {txn.amount >= 0 ? (
                        <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 text-rose-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate">{txn.member_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={getTransactionBadge(txn.type)}>{txn.type}</span>
                        <span className="text-xs text-slate-400">{txn.category}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-black ${txn.amount >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} style={{ fontFamily: 'Libre Franklin, sans-serif' }}>
                        {txn.amount >= 0 ? '+' : ''}{txn.amount}
                      </p>
                    </div>
                  </div>
                ))}
                {recentTransactions.length === 0 && (
                  <p className="text-center text-slate-400 py-8">No transactions yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
