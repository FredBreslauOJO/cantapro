import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState(false);
  
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) return;

    if (password !== confirmPassword) {
      setErrorMessage("As senhas não coincidem. Digite novamente.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Sua senha deve ter no mínimo 6 caracteres.");
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });

      if (error) throw error;
      
      // Se não deu erro, exibe a tela de sucesso para o usuário confirmar o e-mail
      setSuccessMessage(true);
    } catch (err) {
      console.error(err.message);
      setErrorMessage(
        err.message.includes("already registered") 
          ? "Este e-mail já possui uma conta. Tente fazer login." 
          : "Erro ao criar conta. Verifique sua conexão."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 font-sans text-black overflow-hidden bg-black">
      
      <video autoPlay muted loop playsInline className="absolute top-0 left-0 w-full h-full object-cover z-0 opacity-80">
        <source src="/videoBG/loginVid.webm" type="video/webm" />
      </video>

      <div className="relative z-10 w-full max-w-md bg-white border-4 border-black rounded-3xl p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        
        {successMessage ? (
          <div className="text-center py-6">
            <CheckCircle2 size={56} strokeWidth={1.5} className="mx-auto text-green-500 mb-6" />
            <h2 className="text-xl font-black uppercase tracking-tight mb-3">Quase lá, Músico!</h2>
            <p className="text-xs font-bold text-gray-500 mb-8 leading-relaxed">
              Enviamos um link de confirmação para <br/>
              <span className="text-black">{email}</span>. <br/><br/>
              Acesse sua caixa de entrada e clique no link para ativar sua conta no Canta.Pro.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-4 bg-black text-white rounded-xl font-black uppercase tracking-widest text-xs border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all"
            >
              Voltar para o Login
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <button onClick={() => navigate('/login')} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft size={20} />
              </button>
              <img src="/CantaProLogo.svg" alt="CANTA.PRO" className="h-8" />
              <div className="w-9" /> {/* Espaçador para centralizar a logo */}
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-100 border-2 border-red-500 text-red-700 font-bold text-xs uppercase rounded-xl">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black uppercase tracking-wider">Seu E-mail</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
                  <input
                    type="email" required
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="banda@email.com"
                    className="w-full pl-10 pr-4 py-3 border-2 border-black rounded-xl text-sm font-bold bg-gray-50 outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black uppercase tracking-wider">Crie uma Senha</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
                  <input
                    type="password" required
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 border-2 border-black rounded-xl text-sm font-bold bg-gray-50 outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 mb-2">
                <label className="text-xs font-black uppercase tracking-wider">Confirme a Senha</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
                  <input
                    type="password" required
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 border-2 border-black rounded-xl text-sm font-bold bg-gray-50 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit" disabled={isSubmitting}
                className="w-full mt-4 py-4 bg-yellow-400 text-black rounded-xl font-black uppercase tracking-widest text-xs border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-300 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : "Finalizar Cadastro"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}