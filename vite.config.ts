import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Served from GitHub Pages under /ethergate-demo/
export default defineConfig({
  base: '/ethergate-demo/',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1600,
  },
})
