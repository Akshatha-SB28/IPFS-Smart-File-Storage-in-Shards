import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: { Buffer: true, process: true },
    }),
  ],
  // ✅ FORCE VITE TO IGNORE THE BROKEN PATH
  optimizeDeps: {
    exclude: ['@esbuild-plugins/node-globals-polyfill'],
    esbuildOptions: {
      // This defines 'process' globally so the scanner doesn't 
      // look for the _virtual-process-polyfill_ file
      define: {
        global: 'globalThis',
      },
    },
  },
  resolve: {
    alias: {
      // If anything asks for the broken plugin, give it nothing
      '@esbuild-plugins/node-globals-polyfill': 'identity-obj-proxy',
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
})