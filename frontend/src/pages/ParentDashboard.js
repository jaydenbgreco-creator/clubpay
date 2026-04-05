import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Coins, Users, Link2, Unlink, ArrowUpRight, ArrowDownRight,
  Trophy, LogOut, Search, Plus, History
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ParentDashboard = () => {
  const { user, logout, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkMemberId, setLinkMemberId] = useState('');
  const [linking, setLinking] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childTransactions, setChildTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/parent/children`, {
        withCredentials: true
      });
      setChildren(response.data);
      if (response.data.length > 0 && !selectedChild) {
        setSelectedChild(response.data[0]);
        loadChildTransactions(response.data[0].member_id);
      }
    } catch {
      // Failed to load children
    } finally {
      setLoading(false);
    }
  };

  const loadChildTransactions = async (memberId) => {
    setLoadingTransactions(true);
    try {
      const response = await axios.get(`${API_URL}/api/parent/child/${memberId}/transactions`, {
        withCredentials: true
      });
      setChildTransactions(response.data);
    } catch {
      // Failed to load transactions
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleLinkChild = async () => {
    if (!linkMemberId.trim()) {
      toast.error('Please enter a member ID');
      return;
    }
    
    setLinking(true);
    try {
      await axios.post(`${API_URL}/api/parent/link-child`, 
        { member_id: linkMemberId.trim() },
        { withCredentials: true }
      );
      toast.success('Child linked successfully!');
      setShowLinkModal(false);
      setLinkMemberId('');
      loadChildren();
      checkAuth();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to link child');
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkChild = async (memberId) => {
    if (!window.confirm('Are you sure you want to unlink this child?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/parent/unlink-child/${memberId}`, {
        withCredentials: true
      });
      toast.success('Child unlinked');
      loadChildren();
      checkAuth();
      if (selectedChild?.member_id === memberId) {
        setSelectedChild(null);
        setChildTransactions([]);
      }
    } catch (error) {
      toast.error('Failed to unlink child');
    }
  };

  const handleSelectChild = (child) => {
    setSelectedChild(child);
    loadChildTransactions(child.member_id);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="w-6 h-6 text-amber-500" />
          <span className="font-black text-slate-900" style={{ fontFamily: 'Libre Franklin, sans-serif' }}>ClubPay</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">{user?.name}</span>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-500 transition-colors" data-testid="logout-btn">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900" style={{ fontFamily: 'Libre Franklin, sans-serif' }} data-testid="parent-dashboard-title">
            Parent Dashboard
          </h1>
          <p className="text-slate-500">View your children's Club Bucks activity</p>
        </div>

        {/* Children List */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-slate-900" style={{ fontFamily: 'Libre Franklin, sans-serif' }}>
              <Users className="w-5 h-5 text-sky-500 inline mr-2" />
              My Children
            </h2>
            <button
              onClick={() => setShowLinkModal(true)}
              className="btn-primary text-sm py-2"
              data-testid="link-child-btn"
            >
              <Plus className="w-4 h-4 mr-1 inline" />
              Link Child
            </button>
          </div>

          {children.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">No children linked yet</p>
              <p className="text-sm text-slate-400">
                Enter your child's Member ID to link their account
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {children.map((child) => (
                <div
                  key={child.member_id}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedChild?.member_id === child.member_id
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => handleSelectChild(child)}
                  data-testid={`child-card-${child.member_id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center">
                        <span className="text-sky-600 font-bold text-lg">{child.first_name?.[0]?.toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{child.display_name}</p>
                        <p className="text-xs text-slate-500">{child.member_id}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUnlinkChild(child.member_id); }}
                      className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                      title="Unlink child"
                      data-testid={`unlink-${child.member_id}`}
                    >
                      <Unlink className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-3xl font-black text-amber-500" style={{ fontFamily: 'Libre Franklin, sans-serif' }}>
                      {child.current_balance?.toLocaleString() || 0}
                    </p>
                    <p className="text-xs text-slate-500">ClubPay</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Child Details */}
        {selectedChild && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-xl font-black text-slate-900 mb-4" style={{ fontFamily: 'Libre Franklin, sans-serif' }}>
              <History className="w-5 h-5 text-sky-500 inline mr-2" />
              {selectedChild.display_name}'s Activity
            </h3>
            
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-emerald-50 rounded-2xl">
                <p className="text-xl font-black text-emerald-600">{selectedChild.earned || 0}</p>
                <p className="text-xs text-emerald-600">Earned</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-2xl">
                <p className="text-xl font-black text-amber-600">{selectedChild.bonus || 0}</p>
                <p className="text-xs text-amber-600">Bonus</p>
              </div>
              <div className="text-center p-3 bg-rose-50 rounded-2xl">
                <p className="text-xl font-black text-rose-600">{selectedChild.spent || 0}</p>
                <p className="text-xs text-rose-600">Spent</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-2xl">
                <p className="text-xl font-black text-slate-600">{selectedChild.adjustments || 0}</p>
                <p className="text-xs text-slate-600">Adj.</p>
              </div>
            </div>

            {/* Transactions */}
            <div className="space-y-3">
              {loadingTransactions ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : childTransactions.length === 0 ? (
                <p className="text-center text-slate-400 py-8">No transactions yet</p>
              ) : (
                childTransactions.map((txn) => (
                  <div key={txn.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      txn.amount >= 0 ? 'bg-emerald-100' : 'bg-rose-100'
                    }`}>
                      {txn.amount >= 0 ? (
                        <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 text-rose-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate">{txn.category}</p>
                      <p className="text-xs text-slate-400">{formatDate(txn.created_at)}</p>
                    </div>
                    <span className={`font-black ${txn.amount >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} style={{ fontFamily: 'Libre Franklin, sans-serif' }}>
                      {txn.amount >= 0 ? '+' : ''}{txn.amount}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex justify-around">
          <button className="flex flex-col items-center text-sky-500">
            <Users className="w-6 h-6" />
            <span className="text-xs font-bold mt-1">Children</span>
          </button>
          <Link to="/leaderboard" className="flex flex-col items-center text-slate-400 hover:text-slate-600">
            <Trophy className="w-6 h-6" />
            <span className="text-xs font-bold mt-1">Leaderboard</span>
          </Link>
        </div>
      </nav>

      {/* Link Child Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowLinkModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()} data-testid="link-child-modal">
            <h3 className="text-xl font-black text-slate-900 mb-2" style={{ fontFamily: 'Libre Franklin, sans-serif' }}>
              <Link2 className="w-5 h-5 text-sky-500 inline mr-2" />
              Link Your Child
            </h3>
            <p className="text-slate-500 mb-6">Enter your child's Member ID to view their balance and activity.</p>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">Member ID</label>
              <input
                type="text"
                value={linkMemberId}
                onChange={(e) => setLinkMemberId(e.target.value)}
                className="input-field"
                placeholder="e.g., Mem-05152"
                data-testid="link-member-id-input"
              />
              <p className="text-xs text-slate-400 mt-2">
                Ask your child or the club administrator for their Member ID
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowLinkModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleLinkChild} disabled={linking} className="btn-primary flex-1" data-testid="confirm-link-btn">
                {linking ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  'Link Child'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;
