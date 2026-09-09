// One durable, atomic document per account. Readers use the hydrated copy so
// rendering never waits for a network request or repeatedly parses large JSON.
let database;
let opening;
const documents = new Map();
const changedBeforeHydration = new Set();
let writes = Promise.resolve();
let failure = null;
export function supportsOfflineStore() { return typeof indexedDB !== 'undefined'; }
function transaction(action, mode = 'readwrite') {
  return new Promise((resolve, reject) => {
    const tx = database.transaction('accounts', mode);
    action(tx.objectStore('accounts'));
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error || new Error('Falha no armazenamento local.'));
    tx.onabort = () => reject(tx.error || new Error('Gravação local interrompida.'));
  });
}
export function initializeOfflineStore() {
  if (!supportsOfflineStore()) return Promise.resolve();
  if (opening) return opening;
  opening = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('O armazenamento local demorou a abrir. Feche outras abas e tente novamente.')), 4000);
    const request = indexedDB.open('canta-offline-v1', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('accounts');
    request.onerror = () => { clearTimeout(timeout); reject(request.error); };
    request.onblocked = () => { clearTimeout(timeout); reject(new Error('Feche outras abas para atualizar o armazenamento offline.')); };
    request.onsuccess = async () => {
      database = request.result;
      database.onversionchange = () => database.close();
      try {
        await transaction(store => {
          const cursor = store.openCursor();
          cursor.onsuccess = () => {
            const row = cursor.result;
            if (row) {
              if (!changedBeforeHydration.has(row.key)) documents.set(row.key, row.value);
              row.continue();
            }
          };
        }, 'readonly');
        clearTimeout(timeout); resolve();
      } catch (error) { clearTimeout(timeout); reject(error); }
    };
  });
  return opening;
}
export function readOfflineDocument(userId) { return documents.get(userId) || null; }
export function persistOfflineDocument(userId, value) {
  changedBeforeHydration.add(userId);
  const previous = documents.get(userId);
  // Serialize writes and account erasure. A late write cannot overtake logout.
  writes = writes.catch(() => {}).then(async () => {
    await initializeOfflineStore();
    await transaction(store => value === null ? store.delete(userId) : store.put(value, userId));
    // Delete a legacy duplicate only after its replacement was committed.
    try { localStorage.removeItem(`canta:v2:${encodeURIComponent(userId)}:offline_snapshot`); } catch { /* Optional migration cleanup. */ }
    failure = null;
  }).catch(error => {
    if (documents.get(userId) === value) {
      if (previous) documents.set(userId, previous); else documents.delete(userId);
    }
    failure = error;
    window.dispatchEvent(new CustomEvent('canta-storage-error', { detail: error.message }));
    throw error;
  });
  // Prevent an unhandled rejection; flushOfflineStore still observes failure.
  void writes.catch(() => {});
  if (value === null) documents.delete(userId); else documents.set(userId, value);
}
export async function flushOfflineStore() { await writes; if (failure) throw failure; }
