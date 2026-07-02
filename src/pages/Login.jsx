import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { Lock, Mail, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Se o guardião global indicar que o usuário já logou, joga direto para a Home
  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) throw error;
      
      // O evento onAuthStateChange do AuthContext vai capturar o sucesso e disparar o redirect
    } catch (err) {
      console.error("Erro de login:", err.message);
      setErrorMessage(
        err.message === "Invalid login credentials" 
          ? "E-mail ou senha incorretos." 
          : "Erro ao conectar. Verifique sua conexão."
      );
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-black uppercase text-xs tracking-widest text-black">
        Carregando autenticação...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans text-black">
      <div className="w-full max-w-md bg-white border-4 border-black rounded-3xl p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        
        {/* LOGO OTIMIZADO */}
        <div className="text-center mb-8">
          <img 
            src="/CantaProLogo.svg" 
            alt="CANTA.PRO Logo" 
            className="h-10 mx-auto text-black"
            fetchpriority="high" 
          />
          <p className="text-xs font-black uppercase tracking-widest text-black/40 mt-2">Teleprompter Profissional</p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 border-2 border-red-500 text-red-700 font-bold text-xs uppercase rounded-xl">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* CAMPO DE E-MAIL (Com ID, Name e Label Vinculados) */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email-field" className="text-xs font-black uppercase tracking-wider text-black">
              E-mail do Músico
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
              <input
                id="email-field"
                name="user_email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@banda.com"
                disabled={isSubmitting}
                className="w-full pl-10 pr-4 py-3 border-2 border-black rounded-xl text-sm font-bold bg-gray-50 focus:bg-white outline-none transition-all"
              />
            </div>
          </div>

          {/* CAMPO DE SENHA (Com ID, Name e Label Vinculados) */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password-field" className="text-xs font-black uppercase tracking-wider text-black">
              Sua Senha
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
              <input
                id="password-field"
                name="user_password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isSubmitting}
                className="w-full pl-10 pr-4 py-3 border-2 border-black rounded-xl text-sm font-bold bg-gray-50 focus:bg-white outline-none transition-all"
              />
            </div>
          </div>

          {/* BOTÃO DE SUBMIT SEGURO */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-4 bg-black text-white rounded-xl font-black uppercase tracking-widest text-xs border-2 border-black shadow-[3px_3px_0px_0px_rgba(34,197,94,1)] hover:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Conectando ao Palco...
              </>
            ) : (
              "Entrar no CANTA.PRO"
            )}
          </button>
        </form>

      </div>
    </div>
  );
}