# Sprint 45 Reflection — AI SDK Elements 整合（混合方案）+ Chat 功能擴展

**Sprint**: 45
**期間**: 2025-08-31
**規模**: 14 SP（混合方案）
**完成度**: 100%

---

## 1. Sprint 目標

整合 Vercel AI SDK Elements 預製 UI 元件 + 擴展 Chat 功能（附件 + 程式碼高亮），同時**保留 Sprint 43 Custom URL 支援**。

---

## 2. 完成的 Commits

| Commit | 範圍 | SP | Hash |
|---|---|---|---|
| A | 安裝 shadcn AI Elements 4 個核心元件 | 3 | `c8fcf07` |
| B | 重構 AdminChatPanel + useChatStream hook | 4 | `453f6f0` |
| C | 檔案附件 UI（純前端）| 2 | `e7ca88a` |
| D | 程式碼區塊高亮（CodeBlock + 自製 parser）| 2 | `e76ffdd` |
| E | E2E 守護 + Submit Gate | 3 | (本次 commit) |

---

## 3. 關鍵決策

### 3.1 「混合方案」 vs 「完整整合」

| 方案 | 優點 | 缺點 |
|---|---|---|
| **混合方案（選）** | 保留 Sprint 43 投資、Custom URL 支援 | Sources/Reasoning 元件不可用 |
| 完整整合 | 所有 AI Elements 元件都可用 | 需重寫 backend、失去 Custom URL |

**結論**：採用混合方案 — 用 AI Elements 的 UI 元件（Conversation / Message / PromptInput / CodeBlock），但**保留自製 SSE 解析 hook**（`useChatStream`），不依賴 AI SDK 的 `useChat` 與 `UIMessageStream` 格式。

### 3.2 「pi agent SDK」實查結果

用戶在 Sprint 44 提到「用 pi agent」— 經研究：
- `@earendil-works/pi-coding-agent` 不是公開 npm package
- Sprint 44 已用 `createProviderFromDB` + 自製 SSE route 解決
- Sprint 45 沿用同樣架構

### 3.3 AI SDK 套件使用範圍

只使用 AI Elements 的 **UI 元件層**：
- ✅ `Conversation / ConversationContent / ConversationScrollButton`
- ✅ `Message / MessageContent`
- ✅ `PromptInput / PromptInputProvider / PromptInputBody / PromptInputFooter / PromptInputHeader / PromptInputTextarea / PromptInputSubmit`
- ✅ `PromptInputTools / PromptInputActionMenu / PromptInputActionAddAttachments`
- ✅ `CodeBlock / CodeBlockContent`（含 shiki syntax highlight）

**不使用** AI SDK 的 `useChat` / `DefaultChatTransport` / `streamText` — 因為需要 `toUIMessageStreamResponse()` 格式，會破壞 Custom URL。

---

## 4. 架構演進

### 4.1 重構前後對比

**重構前（Sprint 44）**：
```
AdminChatPanel (1 file)
  ├── 自製 message list + bubble
  ├── 自製 chat input
  ├── 內建 fetch + SSE parsing
  └── 內建 message state management
```

**重構後（Sprint 45）**：
```
AdminChatPanel
  ├── Conversation / Message (AI Elements)
  │     └── MarkdownRender (自製)
  │           ├── parseMarkdown (純函數)
  │           └── CodeBlock / CodeBlockContent (AI Elements + shiki)
  └── PromptInputProvider (AI Elements context)
        └── PromptInputWrapper
              ├── AttachmentsChips (自製)
              ├── PromptInputTextarea / Submit
              └── PromptInputActionMenu / AddAttachments

useChatStream (自製 hook, S45-B)
  ├── 串接 /api/admin/chat/stream (Sprint 43 backend)
  ├── SSE parsing (data: {content}\\n\\n)
  ├── status state machine
  └── attachments parameter (S45-C)
```

### 4.2 關鍵設計選擇

| 選擇 | 原因 |
|---|---|
| 用 `PromptInputProvider` 包 wrapper | `usePromptInputAttachments` 只能在 Provider 子樹內用 |
| `MarkdownRender` 自製 | `MessageResponse` 用 Streamdown 不支援客製 React 元件 |
| `parseMarkdown` 只支援 code block | AI 回應最常見，heading/list 留 Sprint 46+ |
| 附件純前端不上傳 | 真實上傳需 storage 選型，留 Sprint 46 |
| `dangerouslySetInnerHTML` + escape | 為了 inline markdown 簡潔，必先 escape `<>&` |

---

## 5. 測試演進

| 階段 | 測試總數 | 重點 |
|---|---|---|
| Sprint 44 Submit | 1587 | 既有 baseline |
| S45-A | 1592 | +5 AI Elements 元件存在守護 |
| S45-B | 1601 | +9 chat 整合守護 + 5 useChatStream |
| S45-C | 1613 | +5 attachments UI 守護 + 1 useChatStream attachment 測試 |
| S45-D | 1629 | +6 code block 守護 + 10 markdown-parser 純函數測試 |
| **S45-E** | **1629 + 14 E2E** | **+7 新 E2E（附件 + markdown + streaming indicator）** |

---

## 6. Sprint 揭露的教訓

### 6.1 shadcn AI Elements 安裝
- ✅ shadcn CLI 自動加依賴（`ai@7.0.85` + `use-stick-to-bottom@1.1.6`）
- ⚠️ shadcn CLI 預設互動式提示 — 用 `--yes --overwrite` 跳過
- ⚠️ AI Elements 用的 Button `size="icon-sm"` 沒在我們既有 variants → 補上
- ⚠️ `SelectTrigger` 不接 `size` prop，但 code-block 想傳 → 改用 className

### 6.2 React Context 範圍限制
- `usePromptInputAttachments` 只能在 `<PromptInput>` 或 `<PromptInputProvider>` 子樹內
- 在 function body 直接呼叫會 throw "must be used within PromptInput"
- 修法：拆 `PromptInputWrapper` 子元件，包在 `<PromptInputProvider>` 內

### 6.3 React 18 state batching + vitest
- `setInput(...)` + `send()` 兩段在 `act()` 內，可能 fetch 還沒用新 input
- 修法：`send(overrideInput?)` 第二個參數，直接傳 text 避免依賴 state

### 6.4 StreamController 全域 Map
- 多個 vitest 測試共用 `controllers` Map，會 abort 之前測試的 controller
- 修法：每個測試 `beforeEach` 呼叫 `clearAllStreams()`

### 6.5 finally 與 error state 競爭
- `catch` 設 `status='error'`，但 `finally` 設 `status='ready'` 會清掉
- 修法：`setStatus((prev) => prev === 'error' ? prev : 'ready')`

### 6.6 MessageResponse 不支援客製元件
- AI Elements `MessageResponse` 內部用 Streamdown（react-markdown-based）
- 不接受 children override — 對 React component 嵌入不友善
- 修法：自製 `MarkdownRender` + `parseMarkdown` + `renderInlineMarkdown`

### 6.7 dangerouslySetInnerHTML + XSS 防護
- 行內 markdown 樣式（`<strong>` `<em>` `<code>`）用 HTML 字串比 React node 簡潔
- **必須先 escape `< > &`**，否則 AI 回應含惡意 HTML 會被執行
- 守護測試：HTML 特殊字元應 escape

### 6.8 E2E 測試 fixtures
- Mock `/api/admin/chat/sessions` POST → 自動建立 session
- Mock `/api/admin/chat/stream` 延遲送出 → 驗證 streaming 指示
- Mock SSE body 用 `\n\n` 分隔 events

---

## 7. Sprint 46+ 待辦（從 Sprint 45 揭露）

1. **真實附件上傳**
   - `/api/admin/chat/upload` route
   - storage 選型（S3 / 本機 `public/uploads/` / Vercel Blob）
   - 檔案類型 / 大小 / 病毒掃描
   - Server 讀附件進 prompt context

2. **進階 Markdown**
   - headings / links / lists / images
   - 或裝 `react-markdown` + `remark-gfm` 取代自製 parser

3. **AI Elements Sources / Reasoning 元件**
   - 需要後端用 `toUIMessageStreamResponse()` 格式
   - 評估是否要為 Sources 改 backend（犧牲 Custom URL）
   - 或保留自製 Sources UI（從 metadata 顯示）

4. **訊息編輯 / 重新生成**
   - User 訊息編輯後重新送出
   - Assistant 訊息 regenerate

5. **附件縮圖預覽**
   - 圖片 inline preview
   - PDF 第一頁縮圖

---

## 8. SOP §4.x 改進驗證（Sprint 44-45 累計）

| §4.x 改進 | Sprint | 狀態 |
|---|---|---|
| §4.1 部署檢查 | 44 | ✅ Commit B |
| §4.2 placeholder migration | 44 | ✅ Commit A |
| §4.3 encryption key rotation | - | ⏳ Sprint 47+ |
| §4.4 schema change 雙軌驗證 | - | ⏳ Sprint 47+ |
| §4.5 file pattern vs e2e | 44-45 | ✅ 多 sprint 落實（既有 sprint-44-admin-chat-fab.spec.ts + sprint-45-chat-features.spec.ts）|
| §4.6 SOP 改進 | 44 | ✅ Commit C |

---

## 9. 結論

Sprint 45 成功交付 AI SDK Elements 整合（混合方案）+ Chat 功能擴展：

- **第一階段**：AI Elements 4 元件安裝（3 SP）
- **第二階段**：重構 AdminChatPanel 用 AI Elements（4 SP）
- **第三階段**：附件 UI 純前端（2 SP）
- **第四階段**：程式碼區塊高亮（2 SP）
- **第五階段**：E2E 守護（3 SP）
- **總計**：14 SP / 14 SP = **100%**

關鍵成功因素：
- **混合方案**保留 Sprint 43 Custom URL 投資
- **自製 markdown parser** 不依賴 Streamdown
- **Provider pattern** 讓 attachments context 正確分層
- **E2E + unit + integration 三層測試**確保品質

關鍵風險：
- 真實附件上傳（Sprint 46）需 storage 選型 + 安全驗證
- AI Elements Sources / Reasoning 元件需評估 backend 改造成本
- 自製 parser 維護成本（heading/list 留待 Sprint 46+）
