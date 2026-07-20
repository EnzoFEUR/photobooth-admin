export default function StatCard({ label, value, icon: Icon, trend }) {
  return (
    <div className="bg-[#111113] border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 rounded-md bg-zinc-800/50">
          <Icon className="w-5 h-5 text-zinc-400" />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            trend >= 0 
              ? 'bg-emerald-500/10 text-emerald-400' 
              : 'bg-red-500/10 text-red-400'
          }`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-2xl font-semibold text-zinc-50 tracking-tight">{value}</p>
      <p className="text-xs text-zinc-500 font-medium mt-1 uppercase tracking-wider">{label}</p>
    </div>
  );
}
