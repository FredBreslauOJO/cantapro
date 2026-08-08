import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Importa a engrenagem do PWA (Service Worker) para forçar o cache offline
import { registerSW } from 'virtual:pwa-register'

// Dispara o registro imediatamente em segundo plano
registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)