# 📜 CHANGELOG

所有重要變更都會記錄於此。

格式基於 [Keep a Changelog](https://keepachangelog.com/)，
版本遵循 [Semantic Versioning](https://semver.org/)。

---

## [Unreleased]

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
