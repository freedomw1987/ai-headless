# Backlog — ai-headless

> **框架定位**：WordPress 風格的 AI Headless CRUD 框架
> **核心**：單一 JSON 規範 → AI 編譯成可運行系統（前端 + 後端 + DB）
> **可擴展**：底基 + Extension 機制（Extension 也是 AI 生成）

---

## 📞 對話記錄

> Date Time：2026-08-24 11:31
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

## 🏗️ 模組劃分（Modules）

| 模組 | 名稱 | 說明 |
|---|---|---|
| **M0** | Architecture | 系統架構設計（Next.js + Prisma + AI Pipeline） |
| **M1** | Framework Core | JSON 規範 + AI Pipeline + Extension 規範 |
| **M2** | Auth & RBAC | 用戶管理、登入、權限角色 |
| **M3** | Blog | 第一個 CRUD 範例（含富文本編輯器） |
| **M4** | AI Config | AI 模型配置（OpenAI + Claude 可切換） |
| **M5** | AI Chat | AI 對話界面（chat UI） |
| **M6** | Extension System | Extension 管理 UI + Extension 規範文檔 |
| **M1-WS** | Workflow Subsystem | M1 子系統：Workflow Engine + DSL + UI |

---

## 📊 Backlog 表格

| ID | 類型 | 項目標題 / User Story | 交付價值與驗收標準 (AC) | 優先級 | 估算 (SP) | Sprint | Module | 狀態 |
| ----------- | -------------- | --------------------------------- | ----------------------------------------------------------------- | --------------- | --------------------- | ------ | -------- | ------------------ |
| **TECH-001** | Tech Spike | 設計系統架構（Next.js + Prisma + Postgres + AI Pipeline） | 產出架構圖文檔；明確目錄結構、模組邊界、API 邊界 | P0 | 5 | SP1 | M0 | Done ✅ |
| **TECH-002** | Tech Spike | 設計 JSON 功能規範（OpenSpec 風格） | 產出 `docs/specs/json-spec.md` + `docs/specs/json-schema.json` + TS Types + 範例 | P0 | 8 | SP1 | M1 | Done ✅ |
| **US-101** | User Story | 作為終端用戶，我透過 AI 對話生成 CRUD 功能 | 輸入「幫我做待辦事項」→ AI 釐清 → 生成 JSON + 代碼 + DB Migration → 前端顯示新功能卡片 | P0 | 13 | SP1 | M1 | Done ✅ |
| **US-102** | User Story | 作為管理員，我登入後台管理用戶 | 用戶 CRUD、角色分配、登入/登出、RBAC 權限驗證 | P0 | 5 | SP1 | M2 | Backlog（須先完成 TD-306 Auth.js 整合） |
| **US-103** | User Story | 作為管理員，我用 Blog 範例測試 CRUD | Blog CRUD + 富文本編輯器 + 列表頁 + 詳情頁 | P0 | 5 | SP1 | M3 | Done ✅（需 TD-303 Tiptap 完善） |
| **US-104** | User Story | 作為管理員，我配置 AI 模型（OpenAI/Claude） | API Key 配置、模型切換、配置持久化、錯誤處理 | P0 | 5 | SP1 | M4 | Backlog（SP2+，需 TECH-004） |
| **US-105** | User Story | 作為用戶，我用 AI 對話界面生成功能 | Chat UI 可用，能解析需求、生成 JSON、編譯代碼、提示進度 | P0 | 5 | SP1 | M5 | Backlog（SP3+） |
| **TECH-003** | Tech Spike | 設計 Extension 開發規範（OpenSpec 風格） | 產出 `docs/specs/extension-spec.md` + JSON Schema + TS Types + 範例 Extension 代碼 | P0 | 5 | SP2 | M6 | Backlog |
| **US-106** | User Story | 作為終端用戶，我透過 AI 對話生成 Extension | 輸入「加留言板 Extension」→ AI 生成 Extension → UI 顯示已安裝 Extension → 功能可使用 | P1 | 8 | SP2 | M6 | Backlog |
| **US-107** | User Story | 作為管理員，我管理已安裝 Extension | 列出 / 啟用 / 停用 Extension、查看 Extension 配置 JSON | P1 | 3 | SP2 | M6 | Backlog |
| **US-108** | User Story | 作為用戶，我下載 AI 生成的 JSON 規範 | 每個生成的功能旁邊有「下載 JSON」按鈕 | P1 | 1 | SP2 | M1 | Backlog |
| **TECH-004** | Tech Spike | 設計雙模型抽象層（OpenAI + Claude） | 產出模型 interface + Provider 實作 + token 計算抽象 | P0 | 3 | SP2 | M4 | Ready for Sprint |
| **EN-301** | Tech Debt | MVP 完成後改進（CI/CD、測試覆蓋率、Extension Marketplace） | 自動化測試 ≥ 80%、CI/CD pipeline、Extension 倉庫 | P2 | 13 | SP3 | M0 | Backlog Icebox |
| **TECH-005** | Tech Spike | v1.0.0 重大升級：混合模式架構（JSON + Extension Code） | 產出 system-design.md §13 + json-spec.md §3.6-3.9 + extension-spec.md §4.3-4.6 | P0 | 5 | SP2 | M1 | Done ✅ |
| **TECH-006** | Tech Spike | 設計 Workflow Engine（狀態機 / 審批引擎） | 產出 `docs/prd/08-workflow.md` + Workflow DSL + Runtime + API | P0 | 8 | SP2 | M1-WS | Ready for Sprint |
| **US-201** | User Story | 作為開發者，我用 Hook SDK 寫業務邏輯（beforeCreate / afterCreate / onTransition 等 11 種 hook） | Extension 提供 hook 函數，JSON 規範用 `{{fn:...}}` 引用，框架自動調用 | P0 | 5 | SP2 | M1 | Ready for Sprint |
| **US-202** | User Story | 作為開發者，我用 Action SDK 寫自定義動作 | Extension 提供 action 函數（Zod schema 驗證），UI 自動以按鈕形式顯示 | P0 | 5 | SP2 | M1 | Ready for Sprint |
| **US-203** | User Story | 作為開發者，我用 Computed SDK 寫動態計算欄位 | Extension 提供 compute 函數，UI 自動渲染，快取 + dependency 追蹤 | P0 | 3 | SP2 | M1 | Ready for Sprint |
| **US-204** | User Story | 作為用戶，我用訂單狀態機一鍵切換狀態 | 訂單狀態：draft → pending_payment → paid → shipped → completed，UI 按鈕自動出現 | P0 | 8 | SP2 | M1-WS | Ready for Sprint |
| **US-205** | User Story | 作為主管，我審批請假單（審批流程範例） | 狀態機 + 審批佇列 UI，批准自動走狀態機轉換 | P1 | 5 | SP2 | M1-WS | Backlog |
| **US-206** | User Story | 作為終端用戶，叫 AI 生成有狀態機的系統 | 輸入「做訂單管理，含狀態機」→ AI 生成 JSON（含 workflow）+ TypeScript hook/action/computed/workflow 實作 + 測試 | P0 | 8 | SP2 | M1 | Backlog |
| **US-207** | User Story | 作為開發者，我用 AI 生成 Blog Extension 加 hook（slug 生成、自動 excerpt、發布 action） | 混合模式範例：AI 同時生成 schema.json + 對應的 .ts hook/action 代碼 | P1 | 3 | SP2 | M3 | Backlog |
| **TD-301** | Tech Debt | Hook Runtime 實作 | `api-generator.ts:150,202` 的 hook 調用仍是 TODO，框架生成代碼中 hooks 不會被實際執行 | P0 | 5 | SP2 | M1 | Ready for Sprint |
| **TD-302** | Tech Debt | Relation Select 選項載入 | `ui-generator.ts:145,365,510` 的 relation Select 是 placeholder `{/* TODO: load from API */}`，admin 頁面無法實際使用 | P0 | 3 | SP2 | M1 | Ready for Sprint |
| **TD-303** | Tech Debt | Tiptap rich text 整合 | `ui-generator.ts:154` 對 `text-long` 欄位使用 Textarea，應整合 Tiptap WYSIWYG 編輯器（對應 docs/design.md） | P1 | 3 | SP2 | M3 | Ready for Sprint |
| **TD-304** | Tech Debt | Pipeline Stage 類型安全 | `pipeline-runner.ts:42` 用 `<TIn=any, TOut=any>` 預設泛型，失去類型保護 | P2 | 1 | SP2 | M1 | Ready for Sprint |
| **TD-305** | Tech Debt | Field.relation vs Model.relations 雙軌制 | schema-generator 只支持 `model.relations`，field.relation 無人處理 — 文檔與實作不一致 | P1 | 2 | SP2 | M1 | ✅ Done (Sprint Review Fixes) |
| **TD-306** | Tech Debt | Auth.js v5 整合 | `lib/auth/.gitkeep` 為空，API generator 用 `auth()` 但沒實際 Auth.js v5 整合 | P0 | 5 | SP2 | M2 | ✅ Done (Sprint 2) |

### Sprint 3 Review 發現（S3 Reflection 2025-08-22）

| ID | 類型 | 標題 | 描述 | 優先級 | SP | 模組 | 狀態 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **TD-401** | Tech Debt | Chat Sidebar 手機版漢堡選單 | `chat-page-client.tsx` 永遠渲染 256px sidebar，在 <768px 擠壓主內容 | P1 | 1 | M5 | Ready for Sprint 4 |
| **TD-402** | Tech Debt | Extension grid RWD 改進 | `extensions-page-client.tsx` 用 `md:grid-cols-2`，<md 未做單欄處理 | P2 | 0.5 | M7 | Ready for Sprint 4 |
| **TD-403** | Tech Debt | Extension toggle 失敗 Toast | `extension-card.tsx` toggle catch 後只 console.error，用戶無反饋 | P1 | 0.5 | M7 | Ready for Sprint 4 |
| **TD-404** | Tech Debt | 真實 AI Provider 串接 | `providers.ts` 是 mock，`.env.example` 配 OPENAI_API_KEY 但未使用 | P1 | 12 | M5 | Ready for Sprint 5 |
| **TD-405** | Tech Debt | Extension State 持久化用 Prisma | `.extension-state.json` 寫 filesystem，多實例部署狀態不一致 | P2 | 2 | M7 | Ready for Sprint 4 |
| **TD-406** | Tech Debt | Chat 串流重連機制 | `chat-page-client.tsx` 無 retry，弱網環境體驗差 | P2 | 1 | M5 | Ready for Sprint 4 |

### Sprint 4 Review 發現（S4 Reflection 2025-08-24）

| ID | 類型 | 標題 | 描述 | 優先級 | SP | 模組 | 狀態 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **TD-405** | Tech Debt | Extension State 持久化用 Prisma | `.extension-state.json` 寫 filesystem，但 Prisma 已有 `Extension` model（schema.prisma 已定義）。Sprint 4 略過 | P2 | 2 | M7 | Ready for Sprint 5 |
| **TD-501** | Tech Debt | chat-page-client.tsx 221 行，職責過多 | 同檔負責 UI 渲染 + 串流 + session 管理 + RWD 切換 + retry | P2 | 3 | M5 | Ready for Sprint 5 |
| **TD-502** | Tech Debt | AI API 缺乏 server-side 驗證 + rate limit | `/api/chat/stream` 未檢查 Auth、未限速、未審計。P1 安全風險 | P1 | 1 | M5 | ✅ Done (Sprint 5 infra-restoration, includes audit log + rate limit + auth; unit test added bcf5fd1) |
| **TD-503** | Tech Debt | SSE 串流無 abort/cancel 機制 | 用戶離開頁面或新對話時，串流繼續消耗 API quota | P2 | 1 | M5 | ✅ Done (Sprint 5 infra-restoration commit) |
| **TD-504** | Tech Debt | Mock Stream 字符級延遲造成測試慢 | `MockProvider.streamText` 每字符 15ms，600字=9秒。影響 CI | P2 | 1 | M5 | ✅ Done (Sprint 5: MOCK_STREAM_DELAY_MS env var; test runtime -29%) |
| **TD-505** | Tech Debt | Token 使用量追蹤 | OpenAI/Anthropic 回應含 `usage`，目前完全丟棄 | P2 | 2 | M5 | ✅ Done (Sprint 5 eefdb0e: usage captured, SSE event, audit log) |
| **TD-506** | Tech Debt | ChatSidebar close 用 emoji「✕」而非 icon | 視覺一致性 + 無障礙問題 | P3 | 0.5 | M5 | ✅ Done (Sprint 5: lucide X icon + aria-hidden) |

| **S2.1** | Task | Hook SDK：類型定義 + Runtime + 11 種 hook context | 5 | SP2 | M1 | Ready for Sprint |
| **S2.2** | Task | Action SDK：類型 + Zod 驗證 + Runtime | 3 | SP2 | M1 | Ready for Sprint |
| **S2.3** | Task | Computed SDK：類型 + 依賴追蹤 + Cache | 3 | SP2 | M1 | Ready for Sprint |
| **S2.4** | Task | Workflow Engine：StateMachine + TransitionLog + UI 切換 | 8 | SP2 | M1-WS | Ready for Sprint |
| **S2.5** | Task | {{fn:...}} 引用解析器 + 自動調用整合進 generators | 3 | SP2 | M1 | Ready for Sprint |
| **S2.6** | Task | Tiptap 整合 + 富文本編輯器 | 3 | SP2 | M3 | Ready for Sprint |
| **S2.7** | Task | Auth.js v5 整合 + Session 管理 | 5 | SP2 | M2 | Ready for Sprint |
| **S2.8** | Task | 整合測試：混合模式範例（Blog with Hook/Action/Computed） | 5 | SP2 | M1 | Ready for Sprint |

---

## ✅ Sprint 1 完成（2026-08-24）

| 子任務 | 標題 | SP | 狀態 |
| --- | --- | --- | --- |
| S1.1 | 專案骨架 | 1 | Done ✅ |
| S1.2 | Prisma Schema (9 models) | 1 | Done ✅ |
| S1.3 | JSON Schema + TS Types | 3 | Done ✅ |
| S1.4 | Schema Generator | 3 | Done ✅ |
| S1.5 | API Generator | 3 | Done ✅ |
| S1.6 | UI Generator | 5 | Done ✅ |
| S1.7 | Permission Generator | 1 | Done ✅ |
| S1.8 | AI Pipeline 骨架 | 5 | Done ✅ |
| S1.9 | Extension Loader + API | 5 | Done ✅ |
| S1.10 | 共用 CRUD 組件 | 5 | Done ✅ |
| S1.11 | 整合測試 | 3 | Done ✅ |
| **總計** | **35 SP / 39 SP 計劃** | | |
| **測試** | **194/194 全綠** | | |
| **4 Gate** | **TDD ✅ / typecheck ✅ / lint ✅ / regression ✅** | | |

---

## 📝 規範文檔目錄（核心交付物）

| 文檔 | 用途 | 形式 | 對應 Backlog |
|---|---|---|---|
| `docs/specs/json-spec.md` | AI 生成 CRUD 功能的規範 | OpenSpec（MD + JSON Schema + TS Types + 範例） | TECH-002 |
| `docs/specs/extension-spec.md` | AI 生成 Extension 的規範 | OpenSpec（MD + JSON Schema + TS Types + 範例） | TECH-003 |
| `docs/architecture.md` | 系統架構設計 | 架構圖 + 目錄結構 + 模組邊界 | TECH-001 |

---

## ✅ 當前進度（2026-08-24）

### Sprint 1（跑通單一 CRUD pipeline）
- ✅ 已完成（35 SP / 194 測試全綠 / 4 Gate 全通過）
- 技術債務記錄在 TD-301~TD-306

### Sprint 2 規劃（混合模式 SDK 主力，35 SP）
**總計 35 SP**：

- **混合模式 SDK 必修**（19 SP）：
  - S2.1 Hook SDK + TD-301（Hook Runtime 賟作） = 5 + 5 = **10 SP**（重點）
  - S2.2 Action SDK = 3 SP
  - S2.3 Computed SDK = 3 SP
  - S2.4 Workflow Engine = 8 SP
- **關鍵技術債**（13 SP）：
  - TD-302 Relation Select 選項載入 = 3 SP
  - TD-303 Tiptap 富文本 = 3 SP
  - TD-304 Pipeline Stage 類型安全 = 1 SP
  - TD-305 Field.relation 雙軌制 = 2 SP
  - TD-306 Auth.js v5 整合 = 5 SP
- **整合**（8 SP）：
  - S2.5 `{{fn:...}}` 引用解析器 = 3 SP
  - S2.8 整合測試（Blog with Hook/Action/Computed）= 5 SP

**預計交付能力**：完整的混合模式（JSON L1+L2 + Extension Code L3），能讓 AI 生成可運行的狀態機系統（如訂單管理）、同時生成 Extension 代碼。

### Sprint 3+ 規劃（完整 Demo，40 SP）
> Date Time：2026-08-24 17:30
> 用戶：選擇 B 方案（完整 Demo）
> Q2 選 A：Blog + Todo + Event
> Q3 選 B：完整 Chat（12 SP）
> Q4 選 A：目錄+安裝按鈕（5 SP）

**總計 40 SP**：

| ID | 子任務 | 說明 | SP | 模組 | 狀態 |
| --- | --- | --- | --- | --- | --- |
| **S3.1** | Todo Extension | 第二個 CRUD（title + completed + dueDate）| 5 | M3 | Pending |
| **S3.2** | Event Extension | 第三個 CRUD（datetime + 多對多報名 + 容量 Hook）| 8 | M3 | Pending |
| **S3.3** | E2E CRUD Demo | 三個 CRUD 端到端 + 截圖 | 5 | M3 | Pending |
| **S3.4** | AI Chat 完整 UI | sidebar + streaming + 多 session + Markdown | 12 | M5 | Pending |
| **S3.5** | Extension 安裝 UI | `/admin/extensions` + 啟用/停用 | 5 | M6 | Pending |
| **S3.6** | 文檔站點 | README + docs/ + CHANGELOG | 5 | M0 | Pending |

**預期交付**：`/admin/blog` + `/admin/todo` + `/admin/event` + `/chat` + `/admin/extensions` + 完整 README。

### Sprint 3 進度（隨每次完成後更新）