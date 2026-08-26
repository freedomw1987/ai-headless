# Backlog — ai-headless

> **框架定位**：WordPress 風格的 AI Headless CRUD 框架
> **核心**：單一 JSON 規範 → AI 編譯成可運行系統（前端 + 後端 + DB）
> **可擴展**：底基 + Extension 機制（Extension 也是 AI 生成）

---

## 📌 當前狀態（2026-08-26）

| 項目 | 數據 |
|------|------|
| **當前 Sprint** | **Sprint 20 — UI 元件擴充 + 全局主題切換**（5.5 SP，4 Stages）|
| **Sprint 19 狀態** | ✅ **100% 收尾（8.5/8.5 SP）**（Stage 1+2+3）|
| **測試基線** | **923 tests / 80 files** / Sprint 20 全部 4 Stages 收尾（含 P3 + P3.5）|
| **下一個 P0** | Sprint 21（待規劃）|
| **路線圖關鍵** | ✅ Sprint 20 全收尾（Sheet + Tooltip + Dark mode + Toast sonner + P3 + P3.5）|

### Sprint 20 規劃（UI 元件擴充 + 全局主題切換，5.5 SP）

> **日期**: 2026-08-26
> **用戶決定**: UI 元件擴充（Sheet / Tooltip / dark mode / Toast 升級 sonner）
> **關鍵澄清**: ThemeProvider 全局主題、Extension 自有樣式獨立 — 不走 Extension 機制
> **架構決策**: 用 next-themes ThemeProvider（`app/layout.tsx`）+ ThemeToggle 按鈕（`/admin` 顯眼位置）

| Stage | 內容 | SP | 驗收標準 |
|---|---|---|---|
| **1 — Sheet** | shadcn Sheet 元件 + detail page 抽屜式編輯 | 1.5 | ✅ **收尾（1.5/1.5 SP）** ① Sheet 元件建好（DialogPrimitive + cva side variants）<br>② detail「編輯」按鈕點擊從右側滑出 Sheet<br>③ Sheet 內顯示 DynamicFormClient（預填 initialData）<br>④ onSuccess callback 關閉 Sheet（refresh 在 form-client 內部）<br>⑤ `/edit` page 保留兼容<br>⑥ 12 個守護測試 + 3 個 E2E 全綠 |
| **2 — Tooltip** | shadcn Tooltip + 1 個使用場景 | 1 | ✅ **收尾（1/1 SP）** ① Tooltip 元件建好（Radix UI 內建鍵盤 + a11y）<br>② 場景：list sortable header（記錄「點擊切換排序」+ 狀態）<br>③ 11 個守護測試 + 2 個 E2E（hover + toggle sort）<br>⑤ 架構：Server Component 抽 SortableHeaderCell client wrapper |
| **3 — Dark mode** | next-themes ThemeProvider + ThemeToggle | 1.5 | ✅ **收尾（1.5/1.5 SP）** ① `app/layout.tsx` 加 ThemeProvider（attribute="class", defaultTheme="system", enableSystem, disableTransitionOnChange）<br>② ThemeToggle 按鈕（Sun/Moon icons）放 `/admin` sidebar 底部（user info 下、登出上）<br>③ localStorage 持久化（next-themes 內建）<br>④ Light/Dark/System 三模式（DropdownMenu）<br>⑤ 15 個守護測試（tech-057）+ 3 個 E2E（含截圖 tech-057-dark-mode.png） |
| **4 — Toast sonner 升級** | 徹底改寫 + 移除舊 toast.tsx | 1.5 | ✅ **收尾（1.5/1.5 SP）** ① sonner 1.7.1 安裝（Stage 3 已裝）<br>② 移除 `components/ui/toast.tsx` + `toast.test.tsx` + `extension-card.test.tsx`<br>③ 新建 `components/ui/sonner.tsx`（client wrapper，useTheme 動態 theme prop）<br>④ `extension-card.tsx` 改用 `toast.success()` / `toast.error()` from sonner<br>⑤ `extensions-page-client.tsx` 移除 ToastProvider wrapper<br>⑥ `app/layout.tsx` 在 ThemeProvider 內加 `<Toaster />`<br>⑦ 13 個守護測試（tech-058）+ 4 個 E2E（含 light + dark 截圖） |
| **P3** | Dead code + null date | 0 | ✅ **收尾** ① Stage 1 reviewer 提的 dead code（get handler 268-269）<br>② Sprint 18 留下的 `publishedAt` null date 處理（Zod optional + create input 自動 null + update input 保留 null + UI form 不傳 publishedAt 預設 null） |
| **P3.5** | Event 500 + Hook 註冊（user 報） | 1.5 | ✅ **收尾** ① Bug A：dynamic-handler.ts 4 個 handler（create/update/del/transition）包 try/catch + sanitizeErrorMessage（避免 500 + 暴露 SQL/內部錯誤）<br>② Bug B：hooks-registry.ts 中央映射表 + `registerAllExtensions()` 在 route.ts setup() 內呼叫（修「`Cannot read properties of undefined (reading 'cancelled')`」之前未註冊的 hook）<br>③ `lib/runtime/error-sanitizer.ts`（60 行，SAFE_PATTERNS = Zod + 業務前綴 + 中文必填/格式）<br>④ 13 個守護測試（tech-056，含 reviewer 第二輪抓到漏的 `beforeCreateTodo`）<br>⑤ 3 個 E2E（含截圖 tech-056-event-error-ui.png） |

### Sprint 20 收尾紀錄

> **Stage 1 收尾（1.5/1.5 SP）** — 2026-08-26
> - 改動：新建 `components/ui/sheet.tsx`（DialogPrimitive + cva 4 sides）；改 `dynamic-detail-client.tsx`（SheetTrigger 包 Button + onSuccess callback）；改 `dynamic-form-client.tsx`（加 onSuccess prop）；改 `ui-config.ts`（DetailUIConfig.formConfig + buildFormUIConfig 接受 mode）
> - 測試：12 個守護測試（tech-053）+ 3 個 E2E（含截圖） + tech-046 同步更新反映 SheetTrigger 變更
> - Reviewer 提 3 個 P2 Finding：① 守護測試語義過寬（已修） ②「- 新增」後缀錯位（已修：buildFormUIConfig 依 mode 動態） ③ 既有 dead code `dynamic-handler.ts:268-269`（P3 留待後續清理）
> - 4 Gate 全綠：Gate 1 TDD (紅→綠)、Gate 2 lint/typecheck、Gate 3 regression (77 files / 881 vitest)、Gate 4 reviewer + E2E

> **Stage 2 收尾（1/1 SP）** — 2026-08-26
> - 改動：新建 `components/ui/tooltip.tsx`（shadcn 標準 Radix primitive + TooltipProvider）；新建 `components/admin/sortable-header-cell.tsx`（client wrapper，封裝 Tooltip + URL 組裝）；改 `app/admin/crud/[spec]/page.tsx`（移除直接用 Tooltip + icon + buildSortHref function，改用 SortableHeaderCell）
> - 安裝：@radix-ui/react-tooltip@1.2.16
> - 測試：11 個守護測試（tech-054）+ 2 個 E2E（含截圖 tech-054-tooltip-sortable.png）+ tech-052 同步更新反映 SortableHeaderCell 架構
> - 架構：Server Component（list page）透過 client wrapper（SortableHeaderCell）使用 Tooltip，避免把整個 list page 變 client；Server→Client 不傳 function prop（URL 內聯用 URLSearchParams 組裝）
> - Reviewer 提 4 個 P2 Finding：① TooltipProvider 重複建立（**接受留 P3**：未來可抽 SortableHeader 整個 TableHeader 共享 Provider） ② 註解誤導（已修） ③ Icon 缺少 a11y 標註（已修：icon aria-hidden + link aria-label） ④ 冗餘型別斷言（已修：list page 改傳原值）
> - 4 Gate 全綠：Gate 1 TDD (6 failed → 11 passed)、Gate 2 lint/typecheck、Gate 3 regression (78 files / 892 vitest)、Gate 4 reviewer + E2E

> **P3 收尾（0 SP）** — 2026-08-26
> - 改動：新建 `tests/integration/tech-055-p3-dead-code-null-date.test.ts`（2 守護測試）；改 `lib/runtime/dynamic-handler.ts`（get handler 移除 dead code line 268-269；Zod schema `publishedAt` 改 optional；create input 自動加 publishedAt: null；update input 保留型別）；改 `app/admin/crud/[spec]/dynamic-form-client.tsx`（publishedAt 欄位不傳，預設 null）
> - 4 Gate 全綠：Gate 1 TDD (2 passed)、Gate 2 lint/typecheck、Gate 3 regression (79 files / 894 vitest)、Gate 4 reviewer OK

> **P3.5 收尾（1.5 SP）** — 2026-08-26
> - 改動：新建 `lib/runtime/error-sanitizer.ts`（60 行，sanitizeErrorMessage + SAFE_PATTERNS）；改 `lib/runtime/dynamic-handler.ts`（create/update/del/transition 4 個 handler 包 try/catch + sanitizeErrorMessage；invokeHook 回傳邏輯修正 `(r as { data: ... }).data` → `r as Record<string, unknown>`）；改 `lib/extensions/hooks-registry.ts`（+`beforeCreateTodo` import + safeRegister）；改 `app/api/crud/[spec]/route.ts`（setup() 內呼叫 `registerAllExtensions()`）；新建 `tests/integration/tech-056-p3-5-hook-registration-error-handling.test.ts`（10 → 13 測試，含 reviewer 第二輪抓到漏的 `beforeCreateTodo`）；新建 `tests/e2e/tech-056-p3-5-event-create-error-handling.spec.ts`（3 E2E）
> - 架構：手動映射表（vs 自動掃描 manifest）；registry 完整性靠「completeness guard 測試」保護；safeRegister 用 try/catch 容錯「already registered」（dev hot reload 安全）；error-sanitizer 只允許 SAFE_PATTERNS（Zod / 業務錯誤）暴露；try/catch 範圍只包 hook + Prisma 區塊，不包 Zod/auth/early return
> - Reviewer 第一輪：攔截 `beforeCreateTodo` 漏註冊問題（blocking）；第二輪：OK with notes（5 個 P2/P3 不阻 merge）
> - 4 Gate 全綠：Gate 1 TDD (3 failed → 13 passed)、Gate 2 lint/typecheck、Gate 3 regression (80 files / 907 vitest)、Gate 4 reviewer + E2E

> **Stage 3 收尾（1.5/1.5 SP）** — 2026-08-26
> - 改動：新建 `components/theme/theme-provider.tsx`（~30 行，client component 包 NextThemesProvider）；新建 `components/theme/theme-toggle.tsx`（~50 行，client component，DropdownMenu 三選項 + Sun/Moon/Monitor icons）；改 `app/layout.tsx`（body 內加 ThemeProvider）；改 `app/admin/admin-sidebar.tsx`（user info 下、登出上加 `<ThemeToggle />`）；安裝 `next-themes 0.4.6`
> - 架構：ThemeProvider attribute="class" 配合 tailwind `darkMode: ['class']`；defaultTheme="system" 尊重 OS 偏好；enableSystem + disableTransitionOnChange
> - 測試：15 個守護測試（tech-057）+ 3 個 E2E（含截圖 tech-057-dark-mode.png，整頁深色確認）
> - 4 Gate 全綠：Gate 1 TDD (15 passed)、Gate 2 lint/typecheck、Gate 3 regression (81 files / 922 vitest)、Gate 4 reviewer + E2E

> **Stage 4 收尾（1.5/1.5 SP）** — 2026-08-26
> - 改動：新建 `components/ui/sonner.tsx`（~25 行，client component，包 SonnerToaster + position="top-right" + richColors + closeButton + duration 4000 + useTheme 動態 theme prop）；改 `app/layout.tsx`（ThemeProvider 內加 `<Toaster />`）；改 `components/admin/extension-card.tsx`（useToast() show() → toast.success() / toast.error() from sonner）；改 `app/admin/extensions/extensions-page-client.tsx`（移除 ToastProvider wrapper）；**刪除**：`components/ui/toast.tsx` + `components/ui/toast.test.tsx` + `components/admin/extension-card.test.tsx`（後者依賴 ToastProvider wrapper，整個移除）；**移除依賴**：`@radix-ui/react-toast`（pnpm remove，package.json 死依賴）
> - 架構：徹底改寫，無兼容層，無 useToast shim；Toaster 在 root layout（ThemeProvider 同級，全站共用）；呼叫端對稱改寫（toast.success() / toast.error()）
> - 測試：13 個守護測試（tech-058，含 reviewer 第二輪加的 `theme prop` 防 regression 守護）+ 4 個 E2E（含 light + **dark** 截圖 tech-058-sonner-toast-dark.png）
> - Reviewer 第一輪：BLOCK（1 P1 dark mode 整合缺口 + 1 P2 死依賴 + 1 P3 恆真斷言）；第二輪：MERGE OK with notes（1 P3 housekeeping note：`bun.lock` 陳舊，非功能問題）
> - 4 Gate 全綠：Gate 1 TDD (11 failed → 13 passed)、Gate 2 lint/typecheck、Gate 3 regression (80 files / 923 vitest)、Gate 4 reviewer + E2E

## 🏆 Sprint 20 全收尾（5.5 SP + P3 + P3.5 = 7 SP）

> **日期**: 2026-08-26
> **總 SP**: 7（原 5.5 + P3.5 是 user 報的新 bug，+1.5）
> **測試基線**: Sprint 19 866 → Sprint 20 收尾 **923**（+57）
> **檔案基線**: Sprint 19 74 → Sprint 20 收尾 **80**（+6：sheet.tsx、tooltip.tsx、sonner.tsx、theme-provider.tsx、theme-toggle.tsx、error-sanitizer.tsx）
> **截圖**: 5 張（tech-053-sheet-open、tech-054-tooltip-sortable、tech-056-event-error-ui、tech-057-dark-mode、tech-058-sonner-toast-light + dark）

### 技術債（下一個 Sprint 安排）

| 优先级 | 項目 | 描述 | 文件 |
|---|---|---|---|
| **P2** | list/get handler 沒 try/catch | DB 拋錯 → 500（Prisma 錯誤訊息暴露給前端）| `lib/runtime/dynamic-handler.ts` |
| **P2** | Sanitizer SAFE_PATTERNS 漏 | `Cannot register for cancelled/past event` 在 production 被過濾為通用「提交失敗」 | `lib/runtime/error-sanitizer.ts` |
| **P3** | Hook type contract vs runtime 不一致 | hook-sdk.ts 型別要求回傳完整 ctx，但 4 個 production hook 全 return data | `lib/hooks/hook-sdk.ts` |
| **P3** | Registry completeness regex 不支援嵌套 JSON | `"hooks"\s*:\s*\{([^{}]*)\}` 不支援嵌套 JSON 物件 | `lib/extensions/hooks-registry.ts` |
| **P3** | State machine 錯誤在 production 被過濾 | `StateMachine "x" 拒絕 event "y"` 不匹配 SAFE_PATTERNS | `lib/runtime/error-sanitizer.ts` |
| **P3** | TooltipProvider 重複建立 | 每個 SortableHeaderCell 各自包 Provider（10 欄位 = 10 Provider），狀態隔離（純優化）。未來可抽 SortableHeader 整個 TableHeader 共享 | `components/admin/sortable-header-cell.tsx:59` |
| **P3** | `bun.lock` 陳舊 | 之前用 Bun 安裝留下，非 pnpm 流程用（CI 用 pnpm install --frozen-lockfile，不讀 bun.lock） | `bun.lock` |

**架構決策（重要）**：
- **ThemeProvider**（next-themes）：全局主題（Light/Dark/System），放 `app/layout.tsx`
- **Extension 自有樣式**：保持獨立（不需要知道 dark mode），與全局主題共存
- **不使用 Extension 機制**做 dark mode（避免 mountPoints 未實作的衝突）

**不在 Sprint 20 範圍**：
- ❌ mountPoints 機制（留 Sprint 21+）
- ❌ i18n（留 Sprint 22+）
- ❌ Storybook（留 Sprint 22+）

**對話記錄**：
> Date Time： 2026-08-26 14:30
> 用戶：Sprint 20 — UI 元件擴充（Sheet / Toast / Tooltip / dark mode）
> BA(我)：拆 4 Stage：Sheet 1.5 SP + Tooltip 1 SP + Dark mode 2 SP + Toast 擴充測試 1 SP = 5.5 SP
> 用戶：Toast 改升級 sonner（不擴充測試）— 升級成本修訂 1.5 SP
> 用戶：Dark mode 不走 Extension 機制，用 next-themes 全局 ThemeProvider；Extension 自有樣式獨立
> BA(我)：揭露 mountPoints 機制未實作成本，用戶接受 B 方案（next-themes）
> BA(我)：Toast 用「徹底乾淨改寫」（移除 useToast() hook 和 ToastProvider）
> BA(我)：Sheet 場景選 A（detail page 抽屜式編輯）
> 用戶：Tooltip 用 A（基本 + 1 個驗證場景）
> 用戶：確認 A，寫入 backlog 然後進入 Design Gate

### Sprint 15 進度（Runtime Spec 精簡化）

| Task | 內容 | SP | 狀態 |
|---|---|---|---|
| **TECH-037** | 移除 `apiBase` / `uiBase` | 0.5 | ✅ Stage 1 (`e4797a5`) |
| **TECH-040** | `requiresExtension` 統一從 `spec.name` 推導（總是 guard）| 1 | ✅ Stage 2 (`55664fd`) |
| **TECH-038** | `formatters` + `customRenderers` 在 spec 內定義 | 2 | ✅ Stage 3 partial（本 commit）|
| **TECH-039** | E2E RWD 測試 | 1 | ⏳ Sprint 16 |
| **合計** | | **3.5 / 4.5 SP (78%)** | |

### Sprint 16 規劃（Runtime Spec 精簡化收尾 + RWD）

| Task | 內容 | SP | 來源 |
|---|---|---|---|
| **TECH-038a** | customRenderer 客戶端 React component 動態渲染機制 | 1 | Sprint 15 Stage 3 留 |
| **TECH-038b** | list page formatter 完整支援（server-side 預渲染 HTML）| 1 | Sprint 15 Stage 3 留 |
| **TECH-039** | E2E RWD 測試（Playwright viewport 切換 768/375）| 1 | Sprint 15 Stage 4 留 |
| **合計** | | **3 SP** | |

### Sprint 16 進度（partial：2 / 3 SP）

| Task | 計劃 | 實際 | 狀態 |
|---|---|---|---|
| **TECH-038b** | 1 SP | 1 SP | ✅ Stage 1 commit `e19f370`（list page Server Component + formatter 完整支援）|
| **TECH-039** | 1 SP | 1 SP | ✅ Stage 2（4 spec × 3 viewport RWD E2E，14 tests）|
| **TECH-038a** | 1 SP | 0 SP | ⏳ Sprint 17（Next.js server side require() 無法解析 .tsx JSX，需 JSX 預編譯基礎建設）|

**Sprint 16 揭露 Sprint 15 Stage 3 的真實 bug**：
- UIField.formatter Sprint 15 直接傳 `'{{fn:xxx}}'` raw 字串（應該是純 fnName）— Sprint 16 用 `parseFnRef()` 修正
- detail page `formatters[field.formatter]` key 不 match → 剛好走 client side `toLocaleString('zh-TW')` fallback — Sprint 16 改用 `formatters[field.name]` 修正

**Sprint 16 完成後測試基線**：
- vitest: 750 / 64 files
- E2E: 43（含 14 新 RWD）
- Typecheck: ✅ 綠

### Sprint 17 規劃（customRenderer 客戶端 + JSX 預編譯基礎建設 + UI 改進）

| Task | 內容 | SP | 來源 |
|---|---|---|---|
| **Stage 1.1** | list page 改 shadcn/ui 元件 | 1 | 用戶痛點：UI Raw 丑 |
| **Stage 1.2** | detail page 改 shadcn/ui 元件 | 1 | 用戶痛點：UI Raw 丑 |
| **Stage 1.3** | form page 改 shadcn/ui 元件 | 1 | 用戶痛點：UI Raw 丑 |
| **Stage 2** | customRenderer 客戶端 React component 動態渲染 | 2 | Sprint 16 Stage 1 留 |
| **Spike** | JSX 預編譯方案評估（tsx-loader / esbuild / swc）| 0.5 | Sprint 16 揭露 |
| **合計** | | **5.5 SP** | |

### Sprint 19 進度（Stage 1 + 2 + 3 完成 8.5 / 8.5 SP）

#### Stage 3 — list 排序 + 篩選（4 SP）

| Task | 計劃 | 實際 | 狀態 |
|---|---|---|---|
| **Stage 3.1 handler sort + filter** | 1 SP | 1 SP | ✅ commit `811fe24`（sort 白名單 + order + q OR contains）|
| **Stage 3.2 API** | 0.5 SP | 0.5 SP | ✅ commit `811fe24`（GET 讀 sort/order/q）|
| **Stage 3.3 list page UI** | 1.5 SP | 1.5 SP | ✅ commit `811fe24`（sortable header + 搜尋 form + Empty 篩選狀態）|
| **Stage 3.4 守衛測試 + E2E** | 1 SP | 1 SP | ✅ commit `811fe24`（tech-052 integration 16 + E2E 7）|

### Sprint 19 進度（Stage 1 + 2 完成 4.5 / 4.5 SP）

#### Stage 2 — list page 嵌入 pagination UI + URL 同步（1.5 SP）

| Task | 計劃 | 實際 | 狀態 |
|---|---|---|---|
| **Stage 2.1 list page 內嵌 Pagination** | 0.5 SP | 0.5 SP | ✅ commit `462478b`（Pagination 元件 + buildPageHref）|
| **Stage 2.2 PaginationLink 整合** | 0.5 SP | 0.5 SP | ✅ commit `462478b`（isActive + 頁碼 + Ellipsis + 上一頁/下一頁）|
| **Stage 2.3 E2E** | 0.5 SP | 0.5 SP | ✅ commit `462478b`（tech-051 E2E 4 spec × 2 page + blog no-pagination）|

#### Stage 1 — Server Side 分頁（3 SP）

| Task | 計劃 | 實際 | 狀態 |
|---|---|---|---|
| **Stage 1.1 handler** | 1 SP | 1 SP | ✅ commit `eef3ca4`（list() 加 page/pageSize/total/totalPages）|
| **Stage 1.2 API** | 0.5 SP | 0.5 SP | ✅ commit `eef3ca4`（GET handler 讀 ?page= ?pageSize=）|
| **Stage 1.3 list page** | 1 SP | 1 SP | ✅ commit `eef3ca4`（searchParams + 分頁資訊顯示）|
| **Stage 1.4 守衛測試** | 0.5 SP | 0.5 SP | ✅ commit `eef3ca4`（tech-050 10 守衛測試）|

### Sprint 18 進度（完成 6.5 / 6.5 SP）

| Task | 計劃 | 實際 | 狀態 |
|---|---|---|---|
| **Stage 1 编辑 page** | 1.5 SP | 1.5 SP | ✅ commit `6e047c8`（edit page + list/detail 編輯按鈕） |
| **Stage 2.1 dropdown-menu** | 1.5 SP | 1.5 SP | ✅ commit `1371249`（shadcn 14 sub-components + ListRowActions） |
| **Stage 2.2 pagination** | 1 SP | 1 SP | ✅ commit `4892997`（shadcn 7 sub-components + ListPaginationNav） |
| **Stage 2.3 skeleton** | 0.5 SP | 0.5 SP | ✅ commit (c6)（shadcn Skeleton + detail loading state） |

**Sprint 17 Stage 1 完成後測試基線**：
- vitest: 783 / 66 files（+33 from Sprint 16）
- E2E: 43
- Typecheck: ✅ 綠
- 新增 shadcn 元件：Badge, Empty
- 改進 shadcn 元件：CardTitle 改為 `<h3>`
- 統一 Lucide icons：Plus, ChevronRight, Inbox, ArrowLeft, Trash2, AlertCircle, Loader2, Play

**Sprint 17 Stage 1 收尾改動**：
- `components/ui/badge.tsx` 新增（4 variants）
- `components/ui/empty.tsx` 新增（6 sub-components）
- `components/ui/card.tsx` CardTitle 改 `<h3>`
- `app/admin/crud/[spec]/page.tsx` 改用 shadcn Table + Empty
- `app/admin/crud/[spec]/[id]/dynamic-detail-client.tsx` 改用 shadcn Card
- `app/admin/crud/[spec]/dynamic-form-client.tsx` 改用 shadcn Input/Textarea/Label
- 3 個守護測試檔：tech-041/042/043-shadcn-*.test.ts（共 37 tests）
- tech-038-list-server-component.test.ts 2 個測試更新（tbody→TableBody + Sprint 16→17 Stage 2 註記）

**Sprint 17 Stage 2 待做事項**：
- Spike JSX 預編譯方案（esbuild 最可能，因為 Next.js 13+ 內建支援）
- customRenderer 客戶端動態載入 .tsx component
- list page 移除 placeholder + 真實渲染 React component

**Sprint 17 Stage 2 Spike 結論**：**採用 webpack dynamic import（內建 swc 編譯）**，不需預編譯 .tsx → .js。理由：
1. Next.js Turbopack/webpack 已自動打包 `extensions/<spec>/custom-renderers/*.tsx` 為 chunks
2. `import('@/extensions/...')` + `next/dynamic` + `ssr: false` 即得 lazy load
3. 零 build step、零配置、零 runtime 改動
4. 唯一限制：路徑必須 webpack 可分析（不能完全 runtime 動態拼接變數）

**Sprint 17 Stage 2 實作重點**：
- `components/admin/dynamic-renderer-cell.tsx`：client component + next/dynamic + 多候選路徑
- 移除 list page placeholder
- 9 個守護測試（tech-044）
- Event list 驗證：customRenderer cell 真實渲染進度條 `0/50`、`0/100`

### Sprint 6 進度

| Task | 標題 | 計劃 | 實際 | 狀態 |
|------|------|------|------|------|
| TD-601 | /admin/extensions async await 修復 | 2 SP | 2 SP | ✅ |
| US-S6-1 | TD-503 abort Playwright E2E | 2 SP | 2 SP | ✅ |
| TD-508 | useChatStream → useReducer | 2 SP | 2 SP | ✅ |
| TD-509 | JWT augmentation JSDoc | 0.5 SP | 0.5 SP | ✅ |
| **合計** | **6.5 SP / 6.5 SP 計劃 (100%)** | | | **4 Gate 全綠** |

### Sprint 7 進度（StateMachine + CI）

| Task | 標題 | 計劃 | 實際 | 狀態 |
|------|------|------|------|------|
| TECH-006 | StateMachine Library (JSON schema + runtime) | 8 SP | 8 SP | ✅ |
| US-204 | 訂單狀態機範例（後端 + DB）| 5 SP | 5 SP | ✅ |
| TD-514 | CI workflow (GitHub Actions) | 2 SP | 2 SP | ✅ |
| **合計** | **15 SP / 15 SP 計劃 (100%)** | | | **4 Gate 全綠** |

### Sprint 8 進度（US-204 Demo UI）

| Task | 標題 | 計劃 | 實際 | 狀態 |
|------|------|------|------|------|
| US-204 (UI) | 訂單 Demo UI（列表 + 詳情 + 建立 modal + 切換按鈕）| 5 SP | 5 SP | ✅ |
| US-102 | 後台用戶管理 Phase 1（基礎版）| 5 SP | 5 SP | ✅ |
| **合計** | **10 SP / 10 SP 計劃 (100%)** | | | **4 Gate 全綠** |

### Sprint 9 進度（Blog + Event + Todo CRUD + Disable Guard）

| Task | 標題 | 計劃 | 實際 | 狀態 |
|------|------|------|------|------|
| (Sprint 9 核心) | Blog + Event + Todo 完整 CRUD | 5 SP | 5 SP | ✅ |
| Sprint 9 補完 | Disable Guard 三層架構 + 編輯 UI | 2 SP | 2 SP | ✅ |
| TD-521 | Disable Guard 測試補完（揭蕎 `listEnabledExtensions` bug）| 1 SP | 1 SP | ✅ |
| Sprint 9 Stage 4 | Sidebar HTML 隱藏驗證（E2E + RTL 雙覆蓋）| 0.5 SP | 0.5 SP | ✅ |
| **合計** | **8.5 SP / 8.5 SP 計劃 (100%)** | | | **4 Gate 全綠 + 820 tests** |

**揭露 Backlog（留 Sprint 10）**：TD-522 Order Extension manifest 缺失（0.5 SP）

### Sprint 10 進度（Compiler Pipeline — 修正 Sprint 9 違背 §13）

| Task | 標題 | 計劃 | 實際 | 狀態 |
|------|------|------|------|------|
| **TECH-008 Phase 1** | Compiler Pipeline 串接 + spec `apiBase`/`uiBase` | 3 SP | 3 SP | ✅ |
| **TECH-008 Phase 2** | 反向驗證 Blog Extension（compiler 生成 vs 手寫等價）| 3 SP | 揭露 6 個 bug | ⚠️ Partial（轉 Sprint 11） |
| **TECH-008 Phase 3** | Order/Event/Todo 全遷移 + 撤除手寫檔 | 4 SP | - | 📋 Ready（依賴 Sprint 11） |
| **合計** | **10 SP** | | | **Phase 1 ✅ / Phase 2 ⚠️ 揭露 6 bug** |

**揭露留 Sprint 11**：
- TECH-018 修 api-generator schema 丟失 + 假 import（3 SP）
- TECH-019 修 api-generator hook 引用錯誤（1 SP）
- TECH-020 修 api-generator `ctx.params` Promise wrap（1 SP）
- TECH-021 統一編譯結果 typecheck 通過（2 SP）
- TECH-022 Disable Guard 自動注入（2 SP）

### Sprint 11 進度（Compiler 完善）

| Task | 標題 | 計劃 | 實際 | 狀態 |
|------|------|------|------|------|
| **TECH-018** | 修 schema 丟失 + 假 import | 3 SP | 1 SP | ✅（schema 為 false alarm）|
| **TECH-019** | 修 hook 引用錯誤 | 1 SP | 1 SP | ✅ |
| **TECH-020** | `ctx.params` Promise wrap | 1 SP | 0 SP | ✅ 早已正確 |
| **TECH-021** | 統一編譯結果 typecheck 通過 | 2 SP | 2 SP | ✅ |
| **TECH-022** | Disable Guard 自動注入 | 2 SP | 2 SP | ✅ |
| **TD-522** | Order Extension manifest 缺失 | 0.5 SP | 0.5 SP | ✅ |
| **合計** | **9.5 SP**（預估）/ 6.5 SP 實際 | | | **全完成 ✅ 788 tests** |

### Sprint 14 進度（Runtime 取代 Compiler，9.5 / 9.5 SP）

| Task | 內容 | 預估 | 實際 | 狀態 |
|---|---|---|---|---|
| **TECH-031** | spec-loader（啟動時一次載入 + cache） | 1 SP | 1 SP | ✅ Phase 1 |
| **TECH-032** | dynamic-handler（list/get/create/update/delete + transition） | 2 SP | 2 SP | ✅ Phase 1 |
| **TECH-033** | catch-all route（`/api/crud/[spec]` + query param） | 1 SP | 1 SP | ✅ Phase 1 |
| **TECH-034** | dynamic UI page（ui-config + 3 個 client component） | 2 SP | 2 SP | ✅ Phase 2 |
| **TECH-035** | 完全移除 `lib/compiler/` + 重構 pipeline 為 runtime 指向 | 3 SP | 3 SP | ✅ Phase 2 |
| **TECH-036b** | 4 spec 全切換（刪 19 手寫 + 更新 manifest + 補 requiresExtension） | 1.5 SP | 2 SP | ✅ Phase 2 |
| **合計** | | **9.5 SP** | **10.5 SP** | **全完成 ✅ 748 tests（719 vitest + 29 E2E）** |

> ⚠️ **方向轉變**：Sprint 13 reflection 原規劃 Sprint 14 為「修撤手寫誤區」（繼續 compiler 路線）。Sprint 13 完成後用戶反思：「不需要 compiler，系統可以直接根據 json-spec 變動而生成」。Sprint 14 整個推翻 compiler 路線。

> ⚠️ **本 session 揭露**：event / todo spec 缺 `requiresExtension`（Sprint 9 false claim）。Sprint 14 E2E 驗證時揭露，手動補完。

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
| **US-102** | User Story | 後台用戶管理（Phase 1 基礎版）| 登入頁 + 用戶 CRUD + 3 個寫死角色（admin/editor/viewer）+ middleware 守衛 | 5 | SP1 | M2 | ✅ Done (Phase 1) |
| **US-102-P2** | User Story | 後台用戶管理（Phase 2 動態 RBAC）| Role table + Permission table + 自定義角色管理 UI + 動態權限授權 | 5 | SP2 | M2 | 📋 Backlog |
| **US-103** | User Story | Blog CRUD 範例 | Blog CRUD + 富文本編輯器 + 列表頁 + 詳情頁 | 5 | SP1 | M3 | ✅ Done |
| **US-104** | User Story | AI 模型配置 | API Key 配置、模型切換、配置持久化、錯誤處理 | 5 | SP1 | M4 | 📋 Backlog |
| **US-105** | User Story | AI 對話界面 | Chat UI 可用，能解析需求、生成 JSON、編譯代碼、提示進度 | 5 | SP1 | M5 | 📋 Backlog |
| **TECH-005** | Tech Spike | 混合模式架構 v1.0.0 | JSON L1+L2 + Extension Code L3 + `{{fn:...}}` 引用 | 5 | SP2 | M1 | ✅ Done |
| **TD-301** | Tech Debt | Hook Runtime 實作 | `api-generator.ts:150,202` 的 hook 調用仍是 TODO | 5 | SP2 | M1 | ✅ Done（盤點 2026-08-24） |
| **TD-302** | Tech Debt | Relation Select 選項載入 | `ui-generator.ts:145,365,510` 是 placeholder | 3 | SP2 | M1 | 🗑️ Cancel（UI 不適用 hook 概念，盤點 2026-08-24） |
| **US-201** | User Story | Hook SDK | Extension 提供 hook 函數（11 種 hook context），JSON 用 `{{fn:...}}` 引用 | 5 | SP2 | M1 | ✅ Done（盤點 2026-08-24） |
| **US-202** | User Story | Action SDK | Extension 提供 action 函數（Zod 驗證），UI 自動以按鈕形式顯示 | 5 | SP2 | M1 | ✅ Done（盤點 2026-08-24） |
| **US-203** | User Story | Computed SDK | Extension 提供 compute 函數，UI 自動渲染 + 快取 + dependency 追蹤 | 3 | SP2 | M1 | ✅ Done（盤點 2026-08-24） |
| **TD-516** | Tech Debt | Order 並發 transition 控制 | 同時間兩個 transition 可能都「成功」，最後寫的贏 | 1 | SP8 | M1-WS | 📋 Ready（待真有並發需求時）|
| **TD-517** | Tech Debt | Order transition audit log | 沒有記錄「誰、何時、用什麼 event 切到什麼狀態」 | 2 | SP8 | M1-WS | 📋 Ready（待真實用戶）|
| **TD-518** | Tech Debt | Order transition 權限檢查 | `POST /api/order/{id}/transition` 沒檢查「誰」可以切狀態 | 1 | SP8 | M1-WS | 📋 Ready（待 US-102-P2 完成）|
| **TD-519** | Tech Debt | Order 列表分頁 | 訂單 >50 筆會慢，沒分頁 | 1 | SP8 | M1-WS | 📋 Ready（Sprint 9+）|
| **TD-520** | Tech Debt | Order 用 Zod 驗證 form | 目前 createOrderDialog 手寫 if 驗證 | 1 | SP8 | M1-WS | 📋 Ready（Sprint 9+）|
| **TD-521** | Tech Debt | Disable Guard 測試補完 | Sprint 9 補完 Disable Guard 時發現：`listEnabledExtensions()` 有個 `\|\| true` bug，Sidebar filter 形同失效；其他 helper 也沒 unit test | 1 | SP9 | M6 | ✅ Done（本 session Sprint 9 補完）|
| **TD-522** | Tech Debt | Order Extension manifest 缺失 | `extensions/order/` 沒有 `manifest.json`，導致 extension-manager filesystem scan 漏掉，/api/extensions 看不到 order（但 API guard 仍 work） | 0.5 | SP9+ | M6 | 📋 Ready（Sprint 10+）|
| **US-204** | User Story | 訂單狀態機 | 訂單狀態：draft → pending_payment → paid → shipped → completed | 8 | SP2 | M1-WS | ✅ Done（Sprint 8：後端 + Demo UI，24 個測試）|
| **US-206** | User Story | AI 生成狀態機系統 | 「做訂單管理含狀態機」→ AI 生成 JSON + workflow TS + 測試 | 8 | SP2 | M1 | 📋 Backlog |
| **TD-306** | Tech Debt | Auth.js v5 整合 | `lib/auth/.gitkeep` 為空 | 5 | SP2 | M2 | ✅ Done |
| **TECH-006** | Tech Spike | Workflow Engine | StateMachine + DSL + Runtime + API | 8 | SP2 | M1-WS | ✅ Done（本 session Sprint 7）|
| **TECH-007** | Tech Debt | Disable Guard UX polish | disable 時 toast 提示 + 隱藏動畫 + Toggle UI 更明顯 | 2 | SP9+ | M6 | 📋 Ready（路線圖）|
| **TECH-008** | Tech Spike | Compiler Pipeline 串接 | `lib/compiler/` 4 個 generator 串成 orchestrator + spec `apiBase`/`uiBase` 自訂路徑 | 10 | SP10 | M1 | 🚧 In Progress（Phase 1 ✅ / Phase 2 揭露 6 個 bug）|
| **TD-514** | Tech Debt | **CI workflow**（P0）| 加 `.github/workflows/ci.yml`：lint + typecheck + test + Playwright E2E | 2 | SP6 | M0 | ✅ Done（待 push 首次跑驗證）|

### P1（重要 / 安全）

| ID | 類型 | 標題 | 描述 | SP | Sprint | 模組 | 狀態 |
|----|------|------|------|----|----|------|------|
| **US-106** | User Story | AI 生成 Extension | 「加留言板 Extension」→ AI 生成 + UI 顯示已安裝 | 8 | SP2 | M6 | 📋 Backlog |
| **US-107** | User Story | 管理已安裝 Extension | 列出 / 啟用 / 停用 / 查看配置 JSON | 3 | SP2 | M6 | ✅ Done（盤點 2026-08-24，`/admin/extensions` 完整實作）|
| **TD-303** | Tech Debt | Tiptap rich text 整合 | `text-long` 欄位目前用 Textarea，應整合 Tiptap WYSIWYG | 3 | SP2 | M3 | ✅ Done（盤點 2026-08-24） |
| **TD-305** | Tech Debt | Field.relation vs Model.relations 雙軌制 | schema-generator 只支持 `model.relations`，field.relation 無人處理 | 2 | SP2 | M1 | ✅ Done |
| **TD-401** | Tech Debt | Chat Sidebar 漢堡選單 | <768px 永遠渲染 256px sidebar 擠壓主內容 | 1 | SP4 | M5 | ✅ Done（chat RWD 已完成，盤點 2026-08-24） |
| **TD-403** | Tech Debt | Extension toggle 失敗 Toast | toggle catch 後只 console.error，用戶無反饋 | 0.5 | SP4 | M7 | ✅ Done（setError 已實作，盤點 2026-08-24） |
| **TD-404** | Tech Debt | 真實 AI Provider 串接 | `providers.ts` 是 mock，`.env.example` 配 OPENAI_API_KEY 但未使用 | 12 | SP5 | M5 | ✅ Done（真實串接 + mock fallback，盤點 2026-08-24） |
| **TD-502** | Tech Debt | AI API 驗證 + rate limit | `/api/chat/stream` 未檢查 Auth、未限速、未審計 | 1 | SP5 | M5 | ✅ Done |
| **US-S6-1** | User Story | TD-503 abort E2E | 切換 chat / SPA 切換 / disabled 守護 3 場景（reviewer P1）| 2 | SP6 | M6 | ✅ Done |
| **TD-601** | Defect | /admin/extensions 崩潰修復 | async 函數漏 await → await + try/catch + lint + smoke test | 2 | SP6 | M7 | ✅ Done |
| **TD-510** | Tech Debt | Backlog ID 撞號修正 | 既有兩個 `TD-405` 已透過本次重整重新編號 | 0.5 | SP6 | M0 | ✅ Done（本次重整）|

### P2（一般 / 改進）

| ID | 類型 | 標題 | 描述 | SP | Sprint | 模組 | 狀態 |
|----|------|------|------|----|----|------|------|
| **TD-402** | Tech Debt | Extension grid RWD | `md:grid-cols-2`，<md 未做單欄處理 | 0.5 | SP4 | M7 | 📋 Ready（未做） |
| **TD-406** | Tech Debt | Chat 串流重連機制 | 無 retry，弱網環境體驗差 | 1 | SP4 | M5 | ✅ Done（streamChatWithRetry 已實作，盤點 2026-08-24） |
| **TD-501** | Tech Debt | chat-page-client.tsx 職責過多 | 243 行 → 135 行 + 3 hooks | 3 | SP5 | M5 | ✅ Done |
| **TD-503** | Tech Debt | SSE 串流無 abort/cancel | 用戶離開頁面或新對話時，串流繼續消耗 API quota | 1 | SP5 | M5 | ✅ Done |
| **TD-504** | Tech Debt | Mock Stream 字符延遲 | 每字符 15ms，600字=9秒 | 1 | SP5 | M5 | ✅ Done |
| **TD-505** | Tech Debt | Token 使用量追蹤 | OpenAI/Anthropic 回應含 `usage`，目前完全丟棄 | 2 | SP5 | M5 | ✅ Done |
| **TD-507** | Tech Debt | Tiptap `minimumReleaseAgeExclude` workaround | pnpm 11 升級暫時方案，逐步移除 | 0.5 | SP6 | M6 | 📋 Ready |
| **TD-508** | Tech Debt | useChatStream → useReducer | functional setState workaround → useReducer + dispatch | 2 | SP6 | M6 | ✅ Done |
| **TD-511** | Tech Debt | Playwright webServer 設定 | CI 跑 E2E 需手動起 server | 0.5 | SP6 | M6 | ✅ Done（盤點 2026-08-24，`PLAYWRIGHT_WEBSERVER=auto` 已實作 + `test:e2e:ci` script）|
| **TD-513** | Tech Debt | use-chat-sessions.ts 測試 | TD-508 重構未涵蓋 hook 整合測試 | 1 | SP6 | M5 | ✅ Done（盤點 2026-08-24，16 個測試 case 已實作）|
| **US-S6-2** | User Story | 平板 RWD 優化 | 768-1024px sidebar 太擠 | 1 | SP6 | M6 | 📋 Ready |
| **TD-515** | Tech Debt | Extension State 持久化用 Prisma | `.extension-state.json` 寫 filesystem，多實例部署狀態不一致（舊 TD-405，已重新編號）| 2 | SP6 | M7 | ✅ Done（Prisma Extension.isEnabled，盤點 2026-08-24） |

### P3（細節 / 可選）

| ID | 類型 | 標題 | 描述 | SP | Sprint | 模組 | 狀態 |
|----|------|------|------|----|----|------|------|
| **US-108** | User Story | 下載 AI 生成的 JSON | 每個生成的功能旁邊有「下載 JSON」按鈕 | 1 | SP2 | M1 | 📋 Backlog |
| **US-205** | User Story | 審批請假單 | 狀態機 + 審批佇列 UI | 5 | SP2 | M1-WS | 📋 Backlog |
| **US-207** | User Story | Blog Extension 加 hook | 混合模式範例：slug 生成、自動 excerpt、發布 action | 3 | SP2 | M3 | ✅ Done（盤點 2026-08-24，`extensions/blog/hooks/before-create.ts` 含 slug + excerpt + status 自動生成；發布 action `actions/publish.ts` 已存在）|
| **TD-304** | Tech Debt | Pipeline Stage 類型安全 | `<TIn=any, TOut=any>` 失去類型保護 | 1 | SP2 | M1 | 📋 Ready |
| **TD-506** | Tech Debt | ChatSidebar close emoji → icon | 視覺一致性 + 無障礙 | 0.5 | SP5 | M5 | ✅ Done |
| **TD-509** | Tech Debt | JWT augmentation JSDoc | 解釋 TS quirk：`import type { JWT }` 是 module-load trigger | 0.5 | SP6 | M6 | ✅ Done |
| **TD-512** | Tech Debt | E2E mock SW 相容性 | localStorage 跨 navigation，若加 service worker 可能衝突 | 1 | SP7 | M6 | 📋 Ready |

### 冰盒（Backlog Icebox）

| ID | 類型 | 標題 | 描述 | SP | 模組 | 狀態 |
|----|------|------|------|----|------|------|
| **TECH-003** | Tech Spike | Extension 開發規範 | OpenSpec（MD + JSON Schema + TS Types + 範例）| 5 | M6 | ✅ Done（盤點 2026-08-24，`docs/specs/extension-spec.md` 已存在）|
| **TECH-004** | Tech Spike | 雙模型抽象層 | OpenAI + Claude interface + Provider 實作 + token 計算 | 3 | M4 | ✅ Done（盤點 2026-08-24，`lib/ai/providers/providers.ts` 含 OpenAI + Anthropic 真實串接 + mock fallback）|
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
| **Sprint 14** | [sprint-14.md](reflection/sprint-14.md) | **方向大轉彎**：Compiler → Runtime 路線 + 揭露 event/todo 缺 requiresExtension |

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
---

## 📋 US-102 Phase 2 開工 checklist（下個 session 開工前必看）

### 產品問題（需用戶確認才能開工）
1. **admin / editor / viewer 是不是系統內建、不能刪？**
   - 影響：Role table 是否要加 `isSystem: Boolean` 欄位
   - 我的建議：是，內建3 個都 `isSystem=true`，不能刪只能「自定義新 role」

2. **自定義 role 的命名規則？**
   - 影響：Role.name 驗證邏輯
   - 我的建議：小寫 + 底線（e.g. `editor_special`），≤32 字，唯一

3. **Role 是不是用戶在後台能看到的資源？**
   - 影響：UI 是否要列「所有 role」給用戶選
   - 我的建議：是 — `/admin/roles` 頁面是公開的 role 管理 UI（admin 才能進）

4. **誰能授權權限？**
   - 影響：RBAC middleware / API 守衛
   - 我的建議：只有 admin 能進 `/admin/roles`、能改 role 的 permission 設定

### 技術問題（下個 session 開工時決定）
5. **Session strategy：JWT vs database？**（現狀 JWT + jwt() 重讀 DB hack 已運作）
6. **hasPermission 重構策略**：保留純函式 + 加 `hasDynamicPermission` 平行函式（漸進式遷移）
7. **既有 auth.test.ts 22 個測試**：保留寫死矩陣測試 + 新增動態查 DB 測試

### 開工時程
- 預估 5 SP，3-4 天完成
- 順序：(1) Prisma migration → (2) seed 重寫 → (3) auth.ts 重構 + 新測試 → (4) `/admin/roles` UI → (5) 4 Gate
