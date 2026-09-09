import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'rolldown';
import { JSDOM } from 'jsdom';
import { indexedDB, IDBDatabase } from 'fake-indexeddb';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readLocalSession, resolveAuthSession, beginLocalSignOut } from '../src/lib/localSession.js';
import { initializeOfflineStore, flushOfflineStore, readOfflineDocument } from '../src/lib/offlineStore.js';
import { activateUserCache, userCache, clearUserCache, invalidateContent } from '../src/lib/userCache.js';

const dom = new JSDOM('<div id="root"></div>', { url: 'https://offline.test' });
Object.assign(globalThis, { window: dom.window, document: dom.window.document,
  localStorage: dom.window.localStorage, sessionStorage: dom.window.sessionStorage, indexedDB,
  CustomEvent: dom.window.CustomEvent, Event: dom.window.Event, IS_REACT_ACT_ENVIRONMENT: true });
const key = 'sb-test-auth-token';
const session = { user: { id: 'A', email: 'synthetic@example.invalid' }, access_token: 'synthetic', refresh_token: 'synthetic', expires_at: 1 };

test('expired local session survives INITIAL_SESSION(null), explicit sign-out blocks revival and foreign project keys', () => {
  localStorage.clear(); localStorage.setItem(key, JSON.stringify(session));
  assert.equal(resolveAuthSession('INITIAL_SESSION', null, readLocalSession(localStorage, key)).user.id, 'A');
  assert.equal(readLocalSession(localStorage, 'sb-other-auth-token'), null);
  assert.equal(resolveAuthSession('SIGNED_OUT', null, session), null);
  beginLocalSignOut(localStorage, key);
  localStorage.setItem(key, JSON.stringify(session)); // Simulate a late SDK write.
  assert.equal(readLocalSession(localStorage, key), null);
});

test('IndexedDB snapshot survives durable commit; edit preserves other shows; deletion and logout remove private content', async () => {
  await initializeOfflineStore(); activateUserCache('A');
  const snapshot = { songs: [{ id: 's', title: 'Old' }, { id: 'other' }], setlists: [{ id: 'show' }, { id: 'private' }],
    shows: { show: { songs: [{ id: 's', title: 'Old' }], items: [{ song_id: 's', songs: { id: 's' } }] }, private: { songs: [{ id: 'other' }] } } };
  userCache.setItem('A', 'offline_snapshot', JSON.stringify(snapshot)); await flushOfflineStore();
  assert.equal(readOfflineDocument('A').shows.show.songs[0].title, 'Old');
  assert.equal(localStorage.getItem('canta:v2:A:offline_snapshot'), null);
  invalidateContent('A', ['s'], { song: { id: 's', title: 'New' } }); await flushOfflineStore();
  assert.equal(readOfflineDocument('A').shows.show.songs[0].title, 'New');
  assert.equal(readOfflineDocument('A').shows.private.songs.length, 1);
  invalidateContent('A', ['s'], { deletedSongIds: ['s'], deletedSetlistIds: ['private'] }); await flushOfflineStore();
  assert.equal(readOfflineDocument('A').shows.show.songs.length, 0);
  assert.equal(readOfflineDocument('A').shows.show.items.length, 0);
  assert.equal(readOfflineDocument('A').shows.private, undefined);
  clearUserCache('A'); activateUserCache('B'); await flushOfflineStore();
  assert.equal(readOfflineDocument('A'), null);
  assert.equal(userCache.setItem('A', 'offline_snapshot', JSON.stringify(snapshot)), false);
});

test('aborted disk write keeps the last committed snapshot, including after reopening the database', async () => {
  activateUserCache('disk');
  const original = { songs: [{ id: 'saved' }], setlists: [], shows: {} };
  userCache.setItem('disk', 'offline_snapshot', JSON.stringify(original)); await flushOfflineStore();
  const transact = IDBDatabase.prototype.transaction;
  IDBDatabase.prototype.transaction = function (...args) {
    const tx = transact.apply(this, args);
    if (args[1] === 'readwrite') queueMicrotask(() => tx.abort());
    return tx;
  };
  try {
    userCache.setItem('disk', 'offline_snapshot', JSON.stringify({ ...original, songs: [] }));
    await assert.rejects(flushOfflineStore());
    assert.deepEqual(readOfflineDocument('disk'), original);
  } finally { IDBDatabase.prototype.transaction = transact; }
  const stored = await new Promise((resolve, reject) => {
    const open = indexedDB.open('canta-offline-v1', 1);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const get = db.transaction('accounts', 'readonly').objectStore('accounts').get('disk');
      get.onsuccess = () => { db.close(); resolve(get.result); };
      get.onerror = () => { db.close(); reject(get.error); };
    };
  });
  assert.deepEqual(stored, original);
  clearUserCache('disk'); await flushOfflineStore();
});

test('real player pins a downloaded show across background sync and uses the new version after reopening', async () => {
  activateUserCache('stage'); await initializeOfflineStore();
  const snapshot = title => ({ songs: [], setlists: [{ id: 'show' }], shows: { show: {
    setlistName: 'Synthetic show', songs: [{ id: 'song', title, lyrics_text: title, duration_seconds: 120 }],
  } } });
  userCache.setItem('stage', 'offline_snapshot', JSON.stringify(snapshot('Original lyrics'))); await flushOfflineStore();
  globalThis.__playerAuth = { user: { id: 'stage' }, isOnline: false, contentVersion: 0 };
  globalThis.__playerNetworkCalls = 0;
  window.scrollTo = () => {};
  const require = createRequire(import.meta.url);
  const result = await build({ input: fileURLToPath(new URL('../src/pages/PlaySong.jsx', import.meta.url)),
    write: false, platform: 'node', output: { format: 'esm' }, plugins: [{ name: 'player-fixture', resolveId(id) {
      if (id === 'react' || id === 'react/jsx-runtime' || id === 'lucide-react') return { id: pathToFileURL(require.resolve(id)).href, external: true };
      if (id === '../lib/offline' || id === '../lib/userCache') return { id: new URL(`../src/lib/${id.split('/').pop()}.js`, import.meta.url).href, external: true };
      if (id === '../lib/AuthContext') return '\0player-auth';
      if (id === '../lib/supabase') return '\0player-network';
      if (id === 'react-router-dom') return '\0player-route';
    }, load(id) {
      if (id === '\0player-auth') return 'export const useAuth = () => globalThis.__playerAuth;';
      if (id === '\0player-network') return 'export const supabase = { from() { globalThis.__playerNetworkCalls++; throw new Error("Unexpected network"); } };';
      if (id === '\0player-route') return 'export const useParams = () => ({id:"show",songIndex:"0"}); export const useNavigate = () => () => {};';
    } }] });
  const { default: Player } = await import(`data:text/javascript;base64,${Buffer.from(result.output[0].code).toString('base64')}`);
  let root = createRoot(document.getElementById('root'));
  try {
    await act(async () => root.render(React.createElement(Player)));
    assert.match(document.getElementById('root').textContent, /Original lyrics/i);
    userCache.setItem('stage', 'offline_snapshot', JSON.stringify(snapshot('Updated lyrics'))); await flushOfflineStore();
    globalThis.__playerAuth = { ...globalThis.__playerAuth, isOnline: true, contentVersion: 1 };
    await act(async () => root.render(React.createElement(Player)));
    assert.match(document.getElementById('root').textContent, /Original lyrics/i);
    assert.doesNotMatch(document.getElementById('root').textContent, /Updated lyrics/i);
    await act(async () => root.unmount());
    root = createRoot(document.getElementById('root'));
    await act(async () => root.render(React.createElement(Player)));
    assert.match(document.getElementById('root').textContent, /Updated lyrics/i);
    assert.equal(globalThis.__playerNetworkCalls, 0);
  } finally {
    await act(async () => root.unmount()); clearUserCache('stage'); await flushOfflineStore();
    delete globalThis.__playerAuth; delete globalThis.__playerNetworkCalls;
  }
});

test('real AuthProvider opens offline before pending auth, survives late null, and logs out without network', async () => {
  localStorage.clear(); localStorage.setItem(key, JSON.stringify(session));
  let callback;
  let finishSession;
  const pending = new Promise(resolve => { finishSession = resolve; });
  globalThis.__offlineTestAuth = {
    auth: { getSession: () => pending, onAuthStateChange: listener => {
      callback = listener; return { data: { subscription: { unsubscribe() {} } } };
    }, signOut: () => new Promise(() => {}) },
  };
  const require = createRequire(import.meta.url);
  const result = await build({
    input: fileURLToPath(new URL('../src/lib/AuthContext.jsx', import.meta.url)),
    write: false, platform: 'node',
    plugins: [{ name: 'offline-auth-fixture', resolveId(id) {
      if (id === 'react' || id === 'react/jsx-runtime') return { id: pathToFileURL(require.resolve(id)).href, external: true };
      if (id === './supabase') return '\0auth-fixture';
    }, load(id) {
      if (id === '\0auth-fixture') return `export const supabase = globalThis.__offlineTestAuth;
        export const finishLocalSignOut = () => { void supabase.auth.signOut(); };
        export const authStorageKey = '${key}'; export const getLocalSession = () => {
          if(localStorage.getItem(authStorageKey+':signed-out')==='true')return null;
          return JSON.parse(localStorage.getItem(authStorageKey)); };`;
    } }], output: { format: 'esm' },
  });
  const module = await import(`data:text/javascript;base64,${Buffer.from(result.output[0].code).toString('base64')}`);
  let current;
  function Probe() { current = module.useAuth(); return React.createElement('span', null, current.isLoadingAuth ? 'loading' : current.user?.id || 'guest'); }
  const root = createRoot(document.getElementById('root'));
  try {
    await act(async () => {
      root.render(React.createElement(module.AuthProvider, null, React.createElement(Probe)));
      await new Promise(resolve => setTimeout(resolve, 30));
    });
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); });
    assert.equal(document.getElementById('root').textContent, 'A');
    await act(async () => {
      callback('INITIAL_SESSION', null);
      finishSession({ data: { session: null }, error: { name: 'AuthRetryableFetchError' } });
    });
    assert.equal(document.getElementById('root').textContent, 'A');
    await act(async () => { await current.logout(); });
    assert.equal(document.getElementById('root').textContent, 'guest');
    await act(async () => { callback('TOKEN_REFRESHED', session); });
    assert.equal(document.getElementById('root').textContent, 'guest');
  } finally { await act(async () => root.unmount()); delete globalThis.__offlineTestAuth; }
});
