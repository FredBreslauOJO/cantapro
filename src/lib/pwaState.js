let state = { ready: false, update: false, error: '' };
const listeners = new Set();
export const getPwaState = () => state;
export const subscribePwa = callback => { listeners.add(callback); return () => listeners.delete(callback); };
export function setPwaState(value) { state = { ...state, ...value }; listeners.forEach(callback => callback()); }
let updateApp;
export const setPwaUpdater = callback => { updateApp = callback; };
export const applyPwaUpdate = () => updateApp?.(true);
