/**
 * Sprint 41-1 — TD-803 + TD-804 source-code guard
 *
 * 守護這兩個 P1 bug 不會回歸:
 * - TD-803: JWT callback 不可每次都 query DB (抵銷 Sprint 23 cache)
 * - TD-804: filters parse 失敗不可 silent swallow (應有 log)
 *
 * Gate 1 TDD：source-code guard
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const AUTH_PATH = 'lib/auth/config.ts';
const HANDLER_PATH = 'lib/runtime/dynamic-handler.ts';

describe('Sprint 41-1 — TD-803 JWT cache 不被抵銷', () => {
  it('config.ts 不應在 cache hit 路徑單獨 query image/name', () => {
    const source = readFileSync(AUTH_PATH, 'utf-8');
    // 找出 jwt callback 函式
    const jwtFn = source.match(/async jwt\(\{ token, user \}\)\s*\{([\s\S]*?)return token;\s*\}/);
    expect(jwtFn, '找不到 jwt callback').toBeTruthy();
    if (!jwtFn || !jwtFn[1]) return;

    // 在 jwt callback 內應不包含 db.user.findUnique 在 else (cache hit) 分支
    const elseMatch = jwtFn[1].match(/else\s*\{([\s\S]*?)\}/);
    expect(elseMatch, '找不到 cache hit else 分支').toBeTruthy();
    if (!elseMatch) return;

    const cacheHitBody = elseMatch[1] ?? '';
    // cache hit 路徑不應有 db.user.findUnique (那是 cache miss 才該做的)
    expect(cacheHitBody).not.toMatch(/db\.user\.findUnique/);
  });

  it('config.ts 應有註解標示 TD-803 守護', () => {
    const source = readFileSync(AUTH_PATH, 'utf-8');
    expect(source).toMatch(/TD-803/);
  });
});

describe('Sprint 41-1 — TD-804 filters parse 不可 silent swallow', () => {
  it('dynamic-handler.ts 的 filters parse catch 不可為空 (必須有 log)', () => {
    const source = readFileSync(HANDLER_PATH, 'utf-8');
    // 從 rawFiltersForWhere 往下找最近的 catch 區塊
    const idx = source.indexOf('rawFiltersForWhere');
    expect(idx, '找不到 rawFiltersForWhere').toBeGreaterThan(-1);
    if (idx < 0) return;
    // 從該位置往下找 2000 字元內的 catch
    const slice = source.substring(idx ?? 0, (idx ?? 0) + 2500);
    const catchMatch = slice.match(/catch\s*\(\s*\w+\s*\)\s*\{([\s\S]*?)\}\s*\n\s*\}/);
    expect(catchMatch, '找不到 catch 區塊').toBeTruthy();
    if (!catchMatch) return;
    const catchBody = catchMatch[1] ?? '';
    // 至少要有 console.warn 或 throw
    const hasLog = /console\.warn|console\.error|throw\s/.test(catchBody);
    expect(hasLog, 'filters parse catch 必須有 log 或 throw').toBe(true);
  });

  it('dynamic-handler.ts 應有註解標示 TD-804', () => {
    const source = readFileSync(HANDLER_PATH, 'utf-8');
    expect(source).toMatch(/TD-804/);
  });
});