import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, Mail, Loader2, Music, ArrowLeft, Send } from 'lucide-react';

export default function Login() {
  const [view, setView] = useState('login'); // 'login' ou 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Estados para Recuperação de Senha
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');

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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    
    setIsForgotSubmitting(true);
    setForgotError('');
    setForgotMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;
      
      setForgotMessage('Link de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (err) {
      console.error(err.message);
      setForgotError('Erro ao enviar e-mail. Verifique se está correto.');
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    try {
      setErrorMessage('');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        }
      });

      if (error) throw error;
    } catch (err) {
      console.error(`Erro no login com ${provider}:`, err.message);
      setErrorMessage(`Não foi possível conectar com o ${provider}.`);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 font-sans text-black overflow-hidden bg-black">
      
      <video autoPlay muted loop playsInline className="absolute top-0 left-0 w-full h-full object-cover z-0 opacity-80">
        <source src="/videoBG/loginVid.webm" type="video/webm" />
      </video>

      {/* CAIXA PRINCIPAL REDUZIDA (w-[90%], p-5 no mobile) */}
      <div className="relative z-10 w-[90%] sm:w-full max-w-md bg-white border-4 border-black rounded-3xl p-5 sm:p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all overflow-hidden">
        
        {view === 'login' ? (
          <div className="animate-fadeIn">
            <div className="text-center mb-6">
              <img src="/CantaProLogo.svg" alt="CANTA.PRO" className="h-7 sm:h-8 mx-auto" />
              <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-black/40 mt-1.5">Teleprompter Profissional</p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-2.5 bg-red-100 border-2 border-red-500 text-red-700 font-bold text-[10px] sm:text-xs uppercase rounded-xl text-center">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="email" className="text-[10px] font-black uppercase tracking-wider">E-mail</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
                  <input
                    id="email" name="email" type="email" required
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@banda.com"
                    className="w-full pl-9 pr-4 py-2.5 border-2 border-black rounded-xl text-xs sm:text-sm font-bold bg-gray-50 outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="password-field" className="text-[10px] font-black uppercase tracking-wider">Senha</label>
                  <button type="button" onClick={() => setView('forgot')} className="text-[9px] font-bold text-gray-500 hover:text-black uppercase tracking-wider underline">
                    Esqueceu?
                  </button>
                </div>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
                  <input
                    id="password-field" name="password" type="password" required
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2.5 border-2 border-black rounded-xl text-xs sm:text-sm font-bold bg-gray-50 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit" disabled={isSubmitting}
                className="w-full mt-1 py-3 sm:py-3.5 bg-black text-white rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs border-2 border-black shadow-[3px_3px_0px_0px_rgba(34,197,94,1)] transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : "Entrar no CANTA.PRO"}
              </button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-dashed border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-black/40 font-black uppercase tracking-widest text-[9px]">Ou entre com</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => handleOAuthLogin('google')} type="button"
                className="w-full py-2.5 sm:py-3 bg-white text-black rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2"
              >
                Google
              </button>
              
              <button
                onClick={() => handleOAuthLogin('spotify')} type="button"
                className="w-full py-2.5 sm:py-3 bg-[#1DB954] text-black rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:brightness-105 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2"
              >
                <Music size={14} /> Spotify
              </button>
            </div>

            <div className="mt-6 pt-5 border-t-2 border-dashed border-gray-200 text-center">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-black mb-2.5">
                Ainda não tem uma conta?
              </p>
              <button
                onClick={() => navigate('/register')} type="button"
                className="w-full py-2.5 bg-white text-black rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              >
                Criar Conta Grátis.
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-fadeIn">
            <div className="flex items-center mb-6">
              <button onClick={() => setView('login')} className="p-1.5 -ml-1.5 hover:bg-gray-100 rounded-full transition-colors active:scale-95">
                <ArrowLeft size={18} strokeWidth={2.5} />
              </button>
              <div className="flex-1 text-center pr-6">
                <h2 className="text-lg font-black uppercase tracking-tight">Recuperar Senha</h2>
              </div>
            </div>

            <p className="text-[11px] sm:text-xs font-bold text-gray-500 mb-6 text-center leading-relaxed">
              Digite o e-mail associado à sua conta e enviaremos as instruções para você criar uma nova senha.
            </p>

            {forgotError && (
              <div className="mb-4 p-2.5 bg-red-100 border-2 border-red-500 text-red-700 font-bold text-[10px] sm:text-xs uppercase rounded-xl text-center">
                {forgotError}
              </div>
            )}
            
            {forgotMessage && (
              <div className="mb-4 p-2.5 bg-green-100 border-2 border-green-500 text-green-700 font-bold text-[10px] sm:text-xs uppercase rounded-xl text-center">
                {forgotMessage}
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="forgot-email" className="text-[10px] font-black uppercase tracking-wider">E-mail Cadastrado</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
                  <input
                    id="forgot-email" type="email" required
                    value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="seuemail@banda.com"
                    className="w-full pl-9 pr-4 py-2.5 border-2 border-black rounded-xl text-xs sm:text-sm font-bold bg-gray-50 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit" disabled={isForgotSubmitting}
                className="w-full py-3 bg-black text-white rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs border-2 border-black shadow-[3px_3px_0px_0px_rgba(250,204,21,1)] transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                {isForgotSubmitting ? <Loader2 size={14} className="animate-spin" /> : <><Send size={14} /> Enviar Link</>}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}