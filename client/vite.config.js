import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  preview: {
    port: 4173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    // Optimize bundle splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor libraries for better caching
          vendor: ['react', 'react-dom', 'react-router-dom'],
          socket: ['socket.io-client']
        }
      }
    },
    // Optimize asset handling
    assetsInlineLimit: 4096, // Inline small assets
    // Reduce bundle size
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true
      }
    }
  },
  define: {
    // Set the server URL for production builds
    'import.meta.env.VITE_SERVER_URL': JSON.stringify(
      process.env.VITE_SERVER_URL || 'https://spyfall-uvdi.onrender.com'
    )
  },
  // Performance optimizations
  optimizeDeps: {
    // Pre-bundle dependencies for faster dev server
    include: ['react', 'react-dom', 'react-router-dom', 'socket.io-client']
  },
  // Improve CSS handling
  css: {
    devSourcemap: false // Disable CSS source maps in production
  }
})
