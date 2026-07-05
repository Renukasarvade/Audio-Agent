import { defineConfig } from 'vite';
import { resolve } from 'path';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json' assert { type: 'json' };

export default defineConfig({
  plugins: [crx({ manifest })],
  build: {
    target: 'es2020',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/extension/popup/index.html')
      }
    }
  },
  resolve: {
    alias: {
      'onnxruntime-web/wasm': resolve(__dirname, 'node_modules/onnxruntime-web/dist/ort.wasm.min.mjs'),
      'onnxruntime-web': resolve(__dirname, 'node_modules/onnxruntime-web/dist/ort.bundle.min.mjs')
    }
  },
  optimizeDeps: {
    // Let Vite bundle everything using the aliases provided above
  },
  server: {
    port: 5173,
    strictPort: true,
    host: 'localhost',
    cors: true,
    hmr: {
      port: 5173,
    },
  }
});
