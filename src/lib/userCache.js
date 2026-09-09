import { supportsOfflineStore, readOfflineDocument, persistOfflineDocument } from './offlineStore.js';
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
    if (key === 'offline_snapshot' && supportsOfflineStore()) {
      const value = readOfflineDocument(userId);
      if (value) return JSON.stringify(value);
    }
    try { return localStorage.getItem(cacheKey(userId, key)); } catch { return null; }
  },
  setItem(userId, key, value) {
    // Late requests from a logged-out account must not recreate its private cache.
    if (!userId || activeUser !== userId) return false;
    if (key === 'offline_snapshot' && supportsOfflineStore()) {
      persistOfflineDocument(userId, JSON.parse(value));
      return true;
    }
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
  if (supportsOfflineStore()) persistOfflineDocument(userId, null);
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
export function removeLegacyContentCopies(userId) {
  if (!userId || activeUser !== userId) return;
  const prefix = cacheKey(userId, '');
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(prefix) && /^canta_(songs_offline$|setlists_offline$|song_single_|play_offline_)/.test(key.slice(prefix.length))) {
        localStorage.removeItem(key);
      }
    }
  } catch { /* The committed IndexedDB snapshot remains available. */ }
}
export function invalidateContent(userId, songIds = [], changes = {}) {
  if (!userId || activeUser !== userId) return;
  for (const id of songIds) userCache.removeItem(userId, `canta_song_single_${id}`);
  const snapshot = readCache(userId, 'offline_snapshot');
  if (snapshot) {
    const deleted = new Set(changes.deletedSongIds || []);
    const removedShows = new Set(changes.deletedSetlistIds || []);
    const updateSongs = songs => (songs || []).filter(song => !deleted.has(song.id)).map(song =>
      changes.song?.id === song.id ? { ...song, ...changes.song } : song);
    snapshot.songs = updateSongs(snapshot.songs);
    if (changes.song && !snapshot.songs.some(song => song.id === changes.song.id)) snapshot.songs.push(changes.song);
    snapshot.setlists = (snapshot.setlists || []).filter(show => !removedShows.has(show.id)).map(show =>
      changes.setlist?.id === show.id ? { ...show, ...changes.setlist } : show);
    if (changes.setlist?.owner_id === userId && !snapshot.setlists.some(show => show.id === changes.setlist.id)) {
      snapshot.setlists.push({ ...changes.setlist, isShared: false, songCount: 0, totalDurationSeconds: 0 });
      snapshot.shows[changes.setlist.id] = { setlistName: changes.setlist.event_name, songs: [], items: [] };
    }
    for (const [id, show] of Object.entries(snapshot.shows || {})) {
      if (removedShows.has(id)) { delete snapshot.shows[id]; continue; }
      show.songs = updateSongs(show.songs);
      if (show.items) show.items = show.items.filter(item => !deleted.has(item.song_id || item.songs?.id))
        .map(item => changes.song?.id === item.songs?.id ? { ...item, songs: { ...item.songs, ...changes.song } } : item);
      if (changes.setlist?.id === id && changes.setlist.event_name) show.setlistName = changes.setlist.event_name;
    }
    if (changes.show && snapshot.shows) snapshot.shows[changes.show.id] = changes.show.value;
    snapshot.setlists = snapshot.setlists.map(show => {
      const tracks = snapshot.shows?.[show.id]?.songs?.filter(song => !song.isSeparator);
      return tracks ? { ...show, songCount: tracks.length,
        totalDurationSeconds: tracks.reduce((sum, song) => sum + (song.duration_seconds || 0), 0) } : show;
    });
    snapshot.dirty = true;
    userCache.setItem(userId, 'offline_snapshot', JSON.stringify(snapshot));
  }
  for (const id of changes.deletedSetlistIds || []) userCache.removeItem(userId, `canta_play_offline_${id}`);
  // Legacy copies are retained for unrelated shows; strip known deleted songs.
  for (const key of Object.keys(localStorage)) {
    if (!key.startsWith(cacheKey(userId, 'canta_play_offline_'))) continue;
    try {
      const value = JSON.parse(localStorage.getItem(key));
      value.songs = value.songs.filter(song => !(changes.deletedSongIds || []).includes(song.id));
      localStorage.setItem(key, JSON.stringify(value));
    } catch { localStorage.removeItem(key); }
  }
  window.dispatchEvent(new CustomEvent('canta-content-changed'));
  window.dispatchEvent(new CustomEvent('canta-snapshot-ready'));
}
