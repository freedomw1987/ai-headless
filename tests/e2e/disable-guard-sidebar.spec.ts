/**
 * Sprint 9 補完 — Disable Guard Sidebar E2E
 *
 * 對應：app/admin/layout.tsx + app/admin/admin-sidebar.tsx
 *
 * 守護：disable extension 時，Sidebar HTML 真的不包含對應 nav 連結
 *
 * 涵蓋：
 * 1. 登入後初始狀態 → Sidebar 含 4 個 extension 連結
 * 2. Disable blog → 重新整理 → Sidebar 不含「部落格」連結
 * 3. Re-enable blog → 重新整理 → Sidebar 恢復含「部落格」連結
 * 4. Disable 多個 → 只剩 enabled 的
 * 5. 直接打 /admin/blog → redirect 到 /admin（page guard 也 work）
 *
 * 注意：
 * - 用 admin@ai-headless.local / admin123（prisma seed 帳號）
 * - 需要 dev server 跑（playwright.config.ts 已配 webserver）
 * - 預期登入流程會 redirect 到 /admin
 * - 用 `aside a[href=...]` 限定 selector 範圍，避免與 main 內容（也有「用戶管理」等連結）混淆
 */

import { test, expect, request as pwRequest } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@ai-headless.local';
const ADMIN_PASSWORD = 'admin123';

async function setExtensionEnabled(name: string, enabled: boolean) {
  const apiContext = await pwRequest.newContext({ baseURL: BASE_URL });
  try {
    for (let i = 0; i < 5; i++) {
      const statusRes = await apiContext.get('/api/extensions');
      const statusData = await statusRes.json();
      const current = statusData.data?.find(
        (e: { name: string; isEnabled: boolean }) => e.name === name,
      );
      if (!current) return; // Extension 不在清單中（如 order 沒 manifest），跳過
      if (current.isEnabled === enabled) return; // 已達目標

      await apiContext.post(`/api/extensions/${name}/toggle`);
      await new Promise((r) => setTimeout(r, 100));
    }
  } finally {
    await apiContext.dispose();
  }
}

async function loginViaUI(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/admin/login`);
  // 如果已登入，會直接 redirect 到 /admin（避免重複登入）
  if (page.url().includes('/admin/login') && !page.url().includes('callbackUrl')) {
    await page.fill('input#email', ADMIN_EMAIL);
    await page.fill('input#password', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
  }
  // 等待 URL 離開 /admin/login（避免被 callbackUrl 誤判）
  await page.waitForURL((url) => !url.toString().includes('/admin/login'), { timeout: 15_000 });
}

test.describe('Disable Guard — Sidebar E2E', () => {
  test.beforeEach(async ({ page }) => {
    // 每個 test 之前重設為「全部啟用」（避免其他測試污染）
    await setExtensionEnabled('blog', true);
    await setExtensionEnabled('event', true);
    await setExtensionEnabled('todo', true);
    // 重新登入
    await loginViaUI(page);
  });

  test.afterAll(async () => {
    // 確保測試結束所有 extension 都啟用
    await setExtensionEnabled('blog', true);
    await setExtensionEnabled('event', true);
    await setExtensionEnabled('todo', true);
  });

  test('登入後 Sidebar 預設顯示 3 個 extension 連結（部落格/活動/待辦）', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });

    // 應顯示 3 個有 DB 記錄的 extension
    await expect(page.locator('aside a[href="/admin/blog"]')).toBeVisible();
    await expect(page.locator('aside a[href="/admin/event"]')).toBeVisible();
    await expect(page.locator('aside a[href="/admin/todo"]')).toBeVisible();

    // 「訂單」不在 DB（order 缺 manifest）→ 不顯示
    await expect(page.locator('aside a[href="/admin/orders"]')).not.toBeVisible();
  });

  test('Disable blog → Sidebar 不含「部落格」連結，其他仍在', async ({ page }) => {
    await setExtensionEnabled('blog', false);

    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });

    // 部落格消失
    await expect(page.locator('aside a[href="/admin/blog"]')).not.toBeVisible();
    // 其他 2 個仍在
    await expect(page.locator('aside a[href="/admin/event"]')).toBeVisible();
    await expect(page.locator('aside a[href="/admin/todo"]')).toBeVisible();
  });

  test('Disable event → Sidebar 不含「活動」連結', async ({ page }) => {
    await setExtensionEnabled('event', false);

    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });

    await expect(page.locator('aside a[href="/admin/event"]')).not.toBeVisible();
    await expect(page.locator('aside a[href="/admin/blog"]')).toBeVisible();
    await expect(page.locator('aside a[href="/admin/todo"]')).toBeVisible();
  });

  test('Disable todo → Sidebar 不含「待辦」連結', async ({ page }) => {
    await setExtensionEnabled('todo', false);

    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });

    await expect(page.locator('aside a[href="/admin/todo"]')).not.toBeVisible();
    await expect(page.locator('aside a[href="/admin/blog"]')).toBeVisible();
    await expect(page.locator('aside a[href="/admin/event"]')).toBeVisible();
  });

  test('Disable 多個 → 只剩 enabled 的', async ({ page }) => {
    await setExtensionEnabled('blog', false);
    await setExtensionEnabled('event', false);
    // todo 仍啟用（beforeEach 已設為 true）

    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });

    await expect(page.locator('aside a[href="/admin/blog"]')).not.toBeVisible();
    await expect(page.locator('aside a[href="/admin/event"]')).not.toBeVisible();
    await expect(page.locator('aside a[href="/admin/todo"]')).toBeVisible();
  });

  test('全部 disable → 3 個 extension 連結全部消失，基礎連結仍在', async ({ page }) => {
    await setExtensionEnabled('blog', false);
    await setExtensionEnabled('event', false);
    await setExtensionEnabled('todo', false);

    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });

    // 3 個 extension 連結消失
    await expect(page.locator('aside a[href="/admin/blog"]')).not.toBeVisible();
    await expect(page.locator('aside a[href="/admin/event"]')).not.toBeVisible();
    await expect(page.locator('aside a[href="/admin/todo"]')).not.toBeVisible();

    // 基礎連結仍在
    await expect(page.locator('aside a[href="/admin"]')).toBeVisible();
    await expect(page.locator('aside a[href="/admin/users"]')).toBeVisible();
    await expect(page.locator('aside a[href="/admin/extensions"]')).toBeVisible();
  });

  test('Re-enable blog → Sidebar 恢復含「部落格」連結', async ({ page }) => {
    // beforeEach 已設 blog = true，直接驗證
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });

    await expect(page.locator('aside a[href="/admin/blog"]')).toBeVisible();
  });

  test('Disable blog 後直接打 /admin/blog → redirect 到 /admin（page guard）', async ({ page }) => {
    await setExtensionEnabled('blog', false);

    await page.goto(`${BASE_URL}/admin/blog`);

    // 應該被 page guard 重定向回 /admin
    await expect(page).toHaveURL(/\/admin\/?$/);
    // Sidebar 也不含「部落格」
    await expect(page.locator('aside a[href="/admin/blog"]')).not.toBeVisible();
  });
});
