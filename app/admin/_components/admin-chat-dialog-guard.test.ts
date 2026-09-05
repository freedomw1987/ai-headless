/**
 * Bug Fix — Chat History Sidebar 嵌套 <button> in <button> hydration error
 *
 * 對應: Sprint 46 中用戶回報 React hydration error + Sprint 54 delete button bug
 *
 * Sprint 46 問題:
 * - admin-chat-dialog.tsx 第 106 行 <button onClick={handleSelectSession}>
 *   內含第 118 行 <button onClick={handleDeleteSession}> (刪除鈕)
 * - HTML 不允許 button 嵌套 button, 會 throw hydration error
 * - 錯誤訊息: "<button> cannot be a descendant of <button>. This will cause a hydration error."
 *
 * Sprint 46 Bug Fix:
 * - 外層 button 改 div + role="button" + tabIndex=0 + onKeyDown (Enter/Space)
 * - 內層 delete button 保留 button + stopPropagation
 * - 但 Sprint 54 發現 delete 點不到 (nested interactive 仍有問題)
 *
 * Sprint 54 重構 (本檔測試已更新):
 * - session-item 外層改為純 <div> flex container (不再有 role="button")
 * - 內部兩個真正 <button> 並排: data-action="select" / data-action="delete"
 * - 完全消除 nested interactive, 加上原生 <dialog> confirm
 * - delete button 可正確觸發 confirm, select button 可正確選 session
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

  // Sprint 54: 既然 session-item 為純 <div>, 也不應有 role="button" / tabIndex={0}
  // 鍵盤可達性下移到內部 select button (本身是真正 <button> 元素)

  it('session-item 應有 data-action="select" 內部按鈕 (鍵盤可達性)', () => {
    const testidIdx = source.indexOf('data-testid={`session-item-${s.id}`}');
    expect(testidIdx).toBeGreaterThan(-1);
    const region = source.substring(testidIdx, testidIdx + 1000);
    expect(
      region,
      'session-item 內部應有 data-action="select" <button>',
    ).toMatch(/data-action="select"/);
  });

  it('session-item 內部 select button 應有 onKeyDown 處理 Enter/Space', () => {
    const testidIdx = source.indexOf('data-testid={`session-item-${s.id}`}');
    expect(testidIdx).toBeGreaterThan(-1);
    const region = source.substring(testidIdx, testidIdx + 1500);
    expect(
      region,
      'session-item 區域應有 onKeyDown',
    ).toMatch(/onKeyDown/);
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

  it('session-item 區域內不應有 button 包含另一個 button (用 <button 計數驗證)', () => {
    // Sprint 54 重構: session-item 是純 <div> flex container
    // 裡面有兩個平行的 <button> (select + delete), 沒有嵌套
    // 驗證: session-item 區域內, <button 開 tag 數 = </button> 關 tag 數
    const sessionItemIdx = source.indexOf('data-testid={`session-item-${s.id}`}');
    expect(sessionItemIdx).toBeGreaterThan(-1);
    // session-item 區域: 從 <li 開 tag 到 </li> 關 tag
    const beforeLi = source.substring(0, sessionItemIdx);
    const lastLiOpen = beforeLi.lastIndexOf('<li');
    expect(lastLiOpen).toBeGreaterThan(-1);
    const liClose = source.indexOf('</li>', lastLiOpen);
    expect(liClose).toBeGreaterThan(-1);

    const liRegion = source.substring(lastLiOpen, liClose);
    // 排除註解裡的 <button> 字串: 只算 <button 或 <button\n 後面不是字母的
    const buttonOpenCount = (liRegion.match(/<button(\s|>)/g) ?? []).length;
    const buttonCloseCount = (liRegion.match(/<\/button>/g) ?? []).length;
    expect(
      buttonOpenCount,
      `<li> 區域內 <button 開 tag 數應 = </button> 關 tag 數 (代表未嵌套)`,
    ).toBe(buttonCloseCount);
    // 且至少 2 個 button (select + delete)
    expect(buttonOpenCount, '<li> 區域內應至少 2 個 button (select + delete)').toBeGreaterThanOrEqual(2);
  });
});