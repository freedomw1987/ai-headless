# Reflection 報告索引

> 本目錄存放各 Sprint / US / Module 反省報告。
> **最後更新**：2026-08-26（Sprint 32 收尾）

---

## 📊 總覽

| Sprint | 報告 | 狀態 | 完成率 | 4 Gate | 重點 |
|--------|------|------|--------|--------|------|
| Sprint 3 | [sprint-3-reflection.md](./sprint-3-reflection.md) | ✅ | - | - | 初版 |
| Sprint 4 | [sprint-4-reflection.md](./sprint-4-reflection.md) | ✅ | - | - | RWD/UX 改進 |
| Sprint 5 | [sprint-5-reflection.md](./sprint-5-reflection.md) | ✅ | 100% | ✅ 全綠 | Chat 重構 + 6 個 Tech Debt |
| Sprint 6 | [sprint-6-reflection.md](./sprint-6-reflection.md) | ✅ | 100% | ✅ 全綠 | 發現→修復→預防 pattern + TD-514 P0 |
| Sprint 8 | [sprint-8-reflection.md](./sprint-8-reflection.md) | ✅ | 100% | ✅ 全綠 | Demo UI |
| Sprint 9 | [sprint-9-reflection.md](./sprint-9-reflection.md) | ✅ | 100% | ✅ 全綠 | Blog/Event/Todo CRUD + Disable Guard |
| Sprint 10 Phase 1 | [sprint-10-phase-1.md](./sprint-10-phase-1.md) | ✅ | 100% | ✅ 全綠 | Compiler Pipeline 串接 |
| Sprint 10 Phase 2 | [sprint-10-phase-2.md](./sprint-10-phase-2.md) | ✅ | 100% | ✅ 全綠 | 反向驗證揭露 6 個 bug |
| Sprint 11 Phase A | [sprint-11-phase-a.md](./sprint-11-phase-a.md) | ✅ | 100% | ✅ 全綠 | 修產出 bug |
| Sprint 11 Phase B | [sprint-11-phase-b.md](./sprint-11-phase-b.md) | ✅ | 100% | ✅ 全綠 | Disable Guard 自動注入 |
| Sprint 13 | [sprint-13.md](./sprint-13.md) | ✅ | 100% | ✅ 全綠 | Order Schema + 11 個 bug |
| **Sprint 14** | [**sprint-14.md**](./sprint-14.md) | ✅ | **100%** | ✅ **全綠** | **方向大轉彎：Compiler → Runtime** |
| **Sprint 15** | [**sprint-15.md**](./sprint-15.md) | ✅ | **78%** (3.5/4.5) | ✅ **全綠** | **移除 apiBase/uiBase + 統一 disable guard + formatters/customRenderers** |
| **Sprint 16** | [**sprint-16.md**](./sprint-16.md) | ⚠️ partial | **67%** (2/3) | ✅ **全綠** | **list page 改 Server Component + formatter 真實套用 + RWD E2E（customRenderer 客戶端留 Sprint 17）** |
| **Sprint 17** | [**sprint-17.md**](./sprint-17.md) | ✅ | **100%** (5.5/5.5) | ✅ **全綠** | **list/detail/form UI 改進（shadcn） + customRenderer 客戶端動態渲染（webpack dynamic import）** |
| **Sprint 18** | [**sprint-18.md**](./sprint-18.md) | ✅ | **100%** (6.5/6.5) | ✅ **全綠** | **CRUD 編輯功能（缺 update 解決） + dropdown-menu/pagination/skeleton 三個 shadcn 元件** |
| **Sprint 19 Stage 1** | [**sprint-19.md**](./sprint-19.md) | ✅ | **100%** (3/3) | ✅ **全綠** | **100 筆上限打破：server side 分頁（Promise.all 平行查詢 + searchParams + 分頁資訊顯示）** |
| **Sprint 19 Stage 2** | [**sprint-19.md**](./sprint-19.md#stage-2-重點list-page-嵌入-pagination-ui--url-同步) | ✅ | **100%** (1.5/1.5) | ✅ **全綠** | **list page 嵌入完整 shadcn Pagination UI + URL 同步 + 修正 Sprint 18 Button→buttonVariants bug** |
## 📊 Sprint 19 最終狀態（Stage 1 + 2 + 3 全完成）

| 階段 | 範圍 | SP | Commit | 重點 |
|---|---|---|---|---|
| **Stage 1** | Server Side 分頁 | 3 | `eef3ca4` + `eab7537` | 打破 100 筆上限 + Promise.all 平行查詢 |
| **Stage 2** | list page 嵌入 pagination UI + URL 同步 | 1.5 | `462478b` + `9d82921` | 完整 shadcn Pagination UI + 修正 Sprint 18 Button→buttonVariants bug |
| **Stage 3** | list 排序 + 篩選 | 4 | `811fe24` + `5e0ef49` | sortable header + 搜尋 input + SQL injection 白名單防護 |
| **累計** | **完整資料探索** | **8.5 / 8.5** | 6 commits | **sort + filter + paginate 三件齊全** |

---

| **Sprint 19 Stage 3** | [**sprint-19.md**](./sprint-19.md#stage-3-重點list-排序--篩選) | ✅ | **100%** (4/4) | ✅ **全綠** | **list 排序（sortable header + URL sync）+ 篩選（search form + OR contains）+ SQL injection 白名單防護** |
| **Sprint 20** | [**sprint-20.md**](./sprint-20.md) | ✅ | **100%** (7/7) | ✅ **全綠** | **UI 元件擴充（Sheet / Tooltip / Dark mode / Sonner toast 升級）+ P3 dead code + P3.5 user 報 bug（hook 註冊 + error sanitizer）** |
| **Sprint 21** | [**sprint-21.md**](./sprint-21.md) | ✅ | **100%** (8.25/8.25) | ✅ **全綠** | **US-102-P2 動態 RBAC：Prisma migration + seed-rbac + session-cache + hasDynamicPermission + 5 個 API + 2 個 UI 頁面 + Role Zod schema + 77 個新測試**（揭露 TD-1：commit 1 migration 未實際跑 DB，已修正並驗證 admin 可登入）|
| **Sprint 22** | [**sprint-22.md**](./sprint-22.md) | ✅ | **100%** (0.5/0.5) | ✅ **全綠** | **Silent bug audit：10 個 PATCH/POST/DELETE/PUT handler + 4 個相關基礎設施全面檢查（destructure / enum / FK 三項）→ 0 silent bug + SOP-R1 (PR checklist) + SOP-R2 (grep 自動檢測) 兩條新規則輸出** |
| **Sprint 23** | [**sprint-23.md**](./sprint-23.md) | ✅ | **100%** (2/2) | ✅ **全綠** | **Middleware 動態化（jwt/session permissions 注入 + 60s session-cache + Plan Gate Q3 決定 middleware 只做登入檢查 + 12 個 middleware 整合測試）+ TD-7 extension permissions backfill（18 個 permissions 從 manifest 同步到 DB）** |
| **Sprint 24** | [**sprint-24.md**](./sprint-24.md) | ✅ | **100%** (2/2) | ✅ **全綠** | **UI 條件渲染動態版：`lib/auth/ui-permissions.ts` 新 helper（hasUIPermission 純函數 + useHasUIPermission client hook，自動處理 admin wildcard）+ 2 個 UI 點遷移（crud page + sidebar）+ 11 個純函數測試** |
| **Sprint 25** | [**sprint-25.md**](./sprint-25.md) | ✅ | **100%** (1/1) | ✅ **全綠** | **強制清 hasPermission 純函式（PRD §12.4.1）：刪除純函式本體 + 4 個內部使用 + rbac.ts 整檔 + 14 個純函式測試 + 5 個 requirePermission 呼叫端改用 requirePermissionApiResponse（新增 helper）+ 2 個 server component + 1 個 dynamic-handler（async checkPermission）+ 12 個檔案 1 commit。Phase 2 RBAC 路線圖 11/11 完成** |
| **Sprint 26** | [**sprint-26.md**](./sprint-26.md) | ✅ | **100%** (2.5/2.5) | ✅ **全綠** | **Sprint 20 P2 技術債批量修復：4 commits (TD-401 handler try/catch + TD-402 sanitizer SAFE_PATTERNS + TD-403 Hook type contract + TD-404 brace-balanced spec parser)，22 個新測試，1054/1054 全綠。TD-405 被 TD-402 自動涵蓋（/StateMachine/i 加入 SAFE_PATTERNS）** |
| **Sprint 27** | [**sprint-27.md**](./sprint-27.md) | ✅ | **100%** (2.5/2.5) | ✅ **全綠** | **Clean code 改進：2 commits (TD-523 StrictHookFunction 雙軌制 + TD-524 AppError class + ErrorCategory enum 取代 regex)，21 個新測試，1075/1075 全綠。3 條新學習 (L19-L21)：class-based error vs regex 維護性、雙軌制演進模式、TypeScript Function Contravariance** |
| **Sprint 28** | [**sprint-28.md**](./sprint-28.md) | ✅ | **100%** (5/5) | ✅ **全綠** | **Order Workflow 改進：4 commits (TD-519 Order 列表分頁 [已由 Sprint 19 涵蓋] + TD-520 Order Zod 驗證 [已由 Sprint 19 涵蓋] + TD-516 transaction 避免 race condition + TD-517 TransitionLog audit log)，17 個新測試 + 既有 3 個 order 測試加 mock，1094/1094 全綠。4 條新學習 (L22-L25)：backlog Ready audit、Prisma transaction 雙層防護、Extension code vs Dynamic handler 一致性、利用既有 schema** |
| **Sprint 29** | [**sprint-29.md**](./sprint-29.md) | ✅ | **100%** (3-4/3-4) | ✅ **全綠** | **UserId 注入 + Blog/Event Audit Log：4 commits (動態 handler 統一注入 userId + Order 確認注入生效 + blog transition 整合 TransitionLog + 新增 event transition 函式整合 TransitionLog)，10 個新測試 + 既有 1 個 blog-event-todo 測試加 mock，1104/1104 全綠。4 條新學習 (L26-L29)：UserId 注入應在 handler 層、vitest mock require 場景靜態分析次佳解、extension transition 與 Order 一致、Sprint reflection TD 應立即清** |
| **Sprint 30** | [**sprint-30.md**](./sprint-30.md) | ✅ | **100%** (1.5-2/1.5-2) | ✅ **全綠** | **Event workflow 動態化 + Order cancelEvent log：1 commit (event-workflow transitionEvent 從 spec.workflows 動態讀取代 hard-code + order-workflow 新增 cancelEvent 函式加 $transaction + TransitionLog)，5 個新測試，1109/1109 全綠。3 條新學習 (L30-L32)：spec workflow 動態讀而非 hard-code、Order cancelEvent 之前被 Sprint 28 漏掉、動態讀 spec 適用於時間觸發** |
| **Sprint 31** | [**sprint-31.md**](./sprint-31.md) | ✅ | **100%** (1.5-2/1.5-2) | ✅ **全綠** | **Action Hook Transition Log 補完：2 commits (todo completeTodo 加 TransitionLog + event cancelEvent action 加 TransitionLog，audit 揭露 Sprint 30 reflection TD-新發現 E 修復)，7 個新測試，1114/1116 全綠。4 條新學習 (L33-L36)：action hook 需 audit trail、ActionContext 缺 userId workaround、Todo vs Event fromState 邏輯不同、audit 揭露應立即修** |
| **Sprint 32** | [**sprint-32.md**](./sprint-32.md) | ✅ | **100%** (4/4) | ✅ **全綠** | **手機 RWD 完整 + TD-522：5 commits (TD-522 Order manifest audit 已完成 + admin-sidebar collapse 漢堡按鈕 + DataTable 確認 RWD shadcn 內建 + users/roles header RWD + Playwright E2E snapshot)，6 個新測試，1119/1121 全綠。4 條新學習 (L37-L40)：sidebar collapse 是手機 RWD 第一步、shadcn Table 內建 overflow-auto 不需額外 wrapper、flex-col sm:flex-row header RWD、Playwright E2E snapshot 守護未來 RWD 回歸** |

---

## 🏆 Sprint 14 重點發現

- **方向大轉彎**：用戶 Sprint 13 完成後反思「不需要 compiler」，Sprint 14 整個推翻 compiler 路線
- **完全移除**：`lib/compiler/`（3656 行）+ 3 scripts + tsconfig.test-compiler.json
- **新增 runtime 模組**：`spec-loader.ts` + `dynamic-handler.ts` + `ui-config.ts`
- **4 spec 全切換**：刪除 19 個 Sprint 9-13 手寫檔案 + 更新 5 個測試
- **揭露並修正真實 bug**：
  1. event / todo spec 缺 `requiresExtension`（Sprint 9 false claim）
  2. `setExtensionEnabled` race bug
  3. Sprint 14 設計差異導致測試期望需調整
- **手動 dev server 驗證**（遵循 Sprint 13 教訓「typecheck 過 ≠ 真能用」）
- **淨改動**：+1880 / -6936 = **-5056 行**

---

## 🏆 Sprint 15 重點發現（partial）

- **Stage 1 + 2**：移除 Sprint 14 殘留死代碼（`apiBase`/`uiBase`）+ 統一 disable guard 推導邏輯
- **Stage 3**：TECH-038 formatters + customRenderers 機制（partial — Server Component 函數傳遞限制揭露）
- **揭露並修正真實問題**：
  1. **Server Component 不能傳函數給 Client Component** — Next.js RSC 序列化限制
  2. **Next.js Turbopack 把動態 `require()` 視為靜態分析目標** — 需加 `webpackIgnore` comment
  3. **`{{fn:fnName}}` 語法內 fnName 駝峰 vs 檔名 kebab-case** — 雙檔名支援（toKebabCase + resolveExistingPath）
- **手動 dev server 驗證**：detail page formatter 套用成功（`2030/12/1 下午6:00:00`）
- **partial 決策誠實**：list page formatter 留 Sprint 16（架構上需 server-side 預渲染 HTML）
- **Sprint 16 待做**：customRenderer client rendering + list formatter + RWD E2E（3 SP）

---

## 🏆 Sprint 16 重點發現（partial）

- **重大架構改變**：list page 從 Client Component 改為完整 Server Component（删除 dynamic-list-client.tsx）
- **揭露 Sprint 15 Stage 3 假成功**：UIField.formatter 傳 raw `{{fn:xxx}}` 字串 + formatters[field.formatter] key 不 match → detail formatter 實際走 client side `toLocaleString('zh-TW')` fallback — Sprint 16 修正為真實 server-side 套用
- **partial 決策誠實**：customRenderer 客戶端動態渲染留 Sprint 17（Next.js server side `require()` 無法解析 .tsx JSX，需 JSX 預編譯基礎建設）
- **4 spec × 3 viewport RWD E2E**：14 個 case 全綠
- **揭露新限制**：JSX 在 server side require 會 SyntaxError（不只是 Turbopack 靜態分析，連 runtime 也不行）
- **Sprint 17 待做**：JSX 預編譯方案評估 + customRenderer 客戶端動態渲染（2.5 SP）

---

## 🏆 Sprint 18 重點發現

- **用戶痛點「CRUD 編輯頁沒有」100% 解決**：PUT API 一直存在（Sprint 14），但前端缺 edit page + 按鈕
- **CRUD 完整度**：Create + Read + **Update**（Sprint 14-17 缺 Update）
- **新 shadcn 元件（3 個）**：DropdownMenu（14 sub-components）+ Pagination（7）+ Skeleton
- **list row actions 改用 DropdownMenu**：從 inline Button（占空間）改為「⋯」三動作（檢視/編輯/刪除）
- **detail page loading state**：從「載入中…」文字改為 4 個 Skeleton（標題/描述/3 行內容）
- **守護測試 +36**（9+6+7+8+6）+ 4 個更新
- **E2E 更新**：RWD 測試偵測 row 改用 `[data-testid^="row-actions-"]`（取代舊的「檢視」link 偵測）

## 🏆 Sprint 19 Stage 1 重點發現

- **100 筆上限打破**：`take: 100` 寫死（從 Sprint 14 傳承）→ server side `take/skip` 分頁
- **Promise.all 平行查詢**：`[findMany, count]` 平行查詢，round-trip 從 2N 變 N
- **Server Component 架構延續**：list page 仍為 Server Component，searchParams 解析為 server side
- **shadcn Pagination 元素就緒**（Sprint 18 Stage 2.2），Stage 2 整合即可用
- **守護測試 +10**（4 handler + 2 route + 4 list page）
- **手動驗證（Playwright 截圖）**：?page=1&pageSize=2 → 「共 2 筆資料（第 1 / 1 頁）」 + 2 rows 正確
- **設計權衡**：Stage 1 簡化為文字分頁資訊（Stage 2 嵌入 ListPaginationNav + URL 同步）
- **教訓**：「Server Component 不能傳函數給 Client Component」限制 → ListPaginationNav `mode='server'` 改用 `basePath` 而非函數 prop
- **Sprint 19 Stage 2 待做**：list page 嵌入 ListPaginationNav + URL `?page=` 同步（1.5 SP）✅ 完成

## 🏆 Sprint 19 Stage 3 重點發現

- **完整資料探索三件齊**：sort（sortable header）+ filter（搜尋 input）+ paginate（Pagination UI）
- **SQL injection 防護**：sort 欄位必須在 spec.fields 白名單內（Prisma 不會自動擋）
- **orderBy 動態構造**：`{ [sortField]: sortOrder }` computed key
- **OR contains 搜尋**：q 對所有 string 欄位做 contains，OR 組合
- **search form 保留 sort/order**：hidden input 機制（不是 reset 重來）
- **Empty 狀態兩種**：無資料（顯示「新增」）vs 篩選無結果（顯示「清除搜尋」）
- **守護測試 +38**：16 integration（handler 7 + route 4 + list page 5）+ 7 E2E
- **教訓**：Python 多步驟 replace 中途 assert 失敗，後續步驟不再執行但前面已寫入 — 必須 reset 後重做
- **教訓**：vitest 結構測試 + Playwright 行為測試互補（結構測試抓「寫了什麼」，行為測試抓「做對沒」）
- **Sprint 20+ 待做**：Sheet / Toast / Tooltip 元件 + dark mode + i18n + Storybook

## 🏆 Sprint 19 Stage 2 重點發現

- **list page 嵌入完整 shadcn Pagination UI**：從「純文字分頁資訊」升級為「可 click 切頁的 pagination UI」
- **Pagination 元件內嵌於 Server Component**：直接 render `<Pagination>` 在 list page（不需要 client wrapper）
- **URL 同步**：透過 `buildPageHref(targetPage, pageSize, specName)` helper 構造 `?page=X&pageSize=Y`
- **Bug 修正**：Sprint 18 Stage 2.2 留下的 `Button({...})` → `buttonVariants({...})`（runtime TypeError）
- **教訓**：shadcn 標準 `pagination.tsx` 用 cva 函數 `buttonVariants({...})` 產生 className，不是 React component
- **教訓**：typecheck 抓不到 cva vs React component 誤用，必須靠 E2E runtime 驗證
- **守護測試 +22**：12 integration + 4 E2E（4 spec × 2 page + blog no-pagination case）
- **Sprint 19 Stage 3 完成**（commit `811fe24`）：list 排序 + 篩選（4 SP）+ SQL injection 白名單防護

## 🏆 Sprint 17 重點發現

- **用戶痛點「UI Raw 丑」100% 解決**：list / detail / form 全面改用 shadcn/ui 元件
- **新 shadcn 元件**：`Badge`（4 variants）+ `Empty`（6 sub-components）
- **CardTitle semantic HTML 修正**：`<div>` → `<h3>`（SEO + E2E + a11y）
- **統一 Lucide icons**（Plus / ChevronRight / Inbox / ArrowLeft / Trash2 / AlertCircle / Loader2 / Play）
- **統一 shadcn Button variants**（default / outline / destructive / ghost）
- **46 個新守護測試**（11 + 11 + 15 + 9）+ 2 個 Sprint 16 測試更新
- **技術債 100% 消解**：
  - Sprint 15 Stage 3 formatter bug → Sprint 16 已修
  - customRenderer JSX 預編譯 → Sprint 17 Stage 2 採用 webpack dynamic import 解決（**零 build step**）
- **customRenderer 真實渲染**：Event list 進度條 `0/50`、`0/100` 用 next/dynamic + 多候選路徑（kebab + 去掉 render- 前缀）
- **Sprint 18 待做**：dropdown-menu / pagination / skeleton 元件

---

## 📐 跨 Sprint 共同觀察

| 觀察 | Sprint 5 | Sprint 6 | Sprint 11-14 | Sprint 15 | Sprint 16 | Sprint 17 | Sprint 18 | Sprint 19 Stage 1 | Sprint 19 Stage 2 | Sprint 19 Stage 3 |
|------|----------|----------|--------------|----------|----------|-----------|-----------|------------------|
| Reviewer P1 重要 | ✅ TD-501 | ✅ TD-601 | ✅ setExtensionEnabled race | - | - | - | - | - | - |
| 重構揭露深層 bug | ✅ TD-501 | ✅ TD-508 | ✅ Compiler 揭露 11+ bug | ✅ Stage 3 formatter partial 揭露 RSC 限制 | ✅ Stage 1 揭露 Sprint 15 Stage 3 的 false claim | ✅ Stage 1.1 CardTitle semantic HTML 修正 | - | ✅ Stage 1 揭露「函數不能傳給 Client Component」限制|✅ Stage 2 揭露「Button vs buttonVariants」shadcn cva 誤用 | ✅ Stage 3 揭露「sort 欄位白名單檢查（Prisma 不會自動擋）」 |
| 預防機制投資高 | ✅ JWT augmentation | ✅ no-floating-promises | ✅ Manual dev server verification | ✅ | ✅ | ✅ | ✅ | ✅ Playwright 截圖驗證 | ✅ Playwright 截圖驗證（14 events / 12 seed + sort/filter 各場景）|
| E2E 是下一個缺口 | ⚠️ TD-503 | ✅ 已補 | ✅ Sprint 14 E2E 29/29 綠 | ⚠️ RWD E2E 留 Sprint 16 | ✅ Sprint 16 完成 4 spec × 3 viewport = 43 E2E 全綠 | ✅ 43 E2E 全綠（未變）|✅ 47 E2E（+4：4 spec × 2 page + blog no-pagination） ✅ 43 E2E 全綠（未變）| ✅ 43 E2E 全綠（Stage 2 加 URL 同步 E2E）| ✅ 54 E2E（+7：sort + filter + SQL injection 防護驗證）|
| Typecheck ≠ 真能用 | - | - | ✅ Sprint 13/14 兩次揭露 | ✅ Sprint 15 揭露「Server Component 函數傳遞限制」 | ✅ Sprint 16 揭露「守衛測試只驗結構不等於 runtime 套用」 | ✅ Stage 1.1 CardTitle 是 `<div>` 揭露 SEO 問題 | ✅ Detail loading state 原本用「載入中…」文字 | ✅ Playwright 手動驗證|✅ Playwright 14-event 分頁 + click 切頁驗證分頁資料正確 | ✅ Playwright sort/filter 各場景 + SQL injection 防護驗證（?sort=__proto__ fallback）|
| 守衛檢查演進 | - | - | Sprint 9「每個 spec 都有 disable guard」是 false claim | ✅ Sprint 15「總是 guard」修正 | ✅ Sprint 16 揭露「守衛測試需驗 runtime 執行」 | ✅ 3 個 shadcn UI 守護測試（11+11+15）| ✅ 4 個守護測試 + Sprint 16 修正 | ✅ tech-050（10 個）= handler 4 + route 2 + list page 4 | ✅ tech-052（16 個）= handler 7 + route 4 + list page 5 + E2E 7 |
| SoT 擴展 | - | - | spec.json 是 manifest/API/UI 的 SoT | ✅ spec.json 是 formatter/customRenderer 的 SoT | ✅ spec.json 拆 fnRef 純 fnName 後是 formatter 唯一介面 | ✅ components/ui/ 是 shadcn 元件 SoT | ✅ spec.json 的 listUI/CRUD 動作定義 SoT | ✅ ListPaginationNav `mode='server'` basePath 統一介面 | ✅ buildSortHref helper + sortable header 統一介面（保留 q + pageSize） | ✅ search form hidden input 保留 sort/order |
| UI 一致性 | - | - | Sprint 13 完成 Order Demo UI | Sprint 15 partial 一致 | Sprint 16 list/detail/form 都是純 HTML | ✅ Sprint 17 **完成**（shadcn 統一 + customRenderer 真實渲染）| ✅ Sprint 18 完成（+ DropdownMenu / Pagination / Skeleton + CRUD Update）| ✅ 文字分頁資訊保持一致（Stage 2 加 ListPaginationNav UI）|✅ 完整 shadcn Pagination UI + Ellipsis + isActive + 上一頁/下一頁 | ✅ sortable header + 搜尋 input + Empty 兩狀態（無資料 vs 篩選無結果） |
| customRenderer 設計 | - | - | - | ✅ Sprint 15 `{{fn:}}` 語法（partial：僅 server side 跑） | ✅ Sprint 16 揭露 JSX server side require SyntaxError | ✅ Sprint 17 Stage 2 採用 webpack dynamic import（零 build step）| - | - | - |
| CRUD 完整度 | - | - | Sprint 9 完成 C+R | - | - | - | ✅ Sprint 18 完成 C+R+**U** | - | ✅ Sprint 19 Stage 3 完成 list **sort + filter + paginate** 完整資料探索 | ✅ Sprint 19 Stage 3 完成 list **sort + filter + paginate** 完整資料探索 |
| 守護測試 pattern | - | - | Sprint 9「每個 spec 都有 disable guard」是 false claim | ✅ Sprint 15「總是 guard」修正 | ✅ Sprint 16 揭露「守衛測試需驗 runtime 執行」 | ✅ 4 個 shadcn UI 守護測試（11+11+15+9） | ✅ 5 個守護測試（9+6+7+8+6）+ E2E 改 data-testid | ✅ tech-050 handler 4 + route 2 + list page 4 | ✅ tech-052 handler 7 + route 4 + list page 5 + E2E 7 個行為驗證 |
| 分頁機制 | - | - | Sprint 14 寫死 take: 100 | - | - | - | - | ✅ Stage 1 server side 分頁（Promise.all + take/skip + total/totalPages）| ✅ Stage 2 完整 Pagination UI（PaginationLink + Ellipsis + isActive + URL 同步）| ✅ Stage 3 完整資料探索（sort + filter + paginate）|

---

## 🗂️ 已歸檔 / 已移除

- ~~`docs/backlog-audit-2026-08-24.md`~~ — Sprint 6 後盤點報告，行動已執行完畢，刪除（2026-08-26）
- ~~`docs/backlog-audit-update-2026-08-24.md`~~ — 第二次盤點更新，刪除
- ~~`docs/sprint-7-plan.md`~~ — Sprint 7 完成後，plan 內容已反映在 Sprint 7 reflection（無獨立 reflection 檔則併入 sprint-6-reflection），刪除
- ~~`docs/sprint-11-plan.md`~~ — Sprint 11 完成後，phase A/B 反思已拆出，刪除