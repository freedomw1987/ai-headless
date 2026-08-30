/**
 * Bug Fix (Sprint 46 中發現) — createProviderFromDB fallback 邏輯
 *
 * 對應 PRD: docs/prd/05-ai-config.md §Sprint 43 Plan Gate
 *
 * 問題描述:
 * - Sprint 43 Plan Gate 設計是「user-specific 優先、Global URL (userId=null) fallback」
 * - 但 providers.ts 第 914-916 行的實作:
 *     where: params.userId ? { userId: params.userId } : { userId: null }
 *   只查 user-specific, 完全沒 fallback 到 Global URL
 * - 結果: admin user 若只有 Global URL (userId=null) config, 呼叫 createProviderFromDB
 *   會 throw "No AI config found"
 *
 * 修復:
 * - 先查 user-specific (params.userId)
 * - 找不到再 fallback 到 userId=null (Global URL)
 * - 兩者都找不到才 throw
 *
 * 對應 Sprint 46 Commit 2 (Stage 46-A) 前的 blocker fix
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createProviderFromDB } from './providers';

// Mock @/lib/db 以注入假 aIConfig
vi.mock('@/lib/db', () => ({
  db: {
    aIConfig: {
      findFirst: vi.fn(),
    },
  },
}));

import { db } from '@/lib/db';
import * as providersModule from './providers';

// vitest 不自動載入 .env, 需要手動設定 AI_ENCRYPTION_KEY 才能 decrypt
if (!process.env.AI_ENCRYPTION_KEY) {
  process.env.AI_ENCRYPTION_KEY = '52a61ee3da2c0e61782d0e428211bb4fb81915c2d647f177e87dcfd13428a2ff';
}

// 使用真實 encrypt round-trip 建立有效 ciphertext
const enc = (text: string) => providersModule.encrypt(text);

// Mock helper: 建立 aIConfig 物件（userId 可為 string 或 null）
const mockAIConfig = (overrides: Record<string, any>) => ({
  id: 'cfg-test',
  userId: null,
  type: 'openai_compatible',
  provider: null,
  endpointUrl: null,
  model: 'gpt-4',
  apiKeyEnc: enc('test-key'),
  temperature: 0.7,
  maxTokens: 4096,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('Bug Fix — createProviderFromDB fallback (Sprint 43 historical bug)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('User-specific config 優先', () => {
    it('user-specific config 存在時應使用 user-specific (不 fallback)', async () => {
      vi.mocked(db.aIConfig.findFirst).mockResolvedValueOnce(mockAIConfig({
        id: 'cfg-user',
        userId: 'admin-1',
        type: 'openai_compatible',
        endpointUrl: 'https://api.user.com',
      }) as any);

      const provider = await createProviderFromDB({ userId: 'admin-1' });

      expect(provider).toBeDefined();
      expect(db.aIConfig.findFirst).toHaveBeenCalledTimes(1);
      expect(db.aIConfig.findFirst).toHaveBeenCalledWith({
        where: { userId: 'admin-1' },
      });
    });

    it('user-specific config 存在時不應查詢 Global URL', async () => {
      vi.mocked(db.aIConfig.findFirst).mockResolvedValueOnce(mockAIConfig({
        id: 'cfg-user',
        userId: 'admin-1',
      }) as any);

      await createProviderFromDB({ userId: 'admin-1' });

      // 只查 1 次, 不應查 userId=null
      expect(db.aIConfig.findFirst).toHaveBeenCalledTimes(1);
    });
  });

  describe('Fallback 到 Global URL (userId=null)', () => {
    it('user-specific 找不到時應 fallback 到 userId=null config', async () => {
      // 第 1 次查 user-specific → null
      vi.mocked(db.aIConfig.findFirst).mockResolvedValueOnce(null);
      // 第 2 次查 Global URL → 找到
      vi.mocked(db.aIConfig.findFirst).mockResolvedValueOnce(mockAIConfig({
        id: 'cfg-global',
        userId: null,
        type: 'anthropic_compatible',
        provider: 'anthropic',
        endpointUrl: 'https://api.anthropic.com',
        model: 'claude-3-5-sonnet',
      }) as any);

      const provider = await createProviderFromDB({ userId: 'admin-1' });

      expect(provider).toBeDefined();
      expect(db.aIConfig.findFirst).toHaveBeenCalledTimes(2);
      // 第 1 次查 user-specific
      expect(db.aIConfig.findFirst).toHaveBeenNthCalledWith(1, {
        where: { userId: 'admin-1' },
      });
      // 第 2 次查 Global URL
      expect(db.aIConfig.findFirst).toHaveBeenNthCalledWith(2, {
        where: { userId: null },
      });
    });

    it('admin 用 userId 呼叫但只有 Global URL config 存在時不應 throw', async () => {
      vi.mocked(db.aIConfig.findFirst).mockResolvedValueOnce(null);
      vi.mocked(db.aIConfig.findFirst).mockResolvedValueOnce(mockAIConfig({
        id: 'cfg-global',
        userId: null,
        type: 'anthropic_compatible',
        provider: 'anthropic',
        endpointUrl: 'https://api.anthropic.com',
        model: 'claude-3-5-sonnet',
      }) as any);

      // 不應 throw (這是 bug 的核心: 之前會 throw "No AI config found")
      await expect(createProviderFromDB({ userId: 'admin-1' })).resolves.toBeDefined();
    });
  });

  describe('無 userId 參數時的行為', () => {
    it('無 userId 參數時應只查 Global URL', async () => {
      vi.mocked(db.aIConfig.findFirst).mockResolvedValueOnce(mockAIConfig({
        id: 'cfg-global',
        userId: null,
      }) as any);

      await createProviderFromDB({});

      // 只查 1 次 (Global URL), 不應有 fallback
      expect(db.aIConfig.findFirst).toHaveBeenCalledTimes(1);
      expect(db.aIConfig.findFirst).toHaveBeenCalledWith({
        where: { userId: null },
      });
    });
  });

  describe('兩者都找不到時', () => {
    it('user-specific 找不到 + Global URL 找不到時應 throw 503', async () => {
      vi.mocked(db.aIConfig.findFirst).mockResolvedValueOnce(null);
      vi.mocked(db.aIConfig.findFirst).mockResolvedValueOnce(null);

      await expect(
        createProviderFromDB({ userId: 'admin-1' }),
      ).rejects.toThrow(/No AI config found/);
    });

    it('無 userId 參數且 Global URL 找不到時應 throw 503', async () => {
      vi.mocked(db.aIConfig.findFirst).mockResolvedValueOnce(null);

      await expect(
        createProviderFromDB({}),
      ).rejects.toThrow(/No AI config found/);
    });
  });
});