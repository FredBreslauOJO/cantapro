import React, { useState, useEffect } from 'react';
import { CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

export default function SyncStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncState, setSyncState] = useState('idle'); // idle, syncing, synced, offline
  const { user, plan } = useAuth();

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      triggerAutoSync();
    };
    const goOffline = () => {
      setIsOnline(false);
      setSyncState('offline');
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    if (navigator.onLine) {
      triggerAutoSync();
    } else {
      setSyncState('offline');
    }

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [user, plan]);

  const triggerAutoSync = async () => {
    // Cancela silenciosamente se não for pro ou não estiver logado
    if (!user || plan !== 'pro' || !navigator.onLine) return;
    
    setSyncState('syncing');

    try {
      // 1. BKP DA BIBLIOTECA DE LETRAS
      const { data: allSongs } = await supabase
        .from('songs')
        .select('*')
        .eq('created_by', user.email);

      if (allSongs) {
        localStorage.setItem('canta_songs_offline', JSON.stringify(allSongs));
      }

      // 2. DESCOBRE QUAIS REPERTÓRIOS ELE TEM ACESSO (DONO OU COLABORADOR)
      const { data: memberData } = await supabase
        .from('setlist_members')
        .select('setlist_id')
        .eq('member_email', user.email);
        
      const sharedIds = memberData ? memberData.map(m => m.setlist_id) : [];

      let query = supabase.from('setlists').select('*');
      if (sharedIds.length > 0) {
        query = query.or(`created_by.eq.${user.email},id.in.(${sharedIds.join(',')})`);
      } else {
        query = query.eq('created_by', user.email);
      }
      
      const { data: allSetlists } = await query;

      if (allSetlists && allSetlists.length > 0) {
        // Salva a lista de repertórios na home
        localStorage.setItem('canta_setlists_offline', JSON.stringify(allSetlists));

        // 3. BAIXA E PRÉ-MONTA TODOS OS ITENS DE TODOS OS REPERTÓRIOS PARA O TELEPROMPTER
        const setlistIds = allSetlists.map(sl => sl.id);
        const { data: allItems } = await supabase
          .from('setlist_items')
          .select('id, setlist_id, item_type, content, performance_notes, order_index, songs(*)')
          .in('setlist_id', setlistIds)
          .order('order_index', { ascending: true });

        if (allItems) {
          allSetlists.forEach(setlist => {
            // Filtra os itens desse setlist específico
            const itemsForThisSetlist = allItems.filter(item => item.setlist_id === setlist.id);
            
            // Formata exatamente do jeito que o PlaySong.jsx exige
            const formattedItems = itemsForThisSetlist.map(item => {
              if (item.item_type === 'divider') {
                let dividerText = item.content || 'PAUSA';
                if (item.performance_notes) dividerText += `\n\n${item.performance_notes}`;
                return { id: item.id, title: item.content || 'DIVISOR', isSeparator: true, lyrics_text: dividerText };
              } else if (item.item_type === 'song' && item.songs) {
                return item.songs;
              }
              return null;
            }).filter(Boolean);

            // Grava o arquivo final no disco para o PlaySong abrir instantaneamente offline!
            localStorage.setItem(`canta_play_offline_${setlist.id}`, JSON.stringify({
              setlistName: setlist.event_name,
              songs: formattedItems
            }));
          });
        }
      }

      // Deixa a animação suave terminar
      setTimeout(() => setSyncState('synced'), 1000);
      
    } catch (err) {
      console.error("Erro no Auto-Sync de Roteiros", err);
      setSyncState('offline');
    }
  };

  if (plan !== 'pro') return null;

  return (
    <div 
      className="flex items-center justify-center p-1 opacity-70" 
      title={
        syncState === 'syncing' ? 'Sincronizando Backup do Show...' :
        syncState === 'offline' ? 'Rodando Offline' :
        'Show 100% Baixado'
      }
    >
      {syncState === 'offline' || !isOnline ? (
        <CloudOff size={16} className="text-gray-400" />
      ) : syncState === 'syncing' ? (
        <RefreshCw size={16} className="text-blue-500 animate-spin" />
      ) : (
        <CheckCircle2 size={16} className="text-emerald-500" />
      )}
    </div>
  );
}