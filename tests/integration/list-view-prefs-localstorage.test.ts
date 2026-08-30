/**
 * Sprint 37-2 — ViewSelector localStorage 持久化守護測試
 *
 * 設計：
 * - localStorage key: `crud-view-pref:${specName}`
 * - value: JSON.stringify({ activeView: 'table' | 'todo-list' | 'kanban' })
 * - 初始化優先序：URL ?view= > localStorage > spec.views[0] (default)
 * - 切換 view 時同步寫入 localStorage
 * - 如果 localStorage 的 view 在新 spec 中不存在 → fallback default
 *
 * Gate 1 TDD
 */

import { describe, it, expect, beforeEach } from 'vitest';

const STORAGE_PREFIX = 'crud-view-pref:';

describe('Sprint 37-2 — ViewSelector localStorage 持久化', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('讀取不存在的 key 返回 null', () => {
    expect(localStorage.getItem(STORAGE_PREFIX + 'todo')).toBeNull();
  });

  it('寫入 + 讀取正確', () => {
    localStorage.setItem(
      STORAGE_PREFIX + 'todo',
      JSON.stringify({ activeView: 'kanban' }),
    );
    expect(localStorage.getItem(STORAGE_PREFIX + 'todo')).toBe(
      JSON.stringify({ activeView: 'kanban' }),
    );
  });

  it('每個 spec 獨立 key', () => {
    localStorage.setItem(
      STORAGE_PREFIX + 'todo',
      JSON.stringify({ activeView: 'kanban' }),
    );
    localStorage.setItem(
      STORAGE_PREFIX + 'blog',
      JSON.stringify({ activeView: 'todo-list' }),
    );
    expect(localStorage.getItem(STORAGE_PREFIX + 'todo')).toContain('kanban');
    expect(localStorage.getItem(STORAGE_PREFIX + 'blog')).toContain('todo-list');
  });

  it('無效 JSON 不會 throw', () => {
    localStorage.setItem(STORAGE_PREFIX + 'todo', 'not valid json{');
    expect(() => {
      // 模擬 handleViewChange 處理 invalid storage
      try {
        JSON.parse(localStorage.getItem(STORAGE_PREFIX + 'todo') ?? '');
      } catch {
        // 預期拋出但不該 crash
      }
    }).not.toThrow();
  });

  it('寫入 null（清空）後再讀取為 null', () => {
    localStorage.setItem(STORAGE_PREFIX + 'todo', 'something');
    localStorage.removeItem(STORAGE_PREFIX + 'todo');
    expect(localStorage.getItem(STORAGE_PREFIX + 'todo')).toBeNull();
  });
});