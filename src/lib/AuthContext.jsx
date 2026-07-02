import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [plan, setPlan] = useState('pro'); // ◄ Travado em 'pro' para liberar seus testes e cupons sem depender da tabela profiles
  const [loading, setLoading] = useState(true);
  
  // Referência atômica para impedir atrasos de render do React
  const isLoadingRef = useRef(true);

  const stopLoading = () => {
    setLoading(false);
    isLoadingRef.current = false;
  };

  useEffect(() => {
    // Watchdog de emergência (Cão de guarda)
    const watchdog = setTimeout(() => {
      if (isLoadingRef.current) {
        console.warn("⚠️ Supabase demorou demais para responder. Destravando loading via Watchdog.");
        stopLoading();
      }
    }, 2500);

    // 1. Captura a sessão de login no mesmo instante em que o app abre
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Se tiver sessão ou não, corta o loading imediatamente sem buscar tabelas externas
      stopLoading();
      clearTimeout(watchdog);
    }).catch(() => {
      stopLoading();
      clearTimeout(watchdog);
    });

    // 2. Escuta se o usuário deslogou ou logou em outra aba
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      stopLoading();
      clearTimeout(watchdog);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(watchdog);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, plan, loading }}>
      {children}
    </AuthContext.Provider>
  );
};