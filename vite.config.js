import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Hanya split eager vendor — biarin lazy chunks (xlsx/jspdf) tetap terpisah
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/'))
            return 'vendor-react';
          if (id.includes('node_modules/@supabase'))
            return 'vendor-supabase';
        }
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})
