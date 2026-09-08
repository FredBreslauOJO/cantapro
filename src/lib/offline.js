import { fetchAll } from './data.js';
import { readCache, userCache } from './userCache.js';
export function formatPlayItems(items) {
  return items.map(item => {
    if (item.item_type === 'divider') return { id: item.id, title: item.content || 'PAUSA', isSeparator: true,
      lyrics_text: [item.content || 'PAUSA', item.performance_notes].filter(Boolean).join('\n\n') };
    if (!item.songs) throw new Error('Uma música do repertório não está disponível.');
    return item.songs;
  });
}
export function getOfflineSnapshot(userId) { return readCache(userId, 'offline_snapshot'); }
export async function prepareOffline(client, user, isCurrent = () => true) {
  const songs = await fetchAll(() => client.from('songs').select('*').eq('owner_id', user.id).order('id'));
  const members = await fetchAll(() => client.from('setlist_members').select('setlist_id').eq('user_id', user.id).order('setlist_id'));
  const owned = await fetchAll(() => client.from('setlists').select('*').eq('owner_id', user.id).order('id'));
  const setlistMap = new Map(owned.map(row => [row.id, row]));
  for (const { setlist_id } of members) {
    if (setlistMap.has(setlist_id)) continue;
    const shared = await fetchAll(() => client.from('setlists').select('*').eq('id', setlist_id).order('id'));
    if (shared.length !== 1) throw new Error('Um repertório compartilhado não está disponível.');
    setlistMap.set(setlist_id, shared[0]);
  }
  const shows = {};
  const setlists = [];
  for (const setlist of setlistMap.values()) {
    const items = await fetchAll(() => client.from('setlist_items').select('id,setlist_id,item_type,content,performance_notes,order_index,songs(*)')
      .eq('setlist_id', setlist.id).order('order_index').order('id'));
    shows[setlist.id] = { setlistName: setlist.event_name, songs: formatPlayItems(items) };
    const tracks = items.filter(item => item.item_type === 'song');
    setlists.push({ ...setlist, isShared: setlist.owner_id !== user.id, songCount: tracks.length,
      totalDurationSeconds: tracks.reduce((total, item) => total + (item.songs?.duration_seconds || 0), 0) });
  }
  const snapshot = { version: 1, savedAt: new Date().toISOString(), songs, setlists, shows };
  if (!isCurrent()) throw new Error('A sessão ou o conteúdo mudou. Prepare o show novamente.');
  // Atomic write: partial downloads cannot replace the previous complete copy.
  if (!userCache.setItem(user.id, 'offline_snapshot', JSON.stringify(snapshot))) throw new Error('A sessão mudou.');
  return snapshot;
}
