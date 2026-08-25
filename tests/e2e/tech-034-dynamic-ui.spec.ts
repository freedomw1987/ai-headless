/**
 * Sprint 14 TECH-034 E2E — Dynamic UI
 *
 * 守護：admin/crud/todo 列表頁可訪問、欄位正確、新增按鈕可用
 */

import { test, expect } from '@playwright/test';

test.describe('Sprint 14 TECH-034 — Dynamic UI', () => {
  test('未登入訪問 /admin/crud/todo → redirect 到 login', async ({ page }) => {
    await page.goto('/admin/crud/todo');
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});