/**
 * Sprint 40-4 — mobile actions 守護測試 (source-code guard)
 *
 * Bug: GalleryView / CalendarView 用 `opacity-0 group-hover:opacity-100`
 * → mobile 沒 hover → actions 看不到 → 用戶無法編輯/刪除
 *
 * 修法：mobile 預設 opacity-100，desktop (md+) 才 opacity-0 + group-hover
 *
 * Gate 1 TDD：source-code guard
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const VIEW_FILES = [
  { name: 'GalleryView', path: 'app/admin/crud/[spec]/list-views/gallery-view.tsx' },
  { name: 'CalendarView', path: 'app/admin/crud/[spec]/list-views/calendar-view.tsx' },
];

describe('Sprint 40-4 — mobile actions 修法守護', () => {
  for (const { name, path } of VIEW_FILES) {
    it(`${name} 不應只用 opacity-0 group-hover (mobile 看不到)`, () => {
      const source = readFileSync(path, 'utf-8');
      // Pattern 1 (壞): opacity-0 group-hover:opacity-100 → mobile 看不到
      const oldPattern = /opacity-0\s+group-hover:opacity-100/.test(source);
      // Pattern 2 (好): opacity-100 md:opacity-0 md:group-hover:opacity-100 → mobile 預設顯示
      const newPattern = /opacity-100\s+md:opacity-0\s+md:group-hover:opacity-100/.test(source);

      // 不允許只用舊 pattern (mobile 死路)
      expect(oldPattern, `${name} 不應只用 'opacity-0 group-hover:opacity-100'`).toBe(false);
      // 應該用新 pattern
      expect(newPattern, `${name} 應該用 'opacity-100 md:opacity-0 md:group-hover:opacity-100' 讓 mobile 也能看到`).toBe(true);
    });
  }
});