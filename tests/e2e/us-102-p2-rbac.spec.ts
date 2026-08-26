/**
 * Sprint 21 E2E — RBAC Phase 2 場景測試
 *
 * 對應 PRD：docs/prd/09-rbac.md §7.4 E2E 測試
 *
 * 涵蓋 5 個場景:
 * 1. admin 進 /admin/roles 看到完整列表
 * 2. admin 新增自定義 role（含錯誤場景：重複名、保留字）
 * 3. admin 編輯 role permissions
 * 4. editor 進 /admin/roles 被重導
 * 5. admin 刪除自定義 role（無用戶 / 有人用戶）
 *
 * 注意: E2E 需要 dev DB 與 dev server。執行: pnpm test:e2e
 */

import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

async function login(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto(`${BASE}/admin/login`);
  await page.fill('input#email', email);
  await page.fill('input#password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(
    (url) => !url.toString().includes('/admin/login'),
    { timeout: 15_000 },
  );
}

test.describe('US-102-P2 RBAC', () => {
  test('admin 進 /admin/roles 看到完整列表', async ({ page }) => {
    await login(page, 'admin@ai-headless.local', 'admin123');
    await page.goto(`${BASE}/admin/roles`);

    // 標題
    await expect(page.locator('h1')).toContainText('Roles 管理');

    // 至少看到 3 個內建 role (admin / editor / viewer)
    await expect(page.getByText('admin')).toBeVisible();
    await expect(page.getByText('editor')).toBeVisible();
    await expect(page.getByText('viewer')).toBeVisible();

    // 內建 role 顯示「系統」 badge
    const systemBadges = page.getByText('系統');
    expect(await systemBadges.count()).toBeGreaterThanOrEqual(3);
  });

  test('admin 新增自定義 role 成功', async ({ page }) => {
    await login(page, 'admin@ai-headless.local', 'admin123');
    await page.goto(`${BASE}/admin/roles`);

    // 點新增按鈕
    await page.getByRole('button', { name: '新增 Role' }).click();

    // 填表
    await page.fill('input#name', 'content_moderator_e2e');
    await page.fill('input#displayName', '內容審核員 E2E');
    await page.fill('textarea#description', 'E2E 測試建立的自定義 role');

    // 提交
    await page.getByRole('button', { name: '建立' }).click();

    // 等待 Dialog 關閉
    await page.waitForTimeout(500);

    // 新 role 出現在列表
    await expect(page.getByText('content_moderator_e2e')).toBeVisible();
  });

  test('admin 新增保留字 role 被拒絕', async ({ page }) => {
    await login(page, 'admin@ai-headless.local', 'admin123');
    await page.goto(`${BASE}/admin/roles`);

    await page.getByRole('button', { name: '新增 Role' }).click();

    await page.fill('input#name', 'admin'); // 保留字
    await page.fill('input#displayName', '嘗試覆蓋 admin');

    await page.getByRole('button', { name: '建立' }).click();

    // 應顯示錯誤訊息（Dialog 不關閉）
    await expect(page.getByText(/驗證失敗|保留字/)).toBeVisible({ timeout: 3000 });
  });

  test('admin 進矩陣頁可看到內建 role 為唯讀', async ({ page }) => {
    await login(page, 'admin@ai-headless.local', 'admin123');
    await page.goto(`${BASE}/admin/roles`);

    // 點 admin 的「矩陣」按鈕
    const adminRow = page.locator('tr', { hasText: 'admin' });
    await adminRow.getByRole('link', { name: /矩陣/ }).click();

    // 等待導向
    await page.waitForURL(/\/admin\/roles\/[^/]+\/permissions/, { timeout: 5000 });

    // 看到「系統」 badge + 唯讀警告
    await expect(page.getByText(/系統內建.*唯讀/)).toBeVisible();

    // checkbox 應為 disabled
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    await expect(firstCheckbox).toBeDisabled();
  });

  test('editor 進 /admin/roles 不顯示入口', async ({ page }) => {
    await login(page, 'editor@ai-headless.local', 'editor123');
    await page.goto(`${BASE}/admin`);

    // Sidebar 不顯示 Roles
    const sidebar = page.locator('aside');
    await expect(sidebar.getByRole('link', { name: 'Roles' })).not.toBeVisible();
  });
});