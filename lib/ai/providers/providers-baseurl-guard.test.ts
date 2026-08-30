/**
 * Bug Fix (Sprint 46 中發現) — Custom URL 自動附加 path
 *
 * 對應 PRD: docs/prd/05-ai-config.md §4.0.3 (Sprint 43)
 *
 * 問題:
 * - PRD 設計: Custom URL 應只填 base URL (如 https://api.minimaxi.com/anthropic),
 *   Provider 自動附加 /anthropic/v1/messages
 * - testEndpoint 確實自動附加 path (行 694-695 寫死)
 * - 但 AnthropicProvider 直接 fetch baseUrl, 沒自動附加
 * - 結果: 用戶填 Custom URL 一定要填完整 endpoint 才能 work,
 *   與 PRD 設計和 testEndpoint 行為不一致
 *
 * 修復:
 * - Custom URL 沒包含 /v1/messages 時, 自動附加 /v1/messages (Anthropic) /v1/chat/completions (OpenAI)
 * - 官方 URL (config.baseUrl === undefined) 走預設 ANTHROPIC_API_URL / OPENAI_API_URL
 * - 完整 endpoint URL (已有 /v1/messages) 不變
 */

import { describe, it, expect, vi } from 'vitest';
import { AnthropicProvider, OpenAIProvider } from './providers';

describe('Bug Fix — Custom URL 自動附加 path (Sprint 43 設計不一致)', () => {
  describe('A. AnthropicProvider baseUrl 處理', () => {
    it('Custom URL 沒 path 應自動附加 /v1/messages', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: [{ text: 'ok' }] }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const provider = new AnthropicProvider({
        apiKey: 'sk-test',
        model: 'claude-3-5-sonnet',
        baseUrl: 'https://api.minimaxi.com/anthropic',
        type: 'anthropic-compatible',
      });

      await provider.generateText([{ role: 'user', content: 'hi' }]);

      // 應自動附加 /v1/messages
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.minimaxi.com/anthropic/v1/messages',
        expect.any(Object),
      );
    });

    it('Custom URL 已有 /v1/messages 不應重複附加', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: [{ text: 'ok' }] }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const provider = new AnthropicProvider({
        apiKey: 'sk-test',
        model: 'claude-3-5-sonnet',
        baseUrl: 'https://my-proxy.com/v1/messages',
        type: 'anthropic-compatible',
      });

      await provider.generateText([{ role: 'user', content: 'hi' }]);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://my-proxy.com/v1/messages',
        expect.any(Object),
      );
    });

    it('無 baseUrl (預設) 應用 ANTHROPIC_API_URL', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: [{ text: 'ok' }] }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const provider = new AnthropicProvider({
        apiKey: 'sk-test',
        model: 'claude-3-5-sonnet',
      });

      await provider.generateText([{ role: 'user', content: 'hi' }]);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.any(Object),
      );
    });
  });

  describe('B. OpenAIProvider baseUrl 處理', () => {
    it('Custom URL 沒 path 應自動附加 /v1/chat/completions', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'ok' } }] }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const provider = new OpenAIProvider({
        apiKey: 'sk-test',
        model: 'gpt-4',
        baseUrl: 'https://api.openrouter.ai/api',
        type: 'openai-compatible',
      });

      await provider.generateText([{ role: 'user', content: 'hi' }]);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openrouter.ai/api/v1/chat/completions',
        expect.any(Object),
      );
    });
  });
});