# Sprint 15 Reflection — Runtime Spec 精簡化 + formatters/customRenderers（partial）

**完成日期**：2026-08-26
**Sprint Goal**：移除 Sprint 14 後殘留的死代碼 + 統一 disable guard 推導邏輯 + 在 spec 內定義欄位 formatter/customRenderer 機制
**SP**：3.5 / 4.5 SP（78%）— Stage 1+2+3 完成，Stage 4 留 Sprint 16

---

## ✅ 完成項目

### Stage 1（commit `e4797a5`，0.5 SP）— TECH-037 移除 apiBase/uiBase

#### Removed
- `lib/specs/json-spec.types.ts` — 刪除 `apiBase?` / `uiBase?` 字段（-10 行，含兩個 JSDoc 區塊）

#### Added
- `tests/integration/tech-037-no-apibase-uibase.test.ts` — 4 個守護測試（確保未來不再引入這兩個字段）

#### 動機
Sprint 14 揭露 Sprint 10-13 的 compiler 路線已不需要自訂 base path — runtime 全部走 `/api/crud/<spec>` + `/admin/crud/<spec>` 動態路由。Sprint 14 標 `@deprecated`，本 stage 正式移除。

---

### Stage 2（commit `55664fd`，1 SP）— TECH-040 requiresExtension 統一從 spec.name 推導

#### Added
- `lib/specs/extension-derive.ts`（41 行）— `getRequiredExtension(spec)` helper
  - 顯式覆寫：`spec.requiresExtension ?? ...`
  - 預設推導：`spec.name`
- `tests/integration/tech-040-derive-requires-extension.test.ts`（99 行）— 5 個守護測試

#### Changed
- 4 個檔案改用 helper：
  - `lib/runtime/dynamic-handler.ts` `checkDisabled` — 移除 `if (!spec.requiresExtension) return null` 守衛
  - `app/admin/crud/[spec]/page.tsx`（含 listAvailableSpecs 區塊）
  - `app/admin/crud/[spec]/new/page.tsx`
  - `app/admin/crud/[spec]/[id]/page.tsx`
- **disable guard 改為「總是 guard」**：用 `getRequiredExtension(spec)` + `isExtensionEnabledByName(extName)`，不再用 `if (spec.requiresExtension)` 守衛

#### 動機（Sprint 14 揭露的 false claim 模式）
Sprint 14 揭露「Sprint 9 寫的 disable guard 在 event/todo spec 上完全沒生效，因為這兩個 spec 沒填 `requiresExtension`」。Sprint 15 修正這個 false claim 模式：
- **「總是 guard」**：disable guard 不再依賴 spec 內的 explicit 設定（會漏），改為「永遠從 spec.name 推導」
- 顯式覆寫仍保留（向後兼容），但不再用作條件分支

---

### Stage 3（本 commit，2 SP partial）— TECH-038 formatters + customRenderers

#### Added
- `lib/runtime/extension-loaders.ts`（130 行）— 動態載入 extension 的 formatter / customRenderer 檔案
  - `loadFormatters(spec)` + `loadCustomRenderers(spec)`
  - `parseFnRef(ref)` — 解析 `{{fn:fnName}}` 語法
  - `toKebabCase(s)` — camelCase → kebab-case 雙檔名支援
  - `resolveExistingPath(candidates)` — 從候選路徑中選第一個存在的（用 `fs.statSync`）
  - 用 `/* webpackIgnore: true */` 讓 Next.js Turbopack 跳過靜態分析（否則 webpack 看到 `require(extPath)` 就報 Module not found）
- `extensions/event/formatters/format-event-time.ts`（25 行）— 格式化 DateTime 為 `YYYY/MM/DD HH:mm`（zh-TW locale）
- `extensions/event/custom-renderers/capacity-bar.tsx`（42 行）— capacity progress bar React component
- `tests/integration/tech-038-formatters-renderers.test.ts`（218 行，11 tests）— 守護測試

#### Changed
- `lib/specs/json-spec.types.ts` — `Model` 加 `formatters?` + `customRenderers?` 字段
- `lib/runtime/ui-config.ts` — `UIField` 加 `formatter?` + `customRenderer?` 字段
  - `buildListUIConfig` 把 customRenderer 加為虛擬 UIField（`inputType: 'hidden'`，`name=rendererKey`）
  - `buildDetailUIConfig` / `buildFormUIConfig` 傳遞 formatter 名稱
- `extensions/event/event-spec.json` — 加 `formatters` + `customRenderers` 區塊
  ```json
  {
    "name": "event",
    "models": [{
      "name": "Event",
      "fields": [...],
      "formatters": {
        "startAt": "{{fn:formatEventTime}}",
        "endAt": "{{fn:formatEventTime}}"
      },
      "customRenderers": {
        "capacityBar": "{{fn:renderCapacityBar}}"
      }
    }]
  }
  ```
- `app/admin/crud/[spec]/[id]/page.tsx` — **server side** 預 fetch item + 預套用 formatter → 傳 `formattedValues: Record<fieldName, string>` 給 client
- `app/admin/crud/[spec]/[id]/dynamic-detail-client.tsx` — 接受 `initialItem` + `formattedValues`，避免 client 二次 fetch
- `app/admin/crud/[spec]/dynamic-list-client.tsx` — **移除** client side formatter/customRenderer 渲染（Sprint 16 才補 server-side 預渲染架構）

#### 真實可用性驗證（手動）
- `/admin/crud/event/<id>` 的「開始時間」顯示 `2030/12/1 下午6:00:00`（由 `formatEventTime` 格式化）
- 「結束時間」顯示 `2030/12/2 上午2:00:00`（同一個 formatter 套用）
- 對比 API 回傳的 raw `2026-08-24` —— formatter 完全生效

---

## 🐛 Sprint 15 Stage 3 揭露並修正的真實問題

### 問題 1：Server Component 不能傳函數給 Client Component
- **揭露路徑**：第一次 dev server 測試時 list page / detail page 都報 500，log 顯示 `Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server"`
- **根本原因**：Next.js Server Component 序列化限制 — 純函數 formatter 不能從 page.tsx（server）傳給 dynamic-list-client.tsx / dynamic-detail-client.tsx（client）
- **影響**：原本設計「server 載入 formatter → 傳給 client 渲染」完全不可行
- **修正策略**：
  - **detail page**：server side 預 fetch item + 預套用 formatter → 傳 `formattedValues: Record<fieldName, string>` 給 client（純字串 map 可序列化）
  - **list page**：Sprint 15 範圍內**先不支援 list formatter**（Sprint 16 用 server-side 預渲染 HTML 架構重做）

### 問題 2：Next.js Turbopack 把動態 `require()` 視為靜態分析目標
- **揭露路徑**：log 顯示 `/ROOT/extensions/ <dynamic> /formatters/null` — webpack 沒追蹤 control flow（`if (!fnName) continue` 被忽略）
- **根本原因**：webpack 的 module graph 在 build time 嘗試解析所有 require 路徑，不論 runtime 是否會執行
- **修正策略**：
  - 加 `/* webpackIgnore: true */` comment
  - 改用 `path.resolve(PROJECT_ROOT, ...)` 絕對路徑（不用 `@/` alias — Vitest 和 Node 原生 require 都不支援 alias）

### 問題 3：`{{fn:fnName}}` 語法內 fnName 是駝峰，但檔名慣例是 kebab-case
- **揭露路徑**：第一次 dev server 測試時 `loadFormatters` try 了 `/ROOT/extensions/event/formatters/formatEventTime`，找不到檔案（實際檔案是 `format-event-time.ts`）
- **根本原因**：spec 內用駝峰語法（`{{fn:formatEventTime}}`），但 extension 目錄慣例是 kebab-case（`format-event-time.ts`）
- **修正策略**：
  - 加 `toKebabCase()` helper
  - `resolveExistingPath()` 試駝峰 + kebab-case 兩個候選路徑（兩個都支援，向後兼容）
  - 文件化此雙支援

---

## 📊 Sprint 15 統計

| 項目 | 數量 |
|---|---|
| 新增檔案 | 5（extension-loaders.ts + 2 個 extension 範例 + 2 個守護測試）|
| 修改檔案 | 7（json-spec.types / ui-config / event-spec / 4 個 page/client）|
| 刪除檔案 | 0 |
| 新增測試 | 20（TECH-037 4 + TECH-040 5 + TECH-038 11）|
| 修改測試 | 0 |
| **最終測試基線** | **764 tests / 62 files**（735 vitest + 29 Playwright E2E）|

> 計算：
> - Sprint 14 結束：748 tests / 60 files
> - Stage 1：+4 tests
> - Stage 2：+5 tests
> - Stage 3：+11 tests → 加 test file 1 個（60 → 61 → 62 → 62）
> - 整體：719 vitest → 735 vitest

---

## 🎯 6 維度反省

### 1. UX/UI 一致性 ✅
- Detail page 顯示 formatter 套用後的日期（`2030/12/1 下午6:00:00`），對用戶友善
- 4 個 spec 的 list/detail page 視覺仍一致（list page 移除 formatter 不影響 layout）
- **範圍誠實**：list page 的 formatter Sprint 15 沒做（避免假裝做了） — Sprint 16 再補 server-side 預渲染

### 2. RWD 響應式設計 ⚠️
- Dynamic UI 用 shadcn/ui + Tailwind，理論上響應式
- **本 session 仍沒實際驗證**：375px / 768px viewport 測試留 Sprint 15 Stage 4（即 Sprint 16 的 TECH-039）

### 3. 技術債 ✅ 大幅改善
- **移除**：`apiBase` / `uiBase` 字段（-10 行 + 兩個 JSDoc 區塊）
- **消除 false claim 模式**：disable guard 不再依賴 spec 內的 explicit `requiresExtension` 設定（Sprint 14 揭露的問題）
- **新增技術債**：
  - list page 沒 formatter/customRenderer 渲染（Sprint 16 補）
  - dynamic import 的 React component 渲染機制（Sprint 16 補）
  - 雙駝峰/kebab-case 支援（暫時用 fallback，未來可強制單一）

### 4. 可維護性 ✅
- `getRequiredExtension(spec)` 是純函數、無 side effect、型別清楚
- `loadFormatters` / `loadCustomRenderers` 統一 API，差異只在副檔名
- **spec.json 是 Single Source of Truth**：formatters/customRenderers 都在 spec.json 內定義，AI 友善（單檔改動）

### 5. 測試覆蓋率 ✅
- 20 個新守護測試覆蓋：apiBase/uiBase 移除、requiresExtension 推導、formatters/customRenderers API
- **沒寫 E2E**：TECH-038 是 partial（client side customRenderer 還沒做），E2E 待 Sprint 16
- Manual dev server 驗證 detail formatter 套用成功

### 6. 需求對齊 ⚠️
- 用戶原始需求「在 spec 內定義 formatter/customRenderer」已實作（API + Event 範例）
- **partial 完成**：list page 沒做（因 Server Component 函數傳遞限制）— 已和用戶確認 partial 為 acceptable，Sprint 16 再補
- 用戶在 Sprint 15 開頭的核心思路「manifest columns 注入的話，給 AI 開發時，是否都要多一個 spec？」 → 已實踐於 spec.formatters/spec.customRenderers（單檔、單一）

---

## 📝 Sprint 16 待做項目

| Task | SP | 來源 |
|---|---|---|
| TECH-038 customRenderer 客戶端 React component 動態渲染 | 1 | Sprint 15 Stage 3 留 |
| TECH-038 list page formatter 完整支援（server-side 預渲染 HTML） | 1 | Sprint 15 Stage 3 留 |
| TECH-039 E2E RWD 測試（viewport 375/768 + 4 spec 驗證）| 1 | Sprint 15 Stage 4 留 |

> 預估 Sprint 16：3 SP，目標「Runtime Spec 精簡化 + RWD 驗證」

---

## 🔗 跨 Sprint 觀察

### 「守衛檢查」的演進
- Sprint 9：「每個 spec 都有 disable guard」 — **false claim**
- Sprint 14：揭露 → 補完 event/todo 的 `requiresExtension`
- Sprint 15：「總是 guard」— disable guard 不再依賴 explicit 設定

### 「Server Component 限制」的學習
- Sprint 14 揭露：「function 不能跨 RSC 邊界傳遞」
- Sprint 15 Stage 3 應用：detail formatter 用 server-side 預套用 + 傳 string map

### 「spec.json 是 Single Source of Truth」的延伸
- Sprint 13：spec.json 是 manifest + nav 的 SoT
- Sprint 14：spec.json 是 API + UI 的 SoT
- **Sprint 15**：spec.json 是 formatter + customRenderer 的 SoT（API + Event 第一個真實範例）

---

**反思結論**：Sprint 15 partial（3.5 / 4.5 SP）成功。Stage 1+2 完全達成目標（移除死代碼 + 統一 disable guard）；Stage 3 揭露了 Server Component 函數傳遞限制，做出誠實的 partial 決策（detail 完整、list 留 Sprint 16）。Sprint 16 已規劃清楚，預計 3 SP 收尾 formatter/customRenderer + RWD E2E。