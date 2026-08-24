# Backlog — ai-headless

> **框架定位**：WordPress 風格的 AI Headless CRUD 框架
> **核心**：單一 JSON 規範 → AI 編譯成可運行系統（前端 + 後端 + DB）
> **可擴展**：底基 + Extension 機制（Extension 也是 AI 生成）

---

## 📌 當前狀態（2026-08-24）

| 項目 | 數據 |
|------|------|
| **當前 Sprint** | **Sprint 6**（起步 4 Task 已完成） |
| **測試基線** | 649 tests / 3 E2E / 4 Gate 全綠 |
| **下一個 P0** | TD-514 CI workflow（沒 CI = 沒保護）|
| **下一個 P1** | TD-510 Backlog ID 撞號修正（已透過本次重整完成）|
| **下一個 P2** | TD-511 Playwright webServer + TD-513 use-chat-sessions 測試 |

### Sprint 6 進度

| Task | 標題 | 計劃 | 實際 | 狀態 |
|------|------|------|------|------|
| TD-601 | /admin/extensions async await 修復 | 2 SP | 2 SP | ✅ |
| US-S6-1 | TD-503 abort Playwright E2E | 2 SP | 2 SP | ✅ |
| TD-508 | useChatStream → useReducer | 2 SP | 2 SP | ✅ |
| TD-509 | JWT augmentation JSDoc | 0.5 SP | 0.5 SP | ✅ |
| **合計** | **6.5 SP / 6.5 SP 計劃 (100%)** | | | **4 Gate 全綠** |

### Backlog ID 編號規則（本次重整確立）

| 編號區段 | 用途 |
|----------|------|
| `TECH-xxx` | 技術 spike / 架構設計 |
| `US-1xx` | Sprint 1 User Story |
| `US-2xx` | Sprint 2 User Story |
| `US-S6-x` | Sprint 6 User Story（如 US-S6-1, US-S6-2）|
| `TD-3xx` | Sprint 3 Tech Debt |
| `TD-4xx` | Sprint 4 Tech Debt |
| `TD-5xx` | Sprint 5 Tech Debt |
| `TD-6xx` | Sprint 6 Tech Debt（含本次重整後新增）|
| `EN-301` | MVP 完成後改進（冰盒）|
| `S1.x ~ S3.x` | Sprint 子任務 |
| `S2.1 ~ S2.8` | Sprint 2 子任務 |

**重要變更**（本次重整）：
- ❌→✅ 舊 `TD-405`（Extension State Prisma 持久化）→ **TD-515**（編號衝突修正）
- ❌→✅ 舊 `TD-405-alt`（崩潰修復，過渡命名）→ **TD-601**（正式 Sprint 6 編號）
- ⚠️ CHANGELOG 內的「TD-405 崩潰修復」已加 alias 標記指向 TD-601

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
| **M7** | Admin Pages | 管理後台（/admin/* 路由） |
| **M1-WS** | Workflow Subsystem | M1 子系統：Workflow Engine + DSL + UI |

---

## 📊 Backlog 主表（單一表，按優先級排序）

> 排序規則：P0 → P1 → P2 → P3，相同優先級按 Sprint 計劃順序

### P0（阻塞 / 核心）

| ID | 類型 | 標題 | 描述 | SP | Sprint | 模組 | 狀態 |
|----|------|------|------|----|----|------|------|
| **TECH-001** | Tech Spike | 設計系統架構 | Next.js + Prisma + Postgres + AI Pipeline 架構圖 | 5 | SP1 | M0 | ✅ Done |
| **TECH-002** | Tech Spike | 設計 JSON 功能規範 | OpenSpec（MD + JSON Schema + TS Types + 範例）| 8 | SP1 | M1 | ✅ Done |
| **US-101** | User Story | AI 對話生成 CRUD 功能 | 「幫我做待辦事項」→ 自動生成 JSON + 代碼 + DB Migration | 13 | SP1 | M1 | ✅ Done |
| **US-102** | User Story | 後台用戶管理 | 用戶 CRUD + 角色 + 登入/登出 + RBAC | 5 | SP1 | M2 | 📋 Backlog |
| **US-103** | User Story | Blog CRUD 範例 | Blog CRUD + 富文本編輯器 + 列表頁 + 詳情頁 | 5 | SP1 | M3 | ✅ Done |
| **US-104** | User Story | AI 模型配置 | API Key 配置、模型切換、配置持久化、錯誤處理 | 5 | SP1 | M4 | 📋 Backlog |
| **US-105** | User Story | AI 對話界面 | Chat UI 可用，能解析需求、生成 JSON、編譯代碼、提示進度 | 5 | SP1 | M5 | 📋 Backlog |
| **TECH-005** | Tech Spike | 混合模式架構 v1.0.0 | JSON L1+L2 + Extension Code L3 + `{{fn:...}}` 引用 | 5 | SP2 | M1 | ✅ Done |
| **TD-301** | Tech Debt | Hook Runtime 實作 | `api-generator.ts:150,202` 的 hook 調用仍是 TODO | 5 | SP2 | M1 | 🔜 Ready |
| **TD-302** | Tech Debt | Relation Select 選項載入 | `ui-generator.ts:145,365,510` 是 placeholder | 3 | SP2 | M1 | 🔜 Ready |
| **US-201** | User Story | Hook SDK | Extension 提供 hook 函數（11 種 hook context），JSON 用 `{{fn:...}}` 引用 | 5 | SP2 | M1 | 🔜 Ready |
| **US-202** | User Story | Action SDK | Extension 提供 action 函數（Zod 驗證），UI 自動以按鈕形式顯示 | 5 | SP2 | M1 | 🔜 Ready |
| **US-203** | User Story | Computed SDK | Extension 提供 compute 函數，UI 自動渲染 + 快取 + dependency 追蹤 | 3 | SP2 | M1 | 🔜 Ready |
| **US-204** | User Story | 訂單狀態機 | 訂單狀態：draft → pending_payment → paid → shipped → completed | 8 | SP2 | M1-WS | 🔜 Ready |
| **US-206** | User Story | AI 生成狀態機系統 | 「做訂單管理含狀態機」→ AI 生成 JSON + workflow TS + 測試 | 8 | SP2 | M1 | 📋 Backlog |
| **TD-306** | Tech Debt | Auth.js v5 整合 | `lib/auth/.gitkeep` 為空 | 5 | SP2 | M2 | ✅ Done |
| **TECH-006** | Tech Spike | Workflow Engine | StateMachine + DSL + Runtime + API | 8 | SP2 | M1-WS | 🔜 Ready |
| **TD-514** | Tech Debt | **CI workflow**（P0）| 加 `.github/workflows/ci.yml`：lint + typecheck + test + Playwright E2E | 2 | SP6 | M0 | 🔜 Ready |

### P1（重要 / 安全）

| ID | 類型 | 標題 | 描述 | SP | Sprint | 模組 | 狀態 |
|----|------|------|------|----|----|------|------|
| **US-106** | User Story | AI 生成 Extension | 「加留言板 Extension」→ AI 生成 + UI 顯示已安裝 | 8 | SP2 | M6 | 📋 Backlog |
| **US-107** | User Story | 管理已安裝 Extension | 列出 / 啟用 / 停用 / 查看配置 JSON | 3 | SP2 | M6 | 📋 Backlog |
| **TD-303** | Tech Debt | Tiptap rich text 整合 | `text-long` 欄位目前用 Textarea，應整合 Tiptap WYSIWYG | 3 | SP2 | M3 | 🔜 Ready |
| **TD-305** | Tech Debt | Field.relation vs Model.relations 雙軌制 | schema-generator 只支持 `model.relations`，field.relation 無人處理 | 2 | SP2 | M1 | ✅ Done |
| **TD-401** | Tech Debt | Chat Sidebar 漢堡選單 | <768px 永遠渲染 256px sidebar 擠壓主內容 | 1 | SP4 | M5 | 📋 Ready |
| **TD-403** | Tech Debt | Extension toggle 失敗 Toast | toggle catch 後只 console.error，用戶無反饋 | 0.5 | SP4 | M7 | 📋 Ready |
| **TD-404** | Tech Debt | 真實 AI Provider 串接 | `providers.ts` 是 mock，`.env.example` 配 OPENAI_API_KEY 但未使用 | 12 | SP5 | M5 | 📋 Ready |
| **TD-502** | Tech Debt | AI API 驗證 + rate limit | `/api/chat/stream` 未檢查 Auth、未限速、未審計 | 1 | SP5 | M5 | ✅ Done |
| **US-S6-1** | User Story | TD-503 abort E2E | 切換 chat / SPA 切換 / disabled 守護 3 場景（reviewer P1）| 2 | SP6 | M6 | ✅ Done |
| **TD-601** | Defect | /admin/extensions 崩潰修復 | async 函數漏 await → await + try/catch + lint + smoke test | 2 | SP6 | M7 | ✅ Done |
| **TD-510** | Tech Debt | Backlog ID 撞號修正 | 既有兩個 `TD-405` 已透過本次重整重新編號 | 0.5 | SP6 | M0 | ✅ Done（本次重整）|

### P2（一般 / 改進）

| ID | 類型 | 標題 | 描述 | SP | Sprint | 模組 | 狀態 |
|----|------|------|------|----|----|------|------|
| **TD-402** | Tech Debt | Extension grid RWD | `md:grid-cols-2`，<md 未做單欄處理 | 0.5 | SP4 | M7 | 📋 Ready |
| **TD-406** | Tech Debt | Chat 串流重連機制 | 無 retry，弱網環境體驗差 | 1 | SP4 | M5 | 📋 Ready |
| **TD-501** | Tech Debt | chat-page-client.tsx 職責過多 | 243 行 → 135 行 + 3 hooks | 3 | SP5 | M5 | ✅ Done |
| **TD-503** | Tech Debt | SSE 串流無 abort/cancel | 用戶離開頁面或新對話時，串流繼續消耗 API quota | 1 | SP5 | M5 | ✅ Done |
| **TD-504** | Tech Debt | Mock Stream 字符延遲 | 每字符 15ms，600字=9秒 | 1 | SP5 | M5 | ✅ Done |
| **TD-505** | Tech Debt | Token 使用量追蹤 | OpenAI/Anthropic 回應含 `usage`，目前完全丟棄 | 2 | SP5 | M5 | ✅ Done |
| **TD-507** | Tech Debt | Tiptap `minimumReleaseAgeExclude` workaround | pnpm 11 升級暫時方案，逐步移除 | 0.5 | SP6 | M6 | 📋 Ready |
| **TD-508** | Tech Debt | useChatStream → useReducer | functional setState workaround → useReducer + dispatch | 2 | SP6 | M6 | ✅ Done |
| **TD-511** | Tech Debt | Playwright webServer 設定 | CI 跑 E2E 需手動起 server | 0.5 | SP6 | M6 | 📋 Ready |
| **TD-513** | Tech Debt | use-chat-sessions.ts 測試 | TD-508 重構未涵蓋 hook 整合測試 | 1 | SP6 | M5 | 📋 Ready |
| **US-S6-2** | User Story | 平板 RWD 優化 | 768-1024px sidebar 太擠 | 1 | SP6 | M6 | 📋 Ready |
| **TD-515** | Tech Debt | Extension State 持久化用 Prisma | `.extension-state.json` 寫 filesystem，多實例部署狀態不一致（舊 TD-405，已重新編號）| 2 | SP6 | M7 | 📋 Ready |

### P3（細節 / 可選）

| ID | 類型 | 標題 | 描述 | SP | Sprint | 模組 | 狀態 |
|----|------|------|------|----|----|------|------|
| **US-108** | User Story | 下載 AI 生成的 JSON | 每個生成的功能旁邊有「下載 JSON」按鈕 | 1 | SP2 | M1 | 📋 Backlog |
| **US-205** | User Story | 審批請假單 | 狀態機 + 審批佇列 UI | 5 | SP2 | M1-WS | 📋 Backlog |
| **US-207** | User Story | Blog Extension 加 hook | 混合模式範例：slug 生成、自動 excerpt、發布 action | 3 | SP2 | M3 | 📋 Backlog |
| **TD-304** | Tech Debt | Pipeline Stage 類型安全 | `<TIn=any, TOut=any>` 失去類型保護 | 1 | SP2 | M1 | 📋 Ready |
| **TD-506** | Tech Debt | ChatSidebar close emoji → icon | 視覺一致性 + 無障礙 | 0.5 | SP5 | M5 | ✅ Done |
| **TD-509** | Tech Debt | JWT augmentation JSDoc | 解釋 TS quirk：`import type { JWT }` 是 module-load trigger | 0.5 | SP6 | M6 | ✅ Done |
| **TD-512** | Tech Debt | E2E mock SW 相容性 | localStorage 跨 navigation，若加 service worker 可能衝突 | 1 | SP7 | M6 | 📋 Ready |

### 冰盒（Backlog Icebox）

| ID | 類型 | 標題 | 描述 | SP | 模組 | 狀態 |
|----|------|------|------|----|------|------|
| **TECH-003** | Tech Spike | Extension 開發規範 | OpenSpec（MD + JSON Schema + TS Types + 範例）| 5 | M6 | 📋 Backlog |
| **TECH-004** | Tech Spike | 雙模型抽象層 | OpenAI + Claude interface + Provider 實作 + token 計算 | 3 | M4 | 📋 Ready |
| **EN-301** | Tech Debt | MVP 完成後改進 | CI/CD、測試覆蓋率、Extension Marketplace | 13 | M0 | 🧊 Icebox |

---

## 🗂️ Sprint 進度歷史

### Sprint 1（跑通單一 CRUD pipeline）— ✅ Done
35 SP / 194 測試全綠 / 4 Gate 全通過

| 子任務 | 標題 | SP | 狀態 |
|--------|------|----|------|
| S1.1 | 專案骨架 | 1 | ✅ |
| S1.2 | Prisma Schema (9 models) | 1 | ✅ |
| S1.3 | JSON Schema + TS Types | 3 | ✅ |
| S1.4 | Schema Generator | 3 | ✅ |
| S1.5 | API Generator | 3 | ✅ |
| S1.6 | UI Generator | 5 | ✅ |
| S1.7 | Permission Generator | 1 | ✅ |
| S1.8 | AI Pipeline 骨架 | 5 | ✅ |
| S1.9 | Extension Loader + API | 5 | ✅ |
| S1.10 | 共用 CRUD 組件 | 5 | ✅ |
| S1.11 | 整合測試 | 3 | ✅ |

### Sprint 2 規劃（混合模式 SDK 主力，35 SP）

**混合模式 SDK 必修**（19 SP）：
- S2.1 Hook SDK + TD-301（Hook Runtime 實作）= 5 + 5 = **10 SP**（重點）
- S2.2 Action SDK = 3 SP
- S2.3 Computed SDK = 3 SP
- S2.4 Workflow Engine = 8 SP

**關鍵技術債**（13 SP）：
- TD-302 Relation Select = 3 SP
- TD-303 Tiptap 富文本 = 3 SP
- TD-304 Pipeline Stage 類型安全 = 1 SP
- TD-305 Field.relation 雙軌制 = 2 SP ✅
- TD-306 Auth.js v5 = 5 SP ✅

**整合**（8 SP）：
- S2.5 `{{fn:...}}` 引用解析器 = 3 SP
- S2.8 整合測試 = 5 SP

### Sprint 3+ 規劃（完整 Demo，40 SP）

| ID | 子任務 | 說明 | SP | 模組 | 狀態 |
|----|--------|------|----|------|------|
| **S3.1** | Todo Extension | 第二個 CRUD（title + completed + dueDate）| 5 | M3 | Pending |
| **S3.2** | Event Extension | 第三個 CRUD（datetime + 多對多報名 + 容量 Hook）| 8 | M3 | Pending |
| **S3.3** | E2E CRUD Demo | 三個 CRUD 端到端 + 截圖 | 5 | M3 | Pending |
| **S3.4** | AI Chat 完整 UI | sidebar + streaming + 多 session + Markdown | 12 | M5 | Pending |
| **S3.5** | Extension 安裝 UI | `/admin/extensions` + 啟用/停用 | 5 | M6 | Pending |
| **S3.6** | 文檔站點 | README + docs/ + CHANGELOG | 5 | M0 | Pending |

### Sprint 4-5（Tech Debt 清整期）

| Sprint | 完成項目 | 詳見 |
|--------|----------|------|
| Sprint 4 | TD-401, TD-402, TD-403, TD-406, TD-405(→TD-515) 等 RWD/UX 債 | [S4 Reflection](reflection/sprint-4-reflection.md) |
| Sprint 5 | TD-501~TD-506 + TD-502/503/504/505 完整修復 | [S5 Reflection](reflection/sprint-5-reflection.md) |

### Sprint 6（起步 4 Task 已完成）

詳見上方「當前狀態」表格 + [S6 Reflection](reflection/sprint-6-reflection.md)

---

## 📚 Sprint Reflection 索引

| Sprint | 報告 | 重點發現 |
|--------|------|----------|
| Sprint 3 | [sprint-3-reflection.md](reflection/sprint-3-reflection.md) | 初版 |
| Sprint 4 | [sprint-4-reflection.md](reflection/sprint-4-reflection.md) | RWD/UX 改進 |
| Sprint 5 | [sprint-5-reflection.md](reflection/sprint-5-reflection.md) | Chat 重構 + 6 個 Tech Debt 一次清 |
| **Sprint 6** | [sprint-6-reflection.md](reflection/sprint-6-reflection.md) | 發現 → 修復 → 預防 pattern + 揭露 TD-514 P0（CI 缺失）|

完整索引見 [reflection/index.md](reflection/index.md)

---

## 📝 規範文檔目錄（核心交付物）

| 文檔 | 用途 | 形式 | 對應 Backlog |
|---|---|---|---|
| `docs/specs/json-spec.md` | AI 生成 CRUD 功能的規範 | OpenSpec（MD + JSON Schema + TS Types + 範例）| TECH-002 |
| `docs/specs/extension-spec.md` | AI 生成 Extension 的規範 | OpenSpec（MD + JSON Schema + TS Types + 範例）| TECH-003 |
| `docs/architecture.md` | 系統架構設計 | 架構圖 + 目錄結構 + 模組邊界 | TECH-001 |
| `docs/system-design.md` | 混合模式架構（含 §13 規範）| 系統設計 | TECH-005 |
| `docs/reflection/` | Sprint 反省報告 | Markdown | 每 Sprint |

---

## 🔍 統計與圖表（手動維護）

### 各模組 Backlog 數量

| 模組 | P0 | P1 | P2 | P3 | 冰盒 | 總計 |
|------|----|----|----|----|------|------|
| M0 | 2 | 1 | - | - | 1 | 4 |
| M1 | 7 | 2 | 1 | 1 | - | 11 |
| M2 | 2 | - | - | - | - | 2 |
| M3 | 1 | 1 | - | 1 | - | 3 |
| M4 | 1 | - | - | - | 1 | 2 |
| M5 | 1 | 2 | 4 | 1 | - | 8 |
| M6 | - | 3 | 4 | 1 | 1 | 9 |
| M7 | - | 1 | 1 | - | - | 2 |
| M1-WS | 2 | 1 | - | - | - | 3 |

### 已完成 vs 待完成

| 狀態 | 數量 | 比例 |
|------|------|------|
| ✅ Done | 18 | 40% |
| 🔜 Ready | 9 | 20% |
| 📋 Backlog | 13 | 29% |
| 🧊 Icebox | 3 | 7% |
| Pending（S3 子任務）| 6 | 13% |
| **總計** | **49** | **100%** |