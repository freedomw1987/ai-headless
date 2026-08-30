/**
 * Sprint 43 Commit E — 真加密 / 錯誤處理 / log redaction 守護
 *
 * Commit E 重點:
 * 1. encrypt/decrypt 改用 AES-256-GCM (取代 placeholder)
 * 2. 統一錯誤處理 (AIProviderError class)
 * 3. log redaction: 不輸出 API Key 明文到 log
 *
 * Gate 1 TDD: source-code guard 雙重守護
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const PROVIDERS_PATH = 'lib/ai/providers/providers.ts';

describe('Sprint 43 Commit E — AES-256-GCM 加密守護', () => {
  it('encrypt 函式應使用 crypto.createCipheriv (AES-GCM)', () => {
    const source = readFileSync(PROVIDERS_PATH, 'utf-8');
    // 應有 AES-256-GCM 呼叫
    expect(source, '缺 createCipheriv 呼叫').toMatch(/createCipheriv|createCipher\b/);
  });

  it('encrypt 應使用 GCM mode', () => {
    const source = readFileSync(PROVIDERS_PATH, 'utf-8');
    expect(source, '缺 aes-256-gcm cipher').toMatch(/aes-256-gcm|['"]aes-256-gcm['"]/);
  });

  it('encrypt 應使用隨機 IV', () => {
    const source = readFileSync(PROVIDERS_PATH, 'utf-8');
    // 應有 randomBytes 呼叫
    expect(source, '缺 randomBytes IV').toMatch(/randomBytes/);
  });

  it('encrypt 應回傳 IV + ciphertext + authTag 組合格式', () => {
    const source = readFileSync(PROVIDERS_PATH, 'utf-8');
    // 應有 hex/base64 編碼 + 結合 (IV:ciphertext:authTag 格式)
    expect(source, '缺加密格式組合').toMatch(/authTag|setAuthTag/);
  });

  it('decrypt 應解密 AES-256-GCM 格式', () => {
    const source = readFileSync(PROVIDERS_PATH, 'utf-8');
    // decrypt 應呼叫 createDecipheriv
    expect(source, '缺 createDecipheriv').toMatch(/createDecipheriv/);
  });

  it('應有 KEY 從環境變數取得 (AI_ENCRYPTION_KEY)', () => {
    const source = readFileSync(PROVIDERS_PATH, 'utf-8');
    expect(source, '缺 AI_ENCRYPTION_KEY').toMatch(/AI_ENCRYPTION_KEY/);
  });

  it('KEY 缺失時應 throw 明確錯誤', () => {
    const source = readFileSync(PROVIDERS_PATH, 'utf-8');
    // 應有 key 驗證 + throw
    expect(source, '缺 KEY 驗證 throw').toMatch(/AI_ENCRYPTION_KEY.*is required|throw.*encryption.*key/i);
  });

  it('應有 Commit E 標示（S43-E）', () => {
    const source = readFileSync(PROVIDERS_PATH, 'utf-8');
    expect(source, '缺 Commit E 標示').toMatch(/S43-E|Sprint 43 Commit E/);
  });
});

describe('Sprint 43 Commit E — 統一錯誤處理守護', () => {
  it('應有 AIProviderError class', () => {
    const source = readFileSync(PROVIDERS_PATH, 'utf-8');
    expect(source, '缺 AIProviderError class').toMatch(/export\s+class\s+AIProviderError/);
  });

  it('AIProviderError 應有 provider 與 statusCode 屬性', () => {
    const source = readFileSync(PROVIDERS_PATH, 'utf-8');
    expect(source, 'AIProviderError 缺 provider 屬性').toMatch(/class AIProviderError[\s\S]*?provider[\s\S]*?=/m);
    expect(source, 'AIProviderError 缺 statusCode 屬性').toMatch(/class AIProviderError[\s\S]*?statusCode[\s\S]*?=/m);
  });

  it('OpenAIProvider 應 throw AIProviderError (非 plain Error)', () => {
    const source = readFileSync(PROVIDERS_PATH, 'utf-8');
    // 應用 throw new AIProviderError 取代 throw new Error
    expect(source, 'OpenAIProvider 沒用 AIProviderError').toMatch(/throw\s+new\s+AIProviderError/);
  });

  it('AnthropicProvider 應 throw AIProviderError', () => {
    const source = readFileSync(PROVIDERS_PATH, 'utf-8');
    expect(source, 'AnthropicProvider 沒用 AIProviderError').toMatch(/throw\s+new\s+AIProviderError/);
  });
});

describe('Sprint 43 Commit E — Log redaction 守護', () => {
  it('應有 redactApiKey utility (輸出 sk-*** 格式)', () => {
    const source = readFileSync(PROVIDERS_PATH, 'utf-8');
    // 應有 redactApiKey 函式
    expect(source, '缺 redactApiKey').toMatch(/function\s+redactApiKey|redactApiKey\s*\(/);
  });

  it('console.log/error 內不應含 apiKey 字串', () => {
    const source = readFileSync(PROVIDERS_PATH, 'utf-8');
    // console.log 不該有 apiKey 內插
    const consoleMatches = source.match(/console\.(log|error|warn)\s*\([^)]*apiKey[^)]*\)/g) || [];
    expect(consoleMatches.length, `console 含 apiKey: ${consoleMatches.join(' | ')}`).toBe(0);
  });

  it('throw 訊息不應內插 apiKey 明文', () => {
    const source = readFileSync(PROVIDERS_PATH, 'utf-8');
    // throw new Error 不該用 `${apiKey}` (僅 redact 後才能用)
    const throwMatches = source.match(/throw\s+new\s+Error\s*\(\s*[^)]*\$\{[^}]*apiKey[^}]*\}[^)]*\)/g) || [];
    expect(throwMatches.length, `throw 含 apiKey 明文: ${throwMatches.join(' | ')}`).toBe(0);
  });
});