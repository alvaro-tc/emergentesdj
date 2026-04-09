import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        // Vite 6 usa el compilador moderno de Sass por defecto — no requiere silenciar deprecaciones legacy
        api: 'modern-compiler',
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'build',
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-mui': ['@mui/material', '@mui/icons-material'],
          'vendor-router': ['react-router-dom'],
          'vendor-redux': ['redux', 'react-redux', 'redux-persist'],
          'vendor-charts': ['recharts'],
        },
      },
    },
  },
  define: {
    'process.env.REACT_APP_BACKEND_SERVER': JSON.stringify(process.env.REACT_APP_BACKEND_SERVER || ''),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
})
