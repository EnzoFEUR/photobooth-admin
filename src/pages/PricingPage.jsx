import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import Loader from '../components/ui/Loader';
import { DollarSign, Save, Check, AlertCircle } from 'lucide-react';

export default function PricingPage() {
  const { franchiseeId, isSuper } = useAuth();
  const queryClient = useQueryClient();
  const [editedPrices, setEditedPrices] = useState({});
  const [savedId, setSavedId] = useState(null);

  const { data: layouts = [], isLoading } = useQuery({
    queryKey: ['pricing'],
    queryFn: async () => {
      const { data } = await supabase.from('layout_pricing').select('*').order('price', { ascending: true });
      return data || [];
    },
  });

  const handlePriceChange = (id, value) => {
    setEditedPrices(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = async (layout) => {
    const newPrice = editedPrices[layout.id];
    if (newPrice === undefined || newPrice === layout.price) return;

    const { error } = await supabase
      .from('layout_pricing')
      .update({ price: parseInt(newPrice) })
      .eq('id', layout.id);

    if (!error) {
      setSavedId(layout.id);
      setTimeout(() => setSavedId(null), 2000);
      fetchLayouts();
    }
  };

  if (isLoading) {
    return <Loader message="Loading pricing rules..." />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Layout Pricing</h1>
        <p className="text-gray-500 font-medium mt-1">
          {isSuper ? 'Set prices for all photobooth layouts' : 'View current pricing for your kiosks'}
        </p>
      </div>

      {!isSuper && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-xl text-sm font-medium border bg-amber-500/10 border-amber-500/20 text-amber-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Only Super Admins can modify pricing. Contact your administrator for changes.
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-pink-400" />
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Active Layouts</h3>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {layouts.map((layout) => {
            const currentPrice = editedPrices[layout.id] ?? layout.price;
            const hasChanged = editedPrices[layout.id] !== undefined && editedPrices[layout.id] !== layout.price;

            return (
              <div key={layout.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 hover:bg-white/[0.02] transition-colors">
                <div>
                  <p className="text-base font-semibold text-white">{layout.name}</p>
                  <p className="text-[10px] text-gray-600 font-mono mt-1 uppercase tracking-wider bg-white/[0.04] px-2.5 py-1 rounded-md inline-block">
                    {layout.id}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">₱</span>
                    <input 
                      type="number"
                      value={currentPrice}
                      onChange={(e) => handlePriceChange(layout.id, parseInt(e.target.value) || 0)}
                      disabled={!isSuper}
                      className="w-28 bg-white/[0.04] border border-white/[0.08] rounded-xl py-3 pl-8 pr-3 text-white text-sm font-medium outline-none focus:border-pink-500/30 focus:bg-white/[0.06] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {isSuper && (
                    <button
                      onClick={() => handleSave(layout)}
                      disabled={!hasChanged}
                      className={`flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] ${
                        savedId === layout.id 
                          ? 'bg-emerald-500 text-white' 
                          : hasChanged 
                            ? 'bg-white text-black hover:bg-gray-100' 
                            : 'bg-white/[0.06] text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      {savedId === layout.id ? (
                        <><Check className="w-4 h-4" /> Saved</>
                      ) : (
                        <><Save className="w-4 h-4" /> Save</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {layouts.length === 0 && (
          <div className="text-center text-gray-600 py-12 font-medium">No layouts configured yet</div>
        )}
      </div>
    </div>
  );
}
