import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

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
    plugins: [react(), disableHmrClientPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
