/**
 * Sprint 41-2 — admin 後台剩餘頁面 RWD 守護測試
 *
 * 涵蓋: dashboard / role matrix / user list / user new
 * 守護: 375px (mobile) + 1440px (desktop) 都不 overflow
 */

import { test, expect } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/admin/login');
  await page.fill('input#email', 'admin@ai-headless.local');
  await page.fill('input#password', 'admin123');
  await page.click('button[type=submit]');
  await page.waitForURL(/^http:\/\/localhost:3000\/admin$/, { timeout: 10000 });
}

const PAGES = [
  { name: 'dashboard', url: '/admin' },
  { name: 'roles', url: '/admin/roles' },
  { name: 'users', url: '/admin/users' },
  { name: 'user-new', url: '/admin/users/new' },
];

test.describe('Sprint 41-2 — admin 後台 RWD (375px mobile)', () => {
  for (const p of PAGES) {
    test(`${p.name} 375px 無 horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await login(page);
      await page.goto(p.url);
      await page.waitForTimeout(2000);

      const overflow = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });
      expect(overflow, `${p.name} 在 375px 有 horizontal overflow`).toBe(false);
    });
  }
});

test.describe('Sprint 41-2 — admin 後台 RWD (1440px desktop)', () => {
  for (const p of PAGES) {
    test(`${p.name} 1440px 無 horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await login(page);
      await page.goto(p.url);
      await page.waitForTimeout(2000);

      const overflow = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });
      expect(overflow, `${p.name} 在 1440px 有 horizontal overflow`).toBe(false);
    });
  }
});
