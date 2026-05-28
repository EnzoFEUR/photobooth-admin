import { useState } from 'react';
import { supabase } from '../utils/supabase';
import { Sparkles } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-6 font-sans relative overflow-hidden">
      
      {/* Ambient Background */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-pink-600/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-rose-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[400px] animate-fade-in">
        
        {/* Brand Header */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20 mx-auto mb-5">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-1.5 tracking-tight">Photobooth</h1>
          <p className="text-gray-500 font-medium tracking-wide text-sm">Franchise Management Portal</p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            
            <div className="space-y-1.5">
              <label className="block text-gray-400 text-xs font-semibold pl-1 uppercase tracking-wider">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 text-white placeholder-gray-600 focus:border-pink-500/30 focus:bg-white/[0.06] outline-none transition-all text-sm"
                placeholder="admin@photobooth.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-gray-400 text-xs font-semibold pl-1 uppercase tracking-wider">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 text-white placeholder-gray-600 focus:border-pink-500/30 focus:bg-white/[0.06] outline-none transition-all text-sm"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-medium text-center">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-semibold text-sm py-4 rounded-xl shadow-lg shadow-pink-500/20 transition-all duration-300 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 hover:shadow-xl hover:shadow-pink-500/30"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>

          </form>
        </div>

        <p className="text-center text-[10px] text-gray-700 mt-8 font-medium tracking-wider uppercase">
          Photobooth v1.0 • Secured by Supabase
        </p>
      </div>
    </div>
  );
}