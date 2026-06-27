import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

export default function JoinSetlist() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState("Preparando o palco...");

  useEffect(() => {
    if (user && id) {
      processInvite();
    }
  }, [user, id]);

  const processInvite = async () => {
    try {
      setStatus("Garantindo seu acesso...");

      // Tenta inserir o usuário direto como membro. 
      // Se ele já for membro, o Supabase vai apenas ignorar (erro de duplicidade 23505).
      // Isso evita o erro de bloqueio de leitura de RLS que acontecia antes.
      const { error: insertError } = await supabase
        .from('setlist_members')
        .insert([{ setlist_id: id, member_email: user.email }]);
        
      if (insertError && insertError.code !== '23505') {
        console.error("Erro ao inserir membro:", insertError);
        setStatus("Ops! Erro ao acessar o Setlist.");
        return;
      }

      setStatus("Acesso liberado! Entrando...");

      // Joga o músico direto para a tela de edição
      setTimeout(() => {
        navigate(`/setlists/${id}/edit`, { replace: true });
      }, 800);
      
    } catch (error) {
      console.error(error);
      setStatus("Erro ao aceitar o convite. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black">
      <div className="text-center flex flex-col items-center bg-white p-10 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(250,204,21,1)]">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-6" />
        <h1 className="text-xl font-black uppercase tracking-tight text-black">{status}</h1>
        <p className="text-xs font-bold text-black/40 tracking-widest uppercase mt-2">Só um segundo</p>
      </div>
    </div>
  );
}