import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import Loader from '../components/ui/Loader';
import { Users, Monitor, DollarSign, Shield, Plus, Mail, Building2, X, ShieldAlert } from 'lucide-react';

export default function FranchiseesPage() {
  const { isSuper, isLoading: authLoading } = useAuth();
  const [showInviteModal, setShowInviteModal] = useState(false);

  const { data: franchisees = [], isLoading } = useQuery({
    queryKey: ['franchisees'],
    queryFn: async () => {
      if (!isSuper) return [];
      
      const [profilesRes, boothsRes, txRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: true }),
        supabase.from('booths').select('id, franchisee_id'),
        supabase.from('transactions').select('franchisee_id, amount')
      ]);

      const profiles = profilesRes.data || [];
      const booths = boothsRes.data || [];
      const transactions = txRes.data || [];

      // Group booths and revenue by franchisee_id in O(N) memory
      const boothCountMap = {};
      booths.forEach(b => {
        boothCountMap[b.franchisee_id] = (boothCountMap[b.franchisee_id] || 0) + 1;
      });

      const revenueMap = {};
      transactions.forEach(tx => {
        revenueMap[tx.franchisee_id] = (revenueMap[tx.franchisee_id] || 0) + Number(tx.amount || 0);
      });

      return profiles.map(profile => ({
        ...profile,
        boothCount: boothCountMap[profile.id] || 0,
        totalRevenue: revenueMap[profile.id] || 0
      }));
    },
    enabled: isSuper,
  });

  if (authLoading || isLoading) {
    return <Loader message="Loading directory..." />;
  }

  if (!isSuper) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="card p-12 text-center max-w-md">
          <ShieldAlert className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-zinc-50">Access Restricted</h3>
          <p className="text-sm text-zinc-500 mt-2">Only Super Admins can manage franchisees.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-50">Franchisees</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage all franchise accounts and performance</p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-zinc-50 text-zinc-900 hover:bg-zinc-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Invite Franchisee
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-zinc-800/50 flex items-center justify-center">
              <Users className="w-4 h-4 text-zinc-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Total Accounts</p>
              <p className="text-2xl font-semibold text-zinc-50">{franchisees.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-zinc-800/50 flex items-center justify-center">
              <Monitor className="w-4 h-4 text-zinc-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Total Booths</p>
              <p className="text-2xl font-semibold text-zinc-50">{franchisees.reduce((sum, f) => sum + f.boothCount, 0)}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-zinc-800/50 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-zinc-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Platform Revenue</p>
              <p className="text-2xl font-semibold text-zinc-50">₱{franchisees.reduce((sum, f) => sum + f.totalRevenue, 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Franchisee List */}
      {franchisees.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-10 h-10 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-zinc-400">No Franchisees Yet</h3>
          <p className="text-sm text-zinc-600 mt-2">Invite your first franchisee to get started.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800">
            <h3 className="text-sm font-medium text-zinc-400">All Accounts</h3>
          </div>
          <div className="divide-y divide-zinc-800">
            {franchisees.map((f) => (
              <div key={f.id} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-800/30 transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-9 h-9 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
                    <span className="text-sm font-medium text-zinc-300">
                      {(f.full_name || f.email || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <p className="text-sm font-medium text-zinc-50 truncate max-w-[150px]">{f.full_name || 'Unnamed User'}</p>
                      {f.role === 'super_admin' ? (
                        <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 shrink-0">
                          <Shield className="w-2.5 h-2.5" />
                          Super
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 shrink-0">
                          <Building2 className="w-2.5 h-2.5" />
                          Franchisee
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5 truncate max-w-[200px]">{f.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-medium text-zinc-500">Booths</p>
                    <p className="text-sm font-medium text-zinc-50">{f.boothCount}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-medium text-zinc-500">Revenue</p>
                    <p className="text-sm font-medium text-zinc-50">₱{f.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-zinc-500">Joined</p>
                    <p className="text-xs text-zinc-400">{new Date(f.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowInviteModal(false)}>
          <div className="card max-w-lg w-full p-8 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-zinc-800 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-zinc-400" />
                </div>
                <h2 className="text-base font-semibold text-zinc-50">Invite Franchisee</h2>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="text-zinc-500 hover:text-zinc-300 transition-colors p-1.5 rounded-md hover:bg-zinc-800/50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 rounded-md bg-zinc-800/30 border border-zinc-800">
                <span className="w-6 h-6 rounded-md bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">1</span>
                <div>
                  <p className="text-sm font-medium text-zinc-50">Go to Supabase Dashboard</p>
                  <p className="text-xs text-zinc-500 mt-1">Navigate to <span className="text-zinc-400">Authentication → Users → Invite User</span></p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-md bg-zinc-800/30 border border-zinc-800">
                <span className="w-6 h-6 rounded-md bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">2</span>
                <div>
                  <p className="text-sm font-medium text-zinc-50">Enter their email</p>
                  <p className="text-xs text-zinc-500 mt-1">They will receive a magic link to set their password.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-md bg-zinc-800/30 border border-zinc-800">
                <span className="w-6 h-6 rounded-md bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">3</span>
                <div>
                  <p className="text-sm font-medium text-zinc-50">Profile auto-created</p>
                  <p className="text-xs text-zinc-500 mt-1">Their profile will be automatically created with the <span className="text-zinc-400">'franchisee'</span> role.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowInviteModal(false)}
              className="w-full py-2.5 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-50 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
