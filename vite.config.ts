import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

function disableHmrClientPlugin(): Plugin {
  return {
    name: 'disable-hmr-client-ws',
    enforce: 'post',
    apply: 'serve',
    transform(code, id) {
      if (id.endsWith('/vite/dist/client/client.mjs') || id.endsWith('\\vite\\dist\\client\\client.mjs')) {
        const transformed = code
          .replace(
            'transport.connect(createHMRHandler(handleMessage));',
            '/* HMR disabled: WebSocket transport connection skipped */'
          )
          .replace(
            'throw new Error("send was called before connect");',
            'return;'
          )
          .replace(
            'throw new Error("invoke was called before connect");',
            'return;'
          )
          .replace(
            'ws.send(JSON.stringify(data));',
            'if (ws && ws.readyState === 1) ws.send(JSON.stringify(data));'
          );
        return { code: transformed, map: null };
      }
    },
  };
}

export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: false,
    },
    build: {
      target: 'esnext',
    },
    plugins: [
      react(),
      disableHmrClientPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.ico',
          'apple-touch-icon.png',
          'icon.svg',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
        ],
        manifest: {
          id: '/',
          name: 'MMNext Studio',
          short_name: 'MMNext',
          description:
            'Find the perfect voice for your Text to Speech needs. Simply describe the voice you are looking for and the AI will do the casting for you.',
          theme_color: '#06231B',
          background_color: '#041813',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          navigateFallbackDenylist: [/^\/api\//, /^\/__\//],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
