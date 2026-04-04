import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { qrApi, transactionsApi } from '../services/api';
import {
  Coins, Scan, Camera, Plus, Minus, X, CheckCircle, AlertCircle,
  Users, LayoutDashboard, History, Trophy, LogOut, Menu
} from 'lucide-react';
import { toast } from 'sonner';
import { Html5QrcodeScanner } from 'html5-qrcode';

const ScannerPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedMember, setScannedMember] = useState(null);
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState('earn');
  const [processing, setProcessing] = useState(false);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.clear().catch(console.error);
      }
    };
  }, []);

  const startScanner = () => {
    setScanning(true);
    setScannedMember(null);
    
    setTimeout(() => {
      if (scannerRef.current) {
        html5QrCodeRef.current = new Html5QrcodeScanner(
          "qr-reader",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false
        );
        
        html5QrCodeRef.current.render(
          (decodedText) => {
            handleScan(decodedText);
            if (html5QrCodeRef.current) {
              html5QrCodeRef.current.clear().catch(console.error);
            }
          },
          (error) => {
            // Ignore scan errors
          }
        );
      }
    }, 100);
  };

  const stopScanner = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.clear().catch(console.error);
    }
    setScanning(false);
  };

  const handleScan = async (payload) => {
    try {
      const response = await qrApi.scanQR(payload);
      setScannedMember(response.data);
      setScanning(false);
      toast.success(`Found: ${response.data.display_name}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid QR code');
    }
  };

  const handleQuickAmount = (value) => {
    setAmount(String(Math.abs(value)));
  };

  const handleTransaction = async () => {
    if (!scannedMember || !amount) {
      toast.error('Please scan a member and enter an amount');
      return;
    }
    
    setProcessing(true);
    try {
      const response = await transactionsApi.quick(
        scannedMember.member_id,
        parseFloat(amount),
        transactionType
      );
      toast.success(`${transactionType === 'earn' ? 'Added' : 'Deducted'} ${amount} bucks!`);
      setScannedMember({ ...scannedMember, current_balance: response.data.new_balance });
      setAmount('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Transaction failed');
    } finally {
      setProcessing(false);
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

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar - Hidden on mobile for scan station */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center">
              <Coins className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900" style={{ fontFamily: 'Nunito, sans-serif' }}>Club Bucks</h1>
              <p className="text-xs text-slate-500 font-medium">Scan Station</p>
            </div>
          </div>
        </div>

        <nav className="px-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
                item.path === '/scanner'
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
          <button onClick={handleLogout} className="flex items-center gap-2 text-rose-500 px-4 py-2">
            <LogOut className="w-5 h-5" strokeWidth={2.5} />
            Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-slate-800 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-white">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2 text-white">
            <Scan className="w-6 h-6 text-amber-400" />
            <span className="font-black" style={{ fontFamily: 'Nunito, sans-serif' }}>Scan Station</span>
          </div>
          <Link to="/dashboard" className="text-sky-400 text-sm font-bold">Dashboard</Link>
        </header>

        {/* Scanner Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          {!scanning && !scannedMember && (
            <div className="text-center animate-fade-in-up" data-testid="scanner-idle">
              <div className="w-32 h-32 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <Scan className="w-16 h-16 text-amber-400" strokeWidth={1.5} />
              </div>
              <h2 className="text-3xl font-black text-white mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Ready to Scan
              </h2>
              <p className="text-slate-400 mb-8">Tap the button below to scan a member's QR code</p>
              <button
                onClick={startScanner}
                className="btn-bucks text-xl px-12 py-4"
                data-testid="start-scan-btn"
              >
                <Camera className="w-6 h-6 mr-2 inline" strokeWidth={2.5} />
                Start Scanning
              </button>
            </div>
          )}

          {scanning && (
            <div className="w-full max-w-md animate-fade-in-up" data-testid="scanner-active">
              <div className="bg-slate-800 rounded-3xl p-4 mb-6">
                <div id="qr-reader" ref={scannerRef} className="rounded-2xl overflow-hidden"></div>
              </div>
              <button
                onClick={stopScanner}
                className="btn-secondary w-full"
                data-testid="stop-scan-btn"
              >
                <X className="w-5 h-5 mr-2 inline" />
                Cancel
              </button>
            </div>
          )}

          {scannedMember && (
            <div className="w-full max-w-md animate-fade-in-up" data-testid="member-scanned">
              {/* Member Info */}
              <div className="bg-slate-800 rounded-3xl p-6 mb-6 text-center">
                <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-black text-white">
                    {scannedMember.first_name?.[0]?.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {scannedMember.display_name}
                </h3>
                <p className="text-slate-400 mb-4">{scannedMember.member_id}</p>
                <div className="text-5xl font-black text-amber-400 balance-update" style={{ fontFamily: 'Nunito, sans-serif' }} data-testid="member-balance">
                  {scannedMember.current_balance?.toLocaleString()}
                </div>
                <p className="text-slate-400 mt-1">Current Balance</p>
              </div>

              {/* Transaction Type Toggle */}
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => setTransactionType('earn')}
                  className={`flex-1 py-3 rounded-2xl font-bold transition-all ${
                    transactionType === 'earn'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                  data-testid="type-earn-btn"
                >
                  <Plus className="w-5 h-5 inline mr-1" /> Earn
                </button>
                <button
                  onClick={() => setTransactionType('spend')}
                  className={`flex-1 py-3 rounded-2xl font-bold transition-all ${
                    transactionType === 'spend'
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                  data-testid="type-spend-btn"
                >
                  <Minus className="w-5 h-5 inline mr-1" /> Spend
                </button>
              </div>

              {/* Amount Input */}
              <div className="mb-4">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-6 py-4 text-3xl font-black text-white text-center focus:outline-none focus:border-amber-500"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                  data-testid="amount-input"
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2 mb-6">
                {[5, 10, 25, 50].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleQuickAmount(val)}
                    className="bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-700 transition-colors"
                    data-testid={`quick-${val}-btn`}
                  >
                    {val}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => { setScannedMember(null); setAmount(''); }}
                  className="btn-secondary flex-1"
                  data-testid="scan-another-btn"
                >
                  Scan Another
                </button>
                <button
                  onClick={handleTransaction}
                  disabled={!amount || processing}
                  className={`flex-1 rounded-full font-bold px-6 py-3 transition-all ${
                    transactionType === 'earn'
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                      : 'bg-rose-500 text-white hover:bg-rose-600'
                  } disabled:opacity-50`}
                  data-testid="confirm-txn-btn"
                >
                  {processing ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                  ) : (
                    `${transactionType === 'earn' ? 'Add' : 'Deduct'} Bucks`
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ScannerPage;
