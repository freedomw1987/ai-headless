/**
 * Sprint 54 Stage 54-0 (FR-21.3) — AdminChatDialog Delete Button Bug 守護測試
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.16 (FR-21.3)
 * 對應 Plan Gate: docs/sprint54-plan-gate.md
 *
 * 守護項目:
 * - FR-21.3.1: 不應有 nested interactive (div role="button" 內含 button)
 * - FR-21.3.2: 應有 data-action="select" / data-action="delete" attribute
 * - FR-21.3.3: 應有原生 <dialog> 元素 (或 showModal() 呼叫)
 * - FR-21.3.4: 不應有 window.confirm() 呼叫
 * - FR-21.3.5: 應有 useConfirmDialog hook (或 React state 管理 confirm)
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';

describe('S54-0 — AdminChatDialog Delete Button Bug 守護測試 (FR-21.3)', () => {
  const source = readFileSync(
    'app/admin/_components/admin-chat-dialog.tsx',
    'utf-8',
  );

  describe('FR-21.3.1: 不應有 nested interactive elements', () => {
    it('不應有 <div role="button" ... > 內含 <button>', () => {
      // 檢查模式: div[role="button"] 開啟後, 中間不應出現 <button>
      // 簡化檢查: 不應有 <div[^>]*role="button"[^>]*>[^<]*<button
      // 允許跨行
      const nestedPattern = /<div[^>]*role="button"[^>]*>[\s\S]*?<button/;
      expect(
        source.match(nestedPattern),
        '不應有 <div role="button"> 內含 <button> (nested interactive)',
      ).toBeNull();
    });

    it('session-item 的外層不應有 role="button"', () => {
      // session-item 是 li 內的容器, 不應再有 role="button"
      const sessionItemIdx = source.indexOf('data-testid={`session-item-${s.id}`}');
      expect(sessionItemIdx).toBeGreaterThan(-1);
      // 往前找最近 <li> 開 tag
      const beforeSession = source.substring(0, sessionItemIdx);
      const lastLiOpen = beforeSession.lastIndexOf('<li');
      expect(lastLiOpen).toBeGreaterThan(-1);
      // <li> 與 session-item 之間不應有 role="button"
      const region = source.substring(lastLiOpen, sessionItemIdx);
      expect(
        region.includes('role="button"'),
        '<li> 與 session-item 之間不應有 role="button"',
      ).toBe(false);
    });
  });

  describe('FR-21.3.2: 應有 data-action attribute', () => {
    it('應有 data-action="select"', () => {
      expect(source).toContain('data-action="select"');
    });

    it('應有 data-action="delete"', () => {
      expect(source).toContain('data-action="delete"');
    });
  });

  describe('FR-21.3.3: 應有原生 <dialog> 元素', () => {
    it('應有 <dialog> 元素', () => {
      expect(source).toContain('<dialog');
    });

    it('應有 showModal() 或 dialogRef.current.showModal() 呼叫', () => {
      expect(source).toMatch(/showModal\(/);
    });
  });

  describe('FR-21.3.4: 不應有 window.confirm() 呼叫', () => {
    it('不應有 window.confirm( 呼叫', () => {
      // 只檢查 window.confirm( (原生 window.confirm)
      // useConfirmDialog 的 confirm 函式不是 window.confirm
      expect(source).not.toMatch(/window\.confirm\(/);
      // 不應有冱if (!confirm(...)) 模式 (代表舊的 window.confirm 邏輯)
      expect(source).not.toMatch(/if\s*\(\s*!\s*confirm\s*\(/);
    });
  });

  describe('FR-21.3.5: 應有 useConfirmDialog hook 或 state 管理', () => {
    it('應有 useConfirmDialog 或 React state 管理 confirm', () => {
      expect(source).toMatch(/useConfirmDialog|useState.*confirm|confirmDelete/);
    });
  });

  describe('FR-21.3.6: 既有 data-testid 保留', () => {
    it('應保留 data-testid="session-item-{id}"', () => {
      expect(source).toContain('data-testid={`session-item-${s.id}`}');
    });

    it('應保留 data-testid="delete-session-{id}"', () => {
      expect(source).toContain('data-testid={`delete-session-${s.id}`}');
    });

    it('應保留 data-testid="chat-history-sidebar"', () => {
      expect(source).toContain('data-testid="chat-history-sidebar"');
    });
  });
});