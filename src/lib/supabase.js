import { createClient } from '@supabase/supabase-js'
import { readLocalSession } from './localSession.js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const authStorageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`
export const getLocalSession = () => readLocalSession(localStorage, authStorageKey)
let pendingSignOut = Promise.resolve()
export async function beginSignIn() {
  await pendingSignOut
  localStorage.removeItem(`${authStorageKey}:signed-out`)
}
export function finishLocalSignOut() {
  pendingSignOut = supabase.auth.signOut({ scope: 'local' }).catch(() => {})
}
export async function boundedFetch(input, options = {}) {
  const controller = new AbortController()
  const abort = () => controller.abort()
  options.signal?.addEventListener('abort', abort, { once: true })
  if (options.signal?.aborted) controller.abort()
  const timer = setTimeout(abort, 8000)
  try { return await fetch(input, { ...options, signal: controller.signal }) }
  finally { clearTimeout(timer); options.signal?.removeEventListener('abort', abort) }
}
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { storageKey: authStorageKey }, global: { fetch: boundedFetch },
})
