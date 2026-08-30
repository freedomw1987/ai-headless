/**
 * Bug Fix — Chat History Sidebar 嵌套 <button> in <button> hydration error
 *
 * 對應: Sprint 46 中用戶回報 React hydration error
 *
 * 問題:
 * - admin-chat-dialog.tsx 第 106 行 <button onClick={handleSelectSession}>
 *   內含第 118 行 <button onClick={handleDeleteSession}> (刪除鈕)
 * - HTML 不允許 button 嵌套 button, 會 throw hydration error
 * - 錯誤訊息: "<button> cannot be a descendant of <button>. This will cause a hydration error."
 *
 * 修復策略 (Sprint 46 Bug Fix):
 * - 外層 button 改 div + role="button" + tabIndex=0 + onKeyDown (Enter/Space)
 * - 內層 delete button 保留 button + stopPropagation
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

describe('Bug Fix — Chat History 嵌套 button hydration', () => {
  const source = readFileSync(
    'app/admin/_components/admin-chat-dialog.tsx',
    'utf-8',
  );

  // ============== A. 結構守護 ==============

  it('應有 chat-history-sidebar', () => {
    expect(source).toMatch(/chat-history-sidebar/);
  });

  // ============== B. 不應有 button 嵌套 button ==============

  it('session-item 對應元素開 tag 不應是 <button>', () => {
    const testidIdx = source.indexOf('data-testid={`session-item-${s.id}`}');
    expect(testidIdx, '應有 session-item data-testid').toBeGreaterThan(-1);

    // 找 testid 之前最近的 <element開 tag (該 tag 尚未被關閉)
    // 用從頭找所有 <\w+ 位置, 取最後一個 testidIdx 之前的
    const openTagRegex = /<(\w+)\s/g;
    const before = source.substring(0, testidIdx);
    let lastMatch: RegExpExecArray | null = null;
    let m: RegExpExecArray | null;
    while ((m = openTagRegex.exec(before)) !== null) {
      lastMatch = m;
    }
    expect(lastMatch, '應找到 session-item 開 tag').toBeTruthy();
    expect(
      lastMatch?.[1],
      'session-item 開 tag 不應是 button',
    ).not.toBe('button');
  });

  it('session-item 應有 role="button" (鍵盤可達性)', () => {
    const testidIdx = source.indexOf('data-testid={`session-item-${s.id}`}');
    expect(testidIdx).toBeGreaterThan(-1);
    const openTags = [...source.substring(0, testidIdx).matchAll(/<(\w+)\s/g)];
    const lastOpenTag = openTags[openTags.length - 1];
    expect(lastOpenTag, '應找到 session-item 開 tag').toBeTruthy();
    // 從開 tag 到 testid 應有 role="button"
    const startIdx = lastOpenTag!.index!;
    const fromOpenTag = source.substring(startIdx, testidIdx + 200);
    expect(
      fromOpenTag,
      'session-item 開 tag 區域應有 role="button"',
    ).toMatch(/role="button"/);
  });

  it('session-item 應有 tabIndex={0} (鍵盤可達性)', () => {
    const testidIdx = source.indexOf('data-testid={`session-item-${s.id}`}');
    expect(testidIdx).toBeGreaterThan(-1);
    const openTags = [...source.substring(0, testidIdx).matchAll(/<(\w+)\s/g)];
    const lastOpenTag = openTags[openTags.length - 1];
    expect(lastOpenTag).toBeTruthy();
    const startIdx = lastOpenTag!.index!;
    const fromOpenTag = source.substring(startIdx, testidIdx + 200);
    expect(
      fromOpenTag,
      'session-item 開 tag 區域應有 tabIndex={0}',
    ).toMatch(/tabIndex=\{0\}/);
  });

  it('session-item 應有 onKeyDown 處理 Enter/Space', () => {
    const testidIdx = source.indexOf('data-testid={`session-item-${s.id}`}');
    expect(testidIdx).toBeGreaterThan(-1);
    const openTags = [...source.substring(0, testidIdx).matchAll(/<(\w+)\s/g)];
    const lastOpenTag = openTags[openTags.length - 1];
    expect(lastOpenTag).toBeTruthy();
    const startIdx = lastOpenTag!.index!;
    const region = source.substring(startIdx, testidIdx + 500);
    expect(region, 'session-item 區域應有 onKeyDown').toMatch(/onKeyDown/);
  });

  // ============== C. delete-session 應仍是 button ==============

  it('delete-session 應為 <button>', () => {
    const testidIdx = source.indexOf('data-testid={`delete-session-${s.id}`}');
    expect(testidIdx, '應有 delete-session data-testid').toBeGreaterThan(-1);

    const openTagRegex = /<(\w+)\s/g;
    const before = source.substring(0, testidIdx);
    let lastMatch: RegExpExecArray | null = null;
    let m: RegExpExecArray | null;
    while ((m = openTagRegex.exec(before)) !== null) {
      lastMatch = m;
    }
    expect(lastMatch, '應找到 delete-session 開 tag').toBeTruthy();
    expect(
      lastMatch?.[1],
      'delete-session 開 tag 應為 button',
    ).toBe('button');
  });

  // ============== D. 不應有 button 包含 button 嵌套 ==============

  it('不應有 <button ... data-testid="session-item..." 內包含另一個 <button>', () => {
    const sessionItemIdx = source.indexOf('data-testid={`session-item-${s.id}`}');
    expect(sessionItemIdx).toBeGreaterThan(-1);
    const beforeSession = source.substring(0, sessionItemIdx);
    const lastButtonOpen = beforeSession.lastIndexOf('<button');
    expect(lastButtonOpen).toBeGreaterThan(-1);
    const buttonClose = source.indexOf('</button>', lastButtonOpen);
    expect(buttonClose).toBeGreaterThan(-1);
    expect(
      sessionItemIdx > buttonClose,
      'session-item 應在外層 </button> 之後 (即不再嵌套在 <button> 內)',
    ).toBe(true);
  });
});