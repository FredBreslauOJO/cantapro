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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,webm,jpg,jpeg,gif}'],
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        navigateFallbackAllowlist: [/^(?!\/__).*/],
        // 👇 AQUI ESTÁ A MÁGICA QUE LIBERA O VÍDEO 👇
        maximumFileSizeToCacheInBytes: 10000000 // Aumenta o limite para 10 MB
      }
    })
  ],
})