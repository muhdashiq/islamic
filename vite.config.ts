import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable.png'],
      manifest: {
        id: '/',
        name: 'Adkar — Daily Remembrance',
        short_name: 'Adkar',
        description: 'Your quiet space for daily remembrance, even offline.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f5f5f0',
        theme_color: '#f5f5f0',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        navigateFallbackDenylist: [/^\/content\.json$/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname === '/content.json',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'adkar-content',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 1 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
  server: { headers: { 'Cache-Control': 'no-cache' } },
  preview: { headers: { 'Cache-Control': 'no-cache' } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    clearMocks: true,
  },
});
