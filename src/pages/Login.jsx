import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Criar conta
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Conta criada com sucesso! Você já pode entrar.');
        setIsSignUp(false); // Volta para a tela de login
      } else {
        // Fazer login
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/'); // Redireciona para o app
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-sm border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
        <h1 className="text-3xl font-black uppercase tracking-tighter mb-1 text-black">Canta Pro</h1>
        <p className="text-xs font-bold text-black/50 uppercase tracking-widest mb-8">
          {isSignUp ? 'Crie seu acesso' : 'Acesse seu palco'}
        </p>

        {error && (
          <div className="bg-red-50 border-2 border-red-500 text-red-600 p-3 rounded-xl mb-6 text-xs font-bold uppercase tracking-wide">
            {error === 'Invalid login credentials' ? 'Email ou senha incorretos' : error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest mb-2 text-black">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border-2 border-black/20 rounded-xl p-3 outline-none focus:border-black transition-colors font-medium text-black placeholder-black/30"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest mb-2 text-black">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border-2 border-black/20 rounded-xl p-3 outline-none focus:border-black transition-colors font-medium text-black placeholder-black/30"
              placeholder="******"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white font-black uppercase tracking-widest py-4 rounded-xl hover:opacity-80 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
          >
            {loading ? 'Aguarde...' : (isSignUp ? 'Cadastrar' : 'Entrar')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
            className="text-[10px] font-bold text-black/40 hover:text-black uppercase tracking-widest transition-colors"
          >
            {isSignUp ? 'Já tem conta? Entre aqui.' : 'Não tem conta? Cadastre-se.'}
          </button>
        </div>
      </div>
    </div>
  );
}