import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca a sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUserData(session.user.id);
      else setLoading(false);
    });

    // Escuta mudanças (login/logout)
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
    // 1. CARREGAMENTO OFFLINE INSTANTÂNEO E BLINDADO
    const cachedProfile = localStorage.getItem(`canta_profile_${userId}`);
    const cachedSub = localStorage.getItem(`canta_sub_${userId}`);

    if (cachedProfile) setProfile(JSON.parse(cachedProfile));
    if (cachedSub) setSubscription(JSON.parse(cachedSub));

    // A MÁGICA ESTÁ AQUI: Se já temos algo na memória física, libera a tela IMEDIATAMENTE!
    if (cachedProfile || cachedSub) {
      setLoading(false); 
    } else {
      // Só tranca a tela se for a primeira vez na vida que o cara abre o app
      setLoading(true);
    }

    try {
      // 2. ATUALIZA DA NUVEM SE TIVER CONEXÃO (Roda de forma invisível)
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
        // Só define como FREE se realmente não tiver assinatura na nuvem E não tiver no cache físico
        setSubscription({ plan_type: 'free' });
      }
    } catch (error) {
      console.warn("Modo Offline ativado na Autenticação.", error);
    } finally {
      // Garante que a tela sempre seja destrancada no final, mesmo se der erro e não tiver cache
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
      plan: subscription?.plan_type || 'free', // Atalho fácil para usarmos nas telas
      isLoadingAuth: loading, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);