import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite configuration -- proxies /api and /health to the Flask backend
// during development so the frontend can call them as if they were local.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api':    'http://localhost:5000',
      '/health': 'http://localhost:5000',
    },
  },
  build: {
    outDir:        'dist',
    sourcemap:     true,
    chunkSizeWarningLimit: 1000,
  },
})
