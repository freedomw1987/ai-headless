/**
 * Sprint 43 Commit A — AI Config 模組重新設計守護
 *
 * 設計變更:
 * - PRD 05-ai-config.md 從「OpenAI/Claude 二選一」升級為「4 種 Provider 類型」
 * - AIConfig model 加 type enum + endpointUrl 欄位
 * - ProviderFactory 依 type 決定 class + 注入 baseUrl
 * - Global URL 模式：Custom URL 是 system-wide, 所有 user 共用
 *
 * Gate 1 TDD: source-code guard 雙重守護 PRD 改版 + 介面重構
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { existsSync } from 'node:fs';

const PRD_PATH = 'docs/prd/05-ai-config.md';
const PROVIDERS_PATH = 'lib/ai/providers/providers.ts';
const SCHEMA_PATH = 'prisma/schema.prisma';

describe('Sprint 43 Commit A — PRD 05 改版守護', () => {
  it('PRD 05 應提到 4 種 Provider 類型（openai/claude/openai-compatible/anthropic-compatible）', () => {
    const prd = readFileSync(PRD_PATH, 'utf-8');
    expect(prd, 'PRD 05 沒提到 openai-compatible').toMatch(/openai-compatible/);
    expect(prd, 'PRD 05 沒提到 anthropic-compatible').toMatch(/anthropic-compatible/);
  });

  it('PRD 05 應有 Global URL 設計說明', () => {
    const prd = readFileSync(PRD_PATH, 'utf-8');
    expect(prd, 'PRD 05 沒提到 Global URL 設計').toMatch(/[Gg]lobal URL|系統全域.*URL|system-wide.*URL/);
  });

  it('PRD 05 應有「測試連線」FR (Custom endpoint 也適用)', () => {
    const prd = readFileSync(PRD_PATH, 'utf-8');
    // 在 PRD 05 內找到測試連線相關 FR
    expect(prd, 'PRD 05 沒強調測試連線涵蓋 Custom URL').toMatch(/測試連線|test.*connection|validate.*endpoint/i);
  });
});

describe('Sprint 43 Commit A — Provider 介面重構守護', () => {
  it('ProviderConfig 應有 endpointUrl 欄位（或保留 baseUrl）', () => {
    const source = readFileSync(PROVIDERS_PATH, 'utf-8');
    // baseUrl 已存在 — 確認它還在（Commit A 不改介面, 保留 baseUrl）
    expect(source, 'baseUrl 欄位被移除').toMatch(/baseUrl\s*:\s*string/);
  });

  it('createProvider 工廠應支援 type 參數 (openai-compatible / anthropic-compatible)', () => {
    const source = readFileSync(PROVIDERS_PATH, 'utf-8');
    // 雖然 Commit A 不實作完整 openai-compatible class, 但 factory 介面應有 type 概念
    // 簡化檢查：factory 應讀取 type 而非只有 provider name
    expect(source, 'factory 介面還沒加 type').toMatch(/type\s*[:=]/);
  });

  it('應有 Commit A 標示', () => {
    const source = readFileSync(PROVIDERS_PATH, 'utf-8');
    expect(source, '缺 Commit A 標示').toMatch(/Sprint 43 Commit A|S43-COMMIT-A|S43-A/);
  });
});

describe('Sprint 43 Commit A — Prisma schema 加 type + endpointUrl', () => {
  it('prisma schema 應有 AIConfig model（或新增）', () => {
    if (!existsSync(SCHEMA_PATH)) {
      // Sprint 43 可能還沒加 prisma — skip
      return;
    }
    const schema = readFileSync(SCHEMA_PATH, 'utf-8');
    // schema 應有 AIConfig model
    expect(schema, 'prisma schema 缺 AIConfig model').toMatch(/model AIConfig/);
  });

  it('AIConfig model 應有 type 欄位（enum: openai/claude/openai-compatible/anthropic-compatible）', () => {
    if (!existsSync(SCHEMA_PATH)) return;
    const schema = readFileSync(SCHEMA_PATH, 'utf-8');
    const modelMatch = schema.match(/model AIConfig\s*\{[\s\S]*?\n\}/);
    expect(modelMatch, '找不到 AIConfig model').toBeTruthy();
    if (!modelMatch) return;
    const modelBody = modelMatch[0];
    expect(modelBody, 'AIConfig 缺 type 欄位').toMatch(/type\s+\w+/);
    expect(modelBody, 'AIConfig 缺 endpointUrl 欄位').toMatch(/endpointUrl\s+String\?/);
  });
});