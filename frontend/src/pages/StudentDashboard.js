import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { membersApi, qrApi, transactionsApi } from '../services/api';
import {
  Coins, QrCode, History, Trophy, LogOut, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { toast } from 'sonner';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    loadStudentData();
  }, [user]);

  const loadStudentData = async () => {
    if (!user?.member_id) {
      setLoading(false);
      return;
    }
    
    try {
      const [memberRes, txnRes] = await Promise.all([
        membersApi.getById(user.member_id),
        transactionsApi.getAll({ member_id: user.member_id, limit: 10 })
      ]);
      setMember(memberRes.data);
      setTransactions(txnRes.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const loadQRCode = async () => {
    if (!user?.member_id) return;
    try {
      const response = await qrApi.getQRCode(user.member_id);
      setQrCode(response.data);
      setShowQR(true);
    } catch (error) {
      toast.error('Failed to load QR code');
    }
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

  if (!user?.member_id) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 max-w-md text-center">
          <Coins className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-900 mb-2" style={{ fontFamily: 'Libre Franklin, sans-serif' }}>
            Account Not Linked
          </h2>
          <p className="text-slate-500 mb-6">
            Your account hasn't been linked to a club member yet. Please contact an administrator.
          </p>
          <button onClick={handleLogout} className="btn-secondary">
            <LogOut className="w-5 h-5 mr-2 inline" />
            Logout
          </button>
        </div>
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
        <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-500 transition-colors" data-testid="logout-btn">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <div className="p-4 md:p-6 max-w-lg mx-auto">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-3xl p-8 text-white text-center mb-6 shadow-lg" data-testid="balance-card">
          <p className="text-amber-100 mb-2">Your Balance</p>
          <p className="text-6xl font-black mb-2 balance-update" style={{ fontFamily: 'Libre Franklin, sans-serif' }} data-testid="student-balance">
            {member?.current_balance?.toLocaleString() || 0}
          </p>
          <p className="text-amber-100">ClubPay</p>
          
          <div className="grid grid-cols-3 gap-4 mt-8 text-center">
            <div>
              <p className="text-2xl font-black">{member?.earned || 0}</p>
              <p className="text-amber-100 text-xs">Earned</p>
            </div>
            <div>
              <p className="text-2xl font-black">{member?.bonus || 0}</p>
              <p className="text-amber-100 text-xs">Bonus</p>
            </div>
            <div>
              <p className="text-2xl font-black">{member?.spent || 0}</p>
              <p className="text-amber-100 text-xs">Spent</p>
            </div>
          </div>
        </div>

        {/* QR Code Button */}
        <button
          onClick={loadQRCode}
          className="w-full bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex items-center justify-center gap-3 card-hover mb-6"
          data-testid="show-qr-btn"
        >
          <QrCode className="w-8 h-8 text-sky-500" strokeWidth={2.5} />
          <span className="font-black text-slate-900 text-lg" style={{ fontFamily: 'Libre Franklin, sans-serif' }}>
            Show My QR Code
          </span>
        </button>

        {/* Recent Transactions */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6" data-testid="recent-transactions">
          <h3 className="text-xl font-black text-slate-900 mb-4" style={{ fontFamily: 'Libre Franklin, sans-serif' }}>
            <History className="w-5 h-5 text-sky-500 inline mr-2" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {transactions.map((txn) => (
              <div key={txn.id} className="flex items-center gap-3">
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
            ))}
            {transactions.length === 0 && (
              <p className="text-center text-slate-400 py-4">No transactions yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3">
        <div className="max-w-lg mx-auto flex justify-around">
          <button className="flex flex-col items-center text-sky-500">
            <Coins className="w-6 h-6" />
            <span className="text-xs font-bold mt-1">Balance</span>
          </button>
          <Link to="/leaderboard" className="flex flex-col items-center text-slate-400 hover:text-slate-600">
            <Trophy className="w-6 h-6" />
            <span className="text-xs font-bold mt-1">Leaderboard</span>
          </Link>
        </div>
      </nav>

      {/* QR Code Modal */}
      {showQR && qrCode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowQR(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center animate-fade-in-up" onClick={(e) => e.stopPropagation()} data-testid="qr-modal">
            <h3 className="text-xl font-black text-slate-900 mb-2" style={{ fontFamily: 'Libre Franklin, sans-serif' }}>
              Your QR Code
            </h3>
            <p className="text-slate-500 mb-6">Show this to staff to earn or spend bucks</p>
            <img src={qrCode.qr_image} alt="Your QR Code" className="mx-auto mb-4" data-testid="student-qr-image" />
            <p className="text-sm text-slate-500 mb-4">{member?.display_name}</p>
            <button onClick={() => setShowQR(false)} className="btn-secondary w-full">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
