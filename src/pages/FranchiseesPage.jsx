import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import Loader from '../components/ui/Loader';
import { Users, Monitor, DollarSign, Shield, Plus, Mail, Building2, X, ShieldAlert } from 'lucide-react';

export default function FranchiseesPage() {
  const { isSuper } = useAuth();
  const [showInviteModal, setShowInviteModal] = useState(false);

  const { data: franchisees = [], isLoading } = useQuery({
    queryKey: ['franchisees'],
    queryFn: async () => {
      if (!isSuper) return [];
      const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
      if (!profiles) return [];

      return await Promise.all(profiles.map(async (profile) => {
        const { count: boothCount } = await supabase.from('booths').select('*', { count: 'exact', head: true }).eq('franchisee_id', profile.id);
        const { data: txData } = await supabase.from('transactions').select('amount').eq('franchisee_id', profile.id);
        const totalRevenue = (txData || []).reduce((sum, tx) => sum + Number(tx.amount), 0);
        return { ...profile, boothCount: boothCount || 0, totalRevenue };
      }));
    },
    enabled: isSuper,
  });

  if (!isSuper) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="glass-card p-12 text-center max-w-md">
          <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white">Access Restricted</h3>
          <p className="text-sm text-gray-500 mt-2">Only Super Admins can manage franchisees.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <Loader message="Loading directory..." />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Franchisees</h1>
          <p className="text-gray-500 font-medium mt-1">Manage all franchise accounts and performance</p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-white text-black hover:bg-gray-100 shadow-lg shadow-white/10 transition-all duration-200 active:scale-[0.97]"
        >
          <Plus className="w-4 h-4" />
          Invite Franchisee
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        <div className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Accounts</p>
              <p className="text-2xl font-bold text-white">{franchisees.length}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Booths</p>
              <p className="text-2xl font-bold text-white">{franchisees.reduce((sum, f) => sum + f.boothCount, 0)}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Platform Revenue</p>
              <p className="text-2xl font-bold text-white">₱{franchisees.reduce((sum, f) => sum + f.totalRevenue, 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Franchisee List */}
      {franchisees.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400">No Franchisees Yet</h3>
          <p className="text-sm text-gray-600 mt-2">Invite your first franchisee to get started.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">All Accounts</h3>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {franchisees.map((f) => (
              <div key={f.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-white">
                      {(f.full_name || f.email || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <p className="text-sm font-semibold text-white truncate max-w-[150px]">{f.full_name || 'Unnamed User'}</p>
                      {f.role === 'super_admin' ? (
                        <span className="flex items-center gap-1 text-[9px] tracking-wider uppercase font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-400 shrink-0">
                          <Shield className="w-2.5 h-2.5" />
                          Super
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[9px] tracking-wider uppercase font-bold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 shrink-0">
                          <Building2 className="w-2.5 h-2.5" />
                          Franchisee
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">{f.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Booths</p>
                    <p className="text-sm font-bold text-white">{f.boothCount}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Revenue</p>
                    <p className="text-sm font-bold text-pink-400">₱{f.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Joined</p>
                    <p className="text-xs text-gray-400">{new Date(f.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowInviteModal(false)}>
          <div className="glass-card max-w-lg w-full p-8 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-pink-400" />
                </div>
                <h2 className="text-lg font-bold text-white">Invite Franchisee</h2>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/[0.06]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                <div>
                  <p className="text-sm font-semibold text-white">Go to Supabase Dashboard</p>
                  <p className="text-xs text-gray-500 mt-1">Navigate to <span className="text-gray-400 font-medium">Authentication → Users → Invite User</span></p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                <div>
                  <p className="text-sm font-semibold text-white">Enter their email</p>
                  <p className="text-xs text-gray-500 mt-1">They will receive a magic link to set their password.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                <div>
                  <p className="text-sm font-semibold text-white">Profile auto-created</p>
                  <p className="text-xs text-gray-500 mt-1">Their profile will be automatically created with the <span className="text-gray-400 font-medium">'franchisee'</span> role.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowInviteModal(false)}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-white/[0.06] text-gray-300 hover:bg-white/[0.1] hover:text-white transition-all duration-200"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
