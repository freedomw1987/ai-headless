import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Config — US-S6-1 (TD-503) + TD-511 (webServer 雙 profile)
 *
 * 兩個使用模式：
 *
 * 1. 本機開發（預設）：
 *    pnpm test:e2e
 *    - 不自動啟動 webServer（開發者手動 `pnpm dev`，保留可控 streaming 環境）
 *    - TD-503 abort 測試需要可控 streaming 環境，所以不建議 webServer 自動起
 *
 * 2. CI 自動起 server：
 *    pnpm test:e2e:ci
 *    - 用 webServer 自動啟動 dev server
 *    - 適合 CI 環境（沒人手動起 server）
 *
 * 環境變數：
 * - E2E_BASE_URL : 目標 URL（預設 http://localhost:3000）
 * - E2E_DELAY_MS : Mock streaming 字符延遲（預設 15ms，模擬真實 typing 速度）
 * - PLAYWRIGHT_WEBSERVER : 'auto' 啟用 webServer 自動起 server（CI 模式）
 */
const useWebServer = process.env.PLAYWRIGHT_WEBSERVER === 'auto';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false, // 單一瀏覽器跑，避免 MockProvider 狀態污染
  workers: 1,
  reporter: process.env.CI ? 'list' : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    headless: true,
    actionTimeout: 5_000,
    navigationTimeout: 10_000,
  },
  // TD-511：CI 模式自動起 webServer（用 PLAYWRIGHT_WEBSERVER=auto 觸發）
  // 本機開發不啟動，保留可控 streaming 環境（abort 測試需要）
  ...(useWebServer
    ? {
        webServer: {
          command: 'pnpm dev',
          url: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          stdout: 'ignore',
          stderr: 'pipe',
        },
      }
    : {}),
});