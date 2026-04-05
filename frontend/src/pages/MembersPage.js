import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useClub } from '../context/ClubContext';
import { membersApi, transactionsApi, dashboardApi } from '../services/api';
import {
  Coins, Users, Search, Plus, Edit2, Trash2, QrCode,
  ChevronLeft, ChevronRight, Filter, Download, Upload,
  LayoutDashboard, History, Trophy, Scan, LogOut, Menu, X
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose
} from '../components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import { toast } from 'sonner';
import { AdminLayout } from '../components/AdminLayout';

const MembersPage = () => {
  const { user, logout } = useAuth();
  const { activeClub } = useClub();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    type: 'earn',
    category: 'Job',
    amount: '',
    notes: ''
  });

  const categories = {
    earn: ['Job', 'Attendance', 'Leadership', 'Cleanup', 'Other'],
    spend: ['Store Purchase', 'Activity Fee', 'Other'],
    bonus: ['Behavior Bonus', 'Achievement', 'Special Event', 'Other'],
    adjustment: ['Correction', 'Transfer', 'Admin Adjustment', 'Other']
  };

  const loadMembers = useCallback(async () => {
    try {
      const params = {};
      if (activeClub?.id) params.club_id = activeClub.id;
      if (searchQuery) params.search = searchQuery;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      const response = await membersApi.getAll(params);
      setMembers(response.data);
    } catch {
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [activeClub, searchQuery, statusFilter]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleShowQR = async (member) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/qr/${member.member_id}`, {
        credentials: 'include'
      });
      const data = await response.json();
      setQrData(data);
      setShowQRModal(true);
    } catch (error) {
      toast.error('Failed to generate QR code');
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to delete this member?')) return;
    try {
      await membersApi.delete(memberId);
      toast.success('Member deleted successfully');
      loadMembers();
    } catch (error) {
      toast.error('Failed to delete member');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleTransaction = async () => {
    if (!selectedMember || !transactionForm.amount) return;
    try {
      await transactionsApi.create({
        member_id: selectedMember.member_id,
        type: transactionForm.type,
        category: transactionForm.category,
        amount: parseFloat(transactionForm.amount),
        club_id: activeClub?.id,
        notes: transactionForm.notes
      });
      toast.success('Transaction recorded successfully');
      setShowTransactionModal(false);
      setTransactionForm({ type: 'earn', category: 'Job', amount: '', notes: '' });
      loadMembers();
    } catch (error) {
      toast.error('Failed to record transaction');
    }
  };

  const navItems = []; // Using AdminLayout now

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900" style={{ fontFamily: 'Libre Franklin, sans-serif' }} data-testid="members-title">
            Members
          </h2>
          <p className="text-slate-500">{members.length} total members{activeClub ? ` in ${activeClub.name}` : ''}</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <a 
            href={`${process.env.REACT_APP_BACKEND_URL}/api/members/export${activeClub?.id ? `?club_id=${activeClub.id}` : ''}`}
            className="btn-secondary flex items-center gap-2"
            data-testid="export-members-btn"
          >
            <Download className="w-5 h-5" strokeWidth={2.5} />
            Export CSV
          </a>
          <Link to="/members/import" className="btn-secondary flex items-center gap-2" data-testid="bulk-import-btn">
            <Upload className="w-5 h-5" strokeWidth={2.5} />
            Import CSV
          </Link>
          <Link to="/members/new" className="btn-primary flex items-center gap-2" data-testid="add-member-btn">
            <Plus className="w-5 h-5" strokeWidth={2.5} />
            Add Member
          </Link>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-12"
              data-testid="member-search-input"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48 rounded-2xl border-2 border-slate-200" data-testid="status-filter">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No members found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="members-table">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-bold text-slate-600">Member</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-slate-600">ID</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-slate-600">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-bold text-slate-600">Balance</th>
                  <th className="text-right px-6 py-4 text-sm font-bold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((member) => (
                  <tr key={member.member_id} className="hover:bg-slate-50 transition-colors" data-testid={`member-row-${member.member_id}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
                          <span className="text-sky-600 font-bold">{member.first_name?.[0]?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{member.display_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{member.member_id}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        member.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                        member.status === 'Inactive' ? 'bg-slate-100 text-slate-600' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-black" style={{ color: '#84bd00', fontFamily: 'Libre Franklin, sans-serif' }}>
                        {member.current_balance?.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setSelectedMember(member); setShowTransactionModal(true); }}
                          className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-colors"
                          title="Add Transaction"
                          data-testid={`add-txn-${member.member_id}`}
                        >
                          <Plus className="w-5 h-5" strokeWidth={2.5} />
                        </button>
                        <button
                          onClick={() => handleShowQR(member)}
                          className="p-2 text-sky-500 hover:bg-sky-50 rounded-xl transition-colors"
                          title="Show QR"
                          data-testid={`show-qr-${member.member_id}`}
                        >
                          <QrCode className="w-5 h-5" strokeWidth={2.5} />
                        </button>
                        <Link
                          to={`/members/${member.member_id}/edit`}
                          className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"
                          title="Edit"
                          data-testid={`edit-${member.member_id}`}
                        >
                          <Edit2 className="w-5 h-5" strokeWidth={2.5} />
                        </Link>
                        <button
                          onClick={() => handleDeleteMember(member.member_id)}
                          className="p-2 text-rose-400 hover:bg-rose-50 rounded-xl transition-colors"
                          title="Delete"
                          data-testid={`delete-${member.member_id}`}
                        >
                          <Trash2 className="w-5 h-5" strokeWidth={2.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Modal */}
      {showQRModal && qrData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowQRModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()} data-testid="qr-modal">
            <h3 className="text-xl font-black text-slate-900 mb-2" style={{ fontFamily: 'Libre Franklin, sans-serif' }}>
              {qrData.member_name}
            </h3>
            <p className="text-slate-500 mb-6">{qrData.member_id}</p>
            <img src={qrData.qr_image} alt="QR Code" className="mx-auto mb-4" data-testid="qr-image" />
            <p className="text-xs text-slate-400 mb-4 break-all">{qrData.qr_payload}</p>
            <button onClick={() => setShowQRModal(false)} className="btn-secondary w-full">Close</button>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTransactionModal && selectedMember && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowTransactionModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()} data-testid="transaction-modal">
            <h3 className="text-xl font-black text-slate-900 mb-2" style={{ fontFamily: 'Libre Franklin, sans-serif' }}>
              Add Transaction
            </h3>
            <p className="text-slate-500 mb-6">For {selectedMember.display_name}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Type</label>
                <Select value={transactionForm.type} onValueChange={(v) => setTransactionForm({ ...transactionForm, type: v, category: categories[v][0] })}>
                  <SelectTrigger className="w-full rounded-2xl border-2 border-slate-200" data-testid="txn-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="earn">Earn</SelectItem>
                    <SelectItem value="spend">Spend</SelectItem>
                    <SelectItem value="bonus">Bonus</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                <Select value={transactionForm.category} onValueChange={(v) => setTransactionForm({ ...transactionForm, category: v })}>
                  <SelectTrigger className="w-full rounded-2xl border-2 border-slate-200" data-testid="txn-category-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories[transactionForm.type].map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Amount</label>
                <input
                  type="number"
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                  className="input-field"
                  placeholder="Enter amount"
                  data-testid="txn-amount-input"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Notes (optional)</label>
                <input
                  type="text"
                  value={transactionForm.notes}
                  onChange={(e) => setTransactionForm({ ...transactionForm, notes: e.target.value })}
                  className="input-field"
                  placeholder="Add notes..."
                  data-testid="txn-notes-input"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowTransactionModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleTransaction} className="btn-bucks flex-1" data-testid="submit-txn-btn">Add Transaction</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default MembersPage;
