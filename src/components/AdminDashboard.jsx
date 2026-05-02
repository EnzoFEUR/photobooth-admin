import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../utils/supabase';

export default function AdminDashboard() {
  const [layouts, setLayouts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🎛️ NEW: Filter States
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'today', 'month', 'year'
  const [methodFilter, setMethodFilter] = useState('all'); // 'all', 'cash', 'digital'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    const { data: layoutData } = await supabase.from('layout_pricing').select('*').order('price', { ascending: true });
    if (layoutData) setLayouts(layoutData);

    // Fetch transactions, ordered by newest first
    const { data: transactionData } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
    if (transactionData) setTransactions(transactionData);
    
    setIsLoading(false);
  };

  const handleUpdatePrice = async (id, newPrice) => {
    const { error } = await supabase.from('layout_pricing').update({ price: newPrice }).eq('id', id);
    if (!error) {
      alert("Price updated successfully!");
      fetchData(); 
    }
  };

  // 🧠 NEW: The Analytics Engine (Filters the data instantly)
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const txDate = new Date(tx.created_at);
      const now = new Date();

      // 1. Check Time Filter
      let timeMatch = true;
      if (timeFilter === 'today') {
        timeMatch = txDate.toDateString() === now.toDateString();
      } else if (timeFilter === 'month') {
        timeMatch = txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      } else if (timeFilter === 'year') {
        timeMatch = txDate.getFullYear() === now.getFullYear();
      }

      // 2. Check Payment Method Filter
      let methodMatch = true;
      if (methodFilter !== 'all') {
        // Group anything that isn't 'cash' into 'digital'
        const isCash = tx.payment_method?.toLowerCase() === 'cash';
        if (methodFilter === 'cash') methodMatch = isCash;
        if (methodFilter === 'digital') methodMatch = !isCash; 
      }

      return timeMatch && methodMatch;
    });
  }, [transactions, timeFilter, methodFilter]);

  // Calculate stats based ONLY on the filtered data
  const totalEarnings = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const totalSessions = filteredTransactions.length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-4 md:p-12 font-sans relative overflow-x-hidden">
      
      {/* Background Blurs */}
      <div className="absolute top-[-10%] right-[-5%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-pink-600/20 rounded-full blur-[100px] md:blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-rose-600/10 rounded-full blur-[100px] md:blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-8 mt-20 md:mt-12 mb-12">
        
        {/* HEADER */}
        <div>
          <h1 className="text-4xl md:text-5xl font-semibold text-white mb-2 tracking-tight">Photobooth Analytics</h1>
          <p className="text-gray-400 font-medium tracking-wide">Live Revenue & Control</p>
        </div>

        {/* 🎛️ NEW: FILTER CONTROLS */}
        <div className="flex flex-wrap gap-4 bg-white/5 backdrop-blur-xl p-4 rounded-2xl border border-white/10">
          <div className="flex items-center gap-3">
            <label className="text-gray-400 text-sm font-semibold tracking-wider uppercase">Time:</label>
            <select 
              value={timeFilter} 
              onChange={(e) => setTimeFilter(e.target.value)}
              className="bg-black/40 border border-white/10 text-white text-sm rounded-xl px-4 py-2 outline-none focus:border-pink-500/50 appearance-none min-w-[120px]"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-gray-400 text-sm font-semibold tracking-wider uppercase">Method:</label>
            <select 
              value={methodFilter} 
              onChange={(e) => setMethodFilter(e.target.value)}
              className="bg-black/40 border border-white/10 text-white text-sm rounded-xl px-4 py-2 outline-none focus:border-pink-500/50 appearance-none min-w-[120px]"
            >
              <option value="all">All Methods</option>
              <option value="cash">Cash Only</option>
              <option value="digital">Digital (GCash/Card)</option>
            </select>
          </div>
        </div>
        
        {/* EARNINGS CARD */}
        <div className="bg-gradient-to-br from-pink-500/90 to-rose-600/90 backdrop-blur-2xl p-6 md:p-8 rounded-[2rem] shadow-2xl border border-white/20">
          <p className="text-pink-100 font-semibold tracking-widest text-xs uppercase mb-2 opacity-80">Filtered Revenue</p>
          <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-1">₱{totalEarnings.toLocaleString()}</h2>
          <div className="flex items-center gap-2 text-pink-100/80 text-sm font-medium mt-3">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            {totalSessions} Sessions Found
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 📜 NEW: RECENT TRANSACTIONS LOG */}
          <div className="bg-white/5 backdrop-blur-2xl rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col h-[500px]">
            <div className="bg-white/5 px-6 md:px-8 py-5 border-b border-white/10">
              <h3 className="text-lg font-semibold tracking-wide">Transaction History</h3>
            </div>
            
            <div className="overflow-y-auto flex-1 p-4 space-y-2 custom-scrollbar">
              {filteredTransactions.length === 0 ? (
                <div className="text-center text-gray-500 mt-10 font-medium">No transactions found for these filters.</div>
              ) : (
                filteredTransactions.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center bg-black/20 p-4 rounded-xl border border-white/5 hover:bg-white/5 transition-colors">
                    <div>
                      <div className="font-semibold text-white">{tx.layout_id || 'Unknown Layout'}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(tx.created_at).toLocaleDateString()} • {new Date(tx.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-pink-400">₱{tx.amount}</div>
                      <div className={`text-[10px] tracking-wider uppercase font-bold mt-1 px-2 py-0.5 rounded-md inline-block ${tx.payment_method === 'cash' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {tx.payment_method || 'CASH'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* PRICING TABLE (Kept exactly the same as your updated mobile-friendly one) */}
          <div className="bg-white/5 backdrop-blur-2xl rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl h-[500px] flex flex-col">
            <div className="bg-white/5 px-6 md:px-8 py-5 border-b border-white/10">
              <h3 className="text-lg font-semibold tracking-wide">Layout Pricing Control</h3>
            </div>
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              <div className="divide-y divide-white/5">
                {layouts.map((layout) => (
                  <div key={layout.id} className="flex flex-col md:grid md:grid-cols-2 gap-4 px-6 md:px-8 py-6 items-start md:items-center hover:bg-white/[0.02] transition-colors duration-300">
                    <div className="w-full flex justify-between md:block items-center">
                      <div className="font-semibold text-lg">{layout.name}</div>
                      <div className="md:hidden text-[10px] text-gray-400 font-mono tracking-wider bg-black/40 px-3 py-1.5 rounded-full uppercase border border-white/5">{layout.id}</div>
                    </div>
                    <div className="flex gap-3 w-full mt-2 md:mt-0 justify-end">
                      <div className="relative flex-1 md:flex-none">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold select-none">₱</span>
                        <input 
                          type="number" defaultValue={layout.price} id={`price-${layout.id}`}
                          className="w-full md:w-28 bg-black/20 border border-white/10 rounded-xl py-3 pl-8 pr-3 text-white focus:border-pink-500/50 focus:bg-black/40 outline-none font-medium"
                        />
                      </div>
                      <button 
                        onClick={() => handleUpdatePrice(layout.id, parseInt(document.getElementById(`price-${layout.id}`).value))}
                        className="bg-white text-black hover:bg-gray-200 font-semibold px-6 py-3 rounded-xl transition-all active:scale-[0.95]"
                      >Save</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}