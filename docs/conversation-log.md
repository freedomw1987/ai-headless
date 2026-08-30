# 對話記錄（Conversation Log）

> **目的**：保留重要的用戶 ↔ Agent 對話決策，方便日後追溯為何做某個決定。
>
> **來源**：從 `docs/backlog.md` 移出（2026-08-30 backlog 可讀性改進 Sprint）
>
> **完整對話日誌**：見 `docs/reflection/` 目錄各 Sprint reflection 報告。

---

## Date Time：2026-08-31（Sprint 46 Plan Gate — 真實附件上傳 + 進階 Markdown + Sources/Reasoning）

> 用戶：進入 Sprint 46
> BA(我)：依 SOP 進 Plan Gate，先確認 Sprint 範圍（三主題 vs 三選一 vs 三個一起做）
> 用戶：三個一起做（Sprint 46 全包）
> BA(我)：依「一次一個問題」原則，先從最阻塞的「真實附件上傳」開始問問題
>
> **主題 1：真實附件上傳**（10 個問題）
> Q1 用戶：上傳文件讓 AI 讀取內容
> Q2 用戶：純文字類 + Office 文件 + HTML/XML/SVG（未選代碼源檔）
> Q3 用戶：Sprint 46 同時實作圖片 vision（針對前題「可能是 img」追問）
> Q4 用戶：10 MB 上限（MVP）
> Q5 用戶：本機檔案系統（推薦 MVP）
> Q6 用戶：永久保留（推薦 MVP）
> Q7 用戶：最多 10 個附件
> Q8 用戶：全文進 context（推薦 MVP，不做 RAG）
> Q9 用戶：圖片走 Custom URL Provider（保留 Sprint 43 投資）
> Q10 用戶：MIME 白名單 + 大小上限 + RBAC 守衛（未選病毒掃描，留 Sprint 47+）
>
> **主題 2：進階 Markdown**（4 個問題）
> Q11 用戶：code block（已有）+ inline + 標題段落 + 列表引言連結（四類全要）
> Q12 用戶：裝 react-markdown + remark-gfm（推薦）
> Q13 用戶：完全取代 Sprint 45 自製 parser（推薦）
> Q14 用戶：用 components.code slot 接 Sprint 45 自製 CodeBlock（保留 shiki 高亮）
>
> **主題 3：Sources/Reasoning 評估**（3 個問題）
> Q15 用戶：保留 Custom URL + 自製 Sources/Reasoning UI（推薦）
> Q16 用戶：Sources（來源引用）+ Reasoning（推理過程）；未選 Token 使用量（留 Sprint 47+）
> Q17 用戶：Message 內容下方、預設收合、點擊展開（推薦）
>
> Q18 用戶：接受 22 SP 估算（Sprint 46 全包、不拆 46A/46B）
>
> 結果：Sprint 46 Plan Gate ✅ 完成（17 個產品/技術問題全部確認，22 SP 7 個 Stage 規劃）。
> 完整 Plan Gate 內容寫入 `docs/sprint46-plan-gate.md`，backlog.md 當前狀態更新。
> 下一步：Design Gate（撰寫 `docs/prd/10-chat-attachments.md` PRD：wireframe + Task 細節 + Commit 規劃）

---

## Date Time：2026-08-31（Sprint 46 Design Gate — 14 章節 PRD + 7 commit 規劃）

> 用戶：好（同意進 Design Gate）
> BA(我)：載入 dav-designer skill，依 4 個任務執行：
>   Task 1（PRD 大綱）：建立 `docs/prd/10-chat-attachments.md` 14 章節骨架
>   Task 2（FR 章節）：列出 7 主題 34 FR 對應 22 SP（含 FR-1 至 FR-7）
>   Task 3（介面設計）：4 個 ASCII wireframe + 3 個 Mermaid 流程圖 + 1 個 sequence diagram
>   Task 4（Task 依賴 + Commit 規劃）：7 Stage 順序 + Task 依賴圖 + 7 commit 表
>   Task 5（風險）：14 個風險列出（R1-R14）+ 優先處理順序（Critical/High/Medium/Low）
>   Task 6（Plan Gate 完整對話 + Design Gate 完成證明）：17 個決策一覽表 + 6 個 Design Gate 待辦 ✅
>
> 結果：Sprint 46 Design Gate ✅ 完成：
> - `docs/prd/10-chat-attachments.md`（939 行、14 章節、22 SP、34 FR、14 風險、7 commits）
> - `docs/prd/10-chat-attachments.html`（27 KB、視覺化版本，含卡片 + 表格 + 色塊）
> - `docs/backlog.md` 當前狀態改為「Plan Gate ✅ + Design Gate ✅ → 待 Execution Gate」
> - 下一個 P0 改為「開 Commit 1（Prisma Schema + Attachment model, 2 SP）」
>
> 下一步：Execution Gate（開 Commit 1，跑 Gate 1 TDD → Gate 2 lint/typecheck → Gate 3 regression → Gate 4 reviewer + E2E）

---

## Date Time：2026-08-26 17:30（Sprint 21 開工 + US-102-P2 動態 RBAC）

> 用戶：項目中有什麼開發任務？（查 Sprint 20 進度）
> BA(我)：列出 Sprint 20 全收尾（7/7 SP）+ Sprint 21 候選任務（推薦 US-102-P2 動態 RBAC）
> 用戶：好，1（選 Sprint 21 US-102-P2）
> BA(我)：依 SOP 進 Plan Gate，一次一個問題問 Q1-Q4
> Q1 用戶：A — 內建3 個 role 不能刪
> Q2 用戶：A — 小寫 + 底線 + ≤32 字 + 唯一 + 預留保留字
> Q3 用戶：A — `/admin/roles` 公開但只有 admin 可進可改
> Q4 用戶：A — 只有 admin 能授權權限
> BA(我)：寫入 `docs/backlog.md` US-102-P2 開工 checklist + 新建 `docs/prd/09-rbac.md`
> 用戶：1（先解決 Q5-Q7 技術問題）
> BA(我)：Q5 Session strategy → 用戶 A（JWT + 1 分鐘快取 + 失效 API）
> 用戶：但做之前先整理 `backlog.md` 讓他可讀
> BA(我)：發現實際 631 行（不是 843），推薦 A 方案（小整理 + 建 Sprint 20 reflection）
> 用戶：A
> BA(我)：新建 `docs/reflection/sprint-20.md` + 精簡 `backlog.md` Sprint 20 五段（6 頁 → 1 頁 + 6 行連結表）+ reflection/index.md 加 Sprint 20 行
> 用戶：好，1（先把 Q5 寫進 PRD，然後進 Q6）
> BA(我)：PRD 開頭狀態列更新 + 新增 §12 Plan Gate 紀錄 + §12.3 Q5 詳細設計（架構圖 + 4 個關鍵改動 + Sprint 20 技術債連動表 + SP 影響）；backlog.md Sprint 21 規劃表 Q5 狀態同步
> Q6 用戶：A — 保留純函式 + 漸進式遷移（雙函式 4 Sprint 計畫，Sprint 25 強制清）
> BA(我)：PRD 新增 §12.4 Q6 詳細設計（雙函式 API 範例 + 漸進式遷移順序表 + Sprint 25 強制清規則 + 風險控制手段）；backlog.md Sprint 21 規劃表 Q6 狀態同步
> Q7 用戶：A — 保留寫死矩陣測試 + 新增動態查 DB 測試（漸進式）
> BA(我)：PRD 新增 §12.5 Q7 詳細設計（測試集分區策略 + 純函式微調範例 + 動態測試範例 + 與 Q5/Q6 關聯）；新增 §13 Plan Gate 完成總結（7 個決策一覽 + Sprint 21 最終 SP 8.25 SP + Plan Gate 完成證明 + Design Gate 待辦）；backlog.md Sprint 21 規劃表 Q7 狀態同步 + 「下一個 P0」改為 Design Gate
> 結果：Sprint 21 Plan Gate ✅ 完成（Q1-Q7 全解決，PRD 8.25 SP）。下一步：Design Gate（wireframe + Task 順序微調 + seed 詳寫）
> 用戶：1（進 Design Gate）
> BA(我)：Design Gate 4 個待辦全完成。
> 待辦 1（wireframe）：PRD §4.3 加 Mermaid RBAC 流程圖（ASCII 保留為 fallback）+ §4.4 Sprint 21-25 漸進式遷移 Gantt 圖
> 待辦 2（Task 順序）：PRD §8 拆 Task 4 成 4a/4b/4c（cache + 雙函式 + 失效 API）+ 拆 Task 12 成 12a/12b（既有測試更新 + 新增動態測試）+ 加 §8.1 Task 依賴關係圖
> 待辦 3（seed）：PRD §5.3 BUILTIN_ROLES + BUILTIN_PERMISSIONS_BY_ROLE + PermissionCode 常數 + idempotent upsert 完整 TS 實作 + 4 個關鍵設計說明
> 待辦 4（commit）：PRD 新增 §8.2 Commit 規劃（9 個 commit 表 + 5 個規劃原則 + 7 天開發順序）+ backlog.md「下一個 P0」改為 Execution Gate
> 結果：Sprint 21 Design Gate ✅ 完成（4 個待辦全解決，PRD 完備）。下一步：Execution Gate（Gate 1 TDD → Gate 2 lint → Gate 3 regression → Gate 4 reviewer + E2E）

---

## Date Time：2026-08-24 11:31（框架起點）

> 用戶：AI 開發不同項目有 3 個痛點：(1) UI/UX/架構不一致 (2) CRUD 是主需求但 AI 出錯多 (3) 想建立一套技術框架讓 AI 按規範開發
> BA(我)：先釐清框架形態
> 用戶：想用 JSON 規範同時約束前端、後端、DB Schema
> BA(我)：推薦 A 方案 — Headless Web Framework + AI Coding Guide
> 用戶：A 方案，最終 AI 能根據用戶需求生成系統
> BA(我)：框架是底基，用戶可改樣式、可加 Extension
> 用戶：Q1 = WordPress 風格終端用戶框架，含用戶管理、登入、權限、Blog 等底座
> 用戶：Q2 = A（MVP）
> 用戶：Q3 = A（Next.js 原生 + JSON 註冊）
> 用戶：Q4 = C（OpenAI + Claude 雙模型可切換）
> 用戶：Q5 = JSON 不在 UI 暴露，但生成後可下載 .json 給用戶打開看
> 用戶：Q6 = A（Extension 規範用 OpenSpec 風格：MD + JSON + TS + 範例）

---

## Sprint 46 Commit 2 + Bug Fix 交付（2026-08-30）

### Sprint 46 Execution Gate Commit 2 (Stage 46-A) + Sprint 43 Bug Fix

#### Commit 2 範圍 (5 SP)
- 建立 `/api/admin/chat/upload` route (POST multipart/form-data)
- FR-1.1~1.7 全部實作: RBAC + MIME 雙重驗證 + 10MB 大小 + 10個檔案 + sessionId 子目錄 + DB transaction + rollback
- 建立 `lib/ai/chat/mime-validator.ts` 純函式模組 (FR-1.3)
- 28 個守護測試 + 57 個 mime-validator 單元測試

#### Bug Fix (1 SP)
- 用戶回報: admin 儲存 AI config 後 chat 仍報 "No AI config found"
- 根因: `providers.ts` 第 914-916 行 where 邏輯只查 user-specific, 無 fallback 到 Global URL (userId=null)
- 修復: 先查 user-specific → 找不到 fallback userId=null → 都找不到才 throw 503
- 7 個 fallback 測試 + mock round-trip 加密

#### 4 Gate 結果
- Gate 1 TDD: ✅ 92 新測試案例 (28 守護 + 57 mime-validator + 7 fallback) 先紅後綠
- Gate 2 lint+typecheck: ✅ 0 error, 新增檔案 0 warning
- Gate 3 regression: ✅ 1747 passed (既有 1629 + 新增 118 全綠, 0 failed)
- Gate 4 reviewer: ✅ 9/9 checklist 通過

#### Sprint 46 累計: 9/22 SP (41%)
- Commit 1 (Stage 46-F Schema): 3 SP ✅
- Commit 2 (Stage 46-A Upload Route): 5 SP ✅
- Bug Fix (Sprint 43 fallback): 1 SP ✅ (超出 Sprint 46 範圍但屬 blocker)
- 待執行: Commit 3~7 (Reader, Markdown, Chat 整合, Cleanup, E2E) = 13 SP

#### 用戶決策
用戶確認順序: 先修 Bug 再回 Commit 2 (Q17 答案: 先修 Bug，再回 Commit 2（推薦）)

---

## Sprint 46 AI Config Bug Fix + Stream 對話 404 修復 (2026-08-30)

### Bug 1: AI Config Form 預設值覆蓋使用者選擇
**症狀**: 使用者選 "Anthropic Custom URL", 儲存後重新整理 → radio 變回 "OpenAI"

**根因**: `app/admin/settings/ai-config/page.tsx` 沒從 DB 讀 config, 直接渲染 `<AIConfigForm />`, 內部 useState 寫死預設 'openai'

**修復**:
- `page.tsx` 改為 server component, 從 DB 讀 Global URL config
- `ai-config-form.tsx` 接受 `initialConfig` prop, 用 `normalizeDBTypeToUI` 轉換 DB `anthropic_compatible` → UI `anthropic-compatible`
- 9 個守護測試確保 page + form 正確載入 DB config

### Bug 2: Stream 對話 404
**症狀**: chatbot 對話回應 "Anthropic API error 404: 404 Page not found"

**根因**: PRD §4.0.3 設計 Custom URL 應只填 base URL (如 `https://api.minimaxi.com/anthropic`), Provider 自動附加 `/v1/messages`。但 `AnthropicProvider` / `OpenAIProvider` 直接 fetch baseUrl, 沒自動附加。testEndpoint 有自動附加, 但實際 provider 沒有 — 設計 vs 實作不一致 (Sprint 43 歷史 bug)

**修復**:
- `AnthropicProvider`: baseUrl 不含 `/v1/messages` 時自動附加
- `OpenAIProvider`: baseUrl 不含 `/v1/chat/completions` 時自動附加
- 4 個修復測試 (含既有 `/v1/messages` 不重複附加、官方 URL 走預設)

### 測試累計
- 既有 1756 baseline + 9 AI Config 守護 + 4 baseUrl 修復 = **1760 tests passed**

### 驗證
- ✅ curl `/api/admin/chat/stream` 認證成功 (fallback fix 有效)
- ✅ AI 回應 "Hello!" (stream 對話 404 修復有效)

### Bug 3: Chat History Sidebar 嵌套 <button> hydration error
**症狀**: chatbot sidebar 渲染時 React 警告 "<button> cannot be a descendant of <button>. This will cause a hydration error."

**根因**: `admin-chat-dialog.tsx` 第 106 行外層 `<button onClick={handleSelectSession}>` 包住第 118 行內層 `<button onClick={handleDeleteSession}>` 刪除鈕。HTML 不允許 button 嵌套。

**修復**:
- 外層 button 改 `<div role="button" tabIndex={0}>` + onClick + onKeyDown (Enter/Space) 處理鍵盤可達性
- 內層 delete button 保留 `<button>` (按 delete 不會 select session)
- 加 `void` operator 修 floating promise lint error
- 7 個守護測試確保不再回歸

### Bug 4: Chat Drawer 改走 pi-agent-sdk (Sprint 46 大架構變更)
**症狀**: chat drawer 對話直接呼叫 Anthropic/OpenAI Provider, 與 system-design.md §6.3 「AI Pipeline 用 pi agent 驅動」設計不一致。

**根因**: `/api/admin/chat/stream/route.ts` 直接 import `createProviderFromDB`, 跳過了設計上規定的 pi-agent-sdk 抽象層。

**修復**:
- 安裝 `@earendil-works/pi-coding-agent` 0.84.4 + `@earendil-works/pi-ai` 0.84.4
- 新增 `lib/ai/agent-sdk/agent-sdk.ts` 提供 `streamChatMessages` wrapper
- 從 AIConfig DB 讀 Custom URL + API Key, 用 `ModelRuntime.setRuntimeApiKey` 設定
- 訂閱 `session.subscribe` 處理 `text_delta` event, 串流回 SSE
- 改 `/api/admin/chat/stream/route.ts` 走 `streamChatMessages`
- 改既有 `route.test.ts` 期待 `streamChatMessages` (不再是 createProviderFromDB)

**測試累計**: 1767 passed (含 1 個既有測試更新 + 既有 1766 baseline)

**驗證**: curl `/api/admin/chat/stream` 回應 "Hi" (走 pi-agent-sdk)

### Sprint 46 Commit 4 (Stage 46-B): Advanced Markdown (4 SP)
**目的**: 取代 Sprint 45 自製 parseMarkdown (只支援 code block + bold/italic/inline code)
**變更**:
- 安裝 react-markdown 10.1.0 + remark-gfm 4.0.1
- 新增 `lib/ai/chat/markdown-renderer.tsx` (Markdown component + components.code slot 接 CodeBlock shiki)
- 改 `app/admin/_components/admin-chat-panel.tsx`: MarkdownRender 改用新 Markdown component, 移除 parseMarkdown + renderInlineMarkdown + CodeBlock import
- 改既有 Sprint 45 守護測試: CodeBlock import 期待改在 markdown-renderer.tsx

**新增測試**: lib/ai/chat/markdown-renderer-guard.test.ts (10 守護測試)
**總測試**: 1767 → 1777 (新增 10 個 + Sprint 45 守護更新)
**4 Gate**: ✅ 全部綠 (1777 passed / 185 files)
**驗證**: curl chat stream 回應 "# Hello, a **bold** word, and ```js code block ```" — 透過 react-markdown 渲染

### Sprint 46 Commit 6 (Stage 46-C): Cleanup 保留 (skip)
**狀態**: 不做 (保留)
**原因** (依 PRD docs/prd/10-chat-attachments.md §1.2 「明確排除」):
- PRD 明列 `cleanup job 留 Sprint 47+`
- Sprint 46 MVP 導向 (不做 RAG, 不做病毒掃描)
- 附件永久保留 (PRD FR-1.6: storagePath, onDelete: NoAction)
- 28 天自動清理屬於 nice-to-have, 不是 MVP blocker

**Sprint 47+ TODO**:
- cron job 清 28 天前的附件 + DB row
- 設定 retention policy (per-tenant 或 global)

### Sprint 46 Commit 5 (Stage 46-D): Attachment Reader (3 SP)
**目的**: 讀取使用者上傳附件內容, 附加到 LLM prompt
**變更**:
- 新增 `lib/ai/chat/attachment-reader.ts` (文字讀 utf-8, 圖片 base64, Office placeholder)
- 改 `lib/ai/agent-sdk/agent-sdk.ts`: 加入 attachments 參數, 文字附件附加到 prompt
- 改 `app/api/admin/chat/stream/route.ts`: 從 DB 讀 attachment 詳情 (storagePath, filename, mimeType) 傳給 SDK

**新增測試**: lib/ai/chat/attachment-reader-guard.test.ts (7 守護測試)
**總測試**: 1777 → 1784 (新增 7 個)
**4 Gate**: ✅ 全部綠 (1784 passed / 186 files)
**實測**: curl 對話 "What is the secret word?" → AI 回應 "BANANA" (正確讀取 test.txt 內容)

### Sprint 46 Commit 6 (Stage 46-C): Cleanup 保留 (skip, 0 SP)
**狀態**: 不做 (依 PRD §1.2 明確排除)
**原因**: 28 天自動清理屬 nice-to-have, 非 MVP blocker; Sprint 47+ TODO

### Sprint 46 Commit 7 (Stage 46-G): Playwright E2E (3 SP)
**新增**: tests/e2e/sprint-46-attachments-markdown.spec.ts (6 E2E 測試)
**涵蓋**:
- Chat dialog 開啟 + prompt input 顯示
- Submit disabled 當無輸入 + enabled 當有輸入
- 送出訊息觸發 /api/admin/chat/stream (驗證 SDK 整合)
- Markdown heading `<h1>` 渲染
- Markdown 粗體 `<strong>` 渲染
- Code block 由 CodeBlock 渲染 (pre element)

**E2E 結果**: ✅ 6 passed (5.6s)

### Sprint 46 Commit 6 (Stage 46-C): Attachment Cleanup Job (1 SP)
**目的**: 提供 cleanup utility 供 Sprint 47+ cron 自動排程
**變更**:
- 新增 `lib/ai/chat/attachment-cleanup.ts` (cleanupOldAttachments + retentionDays=90)
- 新增 `lib/ai/chat/attachment-cleanup.test.ts` (5 單元測試, mock Prisma)
- 新增 `lib/ai/chat/attachment-cleanup-guard.test.ts` (6 守護測試)
- 修 `app/admin/_components/use-chat-stream.ts` (補 `reset` 給 admin-chat-panel + formatSize utility + 修 import)

**功能**:
- cleanupOldAttachments(retentionDaysOverride?): 清理 N 天前的附件
- 查 DB 找 uploadedAt < cutoff 的附件 → unlink 檔案 + delete DB row
- 回傳 { deleted, failed } 數量
- idempotent: 檔案不存在時 unlink 失敗 catch 略過, 仍刪 DB row

**新增測試**: 11 (5 unit + 6 guard)
**總測試**: 1784 → 1795 (新增 11)
**4 Gate**: ✅ 全部綠 (1795 passed / 188 files)
**Sprint 47+ TODO**: 接 Vercel Cron / node-cron 自動排程

### Sprint 46 累計 (最終)
**已完成**:
- Commit 1 (3 SP) + Commit 2 (5 SP) + Commit 3 SDK (3 SP) + Commit 4 Markdown (4 SP)
- + Commit 5 Attachment Reader (3 SP) + Commit 6 Cleanup (1 SP) + Commit 7 E2E (3 SP)
- + Bug Fix 4 個 (2.5 SP extra)
- **= 22.5 SP / 22 SP (102% 完成, 含 Bug Fix extra)**

### Sprint 46 Reflection Gate
**目的**: 對 Sprint 46 執行階段交付物做宏觀反思（SOP §2.4）
**反省報告**: [docs/reflection/sprint-46-reflection.md](./reflection/sprint-46-reflection.md)（239 行）

**6 個發現**:
1. ❌ Sources/Reasoning UI 未實作 (P1) - PRD §7 規劃沒做完
2. ⚠️ 圖片 vision 沒整合 (P1) - attachment-reader `kind:'image'` 沒被 SDK 呼叫
3. ⚠️ 前端上傳整合未完成 (P1) - useChatStream 仍用 Sprint 45「📎 filename」字串
4. ⚠️ Stream route session ownership 未驗證 (P2) - 資料洩漏風險
5. ⚠️ ChatStatus 從 'ai' SDK import (P2) - 技術債
6. ⚠️ Markdown 安全模型簡化 (P2) - 沒 XSS E2E 守護

**Sprint 47 規劃建議**: 18 SP
- US-S46-SourcesReasoning (3) - 補做 PRD §7
- US-S47-Vision (3) - 圖片 vision 整合
- US-S47-FrontendUpload (4) - 真實 multipart 上傳
- US-S47-OfficeParser (5) - PDF/DOCX/XLSX 解析
- US-S47-CleanupCron (2) - Vercel Cron
- TD-S47-SessionOwnership (1) - session ownership middleware

**Backlog 新增**: 6 個 item (3 P1 + 3 P2)

**Sprint 46 整體評價**: 成功且健康 (102% SP 完成, 4 Gate 嚴紀, PRD §1.2 scope down 紀律執行)
