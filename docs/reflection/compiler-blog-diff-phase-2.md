# Compiler Blog Diff Report — Sprint 10 Phase 2

> **生成時間**：2026-08-25
> **目的**：比對 Sprint 9 手寫 Blog API + UI 與 Sprint 10 Compiler 自動生成的差異
> **產出**：`app/_compiled/blog/` 對比 `app/api/blog/` + `app/admin/blog/`

---

## 📊 比對摘要

| 檔案 | Sprint 9 手寫 | Compiler 生成 | 行數差 |
|---|---|---|---|
| `app/api/blog/route.ts` | 31 行（GET + POST）| 54 行（POST only）| ⚠️ 缺 GET |
| `app/api/blog/[id]/route.ts` | 49 行（GET + PATCH + DELETE）| ~150 行（GET + PUT + DELETE）| ⚠️ PUT vs PATCH |
| `app/api/blog/[id]/transition/route.ts` | Sprint 9 額外有 | compiler 無 | ❌ 缺 workflow endpoint |
| `app/api/blog/[id]/actions/publish/route.ts` | Sprint 9 無 | compiler 有 | ✅ 新增 |
| `app/admin/blog/page.tsx` | Sprint 9 手寫含 shadcn/ui table | compiler 有 | ⚠️ 樣式細節不同 |
| `app/admin/blog/[id]/page.tsx` | Sprint 9 有（編輯頁）| compiler 有 | ⚠️ 缺 transition buttons |
| `app/admin/blog/new/page.tsx` | Sprint 9 無 | compiler 有 | ✅ 新增（compiler 加） |
| `app/admin/blog/components/*` | Sprint 9 有 6 個元件 | compiler 無 | ❌ 缺共用元件 |

---

## 🔍 差異分類

### 🅐 結構差異（compiler 設計合理）
1. **`route.ts` 單檔多 method**：Sprint 9 把 GET/POST 放同檔；compiler 預期也是同檔，但目前 orchestrator 重複寫入（6 routes 寫進 6 entries 但只有 3 個檔案）→ **compiler bug 需修**

2. **workflow 邏輯位置**：Sprint 9 用 `extensions/blog/workflow/blog-workflow.ts` 包商業邏輯；compiler 直接 prisma + hook
   - 按 system-design.md §13.1：workflow 是 **L3 邏輯**，應放 Extension Code
   - compiler 設計**正確**，但缺「呼叫 workflow」的轉接層

3. **PUT vs PATCH**：Sprint 9 用 PATCH（部分更新），compiler 用 PUT（全替換）
   - RESTful 慣例：PUT 全替、PATCH 部分
   - Sprint 9 實作是 PATCH 風格但用 PUT = **Sprint 9 不標準**
   - compiler 用 PUT = **標準但需 update 邏輯**

### 🅑 功能缺失（compiler 缺）
1. **Disable Guard**：compiler 生成的 route 沒有 `guardExtensionApi`
   - 用戶 Sprint 9 需求：disable blog → API 403
   - compiler 需加 `requiresExtension` 機制

2. **Workflow Transition endpoint**：Sprint 9 有 `POST /api/blog/[id]/transition`
   - compiler 不知道 workflow 存在
   - 需 ui-generator 加 workflow 欄位，自動生成 transition buttons + endpoint

3. **共用元件**（blog-status-badge, blog-transition-buttons, edit-blog-dialog）：
   - Sprint 9 為每個 extension 手寫 6 個元件
   - compiler 完全沒有
   - 需 ui-generator 加更多元件模板

### 🅒 樣式差異（功能等價但風格不同）
1. **DataTable**：Sprint 9 用 `@/components/admin/data-table`（shadcn/ui）；compiler 自帶
2. **Toast/Dialog**：Sprint 9 用 shadcn/ui；compiler 用原生 useState
3. **Form Validation**：Sprint 9 用 react-hook-form + Zod；compiler 用 Zod direct

---

## 🚨 揭露的 Compiler Bug

### Bug 1 — 同一 path 重複寫入
**現象**：6 routes 寫進 `writtenFiles` 但只有 3 個檔案（GET/POST 都寫 `/api/blog/route.ts`）

**修法**：
1. orchestrator 應該把同 path 的多個 method code **合併**（用 `\n\nexport async function PUT(...) {...}`）
2. 或 compiler 改 design：每個 method 一個檔（如 `app/api/blog/get/route.ts`、`app/api/blog/post/route.ts`）→ 不合 Next.js 慣例

### Bug 2 — UI page path suffix 錯誤
**現象**：`page.path = '/admin/blog/new'` → 我寫 `/admin/blog/new/page.tsx` ✅
但 `page.path = '/admin/blog/[id]'` → 我寫 `/admin/blog/[id]/page.tsx` ✅

**修法**：確認 suffix 加法正確（剛才已修過）

### Bug 3 — Transition endpoint 缺失
**現象**：Sprint 9 有 `/api/blog/[id]/transition`，compiler 完全沒生成

**修法**：JsonSpec 加 `workflows` 欄位 → compiler 自動生成 transition endpoint + UI 按鈕

---

## 📋 行動方案

### 立即修（compiler bug）
- [ ] **Bug 1**：修 orchestrator 合併同 path 多 method
- [ ] **Bug 2**：已修

### 短期補（Phase 2 完成前）
- [ ] 加 `requiresExtension` 欄位 + 自動注入 `guardExtensionApi`
- [ ] 加 `workflows` 自動生成 transition endpoint
- [ ] 決定 PUT vs PATCH 統一（推薦 PUT，但 Sprint 9 測試可能要 PATCH）

### 中期規劃（Phase 3）
- [ ] 把 Sprint 9 手寫的 `components/` 元件模板化，compiler 可選生成
- [ ] 統一 DataTable / Form 樣式（用 shadcn/ui）

---

## 🎓 教訓

1. **Compiler 不是「完美複製品」**：差異有功能缺失、樣式不同 — **這正是 Phase 2 的價值**
2. **workflow 是 L3 邏輯**：compiler 不應生成 workflow code，但應生成「呼叫 workflow 的 endpoint」
3. **測試比對比 manual review 強**：跑 E2E 證明 compiler 生成的版本與手寫**功能等價**才是 Phase 2 完成
4. **PUT vs PATCH 統一決策**：早該決定，不是技術問題是 RESTful 規範問題
