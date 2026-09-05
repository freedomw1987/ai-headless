/**
 * Sprint 55 Productization — Landing Page 內容守護測試
 *
 * 對應: docs/sprint55-plan-gate.md Phase 2
 * 對應: 上一個老 page.tsx 只有「進入後台」按鈕 (產品化前不可用)
 *
 * 防止下次重構又把 Landing Page 弄成只有 1 個按鈕
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';

const pageSource = readFileSync('app/page.tsx', 'utf-8');

describe('Sprint 55 Productization — Landing Page', () => {
  it('app/page.tsx 應存在', () => {
    expect(existsSync('app/page.tsx')).toBe(true);
  });

  it('應含 Hero 區塊 + AI Headless 標題', () => {
    expect(pageSource, '應有 AI Headless 標題').toMatch(/AI Headless/);
    expect(pageSource, '應有 Hero section').toMatch(/Hero|hero|<section/);
  });

  it('應有「自然語言生成 CRUD」價值主張', () => {
    expect(pageSource, '應有 30 秒').toMatch(/30 秒/);
    expect(pageSource, '應有自然語言').toMatch(/自然語言/);
    expect(pageSource, '應有 CRUD').toMatch(/CRUD/);
  });

  it('應含 /extension 命令 demo', () => {
    expect(pageSource, '應有 /extension create').toMatch(/\/extension create/);
    expect(pageSource, '應有 --fields=').toMatch(/--fields=/);
  });

  it('應含 6+ 個 features (AI Pipeline / Schema / Demo / Extension / Auth / Workflow)', () => {
    expect(pageSource, '應有 AI Pipeline').toMatch(/AI Pipeline/);
    expect(pageSource, '應有 Schema-Driven').toMatch(/Schema-Driven|Schema Driven/);
    expect(pageSource, '應有 30 秒 Demo').toMatch(/30 秒 Demo/);
    expect(pageSource, '應有 Extension 機制').toMatch(/Extension 機制/);
    expect(pageSource, '應有 Auth.js').toMatch(/Auth\.js/);
    expect(pageSource, '應有 Workflow').toMatch(/Workflow/);
  });

  it('應有 4 個內建 extensions showcase (todo/blog/event/order)', () => {
    expect(pageSource, '應有 todo').toMatch(/todo/);
    expect(pageSource, '應有 blog').toMatch(/blog/);
    expect(pageSource, '應有 event').toMatch(/event/);
    expect(pageSource, '應有 order').toMatch(/order/);
  });

  it('應有 MIT License 標註', () => {
    expect(pageSource, '應有 MIT License').toMatch(/MIT License/);
  });

  it('應有 GitHub link', () => {
    expect(pageSource, '應有 GitHub link').toMatch(/github\.com/);
  });

  it('應有 Footer', () => {
    expect(pageSource, '應有 Footer').toMatch(/<footer/);
  });

  it('應有最終 CTA (開始 Demo)', () => {
    expect(pageSource, '應有 30 秒試試看').toMatch(/30 秒試試看|開始 Demo/);
  });

  it('應使用 shadcn Card + Badge 元件', () => {
    expect(pageSource, '應 import Card').toMatch(/from\s+['"`]@\/components\/ui\/card['"`]/);
    expect(pageSource, '應 import Badge').toMatch(/from\s+['"`]@\/components\/ui\/badge['"`]/);
  });

  it('應使用 lucide-react icons (8 個)', () => {
    expect(pageSource, '應 import lucide icons').toMatch(/from\s+['"`]lucide-react['"`]/);
    // 至少 8 個 icons
    const iconMatches = pageSource.match(/<[A-Z][a-zA-Z]+\s+className=/g) ?? [];
    expect(iconMatches.length).toBeGreaterThanOrEqual(8);
  });
});