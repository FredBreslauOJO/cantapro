import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

export default function SyncStatus() {
  const { user, isOnline } = useAuth();
  const [syncState, setSyncState] = useState('idle'); 
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    const isForcedOffline = sessionStorage.getItem('canta_force_offline') === 'true';
    if (!navigator.onLine || isForcedOffline) {
      setSyncState('offline');
    } else {
      checkInitialStatus();
    }
  }, [user, isOnline]);

  const checkInitialStatus = () => {
    if (!user) return;
    const lSync = localStorage.getItem(`canta_last_sync_${user.id}`);
    if (lSync) {
      setLastSync(new Date(lSync));
      setSyncState('success');
    } else {
      setSyncState('idle');
    }
  };

  // AUDITORIA FIX: Download atômico. Se um request falhar, ele não marca como sucesso e limpa o processo.
  const handleManualSync = async () => {
    if (!user || syncState === 'offline') return;
    
    setSyncState('syncing');

    try {
      const { data: memberData, error: memErr } = await supabase.from('setlist_members').select('setlist_id').eq('member_email', user.email);
      if (memErr) throw memErr;
      
      const sharedIds = memberData ? memberData.map(m => m.setlist_id) : [];

      let query = supabase.from('setlists').select('*');
      if (sharedIds.length > 0) {
        query = query.or(`created_by.eq.${user.email},id.in.(${sharedIds.join(',')})`);
      } else {
        query = query.eq('created_by', user.email);
      }

      const { data: setlists, error: slErr } = await query;
      if (slErr) throw slErr;

      const { data: songs, error: sErr } = await supabase.from('songs').select('*').eq('created_by', user.email);
      if (sErr) throw sErr;

      localStorage.setItem(`canta_setlists_offline_${user.id}`, JSON.stringify(setlists || []));
      localStorage.setItem(`canta_songs_offline_${user.id}`, JSON.stringify(songs || []));

      if (songs) {
        songs.forEach(song => {
          localStorage.setItem(`canta_song_single_${user.id}_${song.id}`, JSON.stringify(song));
        });
      }

      const now = new Date();
      setLastSync(now);
      localStorage.setItem(`canta_last_sync_${user.id}`, now.toISOString());
      
      setSyncState('success');

      setTimeout(() => {
        if (navigator.onLine && sessionStorage.getItem('canta_force_offline') !== 'true') {
           setSyncState('success');
        }
      }, 3000);

    } catch (err) {
      console.error("Falha na sincronização (rede ou banco):", err);
      setSyncState('error');
    }
  };

  if (syncState === 'offline') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 rounded-lg text-gray-500 border-2 border-transparent" title="Modo Offline Ativo">
        <CloudOff size={14} />
        <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Offline</span>
      </div>
    );
  }

  if (syncState === 'syncing') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-yellow-100 rounded-lg text-yellow-700 border-2 border-transparent" title="Baixando dados para uso offline...">
        <RefreshCw size={14} className="animate-spin" />
        <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Baixando...</span>
      </div>
    );
  }

  if (syncState === 'error') {
    return (
      <button onClick={handleManualSync} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-100 rounded-lg text-red-600 border-2 border-red-200 hover:bg-red-200 transition-colors active:scale-95" title="Falha ao baixar show. Tentar novamente.">
        <AlertTriangle size={14} />
        <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Falha - Repetir</span>
      </button>
    );
  }

  if (syncState === 'success' && lastSync) {
    return (
      <button onClick={handleManualSync} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-100 rounded-lg text-green-700 border-2 border-transparent hover:bg-green-200 transition-colors active:scale-95" title={`100% Baixado. Última vez: ${lastSync.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`}>
        <CheckCircle2 size={14} />
        <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Show Pronto</span>
      </button>
    );
  }

  return (
    <button onClick={handleManualSync} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black rounded-lg text-white border-2 border-black hover:bg-gray-800 transition-colors active:scale-95 shadow-[2px_2px_0px_0px_rgba(250,204,21,1)]" title="Baixar show para usar sem internet">
      <Cloud size={14} />
      <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Baixar Show</span>
    </button>
  );
}