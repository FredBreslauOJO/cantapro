import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', 
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'safari-pinned-tab.svg'],
      manifest: {
        name: 'CANTA.PRO',
        short_name: 'CANTA.PRO',
        description: 'Teleprompter e Organizador de Repertórios',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone', 
        orientation: 'portrait',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Agora ele salva TUDO (inclusive os vídeos de background se houver)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,webm,jpg,jpeg,gif}'],
        cleanupOutdatedCaches: true,
        // A REGRA DE OURO DO OFFLINE PARA REACT:
        navigateFallback: '/index.html',
        navigateFallbackAllowlist: [/^(?!\/__).*/],
      }
    })
  ],
})