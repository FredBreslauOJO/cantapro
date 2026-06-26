import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Ouve se há uma sessão de recuperação ativa ao carregar a página
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMessage('Sessão de recuperação validada. Digite sua nova senha.');
      }
    });
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      setMessage('Senha atualizada com sucesso!');
      setTimeout(() => navigate('/'), 2000); // Vai para o app após 2 segundos
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white border-4 border-black rounded-[2rem] w-full max-w-md p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tight">CANTA PRO</h1>
          <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mt-1">Criar Nova Senha</p>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4 mb-6">
            <p className="text-red-500 text-xs font-bold uppercase tracking-widest">{error}</p>
          </div>
        )}

        {message && (
          <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4 mb-6">
            <p className="text-green-600 text-xs font-bold uppercase tracking-widest">{message}</p>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-black mb-1">Nova Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-black transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-2 bg-black text-white text-sm font-black uppercase tracking-widest rounded-xl hover:opacity-80 transition-opacity disabled:opacity-40 active:scale-95 transition-transform"
          >
            {loading ? 'Salvando...' : 'Atualizar Senha'}
          </button>
        </form>
      </div>
    </div>
  );
}