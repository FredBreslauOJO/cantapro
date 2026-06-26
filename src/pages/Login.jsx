import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // Modos de tela: 'login', 'signup', ou 'forgot'
  const [mode, setMode] = useState('login'); 

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'forgot') {
        // Envia o email de recuperação
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`,
        });
        if (error) throw error;
        setMessage('Email de recuperação enviado! Verifique sua caixa de entrada.');
        
      } else if (mode === 'signup') {
        // Cria a conta
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) {
          if (error.message.includes('already registered')) throw new Error('Este email já está cadastrado.');
          throw error;
        }
        setMessage('Falta pouco! Enviamos um link de confirmação para a sua caixa de entrada. Clique nele para ativar sua conta.');
        
      } else {
        // Faz o Login normal
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          if (error.message.includes('Email not confirmed')) throw new Error('Por favor, verifique sua caixa de entrada e confirme seu email antes de entrar.');
          if (error.message.includes('Invalid login')) throw new Error('Email ou senha incorretos.');
          throw error;
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white border-4 border-black rounded-[2rem] w-full max-w-md p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tight">CANTA PRO</h1>
          <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mt-1">
            {mode === 'login' ? 'Acesse seu palco' : mode === 'signup' ? 'Crie sua conta' : 'Recuperar Acesso'}
          </p>
        </div>

        {/* Alertas */}
        {error && (
          <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4 mb-6">
            <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">{error}</p>
          </div>
        )}
        {message && (
          <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4 mb-6">
            <p className="text-green-600 text-[10px] font-black uppercase tracking-widest leading-relaxed">{message}</p>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-black mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-black transition-colors"
              placeholder="seu@email.com"
              required
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-black mb-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-black transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
          )}

          {mode === 'login' && (
            <div className="text-right">
              <button 
                type="button" 
                onClick={() => { setMode('forgot'); setError(''); setMessage(''); }} 
                className="text-[10px] font-black text-gray-400 hover:text-black uppercase tracking-widest transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-2 bg-black text-white text-sm font-black uppercase tracking-widest rounded-xl hover:opacity-80 transition-opacity disabled:opacity-40 active:scale-95 transition-transform"
          >
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar Conta' : 'Enviar Link de Recuperação'}
          </button>
        </form>

        {/* Rodapé de Navegação */}
        <div className="mt-8 text-center border-t-2 border-gray-100 pt-6">
          {mode === 'login' ? (
            <button onClick={() => { setMode('signup'); setError(''); setMessage(''); }} className="text-[10px] font-black text-gray-400 hover:text-black uppercase tracking-widest transition-colors">
              Não tem conta? Cadastre-se.
            </button>
          ) : (
            <button onClick={() => { setMode('login'); setError(''); setMessage(''); }} className="text-[10px] font-black text-gray-400 hover:text-black uppercase tracking-widest transition-colors">
              Voltar para o Login
            </button>
          )}
        </div>

      </div>
    </div>
  );
}