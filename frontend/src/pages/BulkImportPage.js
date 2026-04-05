import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useClub } from '../context/ClubContext';
import {
  Coins, Users, Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle,
  LayoutDashboard, History, Trophy, Scan, LogOut, Menu, ChevronLeft
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const BulkImportPage = () => {
  const { user, logout } = useAuth();
  const { activeClub } = useClub();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/api/members/upload-csv${activeClub?.id ? `?club_id=${activeClub.id}` : ''}`, formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setResult(response.data);
      toast.success(`Successfully imported ${response.data.imported} members!`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to import members');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const downloadTemplate = () => {
    const template = `member_id,first_name,last_name,status,starting_balance,notes
Mem-00001,John,Doe,Active,0,New member
Mem-00002,Jane,Smith,Active,10,Transfer student`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'members_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/members', icon: Users, label: 'Members' },
    { path: '/transactions', icon: History, label: 'Transactions' },
    { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { path: '/scanner', icon: Scan, label: 'Scan Station' },
  ];

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
              <h1 className="text-xl font-black text-slate-900" style={{ fontFamily: 'Libre Franklin, sans-serif' }}>ClubPay</h1>
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
                location.pathname.startsWith('/members') && item.path === '/members'
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
          <span className="font-black text-slate-900" style={{ fontFamily: 'Libre Franklin, sans-serif' }}>Bulk Import</span>
          <div className="w-10" />
        </header>

        <div className="p-6 md:p-8">
          <button onClick={() => navigate('/members')} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6">
            <ChevronLeft className="w-5 h-5" />
            Back to Members
          </button>

          <div className="max-w-2xl">
            <h2 className="text-3xl font-black text-slate-900 mb-2" style={{ fontFamily: 'Libre Franklin, sans-serif' }} data-testid="bulk-import-title">
              Bulk Import Members
            </h2>
            <p className="text-slate-500 mb-8">Upload a CSV file to import multiple members at once.</p>

            {/* Template Download */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-6">
              <h3 className="font-bold text-slate-900 mb-2">1. Download Template</h3>
              <p className="text-sm text-slate-500 mb-4">
                Start with our CSV template to ensure your data is formatted correctly.
              </p>
              <button onClick={downloadTemplate} className="btn-secondary flex items-center gap-2" data-testid="download-template-btn">
                <Download className="w-5 h-5" />
                Download Template
              </button>
            </div>

            {/* File Upload */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-6">
              <h3 className="font-bold text-slate-900 mb-2">2. Upload Your File</h3>
              <p className="text-sm text-slate-500 mb-4">
                Select your CSV file with member data. Required columns: member_id, first_name.
              </p>
              
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                ref={fileInputRef}
                className="hidden"
                data-testid="file-input"
              />
              
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center cursor-pointer hover:border-sky-500 hover:bg-sky-50 transition-all"
              >
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileSpreadsheet className="w-8 h-8 text-sky-500" />
                    <div className="text-left">
                      <p className="font-bold text-slate-900">{file.name}</p>
                      <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="font-bold text-slate-700">Click to select a CSV file</p>
                    <p className="text-sm text-slate-400 mt-1">or drag and drop</p>
                  </>
                )}
              </div>
            </div>

            {/* Upload Button */}
            {file && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="btn-primary w-full flex items-center justify-center gap-2 mb-6"
                data-testid="upload-btn"
              >
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Import Members
                  </>
                )}
              </button>
            )}

            {/* Results */}
            {result && (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6" data-testid="import-results">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  Import Complete
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-emerald-50 rounded-2xl p-4 text-center">
                    <p className="text-3xl font-black text-emerald-600">{result.imported}</p>
                    <p className="text-sm text-emerald-600">Imported</p>
                  </div>
                  <div className="bg-amber-50 rounded-2xl p-4 text-center">
                    <p className="text-3xl font-black text-amber-600">{result.skipped}</p>
                    <p className="text-sm text-amber-600">Skipped (duplicates)</p>
                  </div>
                </div>
                {result.errors && result.errors.length > 0 && (
                  <div className="bg-rose-50 rounded-2xl p-4">
                    <p className="font-bold text-rose-700 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Errors
                    </p>
                    <ul className="text-sm text-rose-600 space-y-1">
                      {result.errors.map((err, i) => (
                        <li key={`err-${i}-${err.slice(0, 20)}`}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <button onClick={() => navigate('/members')} className="btn-secondary w-full mt-4">
                  View All Members
                </button>
              </div>
            )}

            {/* Format Guide */}
            <div className="bg-slate-100 rounded-2xl p-4 mt-6">
              <p className="font-bold text-slate-700 mb-2">CSV Format</p>
              <p className="text-sm text-slate-600">
                <strong>Required:</strong> member_id, first_name<br />
                <strong>Optional:</strong> last_name, status, starting_balance, notes
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BulkImportPage;
