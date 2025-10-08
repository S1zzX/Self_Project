import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/users': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/tasks': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/notifications': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/messages': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/refresh-token': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/logout': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})