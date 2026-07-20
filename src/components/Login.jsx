import { useState } from 'react';
import { supabase } from '../utils/supabase';
import { Camera } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (lockoutTime && Date.now() < lockoutTime) {
      const remainingSeconds = Math.ceil((lockoutTime - Date.now()) / 1000);
      setError(`Too many attempts. Please try again in ${remainingSeconds} seconds.`);
      return;
    } else if (lockoutTime && Date.now() >= lockoutTime) {
      // Reset after lockout expires
      setLockoutTime(null);
      setFailedAttempts(0);
    }

    setLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      
      if (newAttempts >= 5) {
        setLockoutTime(Date.now() + 30000); // 30 seconds lockout
        setError('Too many failed attempts. Please try again in 30 seconds.');
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } else {
      setFailedAttempts(0);
      setLockoutTime(null);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-6 font-sans">

      <div className="w-full max-w-[400px]">
        
        {/* Brand Header */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center mx-auto mb-5">
            <Camera className="w-6 h-6 text-zinc-300" />
          </div>
          <h1 className="text-3xl font-semibold text-zinc-50 mb-1.5 tracking-tight">Photobooth</h1>
          <p className="text-zinc-500 font-medium text-sm">Franchise Management Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#111113] border border-zinc-800 rounded-lg p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            
            <div className="space-y-1.5">
              <label className="block text-zinc-500 text-xs font-medium pl-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-3.5 text-zinc-50 placeholder-zinc-600 focus:border-zinc-500 outline-none transition-colors text-sm"
                placeholder="admin@photobooth.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-zinc-500 text-xs font-medium pl-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-3.5 text-zinc-50 placeholder-zinc-600 focus:border-zinc-500 outline-none transition-colors text-sm"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-md text-sm font-medium text-center">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-2 bg-zinc-50 text-zinc-900 font-medium text-sm py-3.5 rounded-lg transition-colors disabled:opacity-50 hover:bg-zinc-200"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>

          </form>
        </div>

        <p className="text-center text-[10px] text-zinc-600 mt-8 font-medium tracking-wider uppercase">
          Photobooth v1.0 • Secured by Supabase
        </p>
      </div>
    </div>
  );
}