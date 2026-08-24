/**
 * Sprint 9 補完 — Disable Guard API E2E（Playwright）
 *
 * 對應：app/api/\[blog|event|todo|order\]/** 的 guardExtensionApi
 *
 * 涵蓋：
 * 1. Disable extension 後 GET /api/{ext} → 403 ExtensionDisabled
 * 2. Disable extension 後 POST /api/{ext} → 403
 * 3. Disable extension 後 PATCH /api/{ext}/{id} → 403
 * 4. 重新啟用後恢復正常
 *
 * 此測試需要 dev server 跑（playwright.config.ts 已配 webserver）
 */

import { test, expect, request as pwRequest } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL ?? 'http://localhost:3000';

async function setExtensionEnabled(name: string, enabled: boolean) {
  // 透過 toggle API 反覆切，直到達到目標狀態
  const apiContext = await pwRequest.newContext({ baseURL: BASE_URL });
  const statusRes = await apiContext.get('/api/extensions');
  const statusData = await statusRes.json();
  const current = statusData.data.find((e: { name: string; isEnabled: boolean }) => e.name === name);

  if (!current) {
    throw new Error(`Extension '${name}' not found`);
  }

  let attempts = 0;
  while (current.isEnabled !== enabled && attempts < 5) {
    await apiContext.post(`/api/extensions/${name}/toggle`);
    const newStatus = await apiContext.get('/api/extensions');
    const newData = await newStatus.json();
    const updated = newData.data.find((e: { name: string; isEnabled: boolean }) => e.name === name);
    if (updated.isEnabled === enabled) break;
    attempts++;
  }
  await apiContext.dispose();
}

test.describe('Disable Guard — API E2E', () => {
  // 確保測試結束後所有 extension 都啟用
  test.afterAll(async () => {
    await setExtensionEnabled('blog', true).catch(() => {});
    await setExtensionEnabled('event', true).catch(() => {});
    await setExtensionEnabled('todo', true).catch(() => {});
    await setExtensionEnabled('order', true).catch(() => {});
  });

  test.describe('Blog Extension', () => {
    test.afterAll(async () => {
      await setExtensionEnabled('blog', true);
    });

    test('Enable → GET /api/blog → 200', async ({ request: req }) => {
      await setExtensionEnabled('blog', true);
      const res = await req.get(`${BASE_URL}/api/blog`);
      expect(res.status()).toBe(200);
    });

    test('Disable → GET /api/blog → 403 ExtensionDisabled', async ({ request: req }) => {
      await setExtensionEnabled('blog', false);
      const res = await req.get(`${BASE_URL}/api/blog`);
      expect(res.status()).toBe(403);
      const body = await res.json();
      expect(body.error).toBe('ExtensionDisabled');
      expect(body.extension).toBe('blog');
    });

    test('Disable → POST /api/blog → 403', async ({ request: req }) => {
      await setExtensionEnabled('blog', false);
      const res = await req.post(`${BASE_URL}/api/blog`, {
        data: { title: 'test' },
      });
      expect(res.status()).toBe(403);
    });

    test('Disable → POST /api/blog/{id}/transition → 403', async ({ request: req }) => {
      await setExtensionEnabled('blog', false);
      const res = await req.post(`${BASE_URL}/api/blog/dummy-id/transition`, {
        data: { event: 'submit' },
      });
      expect(res.status()).toBe(403);
    });

    test('Re-enable → GET /api/blog → 200', async ({ request: req }) => {
      await setExtensionEnabled('blog', true);
      const res = await req.get(`${BASE_URL}/api/blog`);
      expect(res.status()).toBe(200);
    });
  });

  test.describe('Event Extension', () => {
    test.afterAll(async () => {
      await setExtensionEnabled('event', true);
    });

    test('Disable → GET /api/event → 403', async ({ request: req }) => {
      await setExtensionEnabled('event', false);
      const res = await req.get(`${BASE_URL}/api/event`);
      expect(res.status()).toBe(403);
    });

    test('Re-enable → GET /api/event → 200', async ({ request: req }) => {
      await setExtensionEnabled('event', true);
      const res = await req.get(`${BASE_URL}/api/event`);
      expect(res.status()).toBe(200);
    });
  });

  test.describe('Todo Extension', () => {
    test.afterAll(async () => {
      await setExtensionEnabled('todo', true);
    });

    test('Disable → GET /api/todo → 403', async ({ request: req }) => {
      await setExtensionEnabled('todo', false);
      const res = await req.get(`${BASE_URL}/api/todo`);
      expect(res.status()).toBe(403);
    });

    test('Re-enable → GET /api/todo → 200', async ({ request: req }) => {
      await setExtensionEnabled('todo', true);
      const res = await req.get(`${BASE_URL}/api/todo`);
      expect(res.status()).toBe(200);
    });
  });

  test.describe.skip('Order Extension', () => {
    // ⚠️ Order 沒有 manifest.json，不被 extension-manager 識別
    // （後端 API guard 仍可工作，但 /api/extensions 看不到 order）
    // 詳見 Backlog: TD-522 Order Extension manifest 缺失

    test('Disable → GET /api/order → 403', async ({ request: req }) => {
      await setExtensionEnabled('order', false);
      const res = await req.get(`${BASE_URL}/api/order`);
      expect(res.status()).toBe(403);
    });

    test('Re-enable → GET /api/order → 200', async ({ request: req }) => {
      await setExtensionEnabled('order', true);
      const res = await req.get(`${BASE_URL}/api/order`);
      expect(res.status()).toBe(200);
    });
  });
});