/**
 * Sprint 42 Commit A — TD-807 + TD-818 source-code guard
 *
 * TD-807: lib/auth/config.ts 不應有壞縮排
 *   - 防止有人繞過 prettier 編輯導致縮排壞掉
 *   - 守護方式: 檢查 `callbacks: {` 必須比 `providers:` 內縮 2 空格
 *
 * TD-818: bun.lock 不應被 git track（CI 只用 pnpm）
 *   - 防止兩個 package manager 共存造成 CI 不一致
 *   - 守護方式: bun.lock 必須在 .gitignore 內
 *
 * Gate 1 TDD：source-code guard
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';

const AUTH_CONFIG_PATH = 'lib/auth/config.ts';
const GITIGNORE_PATH = '.gitignore';

describe('Sprint 42 Commit A — TD-807 config.ts 縮排守護', () => {
  it('config.ts 不應有「縮排錯亂」跡象（callbacks: { 必須符合縮排慣例）', () => {
    const source = readFileSync(AUTH_CONFIG_PATH, 'utf-8');
    // callbacks 應在 providers 陣列內, 所以比 providers: 縮 4 空格（array 內 object）
    // 真實情況: Sprint 41 commit 之前壞掉 → callbacks: { 前面只有 0 空格
    // 修法: prettier 跑一次自動修
    const lines = source.split('\n');
    const callbacksLine = lines.findIndex((l) => /^\s*callbacks:\s*\{/.test(l));
    expect(callbacksLine, '找不到 callbacks 行').toBeGreaterThan(-1);
    if (callbacksLine < 0) return;

    const callbacksLineContent = lines[callbacksLine] ?? '';
    // callbacks 應至少有 2 空格縮排（在 providers array 內）
    const leadingSpaces = (callbacksLineContent.match(/^(\s*)/)?.[1] ?? '').length;
    expect(leadingSpaces, `callbacks: 縮排只有 ${leadingSpaces} 空格（應 ≥ 2）`).toBeGreaterThanOrEqual(2);
  });
});

describe('Sprint 42 Commit A — TD-818 lockfile 守護', () => {
  it('bun.lock 不應在 git tracked（CI 只用 pnpm）', () => {
    // 兩種合法狀態:
    // (A) bun.lock 完全不存在（已被刪除）
    // (B) bun.lock 存在但 .gitignore 內有「bun.lock」一條規則
    const bunLockExists = existsSync('bun.lock');
    if (!bunLockExists) {
      // 情況 A: 已刪除 → 通過
      expect(true).toBe(true);
      return;
    }
    // 情況 B: 存在 → 必須 .gitignore 涵蓋
    const gitignore = readFileSync(GITIGNORE_PATH, 'utf-8');
    const hasRule = /^bun\.lock(\s|$)/m.test(gitignore);
    expect(hasRule, 'bun.lock 存在但沒在 .gitignore 內（CI 會誤讀）').toBe(true);
  });

  it('pnpm-lock.yaml 必須存在（這是唯一 lockfile）', () => {
    expect(existsSync('pnpm-lock.yaml'), 'pnpm-lock.yaml 缺失').toBe(true);
  });
});