import React, { useState, useEffect, useCallback } from 'react';
import { useClub } from '../context/ClubContext';
import { transactionsApi } from '../services/api';
import {
  History, ArrowUpRight, ArrowDownRight, Filter, Download, Calendar
} from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import { AdminLayout } from '../components/AdminLayout';

const TransactionsPage = () => {
  const { activeClub } = useClub();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');

  const loadTransactions = useCallback(async () => {
    try {
      const params = { limit: 200 };
      if (typeFilter && typeFilter !== 'all') params.type = typeFilter;
      if (activeClub?.id) params.club_id = activeClub.id;
      const response = await transactionsApi.getAll(params);
      setTransactions(response.data);
    } catch {
      // Failed to load transactions
    } finally {
      setLoading(false);
    }
  }, [typeFilter, activeClub]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

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
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900" style={{ fontFamily: 'Libre Franklin, sans-serif' }} data-testid="transactions-title">
            Transactions
          </h2>
          <p className="text-slate-500">{transactions.length} total transactions{activeClub ? ` in ${activeClub.name}` : ''}</p>
        </div>
        <a 
          href={`${process.env.REACT_APP_BACKEND_URL}/api/transactions/export${activeClub?.id ? `?club_id=${activeClub.id}` : ''}`}
          className="btn-secondary flex items-center gap-2 w-fit"
          data-testid="export-transactions-btn"
        >
          <Download className="w-5 h-5" strokeWidth={2.5} />
          Export CSV
        </a>
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
                    {txn.notes && <span className="text-xs text-slate-400">&bull; {txn.notes}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-xl font-black ${txn.amount >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} style={{ fontFamily: 'Libre Franklin, sans-serif' }}>
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
    </AdminLayout>
  );
};

export default TransactionsPage;
