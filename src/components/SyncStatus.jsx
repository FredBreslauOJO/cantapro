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

    // Dispara a checagem invisível na primeira vez que o app carrega
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
    // Se não estiver logado, estiver offline ou não for plano PRO, cancela silenciosamente
    if (!user || plan !== 'pro' || !navigator.onLine) return;
    
    setSyncState('syncing');

    try {
      const { data: allSongs, error } = await supabase
        .from('songs')
        .select('*')
        .eq('created_by', user.email);

      if (!error && allSongs) {
        const localData = localStorage.getItem('canta_songs_offline');
        const newDataString = JSON.stringify(allSongs);
        
        // Só regrava no disco do celular se houver diferença real (economiza bateria/processamento)
        if (localData !== newDataString) {
          localStorage.setItem('canta_songs_offline', newDataString);
        }
        
        // Mantém a animação girando por 1 segundo extra só para o usuário perceber que foi checado
        setTimeout(() => setSyncState('synced'), 1000);
      }
    } catch (err) {
      console.error("Erro no Auto-Sync", err);
      setSyncState('offline');
    }
  };

  // Se o usuário não for PRO, não exibe o ícone de cache
  if (plan !== 'pro') return null;

  return (
    <div 
      className="flex items-center justify-center p-1 opacity-70" 
      title={
        syncState === 'syncing' ? 'Sincronizando Backup...' :
        syncState === 'offline' ? 'Rodando Offline' :
        'Backup Offline Pronto'
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