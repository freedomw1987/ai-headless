/**
 * Sprint 44 Commit B — §4.1 AI_ENCRYPTION_KEY 部署檢查守護
 *
 * 問題揭露 (Sprint 43 reflection §4.1):
 * - AI_ENCRYPTION_KEY 是 AIConfig AES-256-GCM 加密必需要的環境變數
 * - Commit E 已有 throw 但檢查不夠嚴格:
 *   - 只檢查 length !== 64 (沒驗證 hex chars)
 *   - 沒警告 production 必須設定
 *   - 錯誤訊息沒 link 到 docs
 *
 * 修法:
 * 1. getEncryptionKey() 加 hex chars 驗證 (不只長度)
 * 2. 錯誤訊息加 production 警告 + link
 * 3. .env.example 加 ⚠️ 警告 + 部署 checklist
 * 4. README 加 production deploy checklist
 *
 * 注意:
 * - 此 guard 是 pattern + filesystem check
 * - 真實 encryption runtime 行為交給既有 providers.test.ts
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';

describe('S44-B — §4.1 AI_ENCRYPTION_KEY 部署檢查守護', () => {
  it('providers.ts 應有嚴格的 hex chars 驗證 (不只長度檢查)', () => {
    const source = readFileSync('lib/ai/providers/providers.ts', 'utf-8');
    // 應有 /^[0-9a-fA-F]+$/.test(hex) 或 Buffer.from(hex, 'hex').length === 32 檢查
    const hasHexCheck =
      /\[\s*0-9a-fA-F\s*\]/.test(source) ||
      /hex\s*\.\s*match\s*\(\s*\/\s*\^/i.test(source) ||
      /Buffer\.from\([^,]+,\s*['"]hex['"]\)\.toString\(['"]hex['"]\)/i.test(source);

    expect(
      hasHexCheck,
      'providers.ts getEncryptionKey() 應有 hex chars 驗證 (不只是 length === 64)'
    ).toBe(true);
  });

  it('providers.ts 錯誤訊息應警告 production 環境必須設定', () => {
    const source = readFileSync('lib/ai/providers/providers.ts', 'utf-8');
    // 應有 'production' / '部署' / 'deploy' 等關鍵字
    const hasProdWarning = /production|部署|deploy/i.test(source);
    expect(
      hasProdWarning,
      'AI_ENCRYPTION_KEY 錯誤訊息應警告 production 環境必須設定'
    ).toBe(true);
  });

  it('.env.example 應有 AI_ENCRYPTION_KEY 說明 + ⚠️ 警告', () => {
    if (!existsSync('.env.example')) {
      expect.fail('.env.example 不存在');
      return;
    }
    const envExample = readFileSync('.env.example', 'utf-8');
    expect(envExample, '.env.example 缺 AI_ENCRYPTION_KEY').toContain('AI_ENCRYPTION_KEY');
    // 應有警告 / Warning / 必填 / Required 提示
    const hasWarning = /⚠️|WARNING|必填|required/i.test(envExample);
    expect(hasWarning, '.env.example AI_ENCRYPTION_KEY 應有 ⚠️ 警告').toBe(true);
  });

  it('.env.example 應提供生成 AI_ENCRYPTION_KEY 指令', () => {
    const envExample = readFileSync('.env.example', 'utf-8');
    // 應有 node -e + crypto + randomBytes
    const hasGenerateCmd = /node\s+-e.*randomBytes/i.test(envExample);
    expect(hasGenerateCmd, '.env.example 應提供 AI_ENCRYPTION_KEY 生成指令').toBe(true);
  });

  it('README.md 應有 production deploy checklist', () => {
    // 找 README (可能多個)
    const fs = require('fs');
    const candidates = ['README.md', 'docs/README.md', 'docs/deployment.md'];
    let found = false;
    for (const path of candidates) {
      if (!existsSync(path)) continue;
      const content = readFileSync(path, 'utf-8');
      // 應有 AI_ENCRYPTION_KEY + 'production' / 'deploy' / 'checklist'
      if (content.includes('AI_ENCRYPTION_KEY')) {
        const hasChecklist = /production|部署|deploy|checklist/i.test(content);
        if (hasChecklist) {
          found = true;
          break;
        }
      }
    }
    expect(found, 'README/部署文件應提及 AI_ENCRYPTION_KEY + production checklist').toBe(true);
  });

  it('providers.ts 應在 error message 包含 64 hex 規範', () => {
    const source = readFileSync('lib/ai/providers/providers.ts', 'utf-8');
    // 應有 '64 hex' 或 '64 字元' 等規範提示
    const hasSpec = /64\s*(hex|chars|字元|字符)/i.test(source);
    expect(hasSpec, 'providers.ts error 應說明 64 hex 規範').toBe(true);
  });
});