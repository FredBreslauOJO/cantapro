import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // O NOVO MONITOR DE REDE GLOBAL
  const [isOnline, setIsOnline] = useState(
    navigator.onLine && sessionStorage.getItem('canta_force_offline') !== 'true'
  );

  useEffect(() => {
    // Monitora quedas reais de internet ou a nossa "trava" manual
    const handleConnectionChange = () => {
      const forceOffline = sessionStorage.getItem('canta_force_offline') === 'true';
      setIsOnline(navigator.onLine && !forceOffline);
    };

    window.addEventListener('online', handleConnectionChange);
    window.addEventListener('offline', handleConnectionChange);
    
    // Dispara a primeira checagem
    handleConnectionChange();

    return () => {
      window.removeEventListener('online', handleConnectionChange);
      window.removeEventListener('offline', handleConnectionChange);
    };
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUserData(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserData(session.user.id);
        } else {
          setProfile(null);
          setSubscription(null);
          setLoading(false);
        }
      }
    );

    return () => authListener.unsubscribe();
  }, []);

  const fetchUserData = async (userId) => {
    const cachedProfile = localStorage.getItem(`canta_profile_${userId}`);
    const cachedSub = localStorage.getItem(`canta_sub_${userId}`);

    if (cachedProfile) setProfile(JSON.parse(cachedProfile));
    if (cachedSub) setSubscription(JSON.parse(cachedSub));

    if (cachedProfile || cachedSub) {
      setLoading(false); 
    } else {
      setLoading(true);
    }

    // Se estiver offline ou no modo forçado, ignora o Supabase e fica com o cache
    if (!navigator.onLine || sessionStorage.getItem('canta_force_offline') === 'true') {
      setLoading(false);
      return;
    }

    try {
      const { data: prof, error: profError } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (prof && !profError) {
        setProfile(prof);
        localStorage.setItem(`canta_profile_${userId}`, JSON.stringify(prof));
      }

      const { data: sub, error: subError } = await supabase.from('user_subscriptions').select('*').eq('user_id', userId).single();
      if (sub && !subError) {
        setSubscription(sub);
        localStorage.setItem(`canta_sub_${userId}`, JSON.stringify(sub));
      } else if (!sub && !cachedSub) {
        setSubscription({ plan_type: 'free' });
      }
    } catch (error) {
      console.warn("Modo Offline ativado na Autenticação.", error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      subscription, 
      isAuthenticated: !!user,
      plan: subscription?.plan_type || 'free',
      isLoadingAuth: loading,
      isOnline, // <-- DISPONIBILIZAMOS ISSO PARA O APP INTEIRO
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);