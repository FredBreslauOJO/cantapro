import { useState, useEffect, useSyncExternalStore } from 'react';
import { Cloud, CloudCheck, CloudOff, RefreshCw, Download } from 'lucide-react';
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
  const confirmed = Boolean(snapshot && pwa.ready && !snapshot.dirty && !pwa.error && !storageMessage && syncStatus !== 'error');
  const label = pwa.error || storageMessage || (syncStatus === 'syncing' ? 'Preparando conteúdo offline' :
    syncStatus === 'error' ? 'Atualização pendente. ' + syncMessage : confirmed ? 'Conteúdo salvo neste aparelho' : 'Preparar offline');
  const Icon = syncStatus === 'syncing' ? RefreshCw : confirmed ? CloudCheck : !isOnline || pwa.error || storageMessage || syncStatus === 'error' ? CloudOff : Cloud;
  return <div className="flex items-center gap-1">
    <button type="button" onClick={check} disabled={syncStatus === 'syncing'} aria-label={label} title={label}
      className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 active:scale-95 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-black">
      <Icon aria-hidden="true" size={20} className={syncStatus === 'syncing' ? 'text-blue-500 animate-spin' : confirmed ? 'text-emerald-600' : 'text-gray-500'} />
    </button>
    <span role="status" className="sr-only">{label}</span>
    {pwa.update && <button type="button" onClick={applyPwaUpdate} aria-label="Instalar atualização" title="Instalar atualização" className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100"><Download size={18} aria-hidden="true" /></button>}
  </div>;
}
