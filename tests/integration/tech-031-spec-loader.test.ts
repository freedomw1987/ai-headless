/**
 * Sprint 14 TECH-031 — Runtime Spec Loader
 *
 * 守護：
 * 1. 啟動時一次載入全部 spec
 * 2. 記憶體快取（重複呼叫不重讀檔）
 * 3. 載入失敗給明確錯誤
 * 4. 可列出所有可用 spec
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  loadAllSpecs,
  loadSpec,
  listAvailableSpecs,
  invalidateSpecCache,
} from '@/lib/runtime/spec-loader';
import path from 'node:path';

describe('TECH-031 Spec Loader', () => {
  beforeAll(() => {
    invalidateSpecCache();
  });

  it('listAvailableSpecs 列出 4 個 extension（blog/order/event/todo）', async () => {
    const specs = await listAvailableSpecs();
    expect(specs).toContain('blog');
    expect(specs).toContain('order');
    expect(specs).toContain('event');
    expect(specs).toContain('todo');
  });

  it('loadSpec(name) 回傳合法 JsonSpec', async () => {
    const blog = await loadSpec('blog');
    expect(blog.name).toBe('blog');
    expect(blog.models.length).toBeGreaterThan(0);
  });

  it('loadSpec 不存在 → 拋明確錯誤', async () => {
    await expect(loadSpec('not-exist')).rejects.toThrow(/Spec.*not-exist/);
  });

  it('loadAllSpecs 一次載入全部，回傳 4 個', async () => {
    const all = await loadAllSpecs();
    expect(Object.keys(all).sort()).toEqual(['blog', 'event', 'order', 'todo']);
  });

  it('第二次呼叫 loadAllSpecs 走快取（不改檔時間不變）', async () => {
    const first = await loadAllSpecs();
    const second = await loadAllSpecs();
    expect(first).toBe(second); // 同一個 reference
  });

  it('invalidateSpecCache 後重讀', async () => {
    const first = await loadAllSpecs();
    invalidateSpecCache();
    const second = await loadAllSpecs();
    expect(first).not.toBe(second); // 新 reference
    expect(first.blog).toEqual(second.blog);
  });
});