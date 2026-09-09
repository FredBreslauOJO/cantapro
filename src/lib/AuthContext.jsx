import { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import { supabase } from './supabase';
import { userCache, readCache, clearUserCache, purgeLegacyCache, activateUserCache, migrateOwnDraft, readStoredAuthSession } from './userCache';
const AuthContext = createContext({});
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecovery, setIsRecovery] = useState(false);
  const currentUser = useRef(null);
  const generation = useRef(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine && sessionStorage.getItem('canta_force_offline') !== 'true');
  const refreshUserData = useCallback(async () => {
    const account = currentUser.current;
    if (!account || !navigator.onLine || sessionStorage.getItem('canta_force_offline') === 'true') return;
    const request = ++generation.current;
    const results = await Promise.allSettled([
      supabase.from('profiles').select('*').eq('id', account.id).maybeSingle(),
      supabase.from('user_subscriptions').select('*').eq('user_id', account.id).maybeSingle(),
    ]);
    const [prof, sub] = results.map(result => result.status === 'fulfilled' ? result.value : { error: result.reason || true });
    if (generation.current !== request || currentUser.current?.id !== account.id) return;
    if (!prof.error) {
      setProfile(prof.data);
      try { userCache.setItem(account.id, 'profile', JSON.stringify(prof.data)); } catch { /* Online data remains usable. */ }
    }
    if (!sub.error) {
      const value = sub.data || { plan_type: 'free' };
      setSubscription(value);
      try { userCache.setItem(account.id, 'subscription', JSON.stringify(value)); } catch { /* Online data remains usable. */ }
    }
  }, []);
  useEffect(() => {
    const update = () => {
      setIsOnline(navigator.onLine && sessionStorage.getItem('canta_force_offline') !== 'true');
      if (navigator.onLine) void refreshUserData();
    };
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, [refreshUserData]);
  useEffect(() => {
    const requestGeneration = generation;
    let mounted = true;
    let receivedEvent = false;
    const acceptSession = (session, event) => {
      if (!mounted) return;
      const next = session?.user ?? null;
      const previous = currentUser.current;
      if (previous?.id !== next?.id) {
        generation.current++;
        if (previous) clearUserCache(previous.id);
        setProfile(next ? readCache(next.id, 'profile') : null);
        setSubscription(next ? readCache(next.id, 'subscription') : null);
      }
      currentUser.current = next;
      activateUserCache(next?.id);
      try { migrateOwnDraft(next?.id); } catch { /* Storage can be disabled or a legacy draft corrupt. */ }
      try { purgeLegacyCache(); } catch { /* Storage can be disabled. */ }
      setUser(next);
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true);
      if (!next) setIsRecovery(false);
      setLoading(false);
      // Avoid waiting for Supabase calls inside its auth event lock.
      if (next) setTimeout(() => { if (mounted) void refreshUserData(); }, 0);
    };
    const { data: { subscription: listener } } = supabase.auth.onAuthStateChange((event, session) => {
      receivedEvent = true;
      acceptSession(session, event);
    });
    const recoverLocalSession = () => {
      const localSession = readStoredAuthSession();
      if (localSession?.user?.id) acceptSession(localSession, 'LOCAL_SESSION');
      else setLoading(false);
    };
    const timeout = setTimeout(() => { if (mounted && !receivedEvent) recoverLocalSession(); }, 1500);
    supabase.auth.getSession().then(({ data }) => {
      clearTimeout(timeout);
      if (!receivedEvent) acceptSession(data.session, 'INITIAL_SESSION');
    }).catch(() => { clearTimeout(timeout); if (mounted && !receivedEvent) recoverLocalSession(); });
    return () => { clearTimeout(timeout); mounted = false; requestGeneration.current++; listener.unsubscribe(); activateUserCache(null); };
  }, [refreshUserData]);
  const logout = async () => {
    const account = currentUser.current;
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) throw error;
    if (account) clearUserCache(account.id);
  };
  return <AuthContext.Provider value={{ user, profile, subscription, isAuthenticated: !!user,
    plan: subscription?.plan_type || 'free', isLoadingAuth: loading, isOnline, isRecovery,
    finishRecovery: () => setIsRecovery(false), refreshUserData, logout }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => useContext(AuthContext);
