import { useQuery } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import Loader from '../components/ui/Loader';
import { Monitor, Wifi, WifiOff, Droplets, Scroll, MapPin, Clock, PowerOff, Unlock, Briefcase } from 'lucide-react';

export default function BoothsPage() {
  const { franchiseeId, isSuper } = useAuth();

  const { data: booths = [], isLoading } = useQuery({
    queryKey: ['booths', franchiseeId],
    queryFn: async () => {
      let query = supabase.from('booths').select('*').order('created_at', { ascending: false });
      if (!isSuper) query = query.eq('franchisee_id', franchiseeId);
      const { data, error } = await query;
      if (error) {
        throw new Error(error.message);
      }
      return data || [];
    },
    enabled: !!franchiseeId,
    refetchInterval: 1000 * 60, // Refresh booth status automatically every minute!
  });

  const isOnline = (heartbeat) => {
    if (!heartbeat) return false;
    return (Date.now() - new Date(heartbeat).getTime()) < 5 * 60 * 1000; // 5 min threshold
  };

  const handleRevokeTerminal = async (id) => {
    if (confirm("Are you sure you want to remotely kill this terminal? It will instantly log out and wipe its local data on the next ping.")) {
      try {
        const { error } = await supabase.from('booths').update({ force_logout: true }).eq('id', id);
        if (error) {
          alert(`Failed to activate kill switch: ${error.message}`);
        } else {
          alert("Kill switch activated! Terminal will self-destruct on next heartbeat.");
        }
      } catch (err) {
        console.error(err);
        alert("An unexpected error occurred.");
      }
    }
  };

  const getTimeSince = (heartbeat) => {
    if (!heartbeat) return 'Never';
    const diff = Date.now() - new Date(heartbeat).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (isLoading) {
    return <Loader message="Connecting to booths..." />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-50">Booth Telemetry</h1>
        <p className="text-sm text-zinc-500 mt-1">Monitor your physical kiosk machines in real-time</p>
      </div>

      {booths.length === 0 ? (
        <div className="bg-[#111113] border border-zinc-800 rounded-lg p-12 text-center">
          <Monitor className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-400">No Booths Registered</h3>
          <p className="text-sm text-zinc-600 mt-2">Your physical kiosk machines will appear here once connected.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {booths.map((booth) => {
            const online = isOnline(booth.last_heartbeat);
            return (
              <div key={booth.id} className="bg-[#111113] border border-zinc-800 rounded-lg p-5 space-y-5 hover:border-zinc-700 transition-colors">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-zinc-50">{booth.booth_name}</h3>
                    <div className="flex items-center gap-1.5 mt-1.5 text-zinc-500">
                      <MapPin className="w-3 h-3" />
                      <span className="text-xs font-medium">{booth.location_name || 'No location set'}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                      online 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                      {online ? 'Online' : 'Offline'}
                    </div>

                    {/* Operating Mode Badge */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-800 text-zinc-300">
                      {booth.is_event_mode ? <Unlock className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                      {booth.is_event_mode ? 'Event Mode' : 'Business Mode'}
                    </div>
                  </div>
                </div>

                {/* Consumables (DNP RX1HS) */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Scroll className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">Media Remaining</span>
                      </div>
                      <span className={`text-xs font-semibold ${booth.prints_remaining > 150 ? 'text-emerald-400' : booth.prints_remaining > 50 ? 'text-amber-400' : 'text-red-400'}`}>
                        {booth.prints_remaining} / 700
                      </span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          booth.prints_remaining > 150 ? 'bg-emerald-500' : booth.prints_remaining > 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${(booth.prints_remaining / 700) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Lifetime Prints */}
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                     <span className="text-xs text-zinc-500">Lifetime Prints</span>
                     <span className="text-xs font-semibold text-zinc-300">{booth.total_prints_lifetime?.toLocaleString() || 0}</span>
                  </div>
                </div>

                {/* Last Heartbeat & Kill Switch */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                  <div className="flex items-center gap-1.5 text-zinc-600">
                    <Clock className="w-3 h-3" />
                    <span className="text-[11px] font-medium">
                      Last ping: {getTimeSince(booth.last_heartbeat)}
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => handleRevokeTerminal(booth.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-medium transition-colors"
                  >
                    <PowerOff className="w-3 h-3" /> Revoke
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
