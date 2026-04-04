import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// Detecta entorno: Azure SWA usa base '/', GitHub Pages usa '/MRC.app/'
const isAzure = process.env.DEPLOY_TARGET === 'azure'
const base = isAzure ? '/' : '/MRC.app/'

const pwaScope    = isAzure ? '/'          : '/MRC.app/'
const pwaStartUrl = isAzure ? '/'          : '/MRC.app/'

export default defineConfig({
  base,

  define: {
    __APP_VERSION__:  JSON.stringify(pkg.version),
    __BUILD_DATE__:   JSON.stringify(new Date().toISOString().slice(0, 10)),
    __DEPLOY_TARGET__: JSON.stringify(isAzure ? 'azure' : 'github'),
  },

  plugins: [
    react(),
    VitePWA({
      // autoUpdate: el SW nuevo se activa de inmediato (skipWaiting + clientsClaim).
      // Antes era 'prompt' y el SW viejo persistía sirviendo HTML/CSS obsoleto.
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Misión Riesgo Cero',
        short_name: 'MRC SST',
        description: 'Herramientas SST - Agrosuper Comercial',
        lang: 'es',
        theme_color: '#1B2A4A',
        background_color: '#1B2A4A',
        display: 'standalone',
        orientation: 'portrait',
        scope:     pwaScope,
        start_url: pwaStartUrl,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Fuerza activación inmediata del SW nuevo — sin esto, el SW viejo
        // sigue sirviendo HTML/manifest obsoletos hasta que el usuario cierre TODAS las pestañas.
        skipWaiting: true,
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webmanifest}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/graph\.microsoft\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'graph-api-cache',
              networkTimeoutSeconds: 10,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache' },
          },
        ],
      },
    }),
  ],
})
