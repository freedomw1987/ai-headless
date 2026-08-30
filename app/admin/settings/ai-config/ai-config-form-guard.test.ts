/**
 * Bug Fix — AI Config Form 沒讀 DB 初始值，UI 永遠預設 openai
 *
 * 問題:
 * - 使用者選 "Anthropic Custom URL", 儲存成功
 * - 重新整理頁面或離開再回來, radio 變回 "OpenAI" (預設值)
 * - 看起來像「儲存後變成 OpenAI」, 實際是 UI 沒載入 DB config
 *
 * 對應 PRD: docs/prd/05-ai-config.md §Sprint 43
 *
 * 修復:
 * - page.tsx 改為 server component, 從 DB 讀 config
 * - 將 initialConfig 傳給 AIConfigForm 作為初始 state
 * - AIConfigForm 接受 initialConfig prop
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

describe('AI Config Form 初始化 Bug Fix', () => {
  describe('A. page.tsx 應載入 DB config', () => {
    it('page.tsx 應 import db (server-side DB 讀取)', () => {
      const source = readFileSync(
        'app/admin/settings/ai-config/page.tsx',
        'utf-8',
      );
      expect(source, '應 import db').toMatch(/from\s+['"]@?\/lib\/db['"]/);
    });

    it('page.tsx 應呼叫 db.aIConfig.findFirst', () => {
      const source = readFileSync(
        'app/admin/settings/ai-config/page.tsx',
        'utf-8',
      );
      expect(source, '應呼叫 db.aIConfig.findFirst').toMatch(
        /db\.aIConfig\.findFirst/,
      );
    });

    it('page.tsx 應讀取 userId=null (Global URL)', () => {
      const source = readFileSync(
        'app/admin/settings/ai-config/page.tsx',
        'utf-8',
      );
      expect(source, '應查 userId: null').toMatch(/userId:\s*null/);
    });

    it('page.tsx 應將 config 傳給 AIConfigForm', () => {
      const source = readFileSync(
        'app/admin/settings/ai-config/page.tsx',
        'utf-8',
      );
      expect(source, '應傳 initialConfig prop').toMatch(/initialConfig/);
    });
  });

  describe('B. AIConfigForm 應接受 initialConfig prop', () => {
    it('AIConfigForm 應定義 initialConfig type', () => {
      const source = readFileSync(
        'app/admin/settings/ai-config/ai-config-form.tsx',
        'utf-8',
      );
      expect(source, '應有 initialConfig 介面').toMatch(/initialConfig/);
    });

    it('AIConfigForm 應使用 initialConfig 初始化 type state', () => {
      const source = readFileSync(
        'app/admin/settings/ai-config/ai-config-form.tsx',
        'utf-8',
      );
      // useState 的 type 應來自 initialConfig, 不是寫死 'openai'
      // 檢查 useState<AIProviderType> 後面的 initializer 應參考 initialConfig
      const stateInitPattern = /useState<AIProviderType>\([^)]+\)/;
      const matches = source.match(stateInitPattern);
      expect(matches, '應有 useState<AIProviderType>').toBeTruthy();
      // 不應寫死 'openai'
      expect(
        matches?.[0],
        '不應寫死預設值, 應從 initialConfig 讀取',
      ).not.toContain("'openai'");
    });

    it('AIConfigForm 應使用 initialConfig 初始化 endpointUrl state', () => {
      const source = readFileSync(
        'app/admin/settings/ai-config/ai-config-form.tsx',
        'utf-8',
      );
      // endpointUrl useState 應參考 initialConfig
      const endpointPattern = /useState\(initialConfig\?\.endpointUrl/;
      expect(
        source,
        'endpointUrl useState 應從 initialConfig 讀取',
      ).toMatch(endpointPattern);
    });

    it('AIConfigForm 應使用 initialConfig 初始化 model state', () => {
      const source = readFileSync(
        'app/admin/settings/ai-config/ai-config-form.tsx',
        'utf-8',
      );
      // model useState 應參考 initialConfig.model
      expect(
        source,
        'model useState 應從 initialConfig 讀取',
      ).toMatch(/useState\(initialConfig\?\.model|useState\(initialConfig\.model/);
    });
  });

  describe('C. Type 格式轉換守護', () => {
    it('AIConfigForm 應將 anthropic_compatible (DB) 轉成 anthropic-compatible (UI)', () => {
      const source = readFileSync(
        'app/admin/settings/ai-config/ai-config-form.tsx',
        'utf-8',
      );
      // 應有 type 轉換邏輯: anthropic_compatible → anthropic-compatible
      // 簡單檢查: 應有 normalize function 或 regex 處理 underscore → dash
      expect(
        source,
        '應有 underscore → dash 轉換',
      ).toMatch(/replace|normalize/);
    });
  });
});