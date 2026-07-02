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
    // 🚨 TRAVA CÃO DE GUARDA (WATCHDOG TIMER) 🚨
    // Se o Supabase falhar, travar ou demorar mais de 3 segundos para responder,
    // o timer abaixo estoura e força o encerramento do loading para não travar o app.
    const watchdog = setTimeout(() => {
      if (loading) {
        console.warn("⚠️ Supabase demorou demais para responder. Destravando loading via Watchdog.");
        setLoading(false);
      }
    }, 3000);

    // 1. Busca a sessão atual de forma assíncrona
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchuserPlan(session.user.email);
      } else {
        setLoading(false);
        clearTimeout(watchdog);
      }
    }).catch(() => {
      setLoading(false);
      clearTimeout(watchdog);
    });

    // 2. Escuta mudanças na autenticação (Login, Logout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchuserPlan(session.user.email);
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

  // Busca o plano do usuário na tabela de perfis/assinaturas
  const fetchuserPlan = async (email) => {
    try {
      const { data, error } = await supabase
        .from('profiles') // Ajuste o nome da tabela se for 'user_subscriptions', 'users', etc.
        .select('plan')
        .eq('email', email)
        .maybeSingle();

      if (!error && data) {
        setPlan(data.plan || 'free');
      }
    } catch (err) {
      console.error("Erro ao buscar plano:", err);
    } finally {
      setLoading(false); // Desliga o loading global com sucesso
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, plan, loading }}>
      {children}
    </AuthContext.Provider>
  );
};