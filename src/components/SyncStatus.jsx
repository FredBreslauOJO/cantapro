import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { getOfflineSnapshot, prepareOffline } from '../lib/offline';
export default function SyncStatus() {
  const { user, plan, isOnline } = useAuth();
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const version = useRef(0);
  const busy = useRef(false);
  useEffect(() => {
    const operationVersion = version;
    const invalidate = () => { version.current++; setStatus('idle'); setMessage('Conteúdo alterado. Prepare novamente.'); };
    window.addEventListener('canta-content-changed', invalidate);
    return () => { operationVersion.current++; window.removeEventListener('canta-content-changed', invalidate); };
  }, [user?.id, isOnline]);
  if (plan !== 'pro') return null;
  const snapshot = getOfflineSnapshot(user?.id);
  const prepare = async () => {
    if (!isOnline || busy.current) return;
    busy.current = true;
    const request = ++version.current;
    setStatus('syncing');
    setMessage('Baixando letras e repertórios…');
    try {
      const saved = await prepareOffline(supabase, user, () => version.current === request);
      if (request !== version.current) return;
      setStatus('ready');
      setMessage(`${saved.setlists.length} repertórios preparados às ${new Date(saved.savedAt).toLocaleTimeString('pt-BR')}.`);
    } catch (error) {
      if (request !== version.current) return;
      setStatus('error');
      setMessage(`Falha: ${error.message} A última cópia completa foi preservada.`);
    } finally { busy.current = false; if (request !== version.current) setStatus('idle'); }
  };
  return <div className="relative text-right max-w-40">
    <button onClick={prepare} disabled={!isOnline || status === 'syncing'} className="text-xs underline disabled:opacity-60 px-2 py-2">
      {status === 'syncing' ? 'Preparando…' : isOnline ? 'Preparar offline' : 'Sem internet'}
    </button>
    <p role="status" className="text-xs">{message || (snapshot ? `Cópia de ${new Date(snapshot.savedAt).toLocaleString('pt-BR')}` : 'Sem show preparado')}</p>
  </div>;
}
