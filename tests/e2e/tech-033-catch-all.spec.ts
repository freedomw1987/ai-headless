/**
 * Sprint 14 TECH-033 E2E — Catch-all Dynamic CRUD
 *
 * 守護：http://localhost:3000/api/crud/todo 能讀取 / 404
 * 註：寫入操作需 auth，E2E 難以模擬；寫入測試在 tests/integration/tech-033-catch-all.test.ts
 */

import { test, expect } from '@playwright/test';

test.describe('Sprint 14 TECH-033 — Catch-all API (Read-Only)', () => {
  test('GET /api/crud/todo 列表', async ({ request }) => {
    const res = await request.get('/api/crud/todo');
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.items).toBeDefined();
    expect(Array.isArray(json.items)).toBe(true);
  });

  test('GET 不存在的 spec → 404', async ({ request }) => {
    const res = await request.get('/api/crud/not-exist-spec');
    expect(res.status()).toBe(404);
  });
});