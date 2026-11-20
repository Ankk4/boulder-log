/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/boulder-log/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    // Only this checkout's tests: agent worktrees under .claude/worktrees/ hold copies of src/.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // Keep output short: console output is shown only for failing tests.
    silent: 'passed-only',
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },
  },
})
