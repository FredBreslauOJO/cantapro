import { useState, useEffect, useSyncExternalStore } from 'react';
import { useAuth } from '../lib/AuthContext';
import { getOfflineSnapshot } from '../lib/offline';
import { getPwaState, subscribePwa, applyPwaUpdate } from '../lib/pwaState';
export default function OfflineStatus() {
  const { user, isOnline, syncStatus, syncMessage } = useAuth();
  const pwa = useSyncExternalStore(subscribePwa, getPwaState);
  const [storageMessage, setStorageMessage] = useState('');
  useEffect(() => {
    const failed = event => setStorageMessage(`Não foi possível salvar neste aparelho. ${event.detail || ''}`);
    window.addEventListener('canta-storage-error', failed);
    return () => window.removeEventListener('canta-storage-error', failed);
  }, []);
  const snapshot = getOfflineSnapshot(user?.id);
  const check = async () => {
    if (navigator.storage?.persist) {
      try {
        const persistent = await navigator.storage.persist();
        setStorageMessage(persistent ? '' : 'O navegador não garantiu armazenamento persistente.');
      } catch { setStorageMessage('Não foi possível verificar o armazenamento.'); }
    }
    window.dispatchEvent(new Event('canta-sync-requested'));
  };
  return <div className="text-right max-w-44">
    <button onClick={check} disabled={syncStatus === 'syncing'} className="text-xs underline px-2 py-2 disabled:opacity-60">
      {syncStatus === 'syncing' ? 'Atualizando…' : 'Verificar offline'}
    </button>
    <p role="status" className="text-[10px] leading-tight">
      {pwa.error || (snapshot && pwa.ready ? `${snapshot.setlists.length} repertórios salvos${isOnline ? '' : ' · offline'}` :
        snapshot ? 'Conteúdo salvo; verificando instalação…' : 'Conteúdo ainda não baixado.')}
      {snapshot && <span className="block">Atualizado em {new Date(snapshot.savedAt).toLocaleString('pt-BR')}</span>}
      {snapshot?.dirty && <span className="block">Alterações aguardando sincronização completa.</span>}
      {syncStatus === 'error' && <span className="block">Atualização pendente. {syncMessage}</span>}
      {storageMessage && <span className="block">{storageMessage}</span>}
    </p>
    {pwa.update && <button onClick={applyPwaUpdate} className="text-xs underline py-1">Instalar atualização</button>}
  </div>;
}
