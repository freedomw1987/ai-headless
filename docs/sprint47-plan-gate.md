# 🚀 Sprint 47 Plan Gate（2026-08-31）

> **Sprint 主題**：補完 Sprint 46 三個 P1 揭露 + 真實前端上傳 + Office Parser（含 spike） + Cleanup Cron + 安全守護
> **預估規模**：17 SP（7 個 Stage + 1 個 Pre-Spike）
> **Plan Gate 狀態**：✅ 全部 7 個決策完成
> **Design Gate 狀態**：✅ PRD 14 章節完成（[docs/prd/11-chat-v2-completions.md](prd/11-chat-v2-completions.md)）
> **起點**：Sprint 46 reflection §「發現的問題」6 項 + Sprint 47 預排

---

## 範圍決策（2026-08-31）

> 用戶：進入 Sprint 47
> BA(我)：依 SOP §2.1 進 Plan Gate，先確認 Sprint 47 範圍（18 SP 全包 vs 13 SP 保守 vs 加碼 TD 債清理）
> 用戶：方案 A — 18 SP 全包 + Office Parser (D) 先做 spike 評估 bundle 風險
> BA(我)：寫入 backlog，然後進入 Design Gate

### Plan Gate Spike 結果（2026-08-31，技術 Q1 + Q2 驗證）

> **讀取位置**：
> - `node_modules/.pnpm/@earendil-works+pi-ai@0.84.4_.../dist/types.d.ts`（line 240-455）
> - `node_modules/.pnpm/@earendil-works+pi-agent-core@0.84.4_.../dist/types.d.ts`（line 385-410）
> - `node_modules/.pnpm/@earendil-works+pi-coding-agent@0.84.4_.../dist/core/agent-session.d.ts`（line 153-364）

| 技術問題 | 驗證結果 | 影響 SP 調整 |
|---------|---------|--------------|
| **Q1** pi-agent-sdk 支援 sources/reasoning metadata？ | ⚠️ **部分支援**：有完整 `thinking_start/delta/end` events + `ThinkingContent`，**但沒有 `sources` events/field** | 47-1 從 3 SP → **2 SP**（ReasoningSection 完整做 + SourcesList 降階為「附件引用折疊區」）|
| **Q2** pi-agent-sdk 支援 multi-modal image？ | ✅ **完整支援**：`UserMessage.content: string \| (TextContent \| ImageContent)[]` + `PromptOptions.images?: ImageContent[]` | 47-2 從 3 SP → **2 SP**（直接傳 SDK，不需自己組 prompt）|

### 驗證細節

#### 1. Reasoning 支援（✅ 完整）
```typescript
// AssistantMessageEvent 完整支援
type: "thinking_start" | "thinking_delta" | "thinking_end"

// AssistantMessage.content 包含 ThinkingContent
interface ThinkingContent {
  type: "thinking";
  thinking: string;
  thinkingSignature?: string;
  redacted?: boolean;
}
```
→ 訂閱 `session.subscribe` 監聽 `message_update.assistantMessageEvent.type === 'thinking_delta'` 即可收集 reasoning 字串

#### 2. Sources 不支援（❌ 無原生）
```typescript
// AssistantMessage 沒有 sources 欄位
// AssistantMessage.content 只有 TextContent | ThinkingContent | ToolCall，沒有 SourceContent
```
→ **降階方案**：把「Sources」重新定義為「用戶附件引用折疊區」（顯示本次對話上傳的檔案清單，作為 AI 的「來源」），不做 AI 引用的外部 source

#### 3. Image multi-modal 支援（✅ 原生 API）
```typescript
// pi-coding-agent PromptOptions
interface PromptOptions {
  images?: ImageContent[];  // 直接傳 ImageContent[]
}

interface ImageContent {
  type: "image";
  data: string;     // base64
  mimeType: string;
}

// session.prompt 用法
session.prompt("這張圖是什麼？", {
  images: [{ type: "image", data: base64Data, mimeType: "image/png" }],
  streamingBehavior: "followUp",
});
```
→ 比 Sprint 46 attachment-reader 的 base64+prompt 方案更乾淨；47-2 簡化為「attachment-reader 圖片分支改為不解析、傳 SDK」

**Sprint 47 修正範圍（17 SP）**：

| # | 優先級 | User Story / TD | SP | 備註 |
|---|------|-----------------|----|------|
| 47-0 (Spike) | P0 | **Office Parser Bundle Spike** | 0.5 | 先評估 pdf-parse + mammoth + xlsx bundle 影響；若不可接受降階方案 |
| 47-1 | P0 | **US-S46-SourcesReasoning**（補 PRD §7） | 3 | Sprint 46 漏做；從 pi-agent-sdk `AssistantMessageEvent` 抽 metadata |
| 47-2 | P0 | **US-S47-Vision**（圖片直送 multi-modal） | 3 | pi-agent-sdk `image` 附件 API 整合 |
| 47-3 | P0 | **US-S47-FrontendUpload**（真實上傳 + XHR abort + 進度條） | 4 | backend `/api/admin/chat/upload` 已有，前端接 server |
| 47-4 | P1 | **US-S47-OfficeParser**（PDF/DOCX/XLSX，依 spike 結果） | 5 | 條件執行：spike 通過才做，否則降階 |
| 47-5 | P1 | **US-S47-CleanupCron**（Vercel Cron / node-cron） | 2 | 接 `cleanupOldAttachments()` |
| 47-6 | P2 | **TD-S47-SessionOwnership** | 1 | stream route 加 session ownership check |
| 47-7 | P2 | **TD-S47-MarkdownXSS**（XSS E2E 守護） | 0.5 | 防 Sprint 47+ 加 rehype-raw 引入 XSS |
| 47-7 | P2 | **TD-S47-MarkdownXSS**（XSS E2E 守護） | 0.5 | 防 Sprint 47+ 加 rehype-raw 引入 XSS |
| **總計** | | | **17 SP**（原 18 SP，Q1 降 1 SP） |

**降階情境**：
- 若 47-0 spike 顯示 bundle 不可接受：47-4 降為「只做 PDF」(2 SP) 或整個延到 Sprint 48
- Sprint 47 最低保證 12 SP（不含 47-4 Office）

---

## Stage 拆分（待 Design Gate 細化）

| Stage | 主題 | 預估 SP | 關鍵交付 | 改動模組 | 依賴 |
|---|---|---|---|---|---|
| **47-0** | Office Parser Bundle Spike | 0.5 | 評估 pdf-parse + mammoth + xlsx 安裝後 bundle size + 解析時間；產出文件決策 | M5 backend | — |
| **47-1** | Sources/Reasoning UI 補做 | 2 | ReasoningSection（從 `thinking_delta` 收集）+ SourcesList 降階為「附件引用折疊區」+ Message 下方預設收合 | M5 frontend | pi-agent-sdk 源碼確認 ✅ |
| **47-2** | 圖片 vision 整合 | 2 | `agent-sdk.ts` 改用 `session.prompt(text, { images: ImageContent[] })`；attachment-reader 圖片分支改為「不解析、傳 SDK」 | M5 backend | pi-agent-sdk 源碼確認 ✅ |
| **47-3** | Frontend 真實上傳 | 4 | `useChatStream.send()` 重構：先 fetch upload route → 拿 attachment ID → 傳 stream route；XHR abort 整合；進度條 UI | M5 frontend | 47-2 完成（先確認圖片走法） |
| **47-4** | Office Parser | 5 | PDF (pdf-parse) + DOCX/PPTX (mammoth) + XLSX (xlsx)；attachment-reader 接入新 parser | M5 backend | 47-0 spike 通過 |
| **47-5** | Cleanup Cron | 2 | Vercel Cron `vercel.json` 設定 + `/api/cron/cleanup-attachments` route + 手動觸發 fallback | M5 backend / M0 | 47-3（前端上傳已實作才有資料） |
| **47-6** | Session Ownership | 1 | `requireSessionOwnership(sessionId, userId)` middleware + stream route 整合 | M5 backend | — |
| **47-7** | Markdown XSS E2E | 0.5 | Playwright E2E: `<script>alert(1)</script>` 應 escape；3 個場景（user input / AI output / code block） | M5 e2e | Sprint 46 Markdown 已實作 |

---

## 技術問題決策（2026-08-31 Plan Gate Q1-Q3）

| 問題 | 決策 | SP 影響 |
|------|------|---------|
| **Q1** SourcesList 怎麼做？ | ✅ **接受降階方案** — ReasoningSection 完整做 + SourcesList 降階為「附件引用折疊區」 | 47-1 = 2 SP（不變）|
| **Q2** 多模態圖片？ | ✅ **用 pi-agent-sdk 原生**：`session.prompt(text, { images: ImageContent[] })` | 47-2 = 2 SP |
| **Q3** Cleanup Cron 部署？ | ✅ **Vercel Cron + pnpm script 雙軌** | 47-5 = 2 SP |
| **Q4** Office Parser 降階方案 | ⏳ **待 47-0 spike 結果決定** | 47-4 = 5 SP（spike 通過）/ 2 SP（只做 PDF）/ 0 SP（延 Sprint 48）|
| **Q5** Session Ownership 位置？ | ✅ **helper + source-code guard** — `lib/auth/session-ownership.ts` + 所有用 body sessionId 的 route 必須 call | 47-6 = 1 SP |
| **Q6** Markdown XSS E2E 場景 | ⏳ **待 Plan Gate 確認** | 47-7 = 0.5 SP |

---

## 剩餘待解決問題（進 Design Gate 前需確認）

### Q4（Office Parser spike） → 等 47-0 開工時自動評估，不需現在拍板
- 若 spike 顯示 bundle >5MB：自動降階為 D-1（只做 PDF, 2 SP）或 D-2（延 Sprint 48, 0 SP）
- 若 spike 顯示 bundle ≤5MB：照做 5 SP
- Plan Gate 不拍板，交給 spike 決定

### Q6（Markdown XSS E2E 場景） ✅ 已決策 2026-08-31
- ✅ **3 場景完整守護**：X1 (user input `<script>`) + X2 (AI output `<img onerror>`) + X3 (code block 內 `<script>`)
- 0.5 SP 涵蓋 3 個場景

---

## 風險預視（PRD §13 對齊）

---

## 風險預視（PRD §13 對齊）

| ID | 風險 | 機率 | 影響 | 對策 |
|---|---|---|---|---|
| **R1** | pi-agent-sdk 不支援 sources/reasoning metadata | 中 | 高 | 退回純文字回應，47-1 改做技術債清理（必在 47-1 開工前 spike） |
| **R2** | pi-agent-sdk 不支援 multi-modal image | 中 | 高 | 退回 base64+prompt（Sprint 46 attachment-reader 已實作） |
| **R3** | Office Parser bundle 過大（>5MB） | 中 | 中 | 47-0 spike 提前評估；降階 D-1/D-2/D-3 |
| **R4** | Vercel Cron 部署限制（free tier 1 天 1 次） | 中 | 低 | fallback 用 `pnpm cleanup:once` 手動觸發；或升級 Vercel plan |
| **R5** | Session ownership 檢查漏 route | 低 | 高 | ✅ 已決策：47-6 source-code guard 防止漏 call |
| **R6** | Frontend upload XHR abort 與現有 SSE abort 衝突 | 低 | 中 | useChatStream 整合測試先寫；abort 互斥設計 |

---

## 路線圖

```
Sprint 47-0 (Spike) ──→ 47-1 Sources/Reasoning ──→ 47-2 Vision ──→ 47-3 Frontend Upload ──→ 47-4 Office Parser (條件) ──→ 47-5 Cleanup Cron ──→ 47-6 Session Ownership ──→ 47-7 Markdown XSS
       │                    │                       │                      │                            │                          │                            │                          │
   bundle 評估         metadata 驗證           multi-modal 驗證        useChatStream 重構          條件執行                  排程設定                    security middleware          XSS E2E
```

---

## 下一步

1. ✅ Plan Gate 範圍決策完成（2026-08-31）：17 SP（Q1 降 1 SP）
2. ✅ 技術 Q1/Q2/Q3/Q5/Q6 全部拍板
3. ✅ Design Gate 完成：PRD 14 章節（[docs/prd/11-chat-v2-completions.md](prd/11-chat-v2-completions.md)，1157 行）
4. ⏳ **進 Execution Gate**：開 Commit 1（Office Parser Spike，0.5 SP）→ 跑 4 Gate → 依序 Commit 1-8

---

**Sprint 47 Plan Gate 收工，Design Gate 待開** 🎯
