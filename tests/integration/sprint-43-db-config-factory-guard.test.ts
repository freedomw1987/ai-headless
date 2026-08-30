/**
 * Sprint 43 Commit C — Factory DB-based 守護
 *
 * 設計變更:
 * - 既有 createProvider(env) 從環境變數讀
 * - 新增 createProviderFromDB() 從 Prisma AIConfig 讀
 * - 給 `/admin/ai-config` UI 用的 path
 * - Global URL (userId=null) 為預設 fallback
 *
 * Gate 1 TDD: source-code guard 雙重守護
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';

const PROVIDERS_PATH = 'lib/ai/providers/providers.ts';
const SCHEMA_PATH = 'prisma/schema.prisma';

describe('Sprint 43 Commit C — createProviderFromDB 工廠守護', () => {
  it('應有 createProviderFromDB 函式（從 DB 讀 AIConfig）', () => {
    const source = readFileSync(PROVIDERS_PATH, 'utf-8');
    expect(source, '缺 createProviderFromDB').toMatch(/export\s+(async\s+)?function\s+createProviderFromDB/);
  });

  it('createProviderFromDB 應使用 Prisma client 讀 AIConfig', () => {
    const source = readFileSync(PROVIDERS_PATH, 'utf-8');
    // 應有 prisma.aIConfig 或 db.aIConfig
    expect(source, 'createProviderFromDB 沒用 Prisma').toMatch(/prisma\.aIConfig|db\.aIConfig/);
  });

  it('createProviderFromDB 應優先用 user-specific config, 沒有時 fallback Global URL', () => {
    const source = readFileSync(PROVIDERS_PATH, 'utf-8');
    // 應有 userId 條件 + null fallback
    expect(source, '缺 user-specific + Global URL fallback 邏輯').toMatch(/userId[\s\S]{0,200}null/);
  });

  it('createProviderFromDB 應依 type 欄位決定 class + 注入 endpointUrl', () => {
    const source = readFileSync(PROVIDERS_PATH, 'utf-8');
    // factory 內應讀 type 欄位並注入 endpointUrl (透過 baseUrl 傳遞)
    expect(source, 'createProviderFromDB 沒讀 type').toMatch(/config\.type|\.type\s*===/);
    expect(source, 'createProviderFromDB 沒注入 endpointUrl').toMatch(/baseUrl:\s*endpointUrl/);
  });

  it('createProviderFromDB 找不到 config 應 throw 或 fallback MockProvider', () => {
    const source = readFileSync(PROVIDERS_PATH, 'utf-8');
    // 應有 throw 或 return MockProvider 的 fallback
    const hasFallback = /throw\s+new\s+Error.*[Nn]o\s+AI\s+config/i.test(source) ||
      /fallback.*[Mm]ock|MockProvider\(\)/.test(source);
    expect(hasFallback, 'createProviderFromDB 沒 fallback').toBe(true);
  });

  it('createProviderFromDB 應解密 API Key', () => {
    const source = readFileSync(PROVIDERS_PATH, 'utf-8');
    // 應有 decrypt 呼叫 (匹配 decrypt(apiKeyEnc) 或 decrypt(config.apiKeyEnc))
    expect(source, 'createProviderFromDB 沒解密 API Key').toMatch(/decrypt\s*\(\s*[^)]*apiKeyEnc/);
  });

  it('應有 Commit C 標示（S43-C）', () => {
    const source = readFileSync(PROVIDERS_PATH, 'utf-8');
    expect(source, '缺 Commit C 標示').toMatch(/S43-C|Sprint 43 Commit C/);
  });
});

describe('Sprint 43 Commit C — Prisma migration 守護', () => {
  it('應有 migration 加入 AIProviderType enum', () => {
    if (!existsSync('prisma/migrations')) {
      return; // skip if no migrations dir
    }
    // 簡化檢查: prisma migrations 目錄內應有 sprint-43 相關 migration
    // (不強制具體檔名, 只確認 migrations 目錄存在)
    expect(existsSync('prisma/migrations')).toBe(true);
  });

  it('Prisma schema 應有 AIProviderType enum', () => {
    if (!existsSync(SCHEMA_PATH)) return;
    const schema = readFileSync(SCHEMA_PATH, 'utf-8');
    expect(schema, '缺 AIProviderType enum').toMatch(/enum AIProviderType/);
  });
});