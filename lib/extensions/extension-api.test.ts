/**
 * TDD Gate 1 — Extension API 測試
 *
 * Extension API 提供 REST 端點管理 extensions：
 * - GET /api/extensions          列出
 * - GET /api/extensions/[name]   查詢
 * - POST /api/extensions         安裝（從 JSON body）
 * - DELETE /api/extensions/[name] 卸載
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createExtensionAPI,
  type ExtensionAPIResponse,
} from './extension-api';
import type { ExtensionManifest } from './extension-loader';

const sampleManifest: ExtensionManifest = {
  name: 'blog',
  version: '1.0.0',
  label: 'Blog Extension',
  description: '部落格功能',
  hooks: ['generateSlugFromTitle'],
  actions: ['publishPost'],
};

describe('createExtensionAPI', () => {
  let api: ReturnType<typeof createExtensionAPI>;

  beforeEach(() => {
    api = createExtensionAPI();
  });

  describe('list', () => {
    it('列出所有 extensions', async () => {
      await api.install(sampleManifest);
      const response: ExtensionAPIResponse = await api.list();

      expect(response.status).toBe(200);
      expect(response.data?.items).toHaveLength(1);
      expect(response.data?.items[0]?.name).toBe('blog');
    });

    it('空列表返回空陣列', async () => {
      const response = await api.list();

      expect(response.status).toBe(200);
      expect(response.data?.items).toEqual([]);
    });
  });

  describe('get', () => {
    it('取得已安裝 extension', async () => {
      await api.install(sampleManifest);
      const response = await api.get('blog');

      expect(response.status).toBe(200);
      expect(response.data?.name).toBe('blog');
    });

    it('不存在的 extension 返回 404', async () => {
      const response = await api.get('not-exist');

      expect(response.status).toBe(404);
      expect(response.error).toBeDefined();
    });
  });

  describe('install', () => {
    it('安裝合法 extension', async () => {
      const response = await api.install(sampleManifest);

      expect(response.status).toBe(201);
      expect(response.data?.name).toBe('blog');
    });

    it('拒絕非法 manifest', async () => {
      const response = await api.install({ name: 'Bad', version: 'x' });

      expect(response.status).toBe(400);
      expect(response.error).toBeDefined();
    });

    it('拒絕重複安裝', async () => {
      await api.install(sampleManifest);
      const response = await api.install(sampleManifest);

      expect(response.status).toBe(409);
    });
  });

  describe('uninstall', () => {
    it('卸載已安裝 extension', async () => {
      await api.install(sampleManifest);
      const response = await api.uninstall('blog');

      expect(response.status).toBe(200);
      expect(response.data?.success).toBe(true);
    });

    it('卸載不存在的 extension 返回 404', async () => {
      const response = await api.uninstall('not-exist');

      expect(response.status).toBe(404);
    });
  });

  describe('enable / disable', () => {
    it('enable 已安裝 extension', async () => {
      await api.install(sampleManifest);
      const response = await api.enable('blog');

      expect(response.status).toBe(200);
      expect(response.data?.enabled).toBe(true);
    });

    it('disable 已啟用 extension', async () => {
      await api.install(sampleManifest);
      await api.enable('blog');
      const response = await api.disable('blog');

      expect(response.status).toBe(200);
      expect(response.data?.enabled).toBe(false);
    });

    it('enable 不存在的 extension 返回 404', async () => {
      const response = await api.enable('not-exist');

      expect(response.status).toBe(404);
    });
  });
});