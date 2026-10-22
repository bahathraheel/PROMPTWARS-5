/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('firebase/app') || id.includes('firebase/auth') || id.includes('firebase/firestore')) {
            return 'firebase';
          }
          if (id.includes('recharts')) return 'charts';
          if (id.includes('react-router-dom')) return 'router';
        },
      },
    },
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/tests/**',
        'src/main.tsx',
        'src/**/*.d.ts',
        'src/services/firebase.ts',  // Firebase init — tested via integration
      ],
      thresholds: {
        statements: 60,
        branches:   60,
        functions:  60,
        lines:      60,
      },
    },
  },
})
