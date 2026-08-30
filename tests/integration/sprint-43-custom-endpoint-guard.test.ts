/**
 * Sprint 43 Commit B — Custom LLM Endpoint 守護
 *
 * 揭露（Plan Gate 發現）: 既有 OpenAIProvider / AnthropicProvider 已用 fetch + baseUrl
 * Commit B 不是新增 class, 而是:
 * 1. 把 baseUrl 從 optional 升級為正式 Custom URL 入口
 * 2. 加「測試連線」 utility (testEndpoint)
 * 3. 加 source-code guard
 *
 * Gate 1 TDD: 守護測試
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const PROVIDERS_PATH = 'lib/ai/providers/providers.ts';

describe('Sprint 43 Commit B — Custom URL 入口守護', () => {
  it('OpenAIProvider 應保留 baseUrl Custom URL 邏輯', () => {
    const source = readFileSync(PROVIDERS_PATH, 'utf-8');
    // OpenAIProvider 應有 baseUrl 處理邏輯
    expect(source, 'OpenAIProvider 移除 baseUrl').toMatch(/class OpenAIProvider[\s\S]*?baseUrl\s*=/m);
  });

  it('AnthropicProvider 應保留 baseUrl Custom URL 邏輯', () => {
    const source = readFileSync(PROVIDERS_PATH, 'utf-8');
    expect(source, 'AnthropicProvider 移除 baseUrl').toMatch(/class AnthropicProvider[\s\S]*?baseUrl\s*=/m);
  });

  it('ProviderConfig.baseUrl 應保留（Custom URL 入口）', () => {
    const source = readFileSync(PROVIDERS_PATH, 'utf-8');
    expect(source, 'baseUrl 欄位被移除').toMatch(/baseUrl\?:\s*string/);
  });
});

describe('Sprint 43 Commit B — 測試連線 utility 守護', () => {
  it('應有 testEndpoint 函式（測試 Custom URL 連線）', () => {
    const source = readFileSync(PROVIDERS_PATH, 'utf-8');
    expect(source, '缺 testEndpoint 函式').toMatch(/export\s+(async\s+)?function\s+testEndpoint/);
  });

  it('testEndpoint 應支援 openai-compatible（用 /models endpoint 驗證）', () => {
    const source = readFileSync(PROVIDERS_PATH, 'utf-8');
    // 應有針對 openai-compatible 的 GET /models 或 POST /chat/completions 驗證
    expect(source, 'testEndpoint 沒處理 openai-compatible').toMatch(/openai[-_]compatible/);
  });

  it('testEndpoint 應支援 anthropic-compatible', () => {
    const source = readFileSync(PROVIDERS_PATH, 'utf-8');
    expect(source, 'testEndpoint 沒處理 anthropic-compatible').toMatch(/anthropic[-_]compatible/);
  });

  it('testEndpoint 應回傳結構化結果（success/latencyMs/error）', () => {
    const source = readFileSync(PROVIDERS_PATH, 'utf-8');
    expect(source, 'testEndpoint 沒回傳結構化結果').toMatch(/type\s+\w*TestEndpointResult/);
  });

  it('testEndpoint 失敗不應暴露 API Key 明文', () => {
    const source = readFileSync(PROVIDERS_PATH, 'utf-8');
    // 確保 error message 內不內插 apiKey
    // 檢查 testEndpoint 函式本體 (不含 JSDoc 註解)
    const fnStart = source.indexOf('export async function testEndpoint');
    expect(fnStart, '找不到 testEndpoint 函式').toBeGreaterThan(-1);
    if (fnStart < 0) return;
    const fnEnd = source.indexOf('\nexport ', fnStart + 10);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : undefined);
    // 取所有 catch block 或 throw new Error 行
    const errorMatches = fnBody.match(/catch\s*\([^)]*\)\s*\{[\s\S]*?\}/g) || [];
    const throwMatches = fnBody.match(/throw\s+new\s+Error\([^)]*\)/g) || [];
    // 這些區塊不該含 ${apiKey}（Authorization header 雖含 apiKey 但不在 catch/throw）
    for (const block of [...errorMatches, ...throwMatches]) {
      expect(block, 'testEndpoint catch/throw 內插了 API Key').not.toMatch(/\$\{[^}]*apiKey[^}]*\}/);
    }
    // 額外檢查: catch block 內不該 return error message 包含 apiKey
    const catchReturnMatches = fnBody.match(/error:\s*[^,}]+/g) || [];
    for (const m of catchReturnMatches) {
      expect(m, 'testEndpoint catch return 含 apiKey').not.toMatch(/apiKey/);
    }
  });
});

describe('Sprint 43 Commit B — ProviderFactory Custom URL 支援', () => {
  it('createProvider 應能依 type 處理 baseUrl 傳遞', () => {
    const source = readFileSync(PROVIDERS_PATH, 'utf-8');
    // factory 應讀取 endpointUrl 或 baseUrl
    expect(source, 'factory 沒傳遞 baseUrl').toMatch(/baseUrl:\s*\w+\.baseUrl|baseUrl:\s*endpointUrl/);
  });

  it('應有 Commit B 標示（S43-B）', () => {
    const source = readFileSync(PROVIDERS_PATH, 'utf-8');
    expect(source, '缺 Commit B 標示').toMatch(/S43-B|Sprint 43 Commit B/);
  });
});