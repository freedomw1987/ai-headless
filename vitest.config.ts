import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import path from 'node:path';

export default defineConfig(({ mode }) => ({
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    // 載入 .env.local / .env.test.local / .env.{mode} 到 process.env
    // 解決 dev DB 連線問題：vitest.setup.ts 原本沒載入 .env.local
    // loadEnv 預設順序: .env.{mode}.local > .env.{mode} > .env.local > .env
    // 空字串 prefix 表示讀取所有變數（不限 VITE_）
    env: loadEnv(mode, process.cwd(), ''),
    watch: false, // Completely disables watch mode by default
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'dist', 'tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['lib/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
      exclude: ['**/*.d.ts', '**/*.test.ts', '**/*.spec.ts'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
}));
