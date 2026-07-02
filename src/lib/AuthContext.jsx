import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [plan, setPlan] = useState('free'); // free, base, pro
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🚨 WATCHDOG TIMER (CÃO DE GUARDA)
    const watchdog = setTimeout(() => {
      if (loading) {
        console.warn("⚠️ Supabase demorou demais para responder. Destravando loading via Watchdog.");
        setLoading(false);
      }
    }, 3000);

    // 1. Busca a sessão atual ao abrir o app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserPlan(session.user); // ◄ CORREÇÃO: Passa o objeto do usuário completo
      } else {
        setLoading(false);
        clearTimeout(watchdog);
      }
    }).catch(() => {
      setLoading(false);
      clearTimeout(watchdog);
    });

    // 2. Escuta mudanças de estado (Login / Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserPlan(session.user); // ◄ CORREÇÃO: Passa o objeto do usuário completo
      } else {
        setLoading(false);
        clearTimeout(watchdog);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(watchdog);
    };
  }, []);

  // 🛠️ BUSCA DE PLANO CORRIGIDA (Mata o Erro 400)
  const fetchUserPlan = async (currentUser) => {
    try {
      // TENTATIVA 1: Verifica se o plano está direto no Metadata do login (Super rápido, evita query)
      if (currentUser.user_metadata?.plan) {
        setPlan(currentUser.user_metadata.plan);
        setLoading(false);
        return;
      }

      // TENTATIVA 2: Busca na tabela 'profiles' usando o ID (UUID) único do usuário
      const { data, error } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', currentUser.id) // ◄ CORREÇÃO CRÍTICA: Busca por ID, não por e-mail
        .maybeSingle();

      if (!error && data) {
        setPlan(data.plan || 'free');
      }
    } catch (err) {
      console.error("Erro ao buscar plano no banco:", err);
    } finally {
      setLoading(false); // Destrava o app independentemente do resultado
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, plan, loading }}>
      {children}
    </AuthContext.Provider>
  );
};