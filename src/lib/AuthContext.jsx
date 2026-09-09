import { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import { supabase, authStorageKey, getLocalSession, finishLocalSignOut } from './supabase';
import { resolveAuthSession, beginLocalSignOut } from './localSession';
import { initializeOfflineStore } from './offlineStore';
import { prepareOffline } from './offline';
import { userCache, readCache, clearUserCache, purgeLegacyCache, activateUserCache, migrateOwnDraft } from './userCache';
const AuthContext = createContext({});
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [localReady, setLocalReady] = useState(false);
  const [canSync, setCanSync] = useState(false);
  const [contentVersion, setContentVersion] = useState(0);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const [isRecovery, setIsRecovery] = useState(false);
  const currentUser = useRef(null);
  const generation = useRef(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    if (!user?.id || !localReady || !canSync || !isOnline) return;
    let cancelled = false, busy = false, revision = 0, pending = false;
    let timer;
    const sync = async () => {
      if (cancelled) return;
      if (busy) { pending = true; return; }
      busy = true;
      const operation = revision;
      setSyncStatus('syncing');
      try {
        await prepareOffline(supabase, user, () => !cancelled && operation === revision && currentUser.current?.id === user.id);
        if (!cancelled) { setSyncStatus('ready'); setSyncMessage(''); }
      } catch (error) {
        if (!cancelled) { setSyncStatus('error'); setSyncMessage(error.message); }
      } finally {
        busy = false;
        if (!cancelled && pending) { pending = false; timer = setTimeout(sync, 1000); }
      }
    };
    const changed = () => { revision++; clearTimeout(timer); timer = setTimeout(sync, 500); };
    const resume = () => { if (document.visibilityState === 'visible') void sync(); };
    timer = setTimeout(sync, 0);
    const interval = setInterval(() => { if (document.visibilityState === 'visible') void sync(); }, 60000);
    window.addEventListener('canta-content-changed', changed);
    window.addEventListener('canta-sync-requested', sync);
    document.addEventListener('visibilitychange', resume);
    return () => {
      cancelled = true; clearTimeout(timer); clearInterval(interval);
      window.removeEventListener('canta-content-changed', changed); window.removeEventListener('canta-sync-requested', sync);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [user, localReady, canSync, isOnline]);
  const refreshUserData = useCallback(async () => {
    const account = currentUser.current;
    if (!account || !navigator.onLine) return;
    const request = ++generation.current;
    const { data: auth, error: authError } = await supabase.auth.getSession()
      .catch(error => ({ data: {}, error }));
    if (generation.current !== request || currentUser.current?.id !== account.id) return;
    if (authError || auth.session?.user?.id !== account.id) { setCanSync(false); return; }
    setCanSync(true);
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
      setIsOnline(navigator.onLine);
      if (navigator.onLine) void refreshUserData();
    };
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    const changed = () => setContentVersion(value => value + 1);
    const visible = () => { if (document.visibilityState === 'visible') update(); };
    window.addEventListener('canta-snapshot-ready', changed);
    document.addEventListener('visibilitychange', visible);
    const retry = setInterval(update, 60000);
    return () => {
      clearInterval(retry); window.removeEventListener('online', update); window.removeEventListener('offline', update);
      window.removeEventListener('canta-snapshot-ready', changed); document.removeEventListener('visibilitychange', visible);
    };
  }, [refreshUserData]);
  useEffect(() => {
    const requestGeneration = generation;
    let mounted = true;
    let receivedEvent = false;
    const acceptSession = (session, event) => {
      if (!mounted) return;
      if (localStorage.getItem(`${authStorageKey}:signed-out`) === 'true' && session) return;
      const resolved = resolveAuthSession(event, session, getLocalSession());
      const next = resolved?.user ?? null;
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
      if (next && event !== 'LOCAL_SESSION') setTimeout(() => { if (mounted) void refreshUserData(); }, 0);
    };
    // Hydrate the known account before Supabase attempts token renewal.
    acceptSession(getLocalSession(), 'LOCAL_SESSION');
    try { sessionStorage.removeItem('canta_force_offline'); } catch { /* Optional legacy preference. */ }
    initializeOfflineStore().catch(error => console.warn('Offline storage:', error.message))
      .finally(() => { if (mounted) setLocalReady(true); });
    const { data: { subscription: listener } } = supabase.auth.onAuthStateChange((event, session) => {
      receivedEvent = true;
      acceptSession(session, event);
    });
    const signedOutElsewhere = event => {
      if (event.key === `${authStorageKey}:signed-out` && event.newValue === 'true') {
        setCanSync(false);
        acceptSession(null, 'SIGNED_OUT');
      }
    };
    window.addEventListener('storage', signedOutElsewhere);
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setCanSync(false);
      if (!receivedEvent) acceptSession(data.session, 'INITIAL_SESSION');
    }).catch(() => { if (mounted) setCanSync(false); });
    return () => { mounted = false; requestGeneration.current++; listener.unsubscribe();
      window.removeEventListener('storage', signedOutElsewhere); activateUserCache(null); };
  }, [refreshUserData]);
  const logout = async () => {
    const account = currentUser.current;
    beginLocalSignOut(localStorage, authStorageKey);
    generation.current++;
    currentUser.current = null;
    setUser(null); setProfile(null); setSubscription(null); setCanSync(false);
    if (account) clearUserCache(account.id);
    // The local decision is immediate, including when the auth server is down.
    finishLocalSignOut();
  };
  return <AuthContext.Provider value={{ user, profile, subscription, isAuthenticated: !!user,
    plan: subscription?.plan_type || 'free', isLoadingAuth: loading || !localReady, isOnline: isOnline && canSync, canSync: isOnline && canSync, contentVersion, syncStatus, syncMessage, isRecovery,
    finishRecovery: () => setIsRecovery(false), refreshUserData, logout }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => useContext(AuthContext);
