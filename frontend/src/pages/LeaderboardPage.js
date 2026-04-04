import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../services/api';
import {
  Coins, Trophy, Crown, Medal, Award, Users, LayoutDashboard, History, Scan, LogOut, Menu
} from 'lucide-react';

const LeaderboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const response = await dashboardApi.getLeaderboard(50);
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
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

  const getMedalIcon = (index) => {
    if (index === 0) return <Crown className="w-6 h-6 text-amber-400" strokeWidth={2.5} />;
    if (index === 1) return <Medal className="w-6 h-6 text-slate-300" strokeWidth={2.5} />;
    if (index === 2) return <Award className="w-6 h-6 text-orange-400" strokeWidth={2.5} />;
    return null;
  };

  const getMedalBg = (index) => {
    if (index === 0) return 'bg-gradient-to-r from-amber-400 to-yellow-500';
    if (index === 1) return 'bg-gradient-to-r from-slate-300 to-slate-400';
    if (index === 2) return 'bg-gradient-to-r from-orange-400 to-orange-500';
    return 'bg-slate-100';
  };

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
              <h1 className="text-xl font-black text-slate-900" style={{ fontFamily: 'Nunito, sans-serif' }}>Club Bucks</h1>
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
                item.path === '/leaderboard'
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
          <span className="font-black text-slate-900" style={{ fontFamily: 'Nunito, sans-serif' }}>Leaderboard</span>
          <div className="w-10" />
        </header>

        <div className="p-6 md:p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-900" style={{ fontFamily: 'Nunito, sans-serif' }} data-testid="leaderboard-title">
              <Trophy className="w-8 h-8 text-amber-500 inline mr-2" />
              Leaderboard
            </h2>
            <p className="text-slate-500 mt-1">Top earners in Club Bucks</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Top 3 Podium */}
              {leaderboard.length >= 3 && (
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {/* Second Place */}
                  <div className="pt-8">
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 text-center card-hover" data-testid="podium-2nd">
                      <div className="w-16 h-16 bg-gradient-to-r from-slate-300 to-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 -mt-12 border-4 border-white shadow-lg">
                        <span className="text-2xl font-black text-white">2</span>
                      </div>
                      <Medal className="w-8 h-8 text-slate-400 mx-auto mb-2" strokeWidth={2} />
                      <p className="font-bold text-slate-900 truncate">{leaderboard[1]?.display_name}</p>
                      <p className="text-3xl font-black text-amber-500 mt-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                        {leaderboard[1]?.current_balance?.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">bucks</p>
                    </div>
                  </div>

                  {/* First Place */}
                  <div>
                    <div className="bg-white rounded-3xl shadow-lg border-2 border-amber-200 p-6 text-center card-hover" data-testid="podium-1st">
                      <div className="w-20 h-20 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 -mt-14 border-4 border-white shadow-lg">
                        <Crown className="w-10 h-10 text-white" strokeWidth={2} />
                      </div>
                      <p className="font-black text-slate-900 text-lg truncate">{leaderboard[0]?.display_name}</p>
                      <p className="text-4xl font-black text-amber-500 mt-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                        {leaderboard[0]?.current_balance?.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">bucks</p>
                    </div>
                  </div>

                  {/* Third Place */}
                  <div className="pt-12">
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 text-center card-hover" data-testid="podium-3rd">
                      <div className="w-14 h-14 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 -mt-10 border-4 border-white shadow-lg">
                        <span className="text-xl font-black text-white">3</span>
                      </div>
                      <Award className="w-6 h-6 text-orange-400 mx-auto mb-2" strokeWidth={2} />
                      <p className="font-bold text-slate-900 truncate text-sm">{leaderboard[2]?.display_name}</p>
                      <p className="text-2xl font-black text-amber-500 mt-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                        {leaderboard[2]?.current_balance?.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">bucks</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Rest of the leaderboard */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden" data-testid="leaderboard-list">
                {leaderboard.slice(3).map((member, idx) => (
                  <div
                    key={member.member_id}
                    className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                    data-testid={`leaderboard-row-${idx + 4}`}
                  >
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-600">
                      {idx + 4}
                    </div>
                    <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
                      <span className="text-sky-600 font-bold">{member.display_name?.[0]?.toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate">{member.display_name}</p>
                      <p className="text-xs text-slate-500">{member.member_id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-amber-500" style={{ fontFamily: 'Nunito, sans-serif' }}>
                        {member.current_balance?.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">bucks</p>
                    </div>
                  </div>
                ))}
                {leaderboard.length === 0 && (
                  <div className="p-12 text-center">
                    <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No members with balances yet</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default LeaderboardPage;
