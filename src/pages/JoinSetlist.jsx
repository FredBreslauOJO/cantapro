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
      // 1. Verifica se o setlist realmente existe
      const { data: setlist, error: setlistError } = await supabase
        .from('setlists')
        .select('event_name, created_by')
        .eq('id', id)
        .single();

      if (setlistError || !setlist) {
        setStatus("Ops! Este setlist não foi encontrado.");
        return;
      }

      // 2. Se o usuário atual for o criador do setlist, ele não precisa de convite
      if (setlist.created_by === user.email) {
        navigate(`/setlists/${id}/edit`, { replace: true });
        return;
      }

      setStatus(`Entrando em: ${setlist.event_name}...`);

      // 3. Verifica se o usuário já é membro desta banda/setlist
      const { data: existingMember } = await supabase
        .from('setlist_members')
        .select('*')
        .eq('setlist_id', id)
        .eq('member_email', user.email)
        .single();

      // 4. Se não for membro, cadastra ele no banco
      if (!existingMember) {
        const { error: insertError } = await supabase
          .from('setlist_members')
          .insert([{ setlist_id: id, member_email: user.email }]);
          
        if (insertError) throw insertError;
      }

      // 5. Redireciona o músico para a tela de edição do setlist
      navigate(`/setlists/${id}/edit`, { replace: true });
      
    } catch (error) {
      console.error(error);
      setStatus("Erro ao aceitar o convite. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="text-center flex flex-col items-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-6" />
        <h1 className="text-xl font-black uppercase tracking-widest text-black">{status}</h1>
        <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mt-2">Só um segundo</p>
      </div>
    </div>
  );
}