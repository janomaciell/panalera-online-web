import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'react-vendor'
          }
          if (id.includes('node_modules/gsap')) return 'gsap-vendor'
          if (id.includes('node_modules/framer-motion')) return 'motion-vendor'
          if (id.includes('node_modules/@tanstack')) return 'query-vendor'
          if (id.includes('node_modules/zustand') || id.includes('node_modules/axios') || id.includes('node_modules/react-hook-form')) return 'form-vendor'
        },
      },
    },
  },
})
