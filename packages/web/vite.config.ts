import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@knowlex/core': path.resolve(__dirname, '../core/src'),
    },
  },
  server: {
    allowedHosts: ['millie-venose-temerariously.ngrok-free.dev'],
  },
})
