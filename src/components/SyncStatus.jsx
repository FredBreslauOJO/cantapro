import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw, DownloadCloud, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

export default function SyncStatus({ isRefreshing }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatusText, setShowStatusText] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // FUNÇÃO MÁGICA: Baixa todas as músicas do usuário para o cache de uma vez
  const handlePreShowSync = async (e) => {
    e.stopPropagation();
    if (!isOnline || !user) return;
    
    setIsDownloading(true);
    setShowStatusText(true);

    try {
      // Busca todas as músicas do usuário na nuvem
      const { data: allSongs, error } = await supabase
        .from('songs')
        .select('*')
        .eq('created_by', user.email);

      if (!error && allSongs) {
        // Salva tudo no disco físico do celular de uma tacada só
        localStorage.setItem('canta_songs_offline', JSON.stringify(allSongs));
        
        setDownloadSuccess(true);
        setTimeout(() => {
          setDownloadSuccess(false);
          setShowStatusText(false);
        }, 3000);
      }
    } catch (err) {
      console.error("Erro ao sincronizar repertório", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const triggerStatusText = () => {
    setShowStatusText(true);
    setTimeout(() => setShowStatusText(false), 3000);
  };

  return (
    <div className="relative inline-block select-none z-50">
      <button 
        onClick={isOnline ? handlePreShowSync : triggerStatusText}
        disabled={isDownloading}
        className={`px-3 py-2 rounded-xl border-2 border-black flex items-center justify-center gap-2 transition-all active:scale-95 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-80`}
        title="Sincronizar para o Show"
      >
        {isDownloading ? (
          <>
            <RefreshCw size={14} className="animate-spin text-black" />
            <span className="text-[10px] font-black uppercase tracking-widest">Baixando...</span>
          </>
        ) : downloadSuccess ? (
          <>
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Pronto!</span>
          </>
        ) : !isOnline ? (
          <>
            <CloudOff size={14} className="text-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Modo Offline</span>
          </>
        ) : (
          <>
            <DownloadCloud size={14} className="text-blue-600" />
            <span className="text-[10px] font-black uppercase tracking-widest">Pré-Show</span>
          </>
        )}
      </button>

      {/* Balão de Informação Flutuante */}
      {showStatusText && !isDownloading && !downloadSuccess && (
        <div className="absolute right-0 top-12 bg-black text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg shadow-xl whitespace-nowrap z-50 animate-fadeIn">
          {isRefreshing && "Sincronizando com a Nuvem..."}
          {!isRefreshing && !isOnline && "Rodando 100% Offline"}
        </div>
      )}
    </div>
  );
}