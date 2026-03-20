import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // This handles Buffer, Process, and Global variables automatically
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  server: {
    port: 5173,
    // This ensures your frontend can talk to your backend
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})