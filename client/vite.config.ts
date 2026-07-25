import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
  resolve: {
    alias: {
      // Bypass USWDS package exports map for CSS - resolve directly to dist/css
      '@uswds/uswds/dist/css/uswds.min.css': path.resolve(
        __dirname,
        'node_modules/@uswds/uswds/dist/css/uswds.min.css',
      ),
    },
  },
})
