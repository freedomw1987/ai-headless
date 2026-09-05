# Sprint 54 Plan Gate — AdminChatDialog Delete Button Bug Fix

> **範圍**: 修復 AdminChatDialog 刪除對話按鈕
> **預估**: 0.5 SP / 1 commit / 5 FR / ~13 tests
> **日期**: 2026-09-05

---

## 🐛 Bug 摘要

**用戶反饋**: 「在 `/admin/crud/todo` 點 trash icon 一直都 delete 不到」

**Bug 位置**: `app/admin/_components/admin-chat-dialog.tsx:115-138`

**視覺證據** (來自用戶瀏覽器反饋):
```html
<div role="button" tabindex="0" class="w-full text-left ..." data-testid="session-item-...">
  <span>Attachment Test 2</span>
  <span class="text-xs text-muted-foreground">2</span>
  <button type="button" class="ml-1 p-1 rounded ..." data-testid="delete-session-...">
    <Trash2 />
  </button>
</div>
```

---

## 🔍 根因分析

### 根因 1: HTML5 規範違規 (P0)
`<button>` 不能巢狀在 `role="button"` 元素內。瀏覽器可能拒絕處理子 button 的 click。

### 根因 2: 事件路由衝突 (P0)
外層 `div[role="button"]` 的 `onClick={() => handleSelectSession(s.id)}` 與內層 `<button>` 的 `onClick={(e) => handleDeleteSession(s.id, e)}` 衝突。

即使有 `e.stopPropagation()`, 瀏覽器會先把 pointer event 路由到外層 div。

### 根因 3: `confirm()` 在 dialog 內失效 (P1)
瀏覽器 modal dialog 內 `window.confirm()` 可能被視為安全問題忽略。

---

## 🎯 5 個 Q&A 決策彙總

| Q | 決策 | 採用 |
|---|---|---|
| Q1 修復策略 | 重構為扁平事件代理 + 原生 `<dialog>` confirm | 方案 A（推薦）|
| Q2 Confirm 設計 | HTML5 `<dialog>` + showModal() | 方案 1（推薦）|
| Q3 Session 點擊 | 點整個 row 選該 session | （推薦）|
| Q4 鍵盤操作 | Enter/Space + Delete 鍵 | （推薦）|
| Q5 測試範圍 | 守護 + 互動 + 鍵盤 | （推薦）|

---

## 📋 Sprint 54 FR

| FR | 描述 | SP |
|---|---|---|
| **FR-21.1** | admin-chat-dialog 重構: 扁平事件代理 + 原生 `<dialog>` confirm | 0.3 |
| **FR-21.2** | 鍵盤支援: Enter/Space 選 + Delete 觸發 confirm | 0.1 |
| **FR-21.3** | 守護測試: isSessionAction + 無 nested interactive | 0.05 |
| **FR-21.4** | 互動測試: click 路由 (select / delete) + confirm 流程 | 0.03 |
| **FR-21.5** | 鍵盤測試: Enter/Space/Delete 鍵事件 | 0.02 |
| **總計** | **5 FR** | **0.5 SP** |

---

## 🛠️ Stage 54-0 設計

### 1. 重構 admin-chat-dialog.tsx

**舊結構** (有 bug):
```tsx
<div role="button" tabIndex={0} onClick={() => handleSelectSession(s.id)}>
  <span>{s.title}</span>
  <span>{s._count.messages}</span>
  <button onClick={(e) => handleDeleteSession(s.id, e)}>
    <Trash2 />
  </button>
</div>
```

**新結構** (扁平事件代理):
```tsx
<div
  onClick={(e) => {
    const action = e.target.closest('[data-action]');
    if (!action) return;
    if (action.dataset.action === 'delete') {
      confirmDelete(s.id, s.title);
    } else {
      handleSelectSession(s.id);
    }
  }}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelectSession(s.id);
    } else if (e.key === 'Delete') {
      e.preventDefault();
      confirmDelete(s.id, s.title);
    }
  }}
  tabIndex={0}
  role="button"
  data-testid={`session-item-${s.id}`}
>
  <button
    data-action="select"
    className="flex-1 ..."
  >
    <span>{s.title}</span>
    <span>{s._count.messages}</span>
  </button>
  <button
    data-action="delete"
    aria-label="刪除對話"
    data-testid={`delete-session-${s.id}`}
    onClick={(e) => e.stopPropagation()}  // 防止冒泡到 select
  >
    <Trash2 />
  </button>
</div>
```

**設計重點**:
- 外層 div 仍維持 `role="button"` + `tabIndex={0}` (鍵盤可訪問)
- 用 `data-action="select"` vs `data-action="delete"` 區分
- 點擊事件統一在外層 onClick 處理, 用 closest 路由
- Delete button 加 `stopPropagation()` (避免重複觸發 select)
- **注意**: `<div role="button">` 內仍含 `<button>`, 違反 HTML5 規範!

**修正**: 改為外層 `<div role="button">` 不再按按鈕,而是真正的 click target:
```tsx
<div
  className="flex items-center gap-1 cursor-pointer hover:bg-accent ..."
  data-testid={`session-item-${s.id}`}
>
  <button
    data-action="select"
    onClick={() => handleSelectSession(s.id)}
    className="flex-1 text-left ..."
  >
    <span>{s.title}</span>
    <span>{s._count.messages}</span>
  </button>
  <button
    data-action="delete"
    aria-label="刪除對話"
    data-testid={`delete-session-${s.id}`}
    onClick={() => confirmDelete(s.id, s.title)}
    className="ml-1 p-1 rounded hover:bg-destructive/20"
  >
    <Trash2 />
  </button>
</div>
```

**新設計**:
- 外層 `<div>` 不再有 `role="button"` (只是 flex container)
- 兩個真正的 `<button>` 並排
- 分別有 `data-action="select"` / `data-action="delete"`
- 鍵盤操作: Tab focus 到 select button, Enter 觸發 select; Tab focus 到 delete button, Delete 鍵觸發 delete
- 完全解決 nested interactive + confirm() 問題

### 2. useConfirmDialog hook

```tsx
function useConfirmDialog() {
  const [state, setState] = useState<{
    open: boolean;
    title?: string;
    message?: string;
    onConfirm?: () => void;
  }>({ open: false });

  const confirm = (opts: { title: string; message: string; onConfirm: () => void }) => {
    setState({ open: true, ...opts });
  };

  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (state.open && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    } else if (!state.open && dialogRef.current?.open) {
      dialogRef.current.close();
    }
  }, [state.open]);

  return { state, confirm, dialogRef, close: () => setState({ open: false }) };
}
```

### 3. 守護測試

```ts
describe('S54-0 Admin ChatDialog Delete Button Bug Fix', () => {
  it('不應有 nested interactive elements (div role="button" 內含 button)', () => {
    const source = readFileSync('app/admin/_components/admin-chat-dialog.tsx', 'utf-8');
    // 確認 session item 的外層 div 沒有 role="button"
    // 確保 delete-session testid 的 button 是真的 button, 不是 div
    expect(source).not.toMatch(/<div role="button"[^>]*>[^<]*<button/);
  });

  it('應有 data-action="delete" attribute', () => {
    const source = readFileSync('app/admin/_components/admin-chat-dialog.tsx', 'utf-8');
    expect(source).toContain('data-action="delete"');
  });

  it('應有 useConfirmDialog hook 或原生 <dialog> 元素', () => {
    const source = readFileSync('app/admin/_components/admin-chat-dialog.tsx', 'utf-8');
    expect(source).toMatch(/<dialog|<dialogRef|showModal/);
  });

  it('不應有 window.confirm() 呼叫', () => {
    const source = readFileSync('app/admin/_components/admin-chat-dialog.tsx', 'utf-8');
    expect(source).not.toMatch(/window\.confirm\(|^[^/]*confirm\(/);
  });
});
```

### 4. 互動測試

```ts
describe('互動測試: click 路由', () => {
  it('點 row → 選 session', () => { ... });
  it('點 trash icon → 觸發 confirm dialog', () => { ... });
  it('confirm 取消 → 不刪除', () => { ... });
  it('confirm 確認 → 刪除', () => { ... });
});
```

### 5. 鍵盤測試

```ts
describe('鍵盤測試', () => {
  it('Enter → 選 session', () => { ... });
  it('Space → 選 session', () => { ... });
  it('Delete → 觸發 confirm', () => { ... });
});
```

---

## ⚠️ 風險與緩解

| 風險 | 嚴重性 | 緩解 |
|---|---|---|
| 改 click 行為破壞既有測試 | 🟠 中 | 更新 `admin-chat-dialog-guard.test.ts` 的 data-testid 結構檢查 |
| `<dialog>` 跨瀏覽器 | 🟢 低 | 現代瀏覽器支援度高 |
| 既有使用者習慣 | 🟢 低 | 保留 Enter 行為 + 視覺一致 |

---

## 🚫 排除項目

| 項目 | 排除原因 |
|---|---|
| AdminChatPanel 改寫 | 範圍過大, 留 Sprint 55+ |
| 鍵盤快捷鍵 (Cmd+D 等) | Enter/Space/Delete 已足 |
| 批量刪除 | 一次性 delete 1 個 session 已足 |
| Toast 通知刪除成功 | 留 Sprint 55+ |

---

## 🎯 下一步

1. ✅ Plan Gate (本文件)
2. ⏳ Design Gate (擴充 PRD §2.16)
3. ⏳ Stage 54-0 (重構 + 守護 + 互動 + 鍵盤測試)
4. ⏳ Submit Gate

---

**Sprint 54 Plan Gate**: ✅ APPROVED