/**
 * Sprint 55 Productization — LICENSE 守護測試
 *
 * 對應: docs/sprint55-plan-gate.md Phase 2 (P0-1)
 * 對應: README.md 標註 MIT 但無 LICENSE 檔 (產品化前不可用)
 *
 * 防止下次清理又把 LICENSE 檔弄掉
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';

describe('Sprint 55 Productization — LICENSE', () => {
  it('LICENSE 檔應存在於專案根', () => {
    expect(existsSync('LICENSE'), 'LICENSE 檔不存在').toBe(true);
  });

  it('LICENSE 應為 MIT (最多人用, 商業友好)', () => {
    const license = readFileSync('LICENSE', 'utf-8');
    expect(license, '應有 MIT License 標頭').toMatch(/MIT License/);
    expect(license, '應有 Permission is hereby granted').toMatch(/Permission is hereby granted/);
  });

  it('LICENSE 應有 copyright 年份', () => {
    const license = readFileSync('LICENSE', 'utf-8');
    expect(license, '應有 copyright').toMatch(/Copyright\s+\(c\)\s+\d{4}/);
  });

  it('README 應連結 LICENSE', () => {
    const readme = readFileSync('README.md', 'utf-8');
    expect(readme, 'README 應提及 MIT License').toMatch(/MIT/);
  });
});