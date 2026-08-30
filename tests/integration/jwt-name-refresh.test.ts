/**
 * TD-802 — JWT name refresh 守護測試 (source code guard)
 *
 * 為什麼需要：
 * - Sprint 28-29 揭露 JWT session 沒帶 image 欄位的 bug
 * - 已修：JWT callback 每次都 refresh image
 * - 但 name 欄位還沒 refresh（user 改名字後 JWT 還顯示舊名字）
 *
 * Gate 1 TDD：source-code guard test（防止下次漏加 name refresh）
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const CONFIG_PATH = 'lib/auth/config.ts';
const configSource = readFileSync(CONFIG_PATH, 'utf-8');

describe('TD-802 — JWT name refresh (source-code guard)', () => {
  it('JWT callback select 包含 name 欄位', () => {
    // jwt callback 的 findUnique 必須 select name
    expect(configSource).toMatch(/db\.user\.findUnique\([\s\S]*?select:[\s\S]*?name:[\s\S]*?roleRef/);
  });

  it('JWT callback 有 set token.name', () => {
    expect(configSource).toMatch(/token\.name\s*=/);
  });

  it('JWT callback 的 cache miss 路徑有 set token.name', () => {
    // 找 cache miss 的 token.name assignment
    expect(configSource).toMatch(/if\s*\(fresh\)[\s\S]*?token\.name\s*=[\s\S]*?\}\s*\}/);
  });

  it('session callback 帶 name 到 session.user.name', () => {
    // session callback 必須有 session.user.name = token.name
    expect(configSource).toMatch(/session\.user\.name\s*=/);
  });
});