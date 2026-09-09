export function readLocalSession(storage, key) {
  try {
    if (storage.getItem(`${key}:signed-out`) === 'true') return null;
    const session = JSON.parse(storage.getItem(key));
    return session?.user?.id && session.access_token && session.refresh_token ? session : null;
  } catch { return null; }
}
// INITIAL_SESSION(null) also means a retryable refresh failed. Only restore
// from this project's still-existing credentials, never from another account.
export function resolveAuthSession(event, session, localSession) {
  if (event === 'SIGNED_OUT') return null;
  return session || (event === 'INITIAL_SESSION' ? localSession : null);
}
export function beginLocalSignOut(storage, key) {
  storage.setItem(`${key}:signed-out`, 'true');
  storage.removeItem(key);
}
