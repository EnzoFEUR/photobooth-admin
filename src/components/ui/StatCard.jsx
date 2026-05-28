export default function StatCard({ label, value, icon: Icon, trend, color = 'pink' }) {
  const colorMap = {
    pink: 'from-pink-500/20 to-rose-500/10 border-pink-500/20',
    blue: 'from-blue-500/20 to-cyan-500/10 border-blue-500/20',
    green: 'from-emerald-500/20 to-green-500/10 border-emerald-500/20',
    amber: 'from-amber-500/20 to-yellow-500/10 border-amber-500/20',
  };

  const iconColorMap = {
    pink: 'text-pink-400',
    blue: 'text-blue-400',
    green: 'text-emerald-400',
    amber: 'text-amber-400',
  };

  return (
    <div className={`
      bg-gradient-to-br ${colorMap[color]} 
      backdrop-blur-xl border rounded-2xl p-6
      transition-all duration-300 hover:scale-[1.02]
    `}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl bg-white/[0.06] ${iconColorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            trend >= 0 
              ? 'bg-emerald-500/20 text-emerald-400' 
              : 'bg-red-500/20 text-red-400'
          }`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-wider">{label}</p>
    </div>
  );
}
