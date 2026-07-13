import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, Mail, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) throw error;
      
      if (data?.user) {
        const redirectUrl = localStorage.getItem('canta_invite_redirect');
        if (redirectUrl) {
          navigate(redirectUrl);
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      console.error(err.message);
      setErrorMessage("E-mail ou senha incorretos.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 font-sans text-black overflow-hidden bg-black">
      
      <video autoPlay muted loop playsInline className="absolute top-0 left-0 w-full h-full object-cover z-0 opacity-80">
        <source src="/videoBG/loginVid.webm" type="video/webm" />
      </video>

      <div className="relative z-10 w-full max-w-md bg-white border-4 border-black rounded-3xl p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        
        <div className="text-center mb-8">
          <img src="/CantaProLogo.svg" alt="CANTA.PRO" className="h-10 mx-auto" />
          <p className="text-xs font-black uppercase tracking-widest text-black/40 mt-2">Teleprompter Profissional</p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 border-2 border-red-500 text-red-700 font-bold text-xs uppercase rounded-xl">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-black uppercase tracking-wider">E-mail</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
              <input
                id="email" name="email" type="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@banda.com"
                className="w-full pl-10 pr-4 py-3 border-2 border-black rounded-xl text-sm font-bold bg-gray-50 outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password-field" className="text-xs font-black uppercase tracking-wider">Senha</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
              <input
                id="password-field" name="password" type="password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 border-2 border-black rounded-xl text-sm font-bold bg-gray-50 outline-none"
              />
            </div>
          </div>

          <button
            type="submit" disabled={isSubmitting}
            className="w-full mt-2 py-4 bg-black text-white rounded-xl font-black uppercase tracking-widest text-xs border-2 border-black shadow-[3px_3px_0px_0px_rgba(34,197,94,1)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : "Entrar no CANTA.PRO"}
          </button>
        </form>

        {/* RODAPÉ ATUALIZADO: LEVA PARA O REGISTRO */}
        <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-200 text-center">
          <p className="text-[11px] font-black uppercase tracking-widest text-black mb-3">
            Ainda não tem uma conta?
          </p>
          <button
            onClick={() => navigate('/register')}
            type="button"
            className="w-full py-3 bg-white text-black rounded-xl font-black uppercase tracking-widest text-xs border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            Criar Conta Grátis
          </button>
        </div>

      </div>
    </div>
  );
}