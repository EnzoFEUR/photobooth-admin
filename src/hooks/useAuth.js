import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../utils/supabase';

/**
 * 🔐 useAuth Hook
 * Fetches the current Supabase session AND the user's profile (role, name).
 * Returns everything components need to make role-based decisions.
 */
export function useAuth() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
      else setIsLoading(false);
    });

    // 2. Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Failed to fetch profile:', error.message);
      // If profile doesn't exist yet (race condition), create a minimal one
      setProfile({ id: userId, role: 'franchisee', full_name: '' });
    } else {
      setProfile(data);
    }
    setIsLoading(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  // Derived state
  const user = session?.user || null;
  const role = profile?.role || 'franchisee';
  const isSuper = role === 'super_admin';
  const franchiseeId = user?.id || null;

  return useMemo(() => ({
    user,
    session,
    profile,
    role,
    isSuper,
    franchiseeId,
    isLoading,
    isAuthenticated: !!session,
    signOut,
  }), [session, profile, isLoading]);
}
