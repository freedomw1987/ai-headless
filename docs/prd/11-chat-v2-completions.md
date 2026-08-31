# PRD: Chat 補完 — Sources/Reasoning + Vision + Frontend Upload + Office Parser + Cleanup Cron + 安全守護（Sprint 47）

> **對應 User Story**：Sprint 47 七主題並進
> **對應模組**：M5（AI Chat）+ M0（部署/安全）
> **版本**：1.0.0
> **最後更新**：2026-08-31
> **狀態**：✅ **Plan Gate 完成（6 個決策全部 ✅）** + 🟡 **Design Gate 進行中**
> **PRD 完整度**：14 章節完備（FR/Schema/介面/API/測試/計劃/風險/排除/Plan Gate/Design Gate）
> **Plan Gate 文件**：[docs/sprint47-plan-gate.md](../sprint47-plan-gate.md)
> **Sprint 46 Reflection**（起點）：[docs/reflection/sprint-46-reflection.md](../reflection/sprint-46-reflection.md)

---

## 1. 模組概述

### 1.1 Sprint 47 目標

Sprint 47 在 Sprint 46 已實作的真實附件上傳 + 進階 Markdown 基礎上，補齊七個主題：

1. **Sources / Reasoning UI**：Sprint 46 PRD §7 規劃但未實作 — 從 pi-agent-sdk 的 `thinking_*` events 收集 reasoning + 「附件引用」折疊區
2. **Vision 多模態圖片**：用 pi-agent-sdk 原生 `PromptOptions.images` 取代 Sprint 46 的 base64+prompt 方案
3. **真實前端上傳**：Sprint 46 backend upload route 已實作，前端 `useChatStream` 還在 Sprint 45「📎 filename」字串假象
4. **Office Parser**：Sprint 46 attachment-reader 對 PDF/DOCX/XLSX/PPTX 只 return `kind: 'unsupported'` — Sprint 47 補 parser（先做 bundle spike）
5. **Cleanup Cron**：Sprint 46 commit 6 已實作 `cleanupOldAttachments()`，但沒接排程 — Sprint 47 接 Vercel Cron
6. **Session Ownership**：Sprint 46 reflection 揭露的 P2 安全風險 — stream route 沒驗證 sessionId 歸屬
7. **Markdown XSS 守護**：Sprint 46 守護測試顯式避免 `rehype-raw` 但缺端到端 XSS 驗證

### 1.2 為什麼這七個主題放一個 Sprint？

- **依賴鏈**：47-2 Vision（改 agent-sdk）→ 47-3 Frontend Upload（前端整合依賴後端）→ 47-7 XSS 守護（驗證前面所有 Markdown 改動）
- **安全閉環**：47-6 Session Ownership 補 Sprint 46 揭露的安全漏洞
- **Production 完備**：47-5 Cleanup Cron 把 Sprint 46 「永久保留」轉為「自動清理」，production 部署必要
- **依賴 Sprint 46 reflection**：47-0 到 47-7 都是 reflection 揭露的後續工作，集合在一個 Sprint 收尾

### 1.3 模組邊界

| 屬於 Sprint 47 | 不屬於 Sprint 47 |
|---|---|
| Sources 折疊區（顯示附件引用作為「來源」）| RAG / 向量資料庫 / 真實 source citation |
| Reasoning 區塊（從 `thinking_delta` 收集） | 外部 source 引用（Wikipedia / Web search）|
| pi-agent-sdk 原生 multi-modal image | 自組 base64+prompt 方案（Sprint 46 過渡方案淘汰）|
| 真實前端 multipart 上傳 + XHR abort + 進度條 | 拖放上傳（drag-and-drop） |
| Office Parser（PDF/DOCX/XLSX/PPTX）+ bundle spike | OCR / 掃描文件識別 |
| Vercel Cron + `pnpm cleanup:once` 雙軌 | 排程 UI / 動態 retention policy |
| `requireSessionOwnership()` helper + source-code guard | 全 Prisma extension global filter |
| Markdown XSS E2E 3 場景守護 | CSP / Trusted Types / DOMPurify |
| TD-S47-ChatStatus 自訂型別（冰盒）| `ChatStatus` runtime 重構 |

### 1.4 與 Sprint 46 的差異

| 維度 | Sprint 46 | Sprint 47（本 PRD）|
|---|---|---|
| Reasoning UI | ❌ 未實作（subscription 只處理 text_delta）| ✅ 從 `thinking_delta` 收集 + ReasoningSection 元件 |
| Sources UI | ❌ 未實作 | ✅ 降階為「附件引用折疊區」 |
| Vision 圖片 | ⚠️ base64 + prompt 自組 | ✅ pi-agent-sdk `PromptOptions.images` 原生 |
| Frontend Upload | ⚠️ Sprint 45「📎 filename」字串假象 | ✅ 真實 multipart + XHR abort + 進度條 |
| Office Parser | ❌ `kind: 'unsupported'` | ✅ PDF/DOCX/XLSX/PPTX（bundle spike 先評估）|
| Cleanup Cron | ⚠️ utility 已實作、沒排程 | ✅ Vercel Cron + `pnpm cleanup:once` |
| Session Ownership | ❌ 未檢查（reflection P2 風險）| ✅ `lib/auth/session-ownership.ts` helper + guard |
| Markdown XSS | ⚠️ source-code guard（避免 rehype-raw）| ✅ E2E 3 場景守護（user input / AI output / code block）|
| ChatStatus 型別 | ⚠️ 從 `'ai'` SDK import | 📋 冰盒（不影響功能，Sprint 48+）|

### 1.5 依賴關係

- **依賴**：Sprint 46（backend upload route + Attachment schema + agent-sdk 重構 + Markdown + cleanup utility）、Sprint 44-45（Chat drawer + sessions CRUD）、Sprint 43（Custom URL Provider）
- **被依賴**：Sprint 48+（RAG、OCR、訊息編輯、attachment 拖放、ChatStatus runtime 重構）

---

## 2. 功能清單（Functional Requirements）

### 2.1 FR-1：Office Parser Bundle Spike（Stage 47-0）

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| **FR-1.1** | 安裝 pdf-parse / mammoth / xlsx（測量 bundle size）| P0 | 0.2 |
| **FR-1.2** | 在測試環境解析 3 種檔案各 1 個樣本（PDF/DOCX/XLSX），測量解析時間 + bundle size | P0 | 0.2 |
| **FR-1.3** | 產出 spike 文件決策（做 / 只做 PDF / 延 Sprint 48）| P0 | 0.1 |

### 2.2 FR-2：Sources / Reasoning UI（Stage 47-1）

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| **FR-2.1** | `agent-sdk.ts` `session.subscribe` 處理 `thinking_delta`：累積字串到 `reasoningContent` | P0 | 0.5 |
| **FR-2.2** | `agent-sdk.ts` `streamChatMessages` 接受 `onReasoningDelta` callback | P0 | 0.3 |
| **FR-2.3** | `useChatStream.ts` 收集 `reasoningContent` 串流給前端 | P0 | 0.3 |
| **FR-2.4** | SSE protocol 擴展：`data: { reasoning: '...' }` event 給前端 | P0 | 0.2 |
| **FR-2.5** | `<ReasoningSection>` 元件：顯示 reasoning 字串 + 預設收合 + 點擊展開 + 鍵盤可達 | P0 | 0.5 |
| **FR-2.6** | `<SourcesList>` 元件（降階為「附件引用」）：顯示本次對話附件 chip 清單 + 預設收合 | P0 | 0.2 |
| **FR-2.7** | Message 元件整合：ReasoningSection 在 message content 上方、SourcesList 在下方 | P0 | 0.3 |

### 2.3 FR-3：Vision 多模態圖片（Stage 47-2）

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| **FR-3.1** | `attachment-reader.ts` 圖片分支改為 `readAttachmentImage()`（已實作，47-2 確認）| P0 | 0.3 |
| **FR-3.2** | `agent-sdk.ts` `streamChatMessages` 改用 `PromptOptions.images` 傳圖片給 SDK | P0 | 0.7 |
| **FR-3.3** | 圖片多張時合併 ImageContent[]（最多 10 張，跟 attachment 上限一致）| P0 | 0.3 |
| **FR-3.4** | `attachments` 參數型別改為支援圖片（不只文字）：`AttachmentRef[]` + `ImageAttachment[]` 雙型別 union | P0 | 0.3 |
| **FR-3.5** | 整合測試：上傳 PNG → AI 回應含圖片內容（用真實 Custom URL Provider）| P0 | 0.4 |

### 2.4 FR-4：真實前端上傳（Stage 47-3）

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| **FR-4.1** | `useChatStream.send()` 重構：先 multipart upload → 拿 attachment IDs → 傳 stream route | P0 | 1 |
| **FR-4.2** | XHR `XMLHttpRequest` + `onprogress` 事件顯示 0-100% 上傳進度 | P1 | 0.5 |
| **FR-4.3** | XHR `abort()` 整合：離開頁面 / 切換 session 時 abort 進行中上傳 | P0 | 0.5 |
| **FR-4.4** | 錯誤處理：10 MB 超限 toast「檔案過大」、MIME 不符 toast「不支援的格式」、RBAC 失敗導向登入 | P0 | 0.5 |
| **FR-4.5** | 進度條 UI 元件：shadcn Progress + 「上傳中 45%」文字 | P1 | 0.5 |
| **FR-4.6** | 整合測試：選檔 → upload → AI 回應（mock fetch）| P0 | 0.5 |
| **FR-4.7** | E2E：選檔 → upload → AI 回應含附件內容（Playwright）| P0 | 0.5 |

### 2.5 FR-5：Office Parser（Stage 47-4）

> **Sprint 47 決策**（spike 完成，見 [docs/spike/sprint47-office-parser.md](../spike/sprint47-office-parser.md)）：**只做 PDF（D-1 方案）**。DOCX/XLSX 延 Sprint 48+。
>
> **理由**：
> 1. **80/20 法則**：PDF 佔 Office 附件 60% use case
> 2. **Bundle 控管**：pdf-parse ~5-8 MB 還可接受；mammoth + xlsx 共 9.6 MB 額外負擔
> 3. **Sprint 47 整體時程**：保留 12 SP 給其他 6 個主題，安全守護不能被砍

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| **FR-5.1** | PDF parser：`pdf-parse` v2.4.5（class API: `PDFParse({ data }).getText()`）| P0 | 1 |
| **FR-5.2** | ~~DOCX parser（`mammoth`）~~ → **Sprint 48+** | — | 0 |
| **FR-5.3** | ~~XLSX parser（`xlsx`）~~ → **Sprint 48+** | — | 0 |
| **FR-5.4** | `attachment-reader.ts` 接入 PDF parser（kind: 'office' for PDF）| P0 | 0.5 |
| **FR-5.5** | 整合測試：sample.pdf fixture 解析成功 | P0 | 0.5 |
| **FR-5.6** | ~~bundle 影響評估~~ → 已包含在 [spike 文件](../spike/sprint47-office-parser.md) | — | 0 |

### 2.6 FR-6：Cleanup Cron（Stage 47-5）

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| **FR-6.1** | `vercel.json` 加 cron 設定：每日 03:00 UTC 呼叫 `/api/cron/cleanup-attachments` | P0 | 0.5 |
| **FR-6.2** | `/api/cron/cleanup-attachments` route 呼叫 `cleanupOldAttachments()` + Bearer token 守衛 | P0 | 0.5 |
| **FR-6.3** | `pnpm cleanup:once` script：本機手動觸發 + 顯示清理數量 | P0 | 0.5 |
| **FR-6.4** | 整合測試：route 回傳清理結果 JSON + token 守衛拒絕未授權 | P0 | 0.3 |
| **FR-6.5** | 文件：Vercel Cron 環境變數設定（CRON_SECRET）+ 本機 `.env.example` | P0 | 0.2 |

### 2.7 FR-7：Session Ownership（Stage 47-6）

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| **FR-7.1** | `lib/auth/session-ownership.ts`：`requireSessionOwnership(sessionId, userId)` 函式 | P0 | 0.3 |
| **FR-7.2** | stream route 整合：拿到 sessionId 後 call `requireSessionOwnership(sessionId, user.id)` | P0 | 0.3 |
| **FR-7.3** | 整合測試：user A 送 user B sessionId + attachment ID → 403 拒絕 | P0 | 0.3 |
| **FR-7.4** | source-code guard：所有用 body sessionId 的 route 必須 call `requireSessionOwnership`（掃 `app/api/admin/chat/**/*.ts`）| P0 | 0.1 |

### 2.8 FR-8：Markdown XSS E2E（Stage 47-7）

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| **FR-8.1** | E2E X1：user input 含 `<script>alert(1)</script>` → Markdown 渲染後應 escape | P0 | 0.15 |
| **FR-8.2** | E2E X2：AI output 含 `<img src=x onerror=alert(1)>` → 應 escape 不渲染為 HTML | P0 | 0.15 |
| **FR-8.3** | E2E X3：code block 內 `<script>` 不執行（已 escape，驗證不破壞）| P0 | 0.2 |

### 2.9 FR 總計

| 主題 | FR 數 | SP 總計 |
|---|---|---|
| FR-1 Office Spike | 3 | 0.5 |
| FR-2 Sources/Reasoning | 7 | 2.3 |
| FR-3 Vision | 5 | 2 |
| FR-4 Frontend Upload | 7 | 4 |
| FR-5 Office Parser | 3 | 2（只 PDF, spike 決策 D-1）|
| FR-6 Cleanup Cron | 5 | 2 |
| FR-7 Session Ownership | 4 | 1 |
| FR-8 Markdown XSS | 3 | 0.5 |
| **總計** | **37 FR** | **14 SP** |

---

## 2.10 FR-9 ~ FR-13：Sprint 48 技術債清理 + Office Rest 延伸（Stage 48-1 ~ 48-5）

**對應 Plan Gate**: [docs/sprint48-plan-gate.md](../sprint48-plan-gate.md)
**對應 Sprint 47 Reflection**: [docs/reflection/sprint-47-reflection.md](../reflection/sprint-47-reflection.md) 揭露 4/5 項

### FR-9：Lint Cleanup（Stage 48-1）

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| **FR-9.1** | 修 `react-hooks/exhaustive-deps` (admin-sidebar.tsx, settings/page.tsx) | P2 | 0.2 |
| **FR-9.2** | 修 `await-thenable` (roles/page.tsx, users/page.tsx) | P2 | 0.15 |
| **FR-9.3** | 修 `no-floating-promises` (conversation.tsx) | P2 | 0.15 |

### FR-10：ChatStatus 自訂型別（Stage 48-2）

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| **FR-10.1** | `chat-utils.ts` 自訂 `ChatStatus = 'ready' \| 'submitted' \| 'streaming' \| 'error'` 型別 | P2 | 0.1 |
| **FR-10.2** | `use-chat-stream.ts` 移除 `from 'ai'` import, 改 import 自 `chat-utils` | P2 | 0.1 |
| **FR-10.3** | source-code guard: 驗證無 `'ai'` SDK import on `use-chat-stream.ts` | P2 | 0.1 |

### FR-11：Upload Ownership Refactor（Stage 48-3）

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| **FR-11.1** | `app/api/admin/chat/upload/route.ts` 改 call `requireSessionOwnership(sessionId, user.id)` 取代內聯查詢 | P2 | 0.3 |
| **FR-11.2** | upload route guard test: 驗證 upload route 也 call helper | P2 | 0.2 |

### FR-12：Office Rest Bundle Spike（Stage 48-4）

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| **FR-12.1** | Spike 文件：評估 mammoth / xlsx / pptx 3 個依賴的 bundle 影響 | P1 | 0.2 |
| **FR-12.2** | PPTX parser library 選擇決策（pptxgenjs vs node-pptx vs 其他）| P1 | 0.3 |

### FR-13：Office Parser Rest - DOCX/XLSX/PPTX（Stage 48-5）

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| **FR-13.1** | DOCX parser: `mammoth` 動態 import + try/finally + 抽出文字 | P1 | 1 |
| **FR-13.2** | XLSX parser: `xlsx` 動態 import + try/finally + 每個 sheet 轉文字 | P1 | 1 |
| **FR-13.3** | PPTX parser: 依 spike 決策選 library + 動態 import + 每張 slide 抽文字 | P1 | 0.5 |
| **FR-13.4** | `attachment-reader.ts` 接入 3 個 parser (kind: 'office' 變體複用) | P1 | 0.3 |
| **FR-13.5** | 3 個 fixture (sample.docx / sample.xlsx / sample.pptx) + 整合測試 | P1 | 0.2 |

### FR 總計（含 Sprint 48）

| 主題 | FR 數 | SP 總計 |
|---|---|---|
| FR-1 ~ FR-8 (Sprint 47) | 37 | 14 |
| FR-9 Lint Cleanup | 3 | 0.5 |
| FR-10 ChatStatus | 3 | 0.3 |
| FR-11 Upload Ownership Refactor | 2 | 0.5 |
| FR-12 Office Rest Spike | 2 | 0.5 |
| FR-13 Office Parser Rest | 5 | 3 |
| **Sprint 48 新增** | **15 FR** | **~4.8 SP** |
| **總計 (Sprint 47+48)** | **52 FR** | **~18.8 SP** |

**Office Parser 降階情境**（已被 spike 決策解答）：
- ✅ Spike 結果：**D-1 方案（只做 PDF, 2 SP）** — 見 [spike 文件](../spike/sprint47-office-parser.md) §5
- 替選方案（已取消）：D-0 全做（5 SP）、D-2 延 Sprint 48（0 SP）

---

## 3. 資料模型

### 3.1 Schema 變更總覽

> **Sprint 47 不需新 schema 變更**。Sprint 46 已建好的 `Attachment` model + `ChatSession.deletedAt` 足以支撐所有 Sprint 47 主題。

### 3.2 既有 Schema（複習 Sprint 46 設計）

```prisma
// Sprint 46 FR-6.1 已實作
model Attachment {
  id          String   @id @default(cuid())
  sessionId   String
  session     ChatSession @relation(fields: [sessionId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  filename    String   // 原始檔名
  mimeType    String   // e.g. "application/pdf"
  size        Int      // bytes
  storagePath String   // ./uploads/<sessionId>/<uuid>.<ext>
  uploadedAt  DateTime @default(now())

  @@index([sessionId])    // 主要查詢: 列某 session 的所有附件
  @@index([uploadedAt])   // 次要查詢: Sprint 47+ cleanup job 按時間掃
  @@map("attachments")
}

// Sprint 46 FR-6.3 已實作 (Session 軟刪除為 Sprint 47 cleanup job 鋪路)
model ChatSession {
  id          String        @id @default(cuid())
  userId      String?
  title       String        @default("新對話")
  messages    ChatMessage[]
  attachments Attachment[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  deletedAt   DateTime?     // Sprint 47+ cleanup job: 軟刪除 session 連附件一併清
  @@index([deletedAt])
  @@map("chat_sessions")
}

model ChatMessage {
  id        String      @id @default(cuid())
  sessionId String
  role      String
  content   String      @db.Text
  metadata  Json?       // Sprint 47+ 可存 { reasoning: '...', sources: [...] } (規劃中)
  session   ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  createdAt DateTime    @default(now())
  @@index([sessionId, createdAt])
  @@map("chat_messages")
}
```

### 3.3 TypeScript 型別擴展（FR-3.4）

Sprint 47 對 `AttachmentRef` 型別擴展，新增 `image` 與 `office` 兩種 attachment：

```typescript
// Sprint 46: lib/ai/agent-sdk/agent-sdk.ts
export interface AttachmentRef {
  id: string;
  filename: string;
  mime: string;
  storagePath: string;
}

// Sprint 47 FR-3.4: 擴展為支援多類型
export type AttachmentRef =
  | {
      kind: 'text';
      id: string;
      filename: string;
      mime: string;
      storagePath: string;
    }
  | {
      kind: 'image';
      id: string;
      filename: string;
      mime: string;       // e.g. "image/png"
      base64: string;     // 已 base64 encode (從 readAttachmentImage 取得)
    }
  | {
      kind: 'office';     // Sprint 47 FR-5 解析後
      id: string;
      filename: string;
      mime: string;       // e.g. "application/pdf"
      content: string;    // 解析後的文字內容
    };
```

### 3.4 ChatMessage.metadata 規劃（Sprint 48+ 預留）

> **不在 Sprint 47 範圍**：寫 metadata 到 DB。但 Sprint 47 SSE protocol 擴展會傳 `reasoning` 欄位到前端；下次 Sprint 可考慮把 reasoning 也存 DB。

### 3.5 設計決策

| 決策 | 理由 |
|---|---|
| **不新增 schema** | Sprint 46 Attachment + deletedAt 已足；Sprint 47 都是「使用既有 schema」|
| **AttachmentRef union 型別** | 不同 kind 有不同處理（text → prompt, image → SDK image API, office → prompt）；用 TypeScript discriminated union 強制類型安全 |
| **ChatMessage.metadata 不寫 reasoning** | Sprint 47 UI 顯示 reasoning 來自 SSE 串流、不持久化；下次 Sprint 再決定是否要持久化 |
| **Office parser 不存解析結果到 DB** | 解析是純函式，每次請求重新解析；避免 schema 膨脹 |
| **Session ownership 走 helper 不走 Prisma extension** | Sprint 47 Q5 決策；明確設計 > 隱含設計（Sprint 42 TD-815 學習）|

---

## 4. 介面設計

### 4.1 元件樹（Sprint 47 新增 + 既有）

```
AdminChatPanel (Sprint 44)
├── Conversation (Sprint 45 AI Elements)
│   └── Message
│       ├── MessageContent (Sprint 45)
│       │     ├── ReasoningSection (🆕 Sprint 47)   ← FR-2.5
│       │     │     ├── <Thinking> SVG icon
│       │     │     ├── "AI 思考過程" 標題 (預設收合)
│       │     │     └── <pre> reasoning text (展開時顯示)
│       │     └── MarkdownRender (Sprint 46)
│       │           └── CodeBlock (Sprint 45)
│       └── SourcesList (🆕 Sprint 47)            ← FR-2.6
│             ├── <Paperclip> SVG icon
│             ├── "參考附件 (3)" 標題 (預設收合)
│             └── attachment chips (展開時顯示)
├── PromptInputProvider (Sprint 45)
│   ├── AttachmentsChips (Sprint 45)
│   │     └── UploadProgressBar (🆕 Sprint 47)   ← FR-4.5
│   └── PromptInputTextarea / Submit (Sprint 45)
└── (useChatStream.ts 整合 🆕 Sprint 47 真實上傳)  ← FR-4.1
```

### 4.2 ReasoningSection 元件（FR-2.5）

```
┌────────────────────────────────────────────────────────┐
│  AI 思考過程                                       ▼ │  ← 預設收合
└────────────────────────────────────────────────────────┘
展開後 ↓
┌────────────────────────────────────────────────────────┐
│ 🧠 AI 思考過程                                       ▲ │
├────────────────────────────────────────────────────────┤
│ 讓我先分析用戶的問題...                                 │
│ 1. 識別意圖：這是一個 CRUD 生成需求                     │
│ 2. 設計模組：用 Todo extension                         │
│ 3. 規劃 schema：title, description, completed           │
└────────────────────────────────────────────────────────┘
```

**互動**：
- 點擊 header 切換收合/展開（chevron icon 旋轉）
- 鍵盤：Tab 聚焦 + Enter/Space 切換
- reasoning 為空時不顯示元件
- 串流時自動展開（reasoning 持續更新），完成後 1.5 秒自動收合

### 4.3 SourcesList 元件（FR-2.6，降階為附件引用）

```
┌────────────────────────────────────────────────────────┐
│ 📎 參考附件 (3)                                      ▼ │  ← 預設收合
└────────────────────────────────────────────────────────┘
展開後 ↓
┌────────────────────────────────────────────────────────┐
│ 📎 參考附件 (3)                                      ▲ │
├────────────────────────────────────────────────────────┤
│ 📄 requirements.pdf (245 KB)                          │
│ 📊 data.csv (12 KB)                                  │
│ 🖼️  screenshot.png (89 KB)                            │
└────────────────────────────────────────────────────────┘
```

**互動**：
- 點擊 header 切換收合/展開
- 附件數為 0 時不顯示元件
- chip 顯示：圖示（依 mime）+ 檔名 + 大小
- 預設來源 = 本次對話附件（Sprint 47 降階）

### 4.4 UploadProgressBar 元件（FR-4.5）

```
┌─────────────────────────────────────────────────────┐
│ 📤 上傳中 45%                                    ✕ │  ← 取消按鈕
├─────────────────────────────────────────────────────┤
│ ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ 2.3 MB / 5.1 MB · report.pdf                         │
└─────────────────────────────────────────────────────┘
```

**互動**：
- XHR `onprogress` 事件更新 0-100%
- 點擊 ✕ 呼叫 `xhr.abort()`
- 上傳失敗顯示紅色 + 錯誤訊息

### 4.5 真實前端 upload 流程（FR-4.1-4.7）

```
User: 選檔 (file input)
  ↓
useChatStream.send(files):
  1. 建立 FormData(files[])
  2. POST /api/admin/chat/upload (XHR, onprogress → UploadProgressBar)
  3. 拿 attachment IDs
  4. POST /api/admin/chat/stream (SSE, onDelta → message)
     ├─ onReasoningDelta → reasoning state
     └─ onDelta → message content
  5. close UploadProgressBar
  6. render Message with ReasoningSection + MarkdownRender + SourcesList
```

### 4.6 Cleanup Cron 流程（FR-6.1-6.3）

```
Vercel Cron (每日 03:00 UTC)
  ↓
GET /api/cron/cleanup-attachments
  ↓ (Bearer token 驗證)
requireUser (system token) → cleanupOldAttachments()
  ↓
cleanupOldAttachments() (Sprint 46 commit 6):
  1. cutoff = now - 90 days
  2. 查 Attachment where uploadedAt < cutoff
  3. 逐個: unlink 檔案 + delete DB row
  4. return { deleted: N, failed: M }
  ↓
res.json({ deleted: N, failed: M })

手動 trigger (本機開發 / 緊急):
$ pnpm cleanup:once
  ↓
scripts/cleanup-attachments.ts (tsx 跑 cleanupOldAttachments)
  ↓
console.log("Cleanup complete: { deleted: N, failed: M }")
```

### 4.7 Session Ownership 流程（FR-7.1-7.4）

```
POST /api/admin/chat/stream
  body: { messages, sessionId, attachments: [{ id }] }
  ↓
requireUser() (Sprint 46 既有)
  ↓
isAdmin() (Sprint 46 既有)
  ↓
requireSessionOwnership(sessionId, user.id) (🆕 Sprint 47)
  ├─ db.chatSession.findUnique({ where: { id: sessionId }, select: { userId } })
  ├─ if not found → 404
  ├─ if session.userId !== user.id → 403 "Session does not belong to user"
  └─ else → 繼續
  ↓
db.attachment.findMany({ where: { id: { in }, sessionId } }) (Sprint 46 既有)
  ↓
streamChatMessages(...) (Sprint 47 改用 image multi-modal)
```

---

## 5. API 設計

### 5.1 既有 API（Sprint 46，不變）

| Method | Path | 功能 | Sprint |
|---|---|---|---|
| `POST` | `/api/admin/chat/upload` | 上傳附件（Sprint 46 FR-1.7）| Sprint 46 |
| `POST` | `/api/admin/chat/stream` | SSE 串流對話（Sprint 46 重構）| Sprint 44 + Sprint 46 |
| `GET` `/POST` `/PATCH` `/DELETE` | `/api/admin/chat/sessions/*` | sessions CRUD | Sprint 44 |

### 5.2 新增 API（Sprint 47）

#### 5.2.1 `GET /api/cron/cleanup-attachments`（FR-6.2）

**Request**：
```
GET /api/cron/cleanup-attachments
Headers:
  Authorization: Bearer <CRON_SECRET>
```

**Response 200**：
```json
{
  "deleted": 42,
  "failed": 0,
  "retentionDays": 90,
  "executedAt": "2026-09-01T03:00:00.000Z"
}
```

**Response 401**（token 缺失或錯誤）：
```json
{ "error": "Unauthorized" }
```

**Response 500**：
```json
{ "error": "Cleanup failed: <message>" }
```

**Vercel Cron 設定**（`vercel.json`）：
```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-attachments",
      "schedule": "0 3 * * *"
    }
  ]
}
```

### 5.3 修改 API（Sprint 47）

#### 5.3.1 `POST /api/admin/chat/stream`（FR-7.2）

**修改內容**：在 attachment 查詢前加 `requireSessionOwnership(sessionId, user.id)`

**Request**（不變）：
```json
{
  "messages": [{ "role": "user", "content": "..." }],
  "sessionId": "...",
  "attachments": [{ "id": "..." }]
}
```

**Response**（新增）：
- `403 Session does not belong to user`（user A 送 user B sessionId）
- `404 Session not found`

**SSE protocol 擴展**（FR-2.4）：
```
data: {"content": "讓我先"}
data: {"content": "分析這個問題..."}
data: {"reasoning": "用戶問的是"}        ← 🆕 Sprint 47
data: {"reasoning": " CRUD 生成需求"}
data: {"reasoning": "...完整思考..."}    ← 多個 reasoning event 累積
data: {"content": "我建議"}
data: [DONE]
```

### 5.4 `pnpm cleanup:once` script（FR-6.3）

```typescript
// scripts/cleanup-attachments.ts
import { cleanupOldAttachments } from '@/lib/ai/chat/attachment-cleanup';

async function main() {
  const result = await cleanupOldAttachments();
  console.log(`Cleanup complete: deleted=${result.deleted}, failed=${result.failed}`);
  process.exit(0);
}

main();
```

**`package.json`**：
```json
{
  "scripts": {
    "cleanup:once": "tsx scripts/cleanup-attachments.ts"
  }
}
```

### 5.5 SSE Protocol 變更總覽

| Event Type | Sprint 46 | Sprint 47 |
|---|---|---|
| `data: {"content": "..."}` | ✅ | ✅（不變）|
| `data: {"reasoning": "..."}` | ❌ | ✅（新增）|
| `data: {"error": "..."}` | ✅ | ✅（不變）|
| `data: [DONE]` | ✅ | ✅（不變）|

---

## 6. 測試計劃

### 6.1 測試 4 層架構

| 層級 | 工具 | 覆蓋範圍 |
|---|---|---|
| **單元測試 (Unit)** | Vitest | 純函式（helper、parser、validator）|
| **整合測試 (Integration)** | Vitest + mock fetch | route handler、agent-sdk、SSE protocol |
| **守護測試 (Guard)** | Vitest | source-code guard、檔案存在、import 位置、結構正確性 |
| **E2E** | Playwright | 完整用戶旅程（選檔 → upload → AI 回應）|

### 6.2 各 Stage 測試矩陣

| Stage | 主題 | 單元 | 整合 | 守護 | E2E |
|---|---|---|---|---|---|
| **47-0** | Office Parser Spike | 0 | 1 (spike 評估) | 0 | 0 |
| **47-1** | Sources/Reasoning | 4 (thinking_delta 收集、ReasoningSection、SourcesList) | 3 (useChatStream SSE) | 1 (Message 元件結構) | 1 (Reasoning 展開) |
| **47-2** | Vision | 2 (readAttachmentImage) | 2 (PromptOptions.images) | 1 (AttachmentRef union 型別) | 1 (PNG 上傳 vision) |
| **47-3** | Frontend Upload | 3 (XHR progress、abort、error) | 4 (multipart upload 整合) | 1 (UploadProgressBar 元件) | 2 (選檔 + upload + AI 回應) |
| **47-4** | Office Parser | 3 (PDF/DOCX/XLSX 解析) | 2 (attachment-reader 接 new parser) | 0 | 1 (PDF 上傳 AI 回應) |
| **47-5** | Cleanup Cron | 0 | 4 (route + token + Vercel Cron 設定) | 1 (vercel.json 存在) | 0 |
| **47-6** | Session Ownership | 2 (requireSessionOwnership) | 3 (user A/B 邊界測試) | 1 (source-code guard) | 0 |
| **47-7** | Markdown XSS | 0 | 0 | 0 | 3 (X1 user input / X2 AI output / X3 code block) |
| **總計** | | **14** | **19** | **5** | **8** |

**測試總計：46 個新測試**

### 6.3 關鍵測試場景

#### 47-1 Sources/Reasoning
- **Unit 1**：`session.subscribe` 收到 `thinking_delta` event → 累積字串到 `reasoningContent`
- **Unit 2**：`<ReasoningSection>` 預設收合、點擊展開、鍵盤可達
- **Unit 3**：`<SourcesList>` 顯示附件 chips、預設收合
- **Unit 4**：reasoning 為空時不渲染元件
- **Integration 1**：`useChatStream` 收集 SSE `{"reasoning": "..."}` events
- **Integration 2**：前端 SSE parser 同時處理 content + reasoning 雙 stream
- **Integration 3**：reasoning 串流完成後 1.5 秒自動收合

#### 47-2 Vision
- **Unit 1**：`readAttachmentImage` 正確 base64 encode PNG/JPEG
- **Unit 2**：`AttachmentRef` union 型別 discriminator 正確（`kind: 'image'`）
- **Integration 1**：`streamChatMessages` 呼叫 `session.prompt(text, { images: ImageContent[] })`
- **Integration 2**：多張圖片合併為 ImageContent[]
- **E2E 1**：上傳 PNG → AI 回應含圖片描述

#### 47-3 Frontend Upload
- **Unit 1**：XHR `onprogress` 計算 0-100%
- **Unit 2**：XHR `abort()` 取消進行中上傳
- **Unit 3**：UploadProgressBar 顯示「上傳中 45%」
- **Integration 1**：`useChatStream.send()` 先 upload 再 stream
- **Integration 2**：multipart upload 成功 → attachment IDs 傳 stream
- **Integration 3**：upload 失敗 → toast 錯誤訊息
- **Integration 4**：abort 與 SSE abort 互斥設計
- **E2E 1**：選檔 → upload → AI 回應
- **E2E 2**：選 10 MB+ 檔案 → toast「檔案過大」

#### 47-4 Office Parser
- **Unit 1**：PDF parser 提取所有頁面文字
- **Unit 2**：DOCX parser 提取段落文字
- **Unit 3**：XLSX parser 轉 CSV
- **Integration 1**：`attachment-reader.ts` PDF/DOCX/XLSX 分支正確
- **Integration 2**：解析失敗 → `kind: 'unsupported'` fallback
- **E2E 1**：上傳 PDF → AI 回應含 PDF 內容

#### 47-5 Cleanup Cron
- **Integration 1**：route 收到正確 Bearer token → 呼叫 `cleanupOldAttachments()` → 回傳清理結果
- **Integration 2**：route 收到錯誤/缺失 token → 401
- **Integration 3**：`vercel.json` cron 設定正確（path + schedule）
- **Integration 4**：`pnpm cleanup:once` script 跑通
- **守護 1**：`vercel.json` 檔案存在且含 `crons` 欄位

#### 47-6 Session Ownership
- **Unit 1**：`requireSessionOwnership(sessionId, userId)` 查 DB + 比對
- **Unit 2**：session 不存在 → throw / 回 404
- **Integration 1**：user A 送 user B sessionId → 403
- **Integration 2**：user A 送自己 sessionId → 通過
- **Integration 3**：stream route 完整流程含 ownership 檢查
- **守護 1**：source-code guard — 所有用 body sessionId 的 route 必須 call `requireSessionOwnership`

#### 47-7 Markdown XSS
- **E2E X1**：user input 含 `<script>alert(1)</script>` → Markdown 渲染後文字 escape 為 `&lt;script&gt;`
- **E2E X2**：AI output 含 `<img src=x onerror=alert(1)>` → 應 escape 不渲染為 HTML
- **E2E X3**：code block 內 `<script>` 不執行（已 escape，驗證不破壞）

### 6.4 測試覆蓋率目標

- **Lines**: ≥ 80%（Sprint 46 baseline ~78%）
- **Branches**: ≥ 75%
- **新增 46 測試後預估**：integration 1795 → 1841（+46），E2E 6 → 14（+8）

---

## 7. 開發計劃

### 7.1 7 個 Stage + 1 個 Pre-Spike 順序

```
47-0 (Spike, 0.5 SP)
  ↓ 評估 bundle
47-1 (Sources/Reasoning, 2 SP)
  ↓ reasoning API ready
47-2 (Vision, 2 SP)
  ↓ SDK image API ready
47-3 (Frontend Upload, 4 SP)
  ↓ 前端整合完成
47-4 (Office Parser, 5/2/0 SP, 條件)
  ↓ parser ready (若 spike 通過)
47-5 (Cleanup Cron, 2 SP)
  ↓ 排程上線
47-6 (Session Ownership, 1 SP)
  ↓ 安全修正
47-7 (Markdown XSS, 0.5 SP)
  ↓ E2E 守護
```

### 7.2 Stage 詳述

#### Stage 47-0 — Office Parser Bundle Spike（0.5 SP, 半天）

**Step 1（0.2 SP）**：
- 安裝 `pdf-parse @types/mammoth mammoth xlsx`
- `pnpm install`
- 記錄 lockfile 變化

**Step 2（0.2 SP）**：
- 寫 spike test（vitest）解析 3 種檔案各 1 個樣本
- 量測 `pnpm build` 後 bundle size 變化
- 量測解析時間

**Step 3（0.1 SP）**：
- 產出 `docs/spike/sprint47-office-parser.md` 決策文件
- 若 bundle ≤5MB：照做 47-4（5 SP）
- 若 5MB < bundle ≤10MB：D-1（只做 PDF, 2 SP）
- 若 bundle >10MB：D-2（延 Sprint 48, 0 SP）

**Commit 1**：`spike: office parser bundle evaluation (47-0)` 

#### Stage 47-1 — Sources/Reasoning UI（2 SP, 2 天）

**Step 1（0.5 SP）**：
- `agent-sdk.ts` `session.subscribe` 加 `thinking_delta` 處理
- 新增 `onReasoningDelta` callback 參數
- Unit test：thinking_delta 累積

**Step 2（0.5 SP）**：
- `useChatStream.ts` 收集 reasoning 串流
- SSE protocol 加 `data: {"reasoning": "..."}` event
- Integration test：SSE parser 雙 stream

**Step 3（0.5 SP）**：
- `<ReasoningSection>` 元件（shadcn Collapsible）
- `<SourcesList>` 元件（降階為附件引用）
- Message 元件整合

**Step 4（0.5 SP）**：
- E2E test：Reasoning 展開/收合
- 鍵盤可達 + 自動收合計時

**Commit 2**：`feat: sources & reasoning UI from pi-agent-sdk thinking events (47-1)`

#### Stage 47-2 — Vision 多模態圖片（2 SP, 2 天）

**Step 1（0.5 SP）**：
- `AttachmentRef` union 型別擴展（text/image/office）
- 守護測試：型別 discriminator 正確

**Step 2（0.7 SP）**：
- `streamChatMessages` 改用 `session.prompt(text, { images: ImageContent[] })`
- 整合測試：mock session.prompt 接收到 images 參數

**Step 3（0.4 SP）**：
- 整合測試：上傳 PNG → AI 回應（mock provider）
- 確認 mock provider 有收到 images

**Step 4（0.4 SP）**：
- E2E：上傳 PNG → 真實 Custom URL Provider vision

**Commit 3**：`feat: vision multi-modal via pi-agent-sdk images (47-2)`

#### Stage 47-3 — 真實前端上傳（4 SP, 4 天）

**Step 1（1 SP）**：
- `useChatStream.send()` 重構：先 upload 再 stream
- 多檔合併 multipart upload

**Step 2（0.5 SP）**：
- XHR `onprogress` 事件 + UploadProgressBar 元件
- Unit test：progress 計算

**Step 3（0.5 SP）**：
- XHR `abort()` 整合：useEffect cleanup + 切換 session
- 與 SSE abort 互斥設計

**Step 4（0.5 SP）**：
- 錯誤處理：toast (10 MB 超限 / MIME 不符 / RBAC 失敗)
- 整合測試：錯誤顯示

**Step 5（1.5 SP）**：
- Integration test：完整 upload + stream flow (4 個)
- E2E：選檔 → upload → AI 回應 (2 個)

**Commit 4**：`feat: frontend real upload with XHR abort and progress bar (47-3)`

#### Stage 47-4 — Office Parser（**2 SP, PDF only**, 條件已解答 — D-1 方案）

> **Spike 決策**（2026-08-31, 見 [spike 文件](../spike/sprint47-office-parser.md)）：只做 PDF，D-1 方案。

**Step 1（1 SP）**：PDF parser（pdf-parse v2.4.5, class API）
**Step 2（0.5 SP）**：`attachment-reader.ts` 接 PDF parser（新增 `kind: 'office'` 分支）
**Step 3（0.5 SP）**：整合測試 sample.pdf fixture 解析 + E2E PDF upload

**Commit 5**：`feat: office parser (PDF only, spike D-1) (47-4)`

#### Stage 47-5 — Cleanup Cron（2 SP, 2 天）

**Step 1（0.5 SP）**：
- `/api/cron/cleanup-attachments` route
- Bearer token 守衛

**Step 2（0.5 SP）**：
- `vercel.json` cron 設定
- `pnpm cleanup:once` script

**Step 3（1 SP）**：
- 整合測試：route + token + script
- 文件：`docs/spike/sprint47-cleanup-cron.md`（Vercel Cron 環境變數設定）

**Commit 6**：`feat: cleanup cron (Vercel Cron + pnpm script) (47-5)`

#### Stage 47-6 — Session Ownership（1 SP, 1 天）

**Step 1（0.3 SP）**：
- `lib/auth/session-ownership.ts` `requireSessionOwnership()` helper
- Unit test

**Step 2（0.3 SP）**：
- stream route 整合
- Integration test：user A/B 邊界

**Step 3（0.3 SP）**：
- source-code guard：所有用 body sessionId 的 route 必須 call helper
- 守護測試

**Step 4（0.1 SP）**：
- 文件：未來新 route 的 checklist

**Commit 7**：`feat: requireSessionOwnership helper + source-code guard (47-6)`

#### Stage 47-7 — Markdown XSS E2E（0.5 SP, 半天）

**Step 1（0.5 SP）**：
- Playwright E2E X1/X2/X3 三個場景
- 驗證 escape 後字串在 DOM 內

**Commit 8**：`test: markdown XSS E2E guard (47-7)`

### 7.3 Task 依賴圖

```
47-0 (Spike)
  └─> 47-4 (Office Parser)
        └─> 47-3 (Frontend Upload) [整合時需要 attachment reader 支援]
              └─> 47-7 (XSS)
                    └─> 47-5 (Cron) [需要前端 upload 完成才有資料]
                          └─> 47-6 (Session Ownership) [需 stream route 修改]

47-1 (Sources/Reasoning)  ← 可與 47-2 並行
47-2 (Vision)
```

### 7.4 預估 Commit 序列

| Commit | Stage | 主題 | SP | 預估時間 |
|---|---|---|---|---|
| 1 | 47-0 | spike: office parser bundle | 0.5 | 半天 |
| 2 | 47-1 | feat: sources & reasoning UI | 2 | 2 天 |
| 3 | 47-2 | feat: vision multi-modal | 2 | 2 天 |
| 4 | 47-3 | feat: frontend real upload | 4 | 4 天 |
| 5 | 47-4 | feat: office parser | 5 / 2 / 0 | 5 / 2 / 0 天 |
| 6 | 47-5 | feat: cleanup cron | 2 | 2 天 |
| 7 | 47-6 | feat: session ownership | 1 | 1 天 |
| 8 | 47-7 | test: markdown XSS E2E | 0.5 | 半天 |
| **總計** | | | **17 / 14 / 12 SP** | **17.5 / 14.5 / 12.5 天** |

### 7.5 4 Gate SOP 執行

每個 Commit 完整跑 4 個 Gate：

- **Gate 1（TDD）**：先寫測試紅，再實作綠，再寫整合測試
- **Gate 2（Lint + Typecheck）**：`pnpm lint && pnpm typecheck` 全綠
- **Gate 3（Regression）**：`pnpm test` 全部既有測試不破壞（1795 + 46 = 1841 unit/integration）
- **Gate 4（Reviewer）**：用 `dev-checker-loop` skill 校驗（每 Commit 結束跑一次）

---

## 8. 使用者故事

### 8.1 US-S46-SourcesReasoning（補 Sprint 46 PRD §7 漏做）

> **身為** admin 用戶
> **我想要** 在 AI 回應時看到 AI 的「思考過程」（reasoning）與「參考的附件」（sources）
> **以至於** 我能理解 AI 為何這樣回答、驗證 AI 是否真的有讀我上傳的附件

**驗收條件**：
- [ ] AI 回應時 reasoning 區塊預設收合、點擊展開
- [ ] reasoning 串流時自動展開、完成後 1.5 秒自動收合
- [ ] Sources 區塊顯示本次對話附件清單（檔名 + 大小）
- [ ] 鍵盤可達（Tab + Enter/Space）

### 8.2 US-S47-Vision（圖片多模態）

> **身為** admin 用戶
> **我想要** 上傳 PNG/JPG 圖片後，AI 能「看到」圖片內容並描述
> **以至於** 我能用圖片當 context（例如：截圖 bug、產品照、設計草圖）

**驗收條件**：
- [ ] 上傳 PNG/JPG/WebP/GIF 圖片
- [ ] AI 回應含圖片內容描述（例如：「這個截圖顯示...」）
- [ ] 多張圖片同時上傳 AI 都能看到（最多 10 張）

### 8.3 US-S47-FrontendUpload（真實前端上傳）

> **身為** admin 用戶
> **我想要** 在 chat 選檔時看到上傳進度、能在上傳中取消、上傳失敗有明確錯誤訊息
> **以至於** 我知道 AI 何時開始處理、上傳卡住時可取消、不會傻等

**驗收條件**：
- [ ] 選檔後看到「上傳中 0% → 100%」進度條
- [ ] 點擊 ✕ 取消上傳
- [ ] 10 MB+ 檔案立即 toast「檔案過大」
- [ ] MIME 不符（e.g. .exe）toast「不支援的格式」

### 8.4 US-S47-OfficeParser（PDF/DOCX/XLSX/PPTX）

> **身為** admin 用戶
> **我想要** 上傳 PDF/DOCX/XLSX/PPTX 辦公文件時，AI 能讀取內容並引用
> **以至於** 我能用文件當 context（例如：規格書、合約、報表）

**驗收條件**：
- [ ] 上傳 PDF → AI 回應含 PDF 文字內容
- [ ] 上傳 DOCX → AI 回應含文件段落
- [ ] 上傳 XLSX → AI 回應含 CSV 內容
- [ ] 解析失敗 → 明確錯誤訊息（不卡住）

### 8.5 US-S47-CleanupCron（自動清理 90 天前附件）

> **身為** 系統管理員
> **我想要** 90 天前的附件自動清理、不佔用磁碟空間
> **以至於** production 部署不會無限膨脹

**驗收條件**：
- [ ] Vercel Cron 每日 03:00 UTC 自動跑
- [ ] `pnpm cleanup:once` 本機手動可跑
- [ ] 清理結果有 log（刪除數、失敗數）

### 8.6 TD-S47-SessionOwnership（安全修正）

> **身為** admin 用戶
> **我想要** 我的 chat session 與附件不被其他用戶讀取
> **以至於** 隱私對話與敏感檔案不被外洩

**驗收條件**：
- [ ] user A 送 user B sessionId + attachment ID → 403 拒絕
- [ ] `requireSessionOwnership()` helper 可被未來新 route 重用
- [ ] source-code guard 防止未來 route 漏檢查

### 8.7 TD-S47-MarkdownXSS（XSS E2E 守護）

> **身為** 系統維護者
> **我想要** Markdown 渲染對 XSS 攻擊有 E2E 守護
> **以至於** Sprint 47+ 加 `rehype-raw` 引入 XSS 時被即時抓出

**驗收條件**：
- [ ] E2E 3 場景（user input / AI output / code block）全部通過
- [ ] 守護測試在 CI 必跑

### 8.8 TD-S47-ChatStatus（冰盒，Sprint 48+）

> **身為** 系統維護者
> **我想要** `ChatStatus` 型別不依賴 'ai' SDK
> **以至於** 'ai' SDK 大改版時不破壞 Chat 系統

> **不在 Sprint 47 範圍**：低優先、不影響功能、Sprint 48+ 再處理

---

## 9. 風險與緩解

### 9.1 風險列表

| ID | 風險 | 機率 | 影響 | 緩解策略 |
|---|---|---|---|---|
| **R1** | Office Parser bundle 過大（>5MB）| 中 | 中 | 47-0 spike 提前評估；降階為 D-1（只 PDF, 2 SP）或 D-2（延 Sprint 48）|
| **R2** | pi-agent-sdk PromptOptions.images API 在某些 provider 不支援 | 低 | 高 | 整合測試先驗證 mock provider；不支援時退回 base64+prompt 方案 |
| **R3** | XHR abort 與 SSE abort 衝突 | 低 | 中 | useChatStream 整合測試先寫；abort 互斥設計（upload 完成後才能 abort stream）|
| **R4** | Vercel Cron 免費 tier 限制（每天 1 次）| 低 | 低 | 預設每日 1 次足夠；fallback 用 `pnpm cleanup:once` |
| **R5** | Session Ownership 檢查漏 route | 低 | 高 | 47-6 source-code guard 掃描所有 `app/api/admin/chat/**/*.ts` |
| **R6** | Markdown XSS 在 Playwright 環境與實際瀏覽器行為不同 | 低 | 中 | Playwright 用真實 Chromium；CI 環境一致 |
| **R7** | Reasoning 串流 SSE 解析與現有 content 解析衝突 | 低 | 中 | 47-1 SSE parser 設計雙 stream 累積；整合測試覆蓋 |
| **R8** | Office parser 解析時間過長（>5 秒）| 中 | 中 | 解析在 server-side 背景執行；client 顯示「解析中」 |

### 9.2 風險優先處理順序

```
Critical（必須處理）: R5 (Session Ownership), R1 (Office bundle), R2 (Vision SDK)
High（應該處理）:    R3 (XHR/SSE abort), R7 (SSE 雙 stream), R8 (Office parse time)
Medium（可選處理）:  R4 (Vercel Cron), R6 (XSS Playwright)
```

---

## 10. 不在 Sprint 47 範圍（明確排除）

| 項目 | 排除理由 | 預計 Sprint |
|---|---|---|
| **RAG / 向量資料庫** | Sprint 46 PRD 已排除；Sprint 47 維持全文進 context | 48+ |
| **OCR / 掃描文件識別** | 需 ML 模型 + 第三方 API；不在 MVP 範圍 | 48+ |
| **訊息編輯 / 重新生成** | Sprint 46 PRD 已排除 | 48+ |
| **附件縮圖預覽** | UI 加分項；先滿足核心上傳 + 解析 | 48+ |
| **雲端 Storage（S3 / Vercel Blob）** | 本機 MVP 已足；production deploy 前需遷移 | 48+（deploy 前）|
| **Mermaid / LaTeX 渲染** | Markdown 進階擴展；Sprint 46 已用 react-markdown 完整支援 GFM | 49+ |
| **訊息標記 / 星號收藏** | 不在 Sprint 47 七主題內 | 49+ |
| **多模態影片 / 音訊** | pi-agent-sdk PromptOptions 目前只支援 image | SDK 上游支援後 |
| **Sources 改為外部引用**（Wikipedia / Web）| pi-agent-sdk 沒原生支援；Sprint 47 降階為「附件引用」 | 需 SDK 支援 |
| **TD-S47-ChatStatus 自訂型別** | 低優先，不影響功能 | 48+ |

---

## 11. 相關文檔

- 📐 [系統架構](../system-design.md)
- 🎨 [UX/UI 設計](../DESIGN.md)
- 📋 [Sprint 46 PRD（附件 + Markdown 起點）](./10-chat-attachments.md)
- 📋 [M5 AI Chat PRD（既有）](./06-ai-chat.md)
- 📋 [M4 AI Config PRD（Custom URL Provider 來源）](./05-ai-config.md)
- 📊 [Backlog](../backlog.md)
- 📝 [Sprint 47 Plan Gate 完整紀錄](../sprint47-plan-gate.md)
- 📝 [Sprint 46 Reflection（揭露 6 項問題來源）](../reflection/sprint-46-reflection.md)
- 📝 [Sprint 45 Reflection（AI Elements 基礎建設來源）](../reflection/module-sprint45-reflection.md)
- 📝 [Sprint 43 Reflection（Custom URL Provider 來源）](../reflection/module-sprint43-reflection.md)

---

## 12. 架構演進（Sprint 45 → 46 → 47）

### 12.1 元件層架構

```
Sprint 45（基礎建設）
└── AdminChatPanel
    ├── Conversation / Message (AI Elements)
    │     └── MarkdownRender (自製 parser)
    │           └── CodeBlock / CodeBlockContent (AI Elements + shiki)
    └── PromptInputProvider
          ├── AttachmentsChips (純前端 UI)
          └── PromptInputTextarea / Submit

Sprint 46（附件 + Markdown 真實化）
└── AdminChatPanel
    ├── Conversation / Message
    │     └── MarkdownRender (react-markdown + remark-gfm)
    │           └── CodeBlock (slot)
    └── PromptInputProvider
          ├── AttachmentsChips (純前端 UI，顯示「📎 filename」字串假象)
          └── PromptInputTextarea
          (useChatStream: Sprint 45 string 拼裝)

Sprint 47（本 PRD — 完整閉環）
└── AdminChatPanel
    ├── Conversation / Message
    │     ├── ReasoningSection (🆕 thinking_delta 累積)
    │     ├── MarkdownRender (Sprint 46)
    │     └── SourcesList (🆕 附件引用降階)
    └── PromptInputProvider
          ├── AttachmentsChips
          │     └── UploadProgressBar (🆕 XHR progress)
          └── PromptInputTextarea
          (useChatStream: 🆕 multipart upload + image SDK + SSE reasoning)
```

### 12.2 後端層架構

```
Sprint 46
├── /api/admin/chat/upload (multipart + RBAC + MIME 驗證 + 10MB 上限)
├── /api/admin/chat/stream (SSE via pi-agent-sdk + attachment text 拼 prompt)
├── /api/admin/chat/sessions/* (CRUD)
├── lib/ai/agent-sdk/agent-sdk.ts (streamChatMessages - text_delta only)
├── lib/ai/chat/attachment-reader.ts (text/image/unsupported)
└── lib/ai/chat/attachment-cleanup.ts (utility only, 沒接 cron)

Sprint 47
├── /api/admin/chat/upload (Sprint 46，不變)
├── /api/admin/chat/stream (🆕 image SDK + requireSessionOwnership)
├── /api/admin/chat/sessions/* (Sprint 44-46，不變)
├── 🆕 /api/cron/cleanup-attachments (Bearer token 守衛)
├── lib/ai/agent-sdk/agent-sdk.ts (🆕 thinking_delta + PromptOptions.images)
├── lib/ai/chat/attachment-reader.ts (🆕 office parser 接 pdf-parse/mammoth/xlsx)
├── lib/ai/chat/attachment-cleanup.ts (Sprint 46 utility，接 cron)
└── 🆕 lib/auth/session-ownership.ts (helper)
```

### 12.3 DB Schema 演進

| Sprint | 新增 model | 新增欄位 | 用途 |
|---|---|---|---|
| Sprint 44 | `ChatSession`, `ChatMessage` | — | AI Chat 基礎 |
| Sprint 46 | `Attachment` | `ChatSession.deletedAt` | 附件 + 軟刪除 |
| Sprint 47 | （無） | （無） | 全部用既有 schema |

### 12.4 測試基線演進

| Sprint | Unit/Integration | E2E | 來源 |
|---|---|---|---|
| Sprint 44 | 1629 | 127 | 收尾 baseline |
| Sprint 45 | +0 | +7 | AI Elements 整合 |
| Sprint 46 | +166 | +6 | 附件 + Markdown |
| **Sprint 47** | **+46** | **+8** | 本 PRD（7 主題）|
| **預估 Sprint 47 收尾** | **1841** | **141** | 完整 baseline |

---

## 13. Plan Gate 確認紀錄

### 13.1 Plan Gate 7 個決策

| # | 問題 | 決策 | 備註 |
|---|---|---|---|
| **Q1** | Sprint 47 範圍決策 | ✅ **方案 A — 17 SP 全包 + Office Parser 先 spike** | 預排 18 SP；Q2 後降 1 SP |
| **Q2** | Sources 降階方案 | ✅ **接受降階** — ReasoningSection 完整做 + SourcesList 改為「附件引用折疊區」| pi-agent-sdk 沒 sources 原生支援 |
| **Q3** | Cleanup Cron 部署 | ✅ **Vercel Cron + pnpm script 雙軌** | Vercel 免費 + 本機手動 trigger |
| **Q4** | Office Parser 降階 | ⏳ **待 47-0 spike 結果決定** | spike 通過 / D-1 / D-2 三方案 |
| **Q5** | Session Ownership 位置 | ✅ **helper + source-code guard** | `lib/auth/session-ownership.ts` + guard |
| **Q6** | Markdown XSS E2E 場景 | ✅ **3 場景完整守護** | user input / AI output / code block |
| **Q7** | Design Gate 順序 | ✅ **正常進 Design Gate，寫 PRD 14 章節** | 依 Sprint 46 模式 |

### 13.2 Plan Gate Spike 結果（技術 Q1 + Q2 驗證）

> **讀取位置**：
> - `node_modules/.pnpm/@earendil-works+pi-ai@0.84.4_.../dist/types.d.ts`（line 240-455）
> - `node_modules/.pnpm/@earendil-works+pi-agent-core@0.84.4_.../dist/types.d.ts`（line 385-410）
> - `node_modules/.pnpm/@earendil-works+pi-coding-agent@0.84.4_.../dist/core/agent-session.d.ts`（line 153-364）

| 技術問題 | 驗證結果 | 影響 SP 調整 |
|---------|---------|--------------|
| pi-agent-sdk 支援 sources/reasoning metadata？ | ⚠️ **部分支援**：有完整 `thinking_start/delta/end` events + `ThinkingContent`，**但沒有 `sources` events/field** | 47-1 從 3 SP → **2 SP**（SourcesList 降階為附件引用）|
| pi-agent-sdk 支援 multi-modal image？ | ✅ **完整支援**：`UserMessage.content: string \| (TextContent \| ImageContent)[]` + `PromptOptions.images?: ImageContent[]` | 47-2 從 3 SP → **2 SP**（直接傳 SDK）|

### 13.3 對話記錄

> 日期：2026-08-31
> 用戶：好，做 sprint 47
> BA(我)：依 SOP 進 Plan Gate Q1，先確認 Sprint 47 範圍（18 SP 全包 vs 13 SP 保守 vs 加碼 TD 債清理）
> 用戶：方案 A — 18 SP 全包 + Office Parser (D) 先做 spike 評估 bundle 風險
> BA(我)：Plan Gate Spike 實測 pi-agent-sdk 源碼，發現 sources 不支援但 reasoning 完整；降 1 SP 為 17 SP
> BA(我)：依 「一次一個問題」 問 Q1 降階方案 + Q3 部署 + Q5 檢查位置
> 用戶：接受降階 / Vercel Cron + pnpm script / helper + guard
> BA(我)：問最後 Q6 XSS 場景 + Design Gate 順序
> 用戶：3 場景完整守護 / 正常進 Design Gate 寫 PRD 14 章節
> BA(我)：Plan Gate 完成，進 Design Gate 寫 PRD

---

## 14. Design Gate 完成證明

### 14.1 Design Gate 6 個待辦

| # | 待辦 | 狀態 | 章節 |
|---|---|---|---|
| **1** | PRD 大綱（14 章節骨架）| ✅ | §1-14 完整結構 |
| **2** | FR 章節（8 大主題、40 FR）| ✅ | §2 + §2.9 總計表 |
| **3** | 介面設計（wireframes + 流程圖）| ✅ | §4.1-4.7 |
| **4** | Task 依賴 + Commit 規劃 | ✅ | §7.1-7.4 |
| **5** | 風險與緩解（8 個風險）| ✅ | §9 + §9.1-9.2 |
| **6** | Plan Gate 完整紀錄 + 完成證明 | ✅ | §13-14 |

### 14.2 Design Gate 完成證明

- ✅ PRD 結構完整：14 主章節 + 多個子章節
- ✅ FR 完整：40 個 FR、17.3 SP 對應明確（含 Office 降階情境）
- ✅ 介面設計：5 個 ASCII wireframe（ReasoningSection、SourcesList、UploadProgressBar、上傳流程、Cleanup Cron）+ 1 個 session ownership 流程圖
- ✅ API 設計：1 個新增 endpoint 完整（cleanup cron）+ 1 個修改 endpoint（SSE protocol 擴展）+ 1 個 pnpm script
- ✅ 測試計劃：4 層完整（Unit 14 + Integration 19 + Guard 5 + E2E 8 = 46 個新測試）
- ✅ 開發計劃：8 個 Commit（7 Stage + 1 Spike）+ Task 依賴圖 + 4 Gate SOP
- ✅ 風險管理：8 個風險列出 + 優先處理順序
- ✅ 架構演進：Sprint 45 → 46 → 47 元件 + 後端 + DB + 測試 四層演進圖
- ✅ Plan Gate 對話：7 個決策完整保留 + 2 個 spike 驗證
- ✅ 不在範圍項目：10 個明確排除（含預計 Sprint）

### 14.3 Sprint 47 收尾預期測試基線

- **Unit/Integration**：1795 → **1841**（+46）
- **E2E**：134 → **141**（+7，扣重複 +1 = +8）
- **新增守護測試**：5 個（ReasoningSection、AttachmentRef union、UploadProgressBar、vercel.json、Session Ownership source-code guard）
- **Commit 數**：8 個（1 spike + 7 feature/test）
- **總計**：17.3 SP / 17 天 / 8 commits

### 14.4 下一步

**Execution Gate（Gate 1-4 迴圈）**：
- 開 Commit 1（Office Parser Bundle Spike，0.5 SP）
- 跑 Gate 1（TDD 紅 → 綠）→ Gate 2（lint + typecheck）→ Gate 3（regression）→ Gate 4（reviewer）
- 依序 Commit 1-8，每 commit 完整跑 4 Gate
- 最終 Submit Gate（Commit 8 含 reflection + Sprint 47 reflection 文件）

**降階觸發點**：
- Commit 1 spike 完成後：若 bundle >5MB，降階為 D-1（只 PDF，砍 47-4 SP）；若 >10MB，降階為 D-2（延 Sprint 48）
- Sprint 47 最低保證 12 SP（不含 47-4 Office）
