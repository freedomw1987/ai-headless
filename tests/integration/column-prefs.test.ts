/**
 * Sprint C1 TDD — column-prefs localStorage helper
 *
 * 測試重點:
 * - load(specName) 從 localStorage 讀
 * - save(specName, columns) 存到 localStorage
 * - clear(specName) 清除
 * - SSR (無 window) 安全 — 回傳 null
 * - localStorage 不可用 (security error) — 回傳 null 不 throw
 * - JSON parse 失敗 — 回傳 null 不 throw
 * - key prefix 正確 (避免跟其他 localStorage 衝突)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadColumnPrefs, saveColumnPrefs, clearColumnPrefs } from '@/lib/crud/column-prefs';

describe('Sprint C1 — column-prefs localStorage helper', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('saveColumnPrefs + loadColumnPrefs', () => {
    it('存一個欄位清單 → load 讀回同樣的陣列', () => {
      saveColumnPrefs('todo', ['title', 'completed']);
      const result = loadColumnPrefs('todo');
      expect(result).toEqual(['title', 'completed']);
    });

    it('空陣列也存得進去', () => {
      saveColumnPrefs('todo', []);
      expect(loadColumnPrefs('todo')).toEqual([]);
    });

    it('不同 spec 用不同 key', () => {
      saveColumnPrefs('todo', ['title']);
      saveColumnPrefs('order', ['amount']);
      expect(loadColumnPrefs('todo')).toEqual(['title']);
      expect(loadColumnPrefs('order')).toEqual(['amount']);
    });

    it('第二次 save 覆蓋第一次', () => {
      saveColumnPrefs('todo', ['title', 'completed']);
      saveColumnPrefs('todo', ['title']);
      expect(loadColumnPrefs('todo')).toEqual(['title']);
    });

    it('localStorage 用正確 key prefix (避免衝突)', () => {
      saveColumnPrefs('todo', ['title']);
      // 檢查 localStorage 真的有那個 key
      const raw = localStorage.getItem('crud-list-columns:todo');
      expect(raw).toBe('["title"]');
    });
  });

  describe('clearColumnPrefs', () => {
    it('清除該 spec 的 prefs', () => {
      saveColumnPrefs('todo', ['title']);
      clearColumnPrefs('todo');
      expect(loadColumnPrefs('todo')).toBeNull();
    });

    it('清除不影響其他 spec', () => {
      saveColumnPrefs('todo', ['title']);
      saveColumnPrefs('order', ['amount']);
      clearColumnPrefs('todo');
      expect(loadColumnPrefs('todo')).toBeNull();
      expect(loadColumnPrefs('order')).toEqual(['amount']);
    });

    it('沒存過也安全 (不 throw)', () => {
      expect(() => clearColumnPrefs('never-saved')).not.toThrow();
    });
  });

  describe('SSR / 無 window 環境', () => {
    it('load 在無 window 時回傳 null', () => {
      const originalWindow = globalThis.window;
      (globalThis as { window?: Window }).window = undefined;
      const result = loadColumnPrefs('todo');
      expect(result).toBeNull();
      globalThis.window = originalWindow;
    });

    it('save 在無 window 時不 throw', () => {
      const originalWindow = globalThis.window;
      (globalThis as { window?: Window }).window = undefined;
      expect(() => saveColumnPrefs('todo', ['title'])).not.toThrow();
      globalThis.window = originalWindow;
    });
  });

  describe('localStorage 損壞 / 不可用', () => {
    it('JSON parse 失敗 → 回傳 null 不 throw', () => {
      // 直接寫壞的 JSON
      localStorage.setItem('crud-list-columns:todo', '{not valid json');
      expect(() => loadColumnPrefs('todo')).not.toThrow();
      expect(loadColumnPrefs('todo')).toBeNull();
    });

    it('localStorage 拋錯 (security error) → load 回傳 null', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError: localStorage disabled');
      });
      expect(() => loadColumnPrefs('todo')).not.toThrow();
      expect(loadColumnPrefs('todo')).toBeNull();
    });

    it('localStorage 拋錯 (security error) → save 不 throw', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('SecurityError: localStorage disabled');
      });
      expect(() => saveColumnPrefs('todo', ['title'])).not.toThrow();
    });

    it('不是陣列 (例如儲存字串) → 回傳 null', () => {
      localStorage.setItem('crud-list-columns:todo', '"a string"');
      expect(loadColumnPrefs('todo')).toBeNull();
    });
  });
});
