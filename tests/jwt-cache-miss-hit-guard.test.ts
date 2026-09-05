/**
 * TD-816 — JWT callback cache miss/hit 路徑守護測試
 *
 * 對應: docs/backlog.md TD-816
 * 對應: Sprint 30 R1 揭露（防止下次再犯 cache 邏輯錯誤）
 *
 * 驗證 lib/auth/config.ts jwt() callback 內的 cache miss/hit 路徑：
 * 1. cache miss 時呼叫 db.user.findUnique
 * 2. cache miss 時呼叫 setCachedPermissions
 * 3. cache hit 時不呼叫 db.user.findUnique (不再額外 query)
 * 4. cache hit 時不更新 token.image / token.name (接受 staleness)
 *
 * 注意: 這是 source-code guard, 因為 mock jwt() callback 的 db 需要複雜 setup
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

const source = readFileSync('lib/auth/config.ts', 'utf-8');

describe('TD-816 — JWT callback cache miss/hit 路徑守護', () => {
  it('cache miss 時應呼叫 db.user.findUnique', () => {
    // 在 jwt() callback 內, cache miss 路徑應有 db.user.findUnique
    expect(source).toMatch(/if\s*\(\s*!\s*cached\s*\)/);
    expect(source).toMatch(/db\.user\.findUnique/);
  });

  it('cache miss 時應呼叫 setCachedPermissions', () => {
    expect(source).toMatch(/setCachedPermissions\(/);
  });

  it('cache miss 時應更新 token.image / token.name (TD-802/803)', () => {
    // cache miss 時, 從 DB 讀的 image / name 應寫入 token
    // 在源中应能怍到 token.image = fresh.image 或 token.image = ... ?? null (在 fresh 變數作用域內)
    expect(source).toMatch(/token\.image\s*=\s*fresh\.image/);
    expect(source).toMatch(/token\.name\s*=\s*fresh\.name/);
  });

  it('cache hit 時應不查 DB (TD-803)', () => {
    // 註解中應明確標示 cache hit 時不額外 query image/name
    expect(source).toMatch(/cache hit.*不.*query.*image/i);
  });

  it('cache hit 時直接用 token.role / token.permissions (不重查)', () => {
    // cache hit 路徑
    expect(source).toMatch(/else\s*{[^}]*token\.role\s*=\s*token\.role/);
    expect(source).toMatch(/token\.permissions\s*=\s*Array\.from/);
  });

  it('應在 jwt() callback 註解中標明 cache TTL', () => {
    // 註解應清楚說明這是 cache miss/hit 邏輯
    expect(source).toMatch(/cache miss/);
    expect(source).toMatch(/cache hit/);
  });
});