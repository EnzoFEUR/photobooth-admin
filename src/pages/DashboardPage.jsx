import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import StatCard from '../components/ui/StatCard';
import Loader from '../components/ui/Loader';
import { DollarSign, Camera, Monitor, Image, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const { franchiseeId, isSuper, isLoading: authLoading } = useAuth();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard', franchiseeId],
    queryFn: async () => {
      let txQuery = supabase.from('transactions').select('*').order('created_at', { ascending: false });
      let boothQuery = supabase.from('booths').select('*');
      let frameQuery = supabase.from('frames').select('*');

      if (!isSuper) {
        txQuery = txQuery.eq('franchisee_id', franchiseeId);
        boothQuery = boothQuery.eq('franchisee_id', franchiseeId);
        frameQuery = frameQuery.eq('franchisee_id', franchiseeId);
      }

      const [txRes, boothRes, frameRes] = await Promise.all([txQuery, boothQuery, frameQuery]);
      
      return {
        transactions: txRes.data || [],
        booths: boothRes.data || [],
        frames: frameRes.data || []
      };
    },
    enabled: !!franchiseeId,
  });

  const transactions = dashboardData?.transactions || [];
  const booths = dashboardData?.booths || [];
  const frames = dashboardData?.frames || [];

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

  if (authLoading || isLoading) {
    return <Loader message="Loading..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-50">Overview</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {isSuper ? 'All franchise performance' : 'Your photobooth performance'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={`₱${totalRevenue.toLocaleString()}`} icon={DollarSign} />
        <StatCard label="Sessions Today" value={todaySessions} icon={Camera} />
        <StatCard label="Active Booths" value={`${activeBooths}/${booths.length}`} icon={Monitor} />
        <StatCard label="Active Frames" value={activeFrames} icon={Image} />
      </div>

      {/* Revenue Chart */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-4 h-4 text-zinc-400" />
          <h3 className="text-sm font-medium text-zinc-400">Revenue — Last 7 Days</h3>
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a1a1aa" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#a1a1aa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: '#71717a', fontSize: 12, fontWeight: 500 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: '#71717a', fontSize: 12 }}
                tickFormatter={(v) => `₱${v}`}
              />
              <Tooltip 
                contentStyle={{ 
                  background: '#18181b', 
                  border: '1px solid #3f3f46', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  padding: '10px 14px',
                }}
                labelStyle={{ color: '#a1a1aa', fontSize: '12px', fontWeight: 500 }}
                itemStyle={{ color: '#fafafa', fontWeight: 600 }}
                formatter={(value) => [`₱${value.toLocaleString()}`, 'Revenue']}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#71717a" 
                strokeWidth={1.5}
                fill="url(#revenueGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-400">Recent Transactions</h3>
        </div>
        <div className="divide-y divide-zinc-800">
          {transactions.slice(0, 8).map((tx) => (
            <div key={tx.id} className="flex justify-between items-center px-6 py-4 hover:bg-zinc-800/30 transition-colors">
              <div>
                <p className="text-sm font-medium text-zinc-100">{tx.layout_id || 'Photo Session'}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {new Date(tx.created_at).toLocaleDateString()} • {new Date(tx.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-zinc-50">₱{Number(tx.amount).toLocaleString()}</p>
                <span className={`text-xs font-medium mt-1 px-2 py-0.5 rounded-md inline-block ${
                  tx.payment_method === 'cash' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                }`}>
                  {tx.payment_method || 'cash'}
                </span>
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="text-center text-zinc-500 py-12 font-medium">No transactions yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
