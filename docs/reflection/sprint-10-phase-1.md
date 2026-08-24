# Sprint 10 Phase 1 反省 — Compiler Pipeline 串接

> **Sprint**: Sprint 10 — Compiler Pipeline 啟動（修正 Sprint 9 違背 §13 設計的問題）
> **Phase**: 1 / 3（Compiler Pipeline 串接 + spec 自訂 base path）
> **反省日期**: 2026-08-25
> **反省級別**: Sprint Phase

---

## 🎯 Phase 1 目標

**目標**：把 `lib/compiler/` 既有的 4 個 generator（schema / api / ui / permission）串接成可運行的 pipeline，讓「讀 schema.json → 自動生成 API + UI」真的可行

**對應 Backlog**：TECH-008 Compiler Pipeline 串接（Phase 1 部分）

---

## 📊 改動清單

| 檔案 | 變更 | 說明 |
|---|---|---|
| `lib/compiler/compile.ts` | 新增 | Orchestrator：`compileExtension()` + `listAvailableExtensions()` |
| `lib/specs/json-spec.types.ts` | 修改 | `JsonSpec` 加 `apiBase?` + `uiBase?` 選填欄位 |
| `lib/compiler/api-generator.ts` | 修改 | `modelToRouteBase` 讀 `spec.apiBase` |
| `lib/compiler/ui-generator.ts` | 修改 | 加 `uiBasePath()` + 改 3 處硬編碼路徑 |
| `extensions/blog/blog-spec.json` | 修改 | 加 `"apiBase": "/api/blog"`, `"uiBase": "/admin/blog"` |
| `scripts/try-compile.ts` | 新增 | 驗證腳本（dry-run） |

---

## 🔑 設計決策

### 1. Compiler 是「寫磁碟」工具，不是 runtime
- **不做 dev watch**（避免干擾 Next.js HMR）
- **不做 runtime dynamic route**（保留 Next.js 靜態檔案特性）
- **Sprint 10 範圍**：`pnpm compile` 手動觸發，產出檔案 → commit → deploy

### 2. JsonSpec 向後兼容
- **沒設 `apiBase`** → 預設 `/api/crud/[model-kebab]`（通用模式，一 spec 多 model）
- **有設 `apiBase`** → 直接用該 base 作為路徑（單一 model / Extension 風格）
- 既有 4 個 spec 都**還沒設** apiBase（Phase 2 處理）

### 3. Sprint 9 違背 §13 的修正路徑
| Sprint 9（手寫） | Sprint 10（compiler） |
|---|---|
| `app/api/blog/route.ts` 手寫 | `extensions/blog/blog-spec.json` + `apiBase` → compiler 生成 |
| `app/admin/blog/page.tsx` 手寫 | compiler 生成 list/create/edit 三頁 |
| `extensions/blog/blog-spec.json` 已存在但**沒被使用** | Sprint 10 開始成為 source of truth |

---

## 🧪 驗證結果

| 驗證項 | 結果 |
|---|---|
| `pnpm typecheck` | ✅ 全綠 |
| `pnpm vitest run lib/compiler` | ✅ 84 tests / 4 files（既有 compiler test 全綠）|
| `pnpm vitest run`（全 unit + integration）| ✅ 777 tests / 56 files |
| `scripts/try-compile.ts`（dry-run）| ✅ 產出 `/api/blog/*` + `/admin/blog/*` 路徑，與 Sprint 9 完全一致 |

### Compiler 產出（blog spec）
```
Routes: 6
  GET    /api/blog
  GET    /api/blog/[id]
  POST   /api/blog
  PUT    /api/blog/[id]
  DELETE /api/blog/[id]
  POST   /api/blog/[id]/actions/publish

Pages: 3
  list   /admin/blog
  create /admin/blog/new
  edit   /admin/blog/[id]
```

---

## 📋 揭露的設計問題

### 1. UI page 缺少狀態機支援
Compiler 生成的 list page **沒有 transition 按鈕**（Sprint 9 Order/Blog 都手寫了 transition UI）

**影響**：workflow（狀態機）目前仍需手寫對應 UI 層

**Sprint 10 Phase 2/3 處理**：擴充 ui-generator，加 `workflow` 欄位 → 自動生成 transition 按鈕群

### 2. Compiler 不知道「disable guard」
Phase 1 生成的 API 沒有 `guardExtensionApi` 守衛

**影響**：disable extension 後仍可呼叫 API（不會 403）

**Sprint 10 Phase 2 處理**：api-generator 加 `requiresExtension` 自動注入 guard

### 3. 沒有 sidebar 過濾
Compiler 生成 page 但**沒有自動更新 Sidebar**

**Sprint 10 Phase 2 處理**：ui-generator 同時生成 sidebar nav item

---

## 🚀 下一步

**Phase 2 — 反向驗證 Blog Extension**（3 SP）：
1. 在隔離目錄跑 `pnpm compile --extension=blog --output=app/_compiled/blog/`
2. 與 Sprint 9 手寫 `app/api/blog/` + `app/admin/blog/` diff 比對
3. 修差異直到 compiler 產出**完全等價**（API 行為 + UI 渲染 + sidebar）
4. 跑全 E2E（vitest + playwright）確認等價
5. 完成後 Sprint 10 Phase 2 commit

**Phase 3 — 4 個 extension 全遷移**：
- Order → order-spec.json + `apiBase: '/api/order'`
- Event → event-spec.json + `apiBase: '/api/event'`
- Todo → todo-spec.json + `apiBase: '/api/todo'`
- Blog 已有 → 補上 `apiBase` 已完成

---

## 🎓 教訓

1. **「Compiler 已存在但沒被用」是最大技術債**：Sprint 1-9 累積了 compiler 4 個 generator 卻沒串起來
2. **每次衝刺前先讀 `system-design.md`**：Sprint 9 違反 §13 是因為太快進入實作
3. **向後兼容是設計的第一步**：加 `apiBase?` 選填欄位比改預設值安全得多
4. **dry-run 是 compiler pipeline 的最小驗證**：先證明「能生成對的東西」，再考慮「要不要寫進磁碟」
