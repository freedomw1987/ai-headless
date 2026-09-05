# Sprint 49~53 Review Report

> **範圍**: Sprint 49-1/2, 50-0, 51-0, 52-0 (spike), 52-1, 52-2, 53-0, 53-1
> **日期**: 2026-09-05
> **重點**: 正確性風險、UX 回歸、缺測試、後續任務
> **基線**: ~2,067 tests / 0 regression

---

## ⚡ At a Glance

| 等級 | 數量 | 代表 |
|------|------|------|
| 🔴 P0 | 2 | 53-0 slash command silent no-op、help 動作成為 dead code |
| 🟠 P1 | 4 | 下載 API 用 DB size、kebab-case 缺驗證、backup 無遞迴防護、`..` 路徑繞過 |
| 🟡 P2 | 3 | MIME label fallback、UIMessage 切斷不完整、validator edge cases |

---

## 🔴 正確性風險（P0）

### 1. [P0] Sprint 53-0 — `/extension create` 是 silent no-op
**檔案**: `app/admin/_components/admin-chat-panel.tsx:184-200`

`handleExtensionCommand` 對 `help` / `create` 兩個 action 都只 `return true`：`setInput('')` 後畫面無訊息、無 toast、無 spinner。Admin 送出後看起來像壞掉。

**修法（Sprint 53-1 之前）**：
```ts
if (parsed.action === 'create' && parsed.name) {
  setMessages((prev) => [...prev, {
    id: nanoid(), role: 'assistant',
    content: '🔧 Extension Generator 即將推出（Sprint 53-1）',
  }]);
  return true;
}
```

### 2. [P0] Sprint 53-0 — `/extension help` 解析時 throw → silent fallback
**檔案**: `lib/ai/agent-sdk/extension-generator.ts:200-203`

```ts
const action = parts[1] as 'create' | 'help';
if (action !== 'create') {
  throw new Error(`Unknown action: ${action}. Supported: create`);
}
```

`action` 型別 union 宣告 `'create' | 'help'`，但 parser 只接受 `create`，對 `/extension help` **直接 throw**。handler 的 catch 把它退回 `return false` → `handleSubmit` 走 silent branch → 訊息被丟棄。

**後果**：型別說可以 help，實際 help 路徑永遠到不了（除了 `/extension` 單獨輸入才走 `parts.length < 2` 那條）。

**修法**：
```ts
if (action === 'help') return { action: 'help' };
if (action !== 'create') throw new Error(`Unknown action: ${action}. Supported: create, help`);
```

---

## 🟠 正確性風險（P1）

### 3. [P1] Sprint 50-0 — 下載 route 用 DB 欄位當 `Content-Length`
**檔案**: `app/api/admin/chat/attachments/[id]/download/route.ts:92`

```ts
'Content-Length': attachment.size.toString(),
```

`attachment.size` 是上傳時寫入的 DB 欄位，但 `buffer.length` 才反映磁碟實際大小。若檔案被外部修改 / 上傳時錯誤 / 寫入中斷，`Content-Length` 會與 body 不一致 → 瀏覽器卡住或下載壞檔。

**修法**：用 `buffer.length`，或加 `ETag: hash(buffer)` + `If-None-Match` 條件請求。

### 4. [P1] Sprint 52-1 — `parseExtensionCommand` 未驗證 kebab-case
**檔案**: `lib/ai/agent-sdk/extension-generator.ts:209`

`/extension create My Product` → `parts[2]='My'`, 之後的 `Product` 被當 flag 忽略。回傳 `name='My'`（大寫開頭），下游 validator 最終 throw，UX 不好。

**修法**：
```ts
if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name)) {
  throw new Error('Extension name must be kebab-case (e.g. product, my-extension)');
}
```

### 5. [P1] Sprint 52-2 — `backupExtension` 沒排除遞迴 / 含 `..` 路徑
**檔案**: `lib/ai/agent-sdk/extension-validator.ts:81-108`

兩個相關問題：
- **`copyDir` 無遞迴防護**：若 caller 把 `extensions-backup/...` 傳進 `sourceDir`，會無窮遞迴爆 stack。
- **`isPathAllowed` 不解析 `..`**：`extensions/product/../product2/foo.ts` 正規化後仍以 `extensions/product/` 開頭，通過驗證；但實際 `path.join` 會寫到 `extensions/product2/`。

**修法**：
```ts
function copyDir(src, dest) {
  const resolvedSrc = path.resolve(src);
  const resolvedDest = path.resolve(dest);
  if (resolvedDest.startsWith(resolvedSrc + path.sep)) {
    throw new Error('Recursive backup not allowed');
  }
  ...
}

export function isPathAllowed(targetPath, extensionName) {
  // 解析 .. 並 normalize
  const normalized = path.normalize(targetPath).replace(/\\/g, '/');
  const expectedPrefix = `extensions/${extensionName}/`;
  return normalized === expectedPrefix.slice(0, -1) || normalized.startsWith(expectedPrefix);
}
```
並補 guard test: `extensions/product/../product2/manifest.json` 應 reject。

---

## ⚠️ UX 回歸風險

### 6. [P2] Sprint 50-0 — `mimeType` 缺值時 MIME label silently skip
**檔案**: `components/ai-elements/sources-list.tsx:111`, `lib/ai/chat/attachment-icon.ts:94`

升級前無 `mimeType` 的歷史附件會 silently skip label — by design，但 prop 註解已標註「無 mimeType = 無 label」，可接受。

**附帶 dead code 觀察**: `getMimeLabel` 在未知 mimeType 時 `return labels[mimeType] ?? mimeType` 回傳原 mimeType 字串，但 `sources-list.tsx` 渲染條件是 `mimeLabel && mimeLabel !== att.mimeType` —— 兩個分支等價過濾掉，所以上游的 `?? mimeType` 是 dead code。建議把回傳型別改 `string | null`，未識別時回傳 `null`。

### 7. [P2] Sprint 51-0 — `ui-message-parts.ts` 切斷不完整
**檔案**: `lib/ai/chat/ui-message-parts.ts`

只切斷 `FileUIPart` + `SourceDocumentUIPart`。SDK 還有 `TextUIPart / ReasoningUIPart / ToolUIPart / SourceURIUIPart`。若未來 `conversation.tsx` / `message.tsx` 需要處理 tool call / reasoning，會再 `from "ai"` import。

**守護 regex 限制（`tests/uimessage-deps-guard.test.ts:42` + `tests/sdk-type-deps-guard.test.ts`）**：
- 只匹配 `from\s+["']ai["']` 字串，沒涵蓋 `require('ai')`、`import('@ai-sdk/...')`、re-export 路徑
- 只認 `UIMessage` 大寫駝峰，沒涵蓋 `UIMessagePart`、`Message`、`ChatStatus` 等相似 SDK 名稱（Sprint 51 守護另開一份 `sdk-type-deps-guard.test.ts` 才覆蓋到 `ChatStatus`，未來新增型別容易漏）

**修法**：在檔頭加 `// TODO: 並切斷其他 UIMessage part types`，並把 guard regex 擴展為 `/from\s+['"]ai['"]|require\(['"]ai['"]\)|import\(['"]ai['"]\)/i`；建立 SDK 升級同步 SOP（`ui-message-parts.ts:14` 已揭露此風險）。

---

## 🧪 缺測試項目

### 8. [P1] Sprint 53-0 — `handleExtensionCommand` 三條 path 沒功能性 RTL 測試
目前只有 source-grep guard（檢查 `[Extension Generator]` 字串）。`help`、`create`、parse 失敗 fallback 三條 code path 都沒 RTL 測試。

**建議補（Sprint 53-1）**：
- 輸入 `/extension create product` → 出現「即將推出」訊息
- 輸入 `/extension help` → 出現 help 訊息（修完 #2 後）
- 輸入 `/extension create`（無名稱）→ 走一般 chat
- 輸入 `/extension` → 出現 help 訊息
- 輸入一般訊息 → 走原本 send 流程

### 9. [P1] Sprint 50-0 — 下載 route 沒有 HTTP integration 測試
Guard 測試全是 source-grep regex match。沒有真正打 401 → 403 → 404 → 200 流的測試。

**建議**：用 vitest + supertest（Next.js Route Handler）：
- mock session → 401
- mock non-admin → 403
- mock 不同 session 的 attachment → 403
- 正常 admin + 自己的 attachment → 200 + buffer

### 10. [P2] Sprint 52-2 — `validateExtensionFiles` 沒測缺欄位 / 空內容
8 個 happy path 有測，但：
- `spec.json` 缺必填欄位
- `hooks/beforeCreate.ts` 是空字串
- 路徑含 `..`（見 #5）
- `manifest.json` 是合法 JSON 但缺 schema 必要欄位

### 11. [P2] Sprint 49-1 — Office Rest 守護測試沒有 meta-guard
守護改為「找不到就 throw」，但若未來有人想加 `console.warn + skip` 回到 Sprint 48 寫法，沒測試會擋下。

**建議**：加 meta-guard test：「`tests/office-rest-spike.test.ts` 不應出現 `console.warn` + `return` 模式」。

### 12. [P2] Sprint 53-0 — `parseExtensionCommand` help/throw 行為沒測
**檔案**: `tests/extension-generator-guard.test.ts`

只測 happy path 與 Zod schema，沒測：
- `/extension help` 應回傳 `{ action: 'help' }`（目前會 throw）
- `/extension` 單獨輸入應回傳 `{ action: 'help' }`
- `/extension create` 無名稱應 throw
- `/extension create My Product` 大寫應 throw（修完 #4 後）

---

## 🔧 後續任務（建議加 backlog）

| 優先 | 任務 | 對應 Sprint | 預估 SP |
|------|------|-------------|---------|
| **P0** | 53-1：slash command 實際觸發 generator flow（含「即將推出」placeholder UX） | 53-1 | 0.5 |
| **P0** | 53-1：修 `parseExtensionCommand` help 邏輯（#2） | 53-1 | 0.1 |
| **P0** | 53-1：補 `handleExtensionCommand` 三條 path 的功能性 RTL 測試（#8） | 53-1 | 0.3 |
| **P1** | 50-1：補下載 route 的 HTTP integration 測試（#9） | 50-1 | 0.3 |
| **P1** | 52-3：`parseExtensionCommand` 加 kebab-case 驗證 + 錯誤訊息（#4） | 52-3 | 0.1 |
| **P1** | 52-3：建立 `extensions-backup` 自動清理 cron（避免無限長大） | 52-3 | 0.3 |
| **P1** | 52-3：修 `isPathAllowed` 路徑 `..` 解析 + `copyDir` 遞迴防護（#5） | 52-3 | 0.2 |
| **P1** | 52-3：補 validator edge case 測試（#10） | 52-3 | 0.3 |
| **P1** | 53-1：補 `parseExtensionCommand` help/throw 行為單元測試（#12） | 53-1 | 0.2 |
| **P2** | 51-1：把其他 UIMessage Part 型別切斷 | 51-1 | 0.3 |
| **P2** | 50-1：SourcesList v3 圖片 preview（backlog 既有） | 50-1 | 0.8 |
| **P2** | 53-1：加 `/help` 內建 slash command 列表 | 53-1 | 0.2 |
| **P3** | 50-1：下載 route 加 ETag / 條件請求支援（#3） | 50-1 | 0.2 |

---

## ✅ 做得好的地方

- **Sprint 49-2 dead code 移除**：~75 行清乾淨，grep 全 repo 0 殘留引用
- **Sprint 52-2 路徑防護**：跨 extension、Windows 路徑、核心程式都有覆蓋（`..` 解析見 #5 補強）
- **Sprint 52-1 Zod schema**：完整覆蓋 spec 結構，PascalCase / kebab-case regex 都驗證
- **Sprint 51-0 SDK Type 切斷**：4 個型別全切乾淨（grep 驗證 0 個 `from "ai"` 引用在 admin/agent-sdk/extensions/）
- **守護測試策略一致**：所有 sprint 都走「source-grep 守護 + 真實 fs 掃描 + 嚴格 regex」，風格統一

---

## 📊 Sprint 49~53 統計

| Sprint | Commits | FR | SP | Tests | 重點 |
|--------|---------|----|----|-------|------|
| 49-1   | 1       | 3  | 0.3 | +1    | Office Rest Guard 強化 |
| 49-2   | 1       | 1  | 0.3 | +1    | UIMessage SDK 切斷 + dead code 移除 |
| 50-0   | 1       | 4  | 0.8 | +23   | SourcesList v2 + 下載 API |
| 51-0   | 1       | 3  | 0.8 | +10   | SDK Type Dep 切斷 |
| 52-0   | 1 (spike) | 1 | 0.5 | +10 | Extension Generator 可行性 |
| 52-1   | 1       | 2  | 0.6 | +21   | Generator + Slash Command |
| 52-2   | 1       | 1  | 0.9 | +21   | Validator 三層驗證 |
| 53-0   | 1       | 1  | 0.5 | +11   | Admin Chat Slash 整合 |

---

## 🎯 一句話總結

**做得穩，但 Sprint 53-0 有兩個相關 silent-no-op 風險（#1 admin UX / #2 help parser throw）— 都會在 demo 時讓 admin 以為功能壞了。Sprint 53-1 務必先修。**
