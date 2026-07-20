import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import Loader from '../components/ui/Loader';
import { DollarSign, Save, Check, AlertCircle } from 'lucide-react';

export default function PricingPage() {
  const { franchiseeId, isSuper, isLoading: authLoading } = useAuth();
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
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
    }
  };

  if (authLoading || isLoading) {
    return <Loader message="Loading pricing rules..." />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-50">Layout Pricing</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {isSuper ? 'Set prices for all photobooth layouts' : 'View current pricing for your kiosks'}
        </p>
      </div>

      {!isSuper && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium border bg-amber-500/10 border-amber-500/20 text-amber-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Only Super Admins can modify pricing. Contact your administrator for changes.
        </div>
      )}

      <div className="bg-[#111113] border border-zinc-800 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-zinc-400" />
          <h3 className="text-sm font-medium text-zinc-400">Active Layouts</h3>
        </div>

        <div className="divide-y divide-zinc-800">
          {layouts.map((layout) => {
            const currentPrice = editedPrices[layout.id] ?? layout.price;
            const hasChanged = editedPrices[layout.id] !== undefined && editedPrices[layout.id] !== layout.price;

            return (
              <div key={layout.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 hover:bg-zinc-800/30 transition-colors">
                <div>
                  <p className="text-base font-medium text-zinc-50">{layout.name}</p>
                  <p className="text-[11px] text-zinc-600 font-mono mt-1 bg-zinc-800 px-2 py-0.5 rounded-md inline-block">
                    {layout.id}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-medium text-sm">₱</span>
                    <input 
                      type="number"
                      value={currentPrice}
                      onChange={(e) => handlePriceChange(layout.id, parseInt(e.target.value) || 0)}
                      disabled={!isSuper}
                      className="w-28 bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 pl-8 pr-3 text-zinc-50 text-sm font-medium outline-none focus:border-zinc-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {isSuper && (
                    <button
                      onClick={() => handleSave(layout)}
                      disabled={!hasChanged}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        savedId === layout.id 
                          ? 'bg-emerald-500 text-white' 
                          : hasChanged 
                            ? 'bg-zinc-50 text-zinc-900 hover:bg-zinc-200' 
                            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
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
          <div className="text-center text-zinc-600 py-12 font-medium">No layouts configured yet</div>
        )}
      </div>
    </div>
  );
}
