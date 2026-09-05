/**
 * Sprint 55 Productization — 結構化 Logger 採用度守護測試
 *
 * 對應 docs/sprint55-plan-gate.md Phase 2 (P1-1)
 *
 * 防止下次重構又把 console.log 散落全專案
 * 結構化 logger 已建立 (lib/log.ts), 應逐步採用
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';

describe('Sprint 55 Productization — Structured Logger', () => {
  it('lib/log.ts 應存在', () => {
    expect(existsSync('lib/log.ts')).toBe(true);
  });

  it('lib/log.ts 應 export logger object (4 個 level)', () => {
    const source = readFileSync('lib/log.ts', 'utf-8');
    expect(source, '應有 debug').toMatch(/debug:/);
    expect(source, '應有 info').toMatch(/info:/);
    expect(source, '應有 warn').toMatch(/warn:/);
    expect(source, '應有 error').toMatch(/error:/);
  });

  it('應有 createChildLogger function', () => {
    const source = readFileSync('lib/log.ts', 'utf-8');
    expect(source, '應 export createChildLogger').toMatch(/export\s+function\s+createChildLogger/);
  });

  it('Production 模式應輸出 JSON line 到 stdout/stderr', () => {
    const source = readFileSync('lib/log.ts', 'utf-8');
    expect(source, '應有 process.stdout 或 stderr').toMatch(/process\.(stdout|stderr)/);
    expect(source, '應有 stream.write 或 process.stdout.write').toMatch(/\.write\(/);
    expect(source, '應有 JSON.stringify').toMatch(/JSON\.stringify/);
  });

  it('應有 LOG_LEVEL 控制 (debug/info/warn/error)', () => {
    const source = readFileSync('lib/log.ts', 'utf-8');
    expect(source, '應有 LOG_LEVEL').toMatch(/LOG_LEVEL/);
    expect(source, '應有 priority').toMatch(/priority|PRIORITY/i);
  });

  it('應有 timestamp ISO 格式', () => {
    const source = readFileSync('lib/log.ts', 'utf-8');
    expect(source, '應有 toISOString').toMatch(/toISOString/);
  });

  describe('關鍵 API routes 應採用 logger', () => {
    const sessionDeletePath = 'app/api/admin/chat/sessions/[id]/route.ts';
    if (existsSync(sessionDeletePath)) {
      const source = readFileSync(sessionDeletePath, 'utf-8');
      it('chat sessions DELETE 應 import logger', () => {
        expect(source, '應 import createChildLogger').toMatch(/createChildLogger/);
      });
      it('chat sessions DELETE 不應有散落 console.error (除 ESLint disable)', () => {
        // 期待只剩 import / 沒有 raw console
        const consoleMatches = source.match(/console\.(log|error|warn|info)\(/g) ?? [];
        // 允許 ≤ 0 個 console (應該都已改為 logger)
        expect(consoleMatches.length, '應沒有 console.X').toBe(0);
      });
    }
  });

  it('不應引入新依賴 (pino / winston)', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf-8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const all = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(all.pino, '不應新增 pino').toBeUndefined();
    expect(all.winston, '不應新增 winston').toBeUndefined();
    expect(all.bunyan, '不應新增 bunyan').toBeUndefined();
  });
});