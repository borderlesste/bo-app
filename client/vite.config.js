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
        manualChunks: {
          // Keep React as a separate chunk to avoid issues
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-icons', '@radix-ui/react-label', '@radix-ui/react-select', '@radix-ui/react-separator', '@radix-ui/react-slot', 'lucide-react'],
          'vendor-utils': ['axios', 'clsx', 'tailwind-merge', 'class-variance-authority'],
          'vendor-charts': ['chart.js', 'react-chartjs-2']
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