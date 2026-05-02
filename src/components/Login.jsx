import { useState } from 'react';
import { supabase } from '../utils/supabase';

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
      
      {/* Ambient iOS-style Background Blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-pink-600/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-rose-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[400px]">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-semibold text-white mb-2 tracking-tight">Photobooth</h1>
          <p className="text-gray-400 font-medium tracking-wide">Admin Portal</p>
        </div>

        {/* Frosted Glass Form Card */}
        <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-[2rem] shadow-2xl border border-white/10">
          <form onSubmit={handleLogin} className="space-y-5">
            
            <div className="space-y-1.5">
              <label className="block text-gray-400 text-sm pl-2">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-gray-600 focus:border-pink-500/50 focus:bg-white/10 focus:ring-4 focus:ring-pink-500/10 outline-none transition-all duration-300"
                placeholder="admin@photobooth.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-gray-400 text-sm pl-2">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-gray-600 focus:border-pink-500/50 focus:bg-white/10 focus:ring-4 focus:ring-pink-500/10 outline-none transition-all duration-300"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl text-sm font-medium text-center backdrop-blur-md">
                {error}
              </div>
            )}

            {/* Fluid Button with Active Scale Effect */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-4 bg-white text-black hover:bg-gray-100 font-semibold text-lg py-4 rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-all duration-300 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}