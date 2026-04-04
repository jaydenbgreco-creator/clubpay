import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { transactionsApi } from '../services/api';
import {
  Coins, History, ArrowUpRight, ArrowDownRight, Filter,
  Users, LayoutDashboard, Trophy, Scan, LogOut, Menu, Calendar
} from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';

const TransactionsPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    loadTransactions();
  }, [typeFilter]);

  const loadTransactions = async () => {
    try {
      const params = { limit: 200 };
      if (typeFilter && typeFilter !== 'all') params.type = typeFilter;
      const response = await transactionsApi.getAll(params);
      setTransactions(response.data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
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

  const getTransactionBadge = (type) => {
    const badges = {
      earn: 'badge-earn',
      spend: 'badge-spend',
      bonus: 'badge-bonus',
      adjustment: 'badge-adjustment'
    };
    return badges[type] || 'badge-adjustment';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
                item.path === '/transactions'
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
          <span className="font-black text-slate-900" style={{ fontFamily: 'Nunito, sans-serif' }}>Transactions</span>
          <div className="w-10" />
        </header>

        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-3xl font-black text-slate-900" style={{ fontFamily: 'Nunito, sans-serif' }} data-testid="transactions-title">
                Transactions
              </h2>
              <p className="text-slate-500">{transactions.length} total transactions</p>
            </div>
          </div>

          {/* Filter */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 mb-6">
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-slate-400" />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48 rounded-2xl border-2 border-slate-200" data-testid="type-filter">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="earn">Earn</SelectItem>
                  <SelectItem value="spend">Spend</SelectItem>
                  <SelectItem value="bonus">Bonus</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden" data-testid="transactions-list">
            {loading ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center">
                <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No transactions found</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {transactions.map((txn) => (
                  <div
                    key={txn.id}
                    className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                    data-testid={`txn-row-${txn.id}`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      txn.amount >= 0 ? 'bg-emerald-100' : 'bg-rose-100'
                    }`}>
                      {txn.amount >= 0 ? (
                        <ArrowUpRight className="w-6 h-6 text-emerald-500" strokeWidth={2.5} />
                      ) : (
                        <ArrowDownRight className="w-6 h-6 text-rose-500" strokeWidth={2.5} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate">{txn.member_name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={getTransactionBadge(txn.type)}>{txn.type}</span>
                        <span className="text-xs text-slate-400">{txn.category}</span>
                        {txn.notes && <span className="text-xs text-slate-400">• {txn.notes}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xl font-black ${txn.amount >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} style={{ fontFamily: 'Nunito, sans-serif' }}>
                        {txn.amount >= 0 ? '+' : ''}{txn.amount}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center justify-end gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(txn.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TransactionsPage;
