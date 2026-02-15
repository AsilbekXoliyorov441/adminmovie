import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(),],
  server: {
    proxy: {
      '/xano': {
        target: 'https://x8ki-letl-twmt.n7.xano.io',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/xano/, '/api:j6hO02gL'),
      },
    },
  },
})
