const PREFIX = 'canta:v2:';
let activeUser = null;
export function activateUserCache(userId) { activeUser = userId || null; }
export function cacheKey(userId, key) {
  if (!userId) throw new Error('Uma conta é necessária para acessar dados locais.');
  return `${PREFIX}${encodeURIComponent(userId)}:${key}`;
}
export const userCache = {
  getItem(userId, key) {
    if (!userId) return null;
    try { return localStorage.getItem(cacheKey(userId, key)); } catch { return null; }
  },
  setItem(userId, key, value) {
    // Late requests from a logged-out account must not recreate its private cache.
    if (!userId || activeUser !== userId) return false;
    localStorage.setItem(cacheKey(userId, key), value);
    return true;
  },
  removeItem(userId, key) { if (userId) localStorage.removeItem(cacheKey(userId, key)); },
};
export function readCache(userId, key, fallback = null) {
  try { return JSON.parse(userCache.getItem(userId, key)) ?? fallback; }
  catch { userCache.removeItem(userId, key); return fallback; }
}
export function clearUserCache(userId) {
  if (!userId) return;
  if (activeUser === userId) activeUser = null;
  const prefix = `${PREFIX}${encodeURIComponent(userId)}:`;
  try {
    for (const key of Object.keys(localStorage)) if (key.startsWith(prefix)) localStorage.removeItem(key);
  } catch { /* Disabled storage has no readable private cache. */ }
}
export function purgeLegacyCache() {
  // Never migrate private caches whose account cannot be established.
  for (const key of Object.keys(localStorage)) {
    if (/^(canta_(songs_offline|setlists_offline|song_draft|song_single_|play_offline_|profile_|sub_)|hasSeenTutorial$)/.test(key)) localStorage.removeItem(key);
  }
}
export function migrateOwnDraft(userId) {
  if (!userId) return;
  const raw = localStorage.getItem(`canta_song_draft_${userId}`);
  if (raw && !userCache.getItem(userId, 'canta_song_draft')) {
    // This key includes the authenticated UUID, unlike the original shared draft.
    JSON.parse(raw);
    userCache.setItem(userId, 'canta_song_draft', raw);
  }
}
export function invalidateContent(userId, songIds = []) {
  for (const id of songIds) userCache.removeItem(userId, `canta_song_single_${id}`);
  const prefix = cacheKey(userId, 'canta_play_offline_');
  for (const key of Object.keys(localStorage)) if (key.startsWith(prefix)) localStorage.removeItem(key);
  for (const key of ['canta_songs_offline', 'canta_setlists_offline', 'offline_snapshot']) userCache.removeItem(userId, key);
  window.dispatchEvent(new CustomEvent('canta-content-changed'));
}
