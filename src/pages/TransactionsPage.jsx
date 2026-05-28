import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import { Receipt, Filter, Banknote, Smartphone, Calendar } from 'lucide-react';

export default function TransactionsPage() {
  const { franchiseeId, isSuper } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      let query = supabase.from('transactions').select('*').order('created_at', { ascending: false });
      if (!isSuper) query = query.eq('franchisee_id', franchiseeId);
      const { data } = await query;
      setTransactions(data || []);
      setIsLoading(false);
    };

    if (franchiseeId) fetchTransactions();
  }, [franchiseeId, isSuper]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const txDate = new Date(tx.created_at);
      const now = new Date();

      // Time filter
      let timeMatch = true;
      if (timeFilter === 'today') {
        timeMatch = txDate.toDateString() === now.toDateString();
      } else if (timeFilter === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        timeMatch = txDate >= weekAgo;
      } else if (timeFilter === 'month') {
        timeMatch = txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      }

      // Method filter
      let methodMatch = true;
      if (methodFilter !== 'all') {
        const isCash = tx.payment_method?.toLowerCase() === 'cash';
        if (methodFilter === 'cash') methodMatch = isCash;
        if (methodFilter === 'digital') methodMatch = !isCash;
      }

      return timeMatch && methodMatch;
    });
  }, [transactions, timeFilter, methodFilter]);

  const totalFiltered = filteredTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const cashTotal = filteredTransactions.filter(tx => tx.payment_method === 'cash').reduce((sum, tx) => sum + Number(tx.amount), 0);
  const digitalTotal = totalFiltered - cashTotal;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-[3px] border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Transaction Ledger</h1>
        <p className="text-gray-500 font-medium mt-1">Track and reconcile all cash and digital payments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-1">Total</p>
          <p className="text-2xl font-bold text-white">₱{totalFiltered.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{filteredTransactions.length} sessions</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-1.5 mb-1">
            <Banknote className="w-3 h-3 text-emerald-400" />
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Cash</p>
          </div>
          <p className="text-2xl font-bold text-emerald-400">₱{cashTotal.toLocaleString()}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-1.5 mb-1">
            <Smartphone className="w-3 h-3 text-blue-400" />
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Digital</p>
          </div>
          <p className="text-2xl font-bold text-blue-400">₱{digitalTotal.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 glass-card px-5 py-3">
        <Filter className="w-4 h-4 text-gray-500" />
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-gray-500" />
          <select 
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="bg-white/[0.06] border border-white/[0.08] text-white text-xs font-medium rounded-lg px-3 py-2 outline-none focus:border-pink-500/30 appearance-none cursor-pointer"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Receipt className="w-3.5 h-3.5 text-gray-500" />
          <select 
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-white/[0.06] border border-white/[0.08] text-white text-xs font-medium rounded-lg px-3 py-2 outline-none focus:border-pink-500/30 appearance-none cursor-pointer"
          >
            <option value="all">All Methods</option>
            <option value="cash">Cash Only</option>
            <option value="digital">Digital Only</option>
          </select>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-6 py-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Date & Time</th>
                <th className="px-6 py-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Layout</th>
                <th className="px-6 py-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Method</th>
                <th className="px-6 py-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-white">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(tx.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-300 font-medium">{tx.layout_id || 'Unknown'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] tracking-wider uppercase font-bold px-2.5 py-1 rounded-md ${
                      tx.payment_method === 'cash' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-blue-500/15 text-blue-400'
                    }`}>
                      {tx.payment_method || 'cash'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-pink-400">₱{Number(tx.amount).toLocaleString()}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTransactions.length === 0 && (
            <div className="text-center text-gray-600 py-12 font-medium">No transactions match these filters</div>
          )}
        </div>
      </div>
    </div>
  );
}
