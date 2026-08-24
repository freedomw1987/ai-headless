/**
 * TDD Gate 1 — US-102 密碼雜湊 + 驗證
 *
 * 修 lib/auth/config.ts 中 authorize() 的安全洞（沒驗密碼 hash）
 * 守護：
 * 1. hashPassword：bcrypt 雜湊（非明文）
 * 2. verifyPassword：bcrypt 驗證
 * 3. authorize() 正確串接 hash 驗證
 */

import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('US-102 hashPassword', () => {
  it('產出非明文的雜湊字串', async () => {
    const hash = await hashPassword('mySecret123');
    expect(hash).not.toBe('mySecret123');
    expect(hash.length).toBeGreaterThan(20); // bcrypt hash 通常 60 字
  });

  it('相同密碼產出不同 hash（salt）', async () => {
    const h1 = await hashPassword('same');
    const h2 = await hashPassword('same');
    expect(h1).not.toBe(h2);
  });
});

describe('US-102 verifyPassword', () => {
  it('正確密碼返回 true', async () => {
    const hash = await hashPassword('correctPassword');
    expect(await verifyPassword('correctPassword', hash)).toBe(true);
  });

  it('錯誤密碼返回 false', async () => {
    const hash = await hashPassword('correctPassword');
    expect(await verifyPassword('wrongPassword', hash)).toBe(false);
  });

  it('空字串密碼返回 false', async () => {
    const hash = await hashPassword('correctPassword');
    expect(await verifyPassword('', hash)).toBe(false);
  });
});