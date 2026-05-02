import { useState, useEffect } from 'react';
import { supabase } from './utils/supabase';
import AdminDashboard from './components/AdminDashboard'; 
import Login from './components/Login'; // 👈 Import your new file!

export default function App() {
  const [session, setSession] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Check if the user is already logged in when the app loads
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show a blank dark screen for a split second while checking login status
  if (isInitializing) {
    return <div className="min-h-screen bg-[#09090b]"></div>;
  }

  // If the user IS logged in, show the Dashboard!
  if (session) {
    return (
      <div className="relative bg-[#09090b] min-h-screen">
        <button 
          onClick={() => supabase.auth.signOut()}
          className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white font-semibold py-2 px-6 rounded-full transition-all active:scale-[0.95] z-50"
        >
          Sign Out
        </button>
        <AdminDashboard />
      </div>
    );
  }

  // If the user is NOT logged in, show the sleek Login Form
  return <Login />;
}