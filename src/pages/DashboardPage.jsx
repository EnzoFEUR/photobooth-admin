import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import StatCard from '../components/ui/StatCard';
import { DollarSign, Camera, Monitor, Image, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const { franchiseeId, isSuper } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [booths, setBooths] = useState([]);
  const [frames, setFrames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);

      // Fetch transactions
      let txQuery = supabase.from('transactions').select('*').order('created_at', { ascending: false });
      if (!isSuper) txQuery = txQuery.eq('franchisee_id', franchiseeId);
      const { data: txData } = await txQuery;

      // Fetch booths
      let boothQuery = supabase.from('booths').select('*');
      if (!isSuper) boothQuery = boothQuery.eq('franchisee_id', franchiseeId);
      const { data: boothData } = await boothQuery;

      // Fetch frames
      let frameQuery = supabase.from('frames').select('*');
      if (!isSuper) frameQuery = frameQuery.eq('franchisee_id', franchiseeId);
      const { data: frameData } = await frameQuery;

      setTransactions(txData || []);
      setBooths(boothData || []);
      setFrames(frameData || []);
      setIsLoading(false);
    };

    if (franchiseeId) fetchAll();
  }, [franchiseeId, isSuper]);

  // Compute stats
  const totalRevenue = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const todaySessions = transactions.filter(tx => 
    new Date(tx.created_at).toDateString() === new Date().toDateString()
  ).length;
  const activeBooths = booths.filter(b => {
    if (!b.last_heartbeat) return false;
    return (Date.now() - new Date(b.last_heartbeat).getTime()) < 5 * 60 * 1000;
  }).length;
  const activeFrames = frames.filter(f => f.is_active).length;

  // Revenue chart data (last 7 days)
  const chartData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayRevenue = transactions
        .filter(tx => new Date(tx.created_at).toDateString() === dateStr)
        .reduce((sum, tx) => sum + Number(tx.amount), 0);
      days.push({ day: dayLabel, revenue: dayRevenue });
    }
    return days;
  }, [transactions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-[3px] border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Overview</h1>
        <p className="text-gray-500 font-medium mt-1">
          {isSuper ? 'All franchise performance' : 'Your photobooth performance'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard label="Total Revenue" value={`₱${totalRevenue.toLocaleString()}`} icon={DollarSign} color="pink" />
        <StatCard label="Sessions Today" value={todaySessions} icon={Camera} color="blue" />
        <StatCard label="Active Booths" value={`${activeBooths}/${booths.length}`} icon={Monitor} color="green" />
        <StatCard label="Active Frames" value={activeFrames} icon={Image} color="amber" />
      </div>

      {/* Revenue Chart */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-4 h-4 text-pink-400" />
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Revenue (Last 7 Days)</h3>
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickFormatter={(v) => `₱${v}`}
              />
              <Tooltip 
                contentStyle={{ 
                  background: '#18181b', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '12px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                  padding: '12px 16px',
                }}
                labelStyle={{ color: '#9ca3af', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                itemStyle={{ color: '#f472b6', fontWeight: 700 }}
                formatter={(value) => [`₱${value.toLocaleString()}`, 'Revenue']}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#ec4899" 
                strokeWidth={2.5}
                fill="url(#revenueGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Recent Transactions</h3>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {transactions.slice(0, 8).map((tx) => (
            <div key={tx.id} className="flex justify-between items-center px-6 py-4 hover:bg-white/[0.02] transition-colors">
              <div>
                <p className="text-sm font-semibold text-white">{tx.layout_id || 'Photo Session'}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(tx.created_at).toLocaleDateString()} • {new Date(tx.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-pink-400">₱{Number(tx.amount).toLocaleString()}</p>
                <span className={`text-[9px] tracking-wider uppercase font-bold mt-1 px-2 py-0.5 rounded-md inline-block ${
                  tx.payment_method === 'cash' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {tx.payment_method || 'cash'}
                </span>
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="text-center text-gray-600 py-12 font-medium">No transactions yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
