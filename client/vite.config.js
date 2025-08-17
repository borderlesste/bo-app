import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  root: '.',
  publicDir: 'public',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4001',
        changeOrigin: true,
        // No reescribir la ruta - mantener el prefijo /api
      },
    },
    host: true, // Permite conexiones externas
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: mode !== 'production',
    minify: 'terser',
    target: 'es2018',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: './index.html', // Especificar explícitamente la ruta del index.html
      output: {
        manualChunks: (id) => {
          // Vendor chunk for React and core libraries
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          
          // Router chunk
          if (id.includes('node_modules/react-router')) {
            return 'vendor-router';
          }
          
          // UI libraries chunk
          if (id.includes('node_modules/@radix-ui') || id.includes('node_modules/lucide-react')) {
            return 'vendor-ui';
          }
          
          // Utility libraries chunk
          if (id.includes('node_modules/axios') || id.includes('node_modules/clsx') || id.includes('node_modules/tailwind-merge')) {
            return 'vendor-utils';
          }
          
          // Admin pages chunk
          if (id.includes('/pages/') && (id.includes('Admin') || id.includes('admin'))) {
            return 'admin-pages';
          }
          
          // Client pages chunk
          if (id.includes('/pages/') && (id.includes('Client') || id.includes('client'))) {
            return 'client-pages';
          }
          
          // Public pages chunk
          if (id.includes('/pages/') && !id.includes('Admin') && !id.includes('Client')) {
            return 'public-pages';
          }
          
          // Other vendor dependencies
          if (id.includes('node_modules')) {
            return 'vendor-misc';
          }
        },
        // Optimize file names for caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  define: {
    global: 'globalThis',
  },
}))