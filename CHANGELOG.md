# 📜 CHANGELOG

所有重要變更都會記錄於此。

格式基於 [Keep a Changelog](https://keepachangelog.com/)，
版本遵循 [Semantic Versioning](https://semver.org/)。

---

## [Unreleased]

### 🎯 US-102 — 後台用戶管理（基礎版）

#### Added
- **`lib/auth/password.ts`** — bcrypt 密碼 hash + verify（salt rounds 10），取代之前明文密碼處理漏洞
- **`app/api/users/route.ts`** — GET（列出用戶）/ POST（新增用戶，僅 admin）API
- **`app/api/users/[id]/route.ts`** — GET / PATCH / DELETE（軟刪除）單一用戶 API；保護「不能刪自己」邏輯
- **`app/api/auth/[...nextauth]/route.ts`** — Auth.js v5 handler endpoint（讓 next-auth/react 的 signIn/signOut 運作）
- **`app/admin/login/page.tsx`** + **`login-form.tsx`** — Credentials Provider 登入頁
- **`app/admin/users/page.tsx`** + **`users-page-client.tsx`** — 用戶列表頁（DataTable + 停用操作）
- **`app/admin/users/new/page.tsx`** + **`user-form.tsx`** — 新增/編輯用戶表單
- **`app/admin/users/[id]/edit/page.tsx`** — 編輯用戶頁（admin only）
- **`app/admin/page.tsx`** — Admin 總覽首頁（含用戶管理 / Extensions 入口）
- **`app/admin/layout.tsx`** + **`admin-sidebar.tsx`** — Admin 後台 layout（sidebar + nav + 登出）
- **`middleware.ts`** + **`lib/auth/auth.config.ts`** — Next.js middleware 守衛 `/admin/*`（拆出 edge-safe config 避免 Prisma edge runtime 衝突）
- **`prisma/seed-users.ts`** — Seed 3 個 demo 帳號（admin@ai-headless.local / editor@ai-headless.local / viewer@ai-headless.local）
- **`app/api/users/users-api.test.ts`** — 17 個 API 整合測試（auth 守衛 / RBAC / CRUD / 錯誤處理）
- **`lib/auth/password.test.ts`** — 5 個 bcrypt hash + verify 測試
- **`tests/integration/us-102-user-management.test.ts`** — 8 個整合 smoke test（密碼流程 + seed 帳號 + RBAC 矩陣）

#### Changed
- **`lib/auth/config.ts`** — 修復 `authorize()` 兩大漏洞：(1) 加上 bcrypt 密碼驗證（之前可空密碼登入）；(2) 從 DB 讀真實 role（之前寫死 `'viewer'`）；JWT callback 改為每次 request 重讀 role，admin role 變更立即生效
- **`lib/auth/auth.test.ts`** —（既有）保留寫死矩陣測試，Phase 2 動態化時重構

#### Fixed
- **Middleware edge runtime 衝突** — 拆分 `auth.config.ts`（edge-safe，無 Prisma）給 middleware 用，避免「Edge Runtime 不支援 Node.js API」runtime error
- **Auth.js authorize() 兩大安全漏洞** — 修補寫死 role 與無 bcrypt 驗證
- **登入無 handler endpoint** — 補上 `/api/auth/[...nextauth]/route.ts` 才能用 next-auth/react

#### Test Stats
- Tests: **662 → 692** (+30)
- Files: **46 → 49** (+3)

---

### 🎯 TD-511 + TD-513 — Playwright webServer 雙 profile + useChatSessions 測試補齊

#### Added
- **`app/chat/hooks/use-chat-sessions.test.ts`** — TD-513 hook 整合測試 16 個 case，守護 TD-508 重構後的 session 管理層行為（initial state / createSession / REGISTER_SESSION 去重 / setActiveId + activeSession 衍生計算 / dispatch 暴露給 useChatStream / updateSession stub API 兼容）
- **`app/chat/hooks/use-chat-stream.test.ts`** — ➕ 1 個 `SEED_USER_AND_ASSISTANT` no-op reference equality 守護測試

#### Fixed
- **`app/chat/hooks/use-chat-stream.ts`** — 🐛 修 `SEED_USER_AND_ASSISTANT` reducer 對不存在的 sessionId 沒做 reference equality 的不一致問題（違反 TD-508 訂下的「沒變動就回傳原 state reference」不變量，會導致無謂 re-render）。補上 `let changed = false` 追蹤機制，與 `APPEND_ASSISTANT_CONTENT` 同一 pattern

#### Changed
- **`playwright.config.ts`** — TD-511 拆分雙 profile：用 `PLAYWRIGHT_WEBSERVER=auto` 環境變數分流。本機開發（`pnpm test:e2e`）不自動起 server（保留可控 streaming 環境），CI（`pnpm test:e2e:ci`）自動起 dev server 讓 E2E 可跑
- **`package.json`** — ➕ `test:e2e:ci` 腳本（`PLAYWRIGHT_WEBSERVER=auto playwright test`），為未來 TD-514 CI workflow 鋪路

#### Metrics
- 測試基線：649 → **662 tests**（+13）/ 46 test files / 4 Gate 全綠

### 🧪 US-S6-1 TD-503 Abort E2E + TD-508 Reducer 重構 + TD-509 文件化

#### Added
- **`tests/e2e/td-503-stream-abort.spec.ts`** — Playwright E2E 守護 SSE 串流 abort 機制在 React 層正確傳遞 AbortSignal，涵蓋 3 個場景（切換 chat、同 SPA 切換 session、disabled期間不重複送出）
- **`playwright.config.ts`** — Playwright 配置（E2E 目錄 + 環境變數讀取 dev server URL）
- **`app/chat/hooks/use-chat-stream.test.ts`** — TD-508 sessionsReducer 純函式單元測試，6 個 case 守護 reducer 行為不退步

#### Changed
- **`app/chat/hooks/use-chat-stream.ts`** — TD-508 重構：functional setState 改為 useReducer + named actions（SEED_USER_AND_ASSISTANT / APPEND_ASSISTANT_CONTENT / APPEND_CHARS），文件化 action 語意、加 exhaustiveness check、加 reference equality 守護避免無謂 re-render
- **`app/chat/hooks/use-chat-sessions.ts`** — sessions 改用 useReducer、新增 REGISTER_SESSION action、暴露 `dispatch` 給 useChatStream 使用
- **`app/chat/chat-page-client.tsx`** — caller 改用 dispatch（取代 setSessions）
- **`lib/auth/config.ts`** — TD-509 JWT augmentation 加 JSDoc，解釋為何需要 `import type { JWT }`（TypeScript quirk：必須引入模組才能套用 augmentation）

### 📝 Sprint 6 Reflection 報告

- **`docs/reflection/sprint-6-reflection.md`** — Sprint 6 起步 4 個 Task 反省報告，6 維度檢查 + 跨任務 pattern 記錄
- **`docs/reflection/index.md`** — Reflection 報告索引（含跨 Sprint 觀察比較表）
- **`docs/backlog.md`** — Sprint 6 Reflection 發現區塊，新增 6 個 backlog item（TD-405-alt + TD-510 ~ TD-514 + US-S6-2 沿用）

### 🐛 TD-405 → TD-601 /admin/extensions 崩潰修復

> **編號變更說明**：本次 Backlog 重整時，`TD-405`（Extension State Prisma 持久化，舊 id）重新編號為 **TD-515**；本次修復的崩潰 bug 從過渡命名 `TD-405-alt` 正式編號為 **TD-601**。CHANGELOG 保留原「TD-405」標題以維持歷史可追溯。

#### Fixed
- **`app/api/extensions/route.ts`** — 修正忘記 `await` async 函數 `listInstalledExtensions()` 的 bug，導致 `/api/extensions` 回傳 Promise 序列化後的 `{}`，前端 `/admin/extensions` 在第 75 行 `.filter()` 崩潰。順手加上 try/catch，DB 故障時改回傳 HTTP 500 + 空陣列，不再拖整個前端

#### Added
- **`eslint.config.mjs`** — 新增 `@typescript-eslint/no-floating-promises` 與 `@typescript-eslint/await-thenable` 規則（`error` 等級），並啟用 type-aware linting（`project: './tsconfig.json'`），未來任何 async 函數忘 await 都會在 `pnpm lint` 階段被擋下
- **`tests/integration/td-405-extensions-admin-smoke.test.ts`** — 4 個永久 gate 守護 `/api/extensions` 回傳正確陣列形狀 + 3 個 extensions 都在 + `isEnabled` 布林型別正確 + client `.filter()` 不再炸
- **`README.md`** — 補「沒有本地 PostgreSQL？用 Docker 起一個」子段落，並註明 5432 被佔時可改用 5433，避免新成員 clone 後踩 `.env` 缺失的坑

#### Changed
- **`.env`** — 新建（含真實 `DATABASE_URL` 指向 `lemontree-pg` 容器的 `ai_headless` schema）
- **`app/admin/extensions/extensions-page-client.tsx`** — `useEffect` 內 `loadExtensions()` 加 `void` 標記，明確化 fire-and-forget 意圖（被新 lint 規則順手捕獲）

#### Environment
- 共用 `lemontree-pg`（`postgres:16-alpine`）容器，新增 `ai_headless` schema（與現有 `lemontree` schema 完全隔離），14 張表由 `prisma db push` 同步完成

### 🎉 Sprint 3 — 完整 Demo（40 SP）

#### S3.4 AI Chat 完整 UI（12 SP）
- 新增 `app/chat/` — 完整 Chat UI（sidebar + streaming + 多 session）
- 新增 `app/api/chat/stream/route.ts` — SSE streaming AI Chat endpoint
- 新增 `lib/ai/chat/chat-utils.ts` — ChatSession + Markdown 渲染 + JsonSpec extraction
- 新增 `lib/ai/providers.ts` — AI Provider 介面（mock 實作）
- 新增 `components/chat/` — ChatSidebar / MessageBubble / ChatInput
- 支援 Markdown 渲染（粗體 / 斜體 / code / heading / list / link）+ XSS 防護
- 自動偵測 AI 回應中的 ```json fence 並附加 JsonSpec metadata
- ✨ JsonSpec Badge 在 UI 顯示「✨ 已生成 JsonSpec: name (N models)」

#### S3.5 Extension 安裝 UI（5 SP）
- 新增 `app/admin/extensions/` — Extension 管理後台
- 新增 `app/api/extensions/` — REST API（list / detail / toggle）
- 新增 `lib/extensions/extension-manager.ts` — Extension 狀態管理
- 新增 `components/admin/extension-card.tsx` — Extension 卡片（含 toggle 按鈕）
- 支援啟用/停用狀態切換（持久化到 `.extension-state.json`）
- 顯示 hooks / actions / computed / workflows 計數

#### S3.3 E2E CRUD Demo（5 SP）
- 新增 `BlogPost` / `Todo` / `Event` / `EventRegistration` 四個 Prisma models
- 新增 `tests/integration/three-cruds-e2e.test.ts` — 11 個 E2E 測試
- 驗證完整 pipeline：JSON Spec → Validator → Generators → DB schema

#### S3.2 Event Extension（8 SP）
- 新增 `extensions/event/` — 完整 Event Extension（manifest + spec + 2 models）
- 包含 2 個 Hooks（beforeCreateEvent + beforeRegister）
- 包含 3 個 Computed（availableSeats / isFull / isUpcoming）
- 包含 2 個 Actions（registerAttendee / cancelEvent）
- 包含 1 個 Workflow（lifecycle 狀態機：upcoming/ongoing/past/cancelled）
- 新增 `tests/integration/event-extension.test.ts` — 29 個測試

#### S3.1 Todo Extension（5 SP）
- 新增 `extensions/todo/` — 完整 Todo Extension（manifest + spec + 1 model）
- 包含 1 個 Hook（beforeCreateTodo：trim + 預設值）
- 包含 1 個 Computed（remainingDays）
- 包含 1 個 Action（completeTodo）
- 新增 `tests/integration/todo-extension.test.ts` — 14 個測試

#### 文檔站點（S3.6 - 5 SP）
- 重寫主 `README.md` — 完整功能介紹 + Quick Start + 專案結構
- 新增 `docs/getting-started.md` — 5 分鐘新手入門指南
- 新增 `CHANGELOG.md` — 本檔案

---

## Sprint 9 — Blog + Event + Todo CRUD + Disable Guard

### 🎯 核心交付（commit `ab837d9`）

#### Added
- **Blog Extension**：列表頁、詳情頁、狀態切換、狀態徽章
  - 5 state + 4 event workflow（draft → published → archived + 草稿恢復）
  - **3 個 UI 元件**：list-card / status-badge / transition-buttons / create-dialog
- **Event Extension**：列表頁、狀態切換、狀態徽章
  - 4 state + 3 event workflow（upcoming → ongoing → completed + cancelled）
  - **3 個 UI 元件**：list-card / status-badge / transition-buttons / create-dialog
- **Todo Extension**：列表頁、狀態切換、優先級徽章
  - 3 state workflow（pending → in_progress → completed）
  - **3 個 UI 元件**：list-card / priority-badge / row-actions / create-dialog
- **API endpoints**：13 個（blog ×4 / event ×3 / todo ×4 / order ×2 補齊 transition）

#### Tests
- `tests/integration/blog-event-todo.test.ts` — **33 個**整合測試

### 🛡️ Disable Guard 三層架構（commit `eb1d666`）

#### Added
- `lib/extensions/extension-enabled.ts` — 輕量 helper（`isExtensionEnabledByName` + `listEnabledExtensions`）
- `lib/extensions/api-guard.ts` — API route helper（`guardExtensionApi` → 403）
- `app/admin/_components/extension-page-guard.tsx` — Page helper（`guardExtensionOrRedirect` → redirect）
- `app/admin/layout.tsx` — 注入 `enabledExtensions` 到 Sidebar
- `app/admin/admin-sidebar.tsx` — 接收 prop + 過濾 NAV_ITEMS（每個 nav 加 `requiresExtension`）
- **9 個 API routes** 加 guard（blog ×4 / event ×3 / todo ×4）
- **4 個 pages** 加 guard（blog / event / todo / orders）
- **3 個 edit-dialog 元件**（blog / event / todo）— shadcn/ui Dialog + react-hook-form + Zod
- `app/admin/event/[id]/page.tsx` — Event 詳情頁

### 🐛 Disable Guard 測試補完（commit `3c3be17`）

#### Tests
- `tests/integration/disable-guard-helper.test.ts` — **13 個** helper 測試
- `tests/e2e/disable-guard-api.spec.ts` — **11 個** API E2E（9 pass + 2 skip）

#### Bug Fix
- 🐛 **揭露 `listEnabledExtensions()` bug**：原本 `|| true` 是死代碼，filter 形同失效。修為「`dbRecord.get(name) === undefined || === true`」的嚴格判斷

#### Backlog
- 🆕 **TD-522** Order Extension manifest 缺失（`extensions/order/` 沒有 `manifest.json`）

### ✅ Sidebar HTML 隱藏驗證（commit `741e7f3`）

#### Tests
- `tests/integration/admin-sidebar.test.tsx` — **12 個** RTL 單元測試
- `tests/e2e/disable-guard-sidebar.spec.ts` — **8 個** Sidebar HTML E2E

#### Bug Fix
- 🐛 **揭露 + 修正 `listEnabledExtensions()` 邏輯**：「DB 沒記錄 = 沒安裝 ≠ 已啟用」。改為「DB 有記錄且 enabled 才返回」

### 📊 Sprint 9 統計

| 指標 | 數值 |
|------|------|
| Commits | 4 |
| 變更檔案 | 31 |
| 新增行數 | 1341 |
| 新增測試 | **81 個**（unit + integration + e2e）|
| 揭露 bug | 2 個 |
| Backlog 新增 | TD-521 ✅ Done + TD-522 📋 Ready |

**測試基線**：820 tests / 56 files / 4 Gate 全綠

### 📚 文檔
- `docs/reflection/sprint-9-reflection.md` — 完整反省報告（6 維度）

---

## Sprint 1 Review Fixes（7 SP）

### TD-305 Relation 二元性統一（2 SP）
- 新增 `lib/specs/relation-merge.ts` — mergeRelations + mergeRelationsInSpec
- 優先順序：field.relation（顯式）> field.type=reference（隱式推導）> model.relations（兜底）
- `aiSpecStage` 自動呼叫 mergeRelationsInSpec

### TD-304 Pipeline Type Inference（2 SP）
- `createPipeline<TStages extends ReadonlyArray<PipelineStage>>` — 變參數 tuple 強制 type chain
- 新增 `lib/ai/pipeline/pipeline-types.test.ts` — 4 個測試

### TD-302 Relation Select（3 SP）
- 新增 `components/admin/relation-select.tsx` — Relation Select 組件
- 自動從 `/api/crud/{kebab}` 載入，兼容 `items` / `data` / `results` 三種 API 響應格式
- `ui-generator.ts` 移除 3 個 TODO，生成 `<RelationSelect>` 取代 placeholder

---

## Sprint 2 — Extension SDKs（35 SP）

### S2.1 Hook SDK（5 SP）
- `lib/hooks/hook-sdk.ts` — 鉤子 SDK（含 6 個生命週期事件）

### S2.2 Action SDK（5 SP）
- `lib/actions/action-sdk.ts` — 自定義動作 SDK

### S2.3 Computed SDK（5 SP）
- `lib/computed/computed-sdk.ts` — 計算字段 SDK（registry key 從 field.name 改為 field.compute）

### S2.4 Workflow Engine（5 SP）
- `lib/workflows/workflow-engine.ts` — 狀態機引擎（createStateMachine / transition）

### S2.5 `{{fn:...}}` 解析器（5 SP）
- `lib/refs/ref-resolver.ts` — extractAllReferences / validateReferences / renderTemplate

### S2.6 Tiptap 富文本編輯器（5 SP）
- `components/admin/rich-text-editor.tsx` + `rich-text-display.tsx`

### S2.7 Auth.js v5 + RBAC（5 SP）
- `lib/auth/config.ts` + `auth.ts` + `rbac.ts`

---

## Sprint 1 — 框架核心（35 SP）

- ✅ JsonSpec 規範 + Validator + Types
- ✅ Schema Generator（Prisma）
- ✅ API Generator（Next.js Route Handlers）
- ✅ UI Generator（自動生成 CRUD 頁面）
- ✅ Permission Generator（RBAC 矩陣）
- ✅ Pipeline Runner（AI 編排）
- ✅ shadcn/ui + Tailwind 整合
- ✅ Admin 基礎組件（DataTable / FormField / Pagination / SearchBar）

---

## 統計

| 項目 | 數據 |
|---|---|
| **總測試數** | 468（29 個 test files）|
| **完成 Sprints** | 1 + 2 + Review Fixes + 3 = **112 SP / 152 SP（74%）**|
| **總代碼行數** | ~13,000（含測試）|
| **核心模組** | 12 個（Pipeline / Hook / Action / Computed / Workflow / Auth / Generator / Validator 等）|
| **已實作 Extensions** | 2（todo + event）|

---

## 路線圖

- [ ] **Sprint 4** — 認證 / 權限完善 + 多租戶
- [ ] **Sprint 5** — AI Provider 真實串接（OpenAI + Anthropic）
- [ ] **Sprint 6** — Extension Registry（線上安裝 / 卸載）
- [ ] **Sprint 7** — 完整 E2E 測試 + CI/CD
- [ ] **Sprint 8** — 性能優化 + 生產部署
