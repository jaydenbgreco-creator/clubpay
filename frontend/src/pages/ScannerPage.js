import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useClub } from '../context/ClubContext';
import { qrApi, transactionsApi, membersApi } from '../services/api';
import {
  Coins, Scan, Camera, Plus, Minus, X, CheckCircle, AlertCircle,
  Users, LayoutDashboard, History, Trophy, LogOut, Menu, Keyboard, Search
} from 'lucide-react';
import { toast } from 'sonner';
import { Html5QrcodeScanner } from 'html5-qrcode';

const ScannerPage = () => {
  const { user, logout } = useAuth();
  const { activeClub } = useClub();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedMember, setScannedMember] = useState(null);
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState('earn');
  const [processing, setProcessing] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.clear().catch(console.error);
      }
    };
  }, []);

  // Search members as user types
  useEffect(() => {
    if (searchQuery.length < 1) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const params = { search: searchQuery };
        if (activeClub?.id) params.club_id = activeClub.id;
        const response = await membersApi.getAll(params);
        setSearchResults(response.data.slice(0, 8)); // Limit to 8 results
        setShowDropdown(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const selectMember = (member) => {
    setScannedMember(member);
    setShowManualEntry(false);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
    toast.success(`Found: ${member.display_name}`);
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
        transactionType,
        activeClub?.id
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
        <div className="p-5">
          <div className="flex items-center gap-3">
            <img src="/brand/logo-horizontal.png" alt="BGCA" className="h-10 w-auto" />
          </div>
          <p className="text-xs font-semibold mt-1 ml-1" style={{ color: '#0080c6', fontFamily: 'Libre Franklin, sans-serif' }}>ClubPay</p>
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
            <span className="font-black" style={{ fontFamily: 'Libre Franklin, sans-serif' }}>Scan Station</span>
          </div>
          <Link to="/dashboard" className="text-sky-400 text-sm font-bold">Dashboard</Link>
        </header>

        {/* Scanner Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          {!scanning && !scannedMember && !showManualEntry && (
            <div className="text-center animate-fade-in-up" data-testid="scanner-idle">
              <div className="w-32 h-32 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <Scan className="w-16 h-16 text-amber-400" strokeWidth={1.5} />
              </div>
              <h2 className="text-3xl font-black text-white mb-4" style={{ fontFamily: 'Libre Franklin, sans-serif' }}>
                Ready to Scan
              </h2>
              <p className="text-slate-400 mb-8">Scan a QR code or enter Member ID manually</p>
              <div className="flex flex-col gap-4">
                <button
                  onClick={startScanner}
                  className="btn-bucks text-xl px-12 py-4"
                  data-testid="start-scan-btn"
                >
                  <Camera className="w-6 h-6 mr-2 inline" strokeWidth={2.5} />
                  Scan QR Code
                </button>
                <button
                  onClick={() => setShowManualEntry(true)}
                  className="bg-slate-700 text-white rounded-full font-bold px-8 py-4 hover:bg-slate-600 transition-all flex items-center justify-center gap-2"
                  data-testid="manual-entry-btn"
                >
                  <Search className="w-5 h-5" strokeWidth={2.5} />
                  Search Member
                </button>
              </div>
            </div>
          )}

          {/* Manual Entry Mode */}
          {showManualEntry && !scannedMember && (
            <div className="w-full max-w-md animate-fade-in-up" data-testid="manual-entry-active">
              <div className="bg-slate-800 rounded-3xl p-6 mb-6">
                <h3 className="text-xl font-black text-white mb-4 text-center" style={{ fontFamily: 'Libre Franklin, sans-serif' }}>
                  <Search className="w-6 h-6 text-amber-400 inline mr-2" />
                  Find Member
                </h3>
                <p className="text-slate-400 text-sm text-center mb-6">
                  Search by Member ID or name
                </p>
                
                {/* Search Input with Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Type ID or name..."
                    className="w-full bg-slate-700 border-2 border-slate-600 rounded-2xl px-4 py-4 text-lg font-bold text-white focus:outline-none focus:border-amber-500 placeholder-slate-500"
                    data-testid="member-search-input"
                    autoFocus
                  />
                  {searching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  
                  {/* Search Results Dropdown */}
                  {showDropdown && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-700 rounded-2xl overflow-hidden shadow-xl z-10 max-h-80 overflow-y-auto" data-testid="search-dropdown">
                      {searchResults.map((member) => (
                        <button
                          key={member.member_id}
                          onClick={() => selectMember(member)}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-600 transition-colors text-left border-b border-slate-600 last:border-0"
                          data-testid={`search-result-${member.member_id}`}
                        >
                          <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold">{member.first_name?.[0]?.toUpperCase()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white truncate">{member.display_name}</p>
                            <p className="text-sm text-slate-400">{member.member_id}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-black text-amber-400" style={{ fontFamily: 'Libre Franklin, sans-serif' }}>
                              {member.current_balance}
                            </p>
                            <p className="text-xs text-slate-400">bucks</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* No results message */}
                  {showDropdown && searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-700 rounded-2xl p-4 text-center" data-testid="no-results">
                      <p className="text-slate-400">No members found</p>
                    </div>
                  )}
                </div>
                
                {/* Helper text */}
                <p className="text-slate-500 text-xs text-center mt-4">
                  Start typing to see matching members
                </p>
              </div>
              
              <button
                onClick={() => { setShowManualEntry(false); setSearchQuery(''); setSearchResults([]); setShowDropdown(false); }}
                className="btn-secondary w-full"
                data-testid="cancel-manual-btn"
              >
                <X className="w-5 h-5 mr-2 inline" />
                Cancel
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
                <h3 className="text-2xl font-black text-white mb-1" style={{ fontFamily: 'Libre Franklin, sans-serif' }}>
                  {scannedMember.display_name}
                </h3>
                <p className="text-slate-400 mb-4">{scannedMember.member_id}</p>
                <div className="text-5xl font-black balance-update" style={{ color: '#84bd00', fontFamily: 'Libre Franklin, sans-serif' }} data-testid="member-balance">
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
                  style={{ fontFamily: 'Libre Franklin, sans-serif' }}
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
