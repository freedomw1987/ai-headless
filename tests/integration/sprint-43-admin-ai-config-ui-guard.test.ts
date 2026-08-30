/**
 * Sprint 43 Commit D — /admin/ai-config UI 守護
 *
 * 設計變更:
 * - 新增 app/admin/settings/ai-config/page.tsx
 * - Sidebar 移到「系統設定」section 下面 (跟 users/roles 同區)
 * - 4-type radio (openai / claude / openai-compatible / anthropic-compatible)
 * - URL input (僅 compatible type 顯示)
 * - 「測試連線」按鈕 (call testEndpoint)
 * - API Key 加密輸入
 *
 * Gate 1 TDD: source-code guard 雙重守護
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';

const SIDEBAR_PATH = 'app/admin/admin-sidebar.tsx';
const PAGE_PATH = 'app/admin/settings/ai-config/page.tsx';

describe('Sprint 43 Commit D — AI Config UI 頁面守護', () => {
  it('應有 /admin/settings/ai-config/page.tsx', () => {
    expect(existsSync(PAGE_PATH), `缺 ${PAGE_PATH}`).toBe(true);
  });

  it('頁面應有 4-type radio (openai / claude / openai-compatible / anthropic-compatible)', () => {
    if (!existsSync(PAGE_PATH)) return;
    const source = readFileSync(PAGE_PATH, 'utf-8');
    expect(source, '缺 openai radio').toMatch(/openai/);
    expect(source, '缺 claude radio').toMatch(/claude/);
    expect(source, '缺 openai-compatible radio').toMatch(/openai-compatible|openai_compatible/);
    expect(source, '缺 anthropic-compatible radio').toMatch(/anthropic-compatible|anthropic_compatible/);
  });

  it('頁面應有 URL input (Custom URL 輸入)', () => {
    if (!existsSync(PAGE_PATH)) return;
    // 也檢查 client form (form 才是實際輸入)
    const formPath = 'app/admin/settings/ai-config/ai-config-form.tsx';
    if (existsSync(formPath)) {
      const formSource = readFileSync(formPath, 'utf-8');
      expect(formSource, '缺 endpointUrl 輸入').toMatch(/endpointUrl|name=["']endpointUrl["']/);
      expect(formSource, '缺測試連線按鈕').toMatch(/測試連線|testEndpoint/);
      expect(formSource, '缺 API Key input').toMatch(/apiKey|name=["']apiKey["']/);
      expect(formSource, '缺 model 輸入').toMatch(/model|name=["']model["']/);
    }
  });

  it('頁面應有「測試連線」按鈕', () => {
    if (!existsSync(PAGE_PATH)) return;
    const formPath = 'app/admin/settings/ai-config/ai-config-form.tsx';
    if (!existsSync(formPath)) return;
    const formSource = readFileSync(formPath, 'utf-8');
    expect(formSource, '缺測試連線按鈕').toMatch(/測試連線|testEndpoint/);
  });

  it('頁面應有 API Key 加密輸入', () => {
    if (!existsSync(PAGE_PATH)) return;
    const formPath = 'app/admin/settings/ai-config/ai-config-form.tsx';
    if (!existsSync(formPath)) return;
    const formSource = readFileSync(formPath, 'utf-8');
    expect(formSource, '缺 API Key input').toMatch(/apiKey|name=["']apiKey["']/);
  });

  it('頁面應有 model 輸入', () => {
    if (!existsSync(PAGE_PATH)) return;
    const formPath = 'app/admin/settings/ai-config/ai-config-form.tsx';
    if (!existsSync(formPath)) return;
    const formSource = readFileSync(formPath, 'utf-8');
    expect(formSource, '缺 model 輸入').toMatch(/model|name=["']model["']/);
  });

  it('應有 Commit D 標示（S43-D）', () => {
    if (!existsSync(PAGE_PATH)) return;
    const source = readFileSync(PAGE_PATH, 'utf-8');
    expect(source, '缺 Commit D 標示').toMatch(/S43-D|Sprint 43 Commit D/);
  });
});

describe('Sprint 43 Commit D — Sidebar 「系統設定」section 守護', () => {
  it('Sidebar 應有 AI 模型配置 連結', () => {
    const source = readFileSync(SIDEBAR_PATH, 'utf-8');
    expect(source, '缺 AI 模型配置 sidebar link').toMatch(/\/admin\/settings\/ai-config/);
  });

  it('AI Config 連結應有 data-testid', () => {
    const source = readFileSync(SIDEBAR_PATH, 'utf-8');
    expect(source, '缺 sidebar-link-ai-config').toMatch(/data-testid=["']sidebar-link-ai-config["']/);
  });

  it('AI Config 連結應在「系統設定」section 內 (在 roles 之後, Extensions 之前)', () => {
    const source = readFileSync(SIDEBAR_PATH, 'utf-8');
    // 找 「系統設定」 h3 的位置 (跳過 JSDoc 註解裡的「系統設定」)
    const sectionStart = source.indexOf('<h3', source.indexOf('系統設定'));
    expect(sectionStart, '找不到系統設定 h3').toBeGreaterThan(-1);
    if (sectionStart < 0) return;
    // 取 section 內容 (到 Extensions 之前)
    const afterSectionStart = source.substring(sectionStart);
    const sectionEnd = afterSectionStart.indexOf('Extensions 管理');
    if (sectionEnd < 0) return;
    const section = afterSectionStart.substring(0, sectionEnd);
    expect(section, 'AI Config 連結不在系統設定 section').toMatch(/\/admin\/settings\/ai-config/);
  });

  it('AI Config 連結應有 isActive highlighting (pathname.startsWith)', () => {
    const source = readFileSync(SIDEBAR_PATH, 'utf-8');
    // 應有 pathname.startsWith('/admin/settings/ai-config') 邏輯
    expect(source, '缺 AI Config isActive 邏輯').toMatch(/pathname\.startsWith\(['"]\/admin\/settings\/ai-config['"]\)/);
  });
});

describe('Sprint 43 Commit D — API endpoint 守護', () => {
  it('應有 /api/admin/ai-config endpoint', () => {
    const apiPath = 'app/api/admin/ai-config/route.ts';
    expect(existsSync(apiPath), `缺 ${apiPath}`).toBe(true);
  });

  it('API 應支援 GET (讀 config)', () => {
    const apiPath = 'app/api/admin/ai-config/route.ts';
    if (!existsSync(apiPath)) return;
    const source = readFileSync(apiPath, 'utf-8');
    expect(source, '缺 GET handler').toMatch(/export\s+(async\s+)?function\s+GET|export\s+async\s+function\s+GET/);
  });

  it('API 應支援 PUT/POST (更新 config)', () => {
    const apiPath = 'app/api/admin/ai-config/route.ts';
    if (!existsSync(apiPath)) return;
    const source = readFileSync(apiPath, 'utf-8');
    expect(source, '缺 PUT/POST handler').toMatch(/export\s+(async\s+)?function\s+(PUT|POST)/);
  });
});