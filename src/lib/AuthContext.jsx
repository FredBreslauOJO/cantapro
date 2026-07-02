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
    // WATCHDOG TIMER (CÃO DE GUARDA)
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
        fetchUserPlan(session.user); 
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
        fetchUserPlan(session.user); 
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

  // BUSCA DE PLANO BLINDADA COM DIAGNÓSTICO DE ERRO
  const fetchUserPlan = async (currentUser) => {
    try {
      // Se o plano já estiver nos metadados do login, resolve direto aqui
      if (currentUser.user_metadata?.plan) {
        setPlan(currentUser.user_metadata.plan);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', currentUser.id) 
        .maybeSingle();

      if (error) {
        // 🚨 ISSO VAI PRINTAR O MOTIVO EXATO DO ERRO 400 NO SEU CONSOLE (Ex: "column id does not exist")
        console.error("🚨 ERRO DE SCHEMA NO SUPABASE:", error.message, "| Detalhes:", error.details);
        setPlan('free'); 
      } else if (data) {
        setPlan(data.plan || 'free');
      }
    } catch (err) {
      console.error("Erro interno ao buscar plano:", err);
    } finally {
      setLoading(false); // ◄ Alívio imediato: o loading morre aqui de qualquer forma, sem travar a tela!
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, plan, loading }}>
      {children}
    </AuthContext.Provider>
  );
};