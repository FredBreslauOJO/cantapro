import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isOnline, setIsOnline] = useState(
    navigator.onLine && sessionStorage.getItem('canta_force_offline') !== 'true'
  );

  useEffect(() => {
    const handleConnectionChange = () => {
      const forceOffline = sessionStorage.getItem('canta_force_offline') === 'true';
      setIsOnline(navigator.onLine && !forceOffline);
    };

    window.addEventListener('online', handleConnectionChange);
    window.addEventListener('offline', handleConnectionChange);
    
    handleConnectionChange();

    return () => {
      window.removeEventListener('online', handleConnectionChange);
      window.removeEventListener('offline', handleConnectionChange);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Lê a sessão do armazenamento local do celular primeiro
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchUserData(session.user.id);
          } else {
            setLoading(false);
          }
        }
      } catch (error) {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // BLINDAGEM: Se a internet cair, o Supabase tenta atualizar o token, falha e dispara "SIGNED_OUT".
        // Aqui nós ignoramos esse deslogamento se o celular estiver offline.
        if (!navigator.onLine && event === 'SIGNED_OUT') return;

        if (mounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchUserData(session.user.id);
          } else {
            setProfile(null);
            setSubscription(null);
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      authListener.unsubscribe();
    };
  }, []);

  const fetchUserData = async (userId) => {
    const cachedProfile = localStorage.getItem(`canta_profile_${userId}`);
    const cachedSub = localStorage.getItem(`canta_sub_${userId}`);

    if (cachedProfile) setProfile(JSON.parse(cachedProfile));
    if (cachedSub) setSubscription(JSON.parse(cachedSub));

    // Se temos dados cacheados, liberamos o Loading imediatamente (sem tela de carregamento infinita)
    if (cachedProfile || cachedSub) {
      setLoading(false); 
    }

    // Se estivermos offline, matamos o processo de rede aqui.
    if (!navigator.onLine || sessionStorage.getItem('canta_force_offline') === 'true') {
      setLoading(false);
      return;
    }

    // Atualização de dados em background (Online)
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
      isOnline,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);