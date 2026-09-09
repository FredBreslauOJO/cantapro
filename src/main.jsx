import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Importa a engrenagem do PWA (Service Worker) para forçar o cache offline
import { registerSW } from 'virtual:pwa-register'
import { setPwaState, setPwaUpdater } from './lib/pwaState'

// Dispara o registro imediatamente em segundo plano
const updateSW = registerSW({
  immediate: true,
  onOfflineReady() { setPwaState({ ready: true, error: '' }) },
  onNeedRefresh() { setPwaState({ update: true }) },
  onRegisterError() { setPwaState({ error: 'A instalação offline do aplicativo não foi concluída.' }) },
})
setPwaUpdater(updateSW)
if ('serviceWorker' in navigator && 'caches' in window) {
  navigator.serviceWorker.ready.then(async () => {
    const shell = await caches.match('/index.html', { ignoreSearch: true })
    if (shell) setPwaState({ ready: true })
  }).catch(() => {})
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
