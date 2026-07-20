import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import Loader from '../components/ui/Loader';
import { Receipt, Filter, Banknote, Smartphone, Calendar } from 'lucide-react';

export default function TransactionsPage() {
  const { franchiseeId, isSuper } = useAuth();
  const [timeFilter, setTimeFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', franchiseeId],
    queryFn: async () => {
      let query = supabase.from('transactions').select('*').order('created_at', { ascending: false });
      if (!isSuper) query = query.eq('franchisee_id', franchiseeId);
      const { data } = await query;
      return data || [];
    },
    enabled: !!franchiseeId,
  });

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
    return <Loader message="Loading transactions..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-50">Transactions</h1>
        <p className="text-sm text-zinc-500 mt-1">Track all cash and digital payments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-xs text-zinc-500 font-medium mb-1">Total</p>
          <p className="text-2xl font-semibold text-zinc-50">₱{totalFiltered.toLocaleString()}</p>
          <p className="text-xs text-zinc-500 mt-1">{filteredTransactions.length} sessions</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-1.5 mb-1">
            <Banknote className="w-3.5 h-3.5 text-emerald-400" />
            <p className="text-xs text-zinc-500 font-medium">Cash</p>
          </div>
          <p className="text-2xl font-semibold text-zinc-50">₱{cashTotal.toLocaleString()}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-1.5 mb-1">
            <Smartphone className="w-3.5 h-3.5 text-blue-400" />
            <p className="text-xs text-zinc-500 font-medium">Digital</p>
          </div>
          <p className="text-2xl font-semibold text-zinc-50">₱{digitalTotal.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 card px-5 py-3">
        <Filter className="w-4 h-4 text-zinc-500" />
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
          <select 
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-medium rounded-lg px-3 py-2 outline-none focus:border-zinc-600 appearance-none cursor-pointer"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Receipt className="w-3.5 h-3.5 text-zinc-500" />
          <select 
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-medium rounded-lg px-3 py-2 outline-none focus:border-zinc-600 appearance-none cursor-pointer"
          >
            <option value="all">All Methods</option>
            <option value="cash">Cash Only</option>
            <option value="digital">Digital Only</option>
          </select>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide whitespace-nowrap">Date & Time</th>
                <th className="px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide whitespace-nowrap">Layout</th>
                <th className="px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide whitespace-nowrap">Method</th>
                <th className="px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide text-right whitespace-nowrap">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-medium text-zinc-100">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {new Date(tx.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-zinc-300 font-medium">{tx.layout_id || 'Unknown'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                      tx.payment_method === 'cash' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {tx.payment_method || 'cash'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <span className="text-sm font-medium text-zinc-50">₱{Number(tx.amount).toLocaleString()}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTransactions.length === 0 && (
            <div className="text-center text-zinc-500 py-12 font-medium">No transactions match these filters</div>
          )}
        </div>
      </div>
    </div>
  );
}
