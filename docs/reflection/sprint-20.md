# Sprint 20 Reflection — UI 元件擴充 + 全局主題切換

> **Sprint**: Sprint 20 (Stage 1 + Stage 2 + Stage 3 + Stage 4 + P3 + P3.5)
> **SP**: 7 / 7 ✅（5.5 原計劃 + 1.5 user 報 bug）
> **日期**: 2026-08-26
> **測試基線**: 866 → **923**（+57）
> **檔案基線**: 74 → **80**（+6：sheet.tsx、tooltip.tsx、sonner.tsx、theme-provider.tsx、theme-toggle.tsx、error-sanitizer.ts）

---

## 🏆 總覽

| Stage | 主題 | SP | 狀態 |
|---|---|---|---|
| **Stage 1** | Sheet（抽屜式編輯）| 1.5 | ✅ |
| **Stage 2** | Tooltip（sortable header）| 1 | ✅ |
| **Stage 3** | Dark mode（next-themes ThemeProvider）| 1.5 | ✅ |
| **Stage 4** | Toast sonner 升級（徹底改寫）| 1.5 | ✅ |
| **P3** | Dead code + null date | 0 | ✅ |
| **P3.5** | Event 500 + Hook 註冊（user 報 bug）| 1.5 | ✅ |
| **累計** | | **7 / 7** | **4 Gate 全綠** |

---

## Stage 1 重點（Sheet）

### 交付
1. `components/ui/sheet.tsx`（DialogPrimitive + cva 4 sides）
2. `dynamic-detail-client.tsx`：SheetTrigger 包 Button + onSuccess callback
3. `dynamic-form-client.tsx`：加 onSuccess prop
4. `ui-config.ts`：DetailUIConfig.formConfig + buildFormUIConfig 接受 mode

### 守護測試
- tech-053 12 個（Sheet 元件結構 + 整合）
- tech-046 同步更新反映 SheetTrigger 變更
- 3 個 E2E（含截圖 tech-053-sheet-open）

### Reviewer 提 3 個 P2 Finding
1. 守護測試語義過寬（**已修**）
2.「- 新增」後缀錯位（**已修**：buildFormUIConfig 依 mode 動態）
3. 既有 dead code `dynamic-handler.ts:268-269`（**留 P3**）

### 4 Gate 全綠
- Gate 1 TDD（紅→綠）
- Gate 2 lint/typecheck
- Gate 3 regression（77 files / 881 vitest）
- Gate 4 reviewer + E2E

---

## Stage 2 重點（Tooltip）

### 交付
1. `components/ui/tooltip.tsx`（shadcn 標準 Radix primitive + TooltipProvider）
2. `components/admin/sortable-header-cell.tsx`（client wrapper，封裝 Tooltip + URL 組裝）
3. `app/admin/crud/[spec]/page.tsx` 改用 SortableHeaderCell（移除直接用 Tooltip）
4. 安裝：`@radix-ui/react-tooltip@1.2.16`

### 架構決策
- **Server Component（list page）透過 client wrapper（SortableHeaderCell）使用 Tooltip**，避免把整個 list page 變 client
- **Server→Client 不傳 function prop**（URL 內聯用 URLSearchParams 組裝）

### 守護測試
- tech-054 11 個（Tooltip + SortableHeaderCell）
- tech-052 同步更新反映 SortableHeaderCell 架構
- 2 個 E2E（含截圖 tech-054-tooltip-sortable.png）

### Reviewer 提 4 個 P2 Finding
1. TooltipProvider 重複建立（**接受留 P3**：未來可抽 SortableHeader 整個 TableHeader 共享 Provider）
2. 註解誤導（**已修**）
3. Icon 缺少 a11y 標註（**已修**：icon aria-hidden + link aria-label）
4. 冗餘型別斷言（**已修**：list page 改傳原值）

### 4 Gate 全綠
- Gate 1 TDD（6 failed → 11 passed）
- Gate 2 lint/typecheck
- Gate 3 regression（78 files / 892 vitest）
- Gate 4 reviewer + E2E

---

## P3 重點（Dead code + null date）

### 交付
1. `tests/integration/tech-055-p3-dead-code-null-date.test.ts`（2 守護測試）
2. `lib/runtime/dynamic-handler.ts`：get handler 移除 dead code line 268-269
3. Zod schema `publishedAt` 改 optional
4. create input 自動加 `publishedAt: null`
5. update input 保留型別
6. `dynamic-form-client.tsx`：publishedAt 欄位不傳，預設 null

### 4 Gate 全綠
- Gate 1 TDD（2 passed）
- Gate 2 lint/typecheck
- Gate 3 regression（79 files / 894 vitest）
- Gate 4 reviewer OK

---

## P3.5 重點（Event 500 + Hook 註冊）

> **來源**：user 報 bug（Sprint 20 開發期間揭露）

### 兩條 bug
- **Bug A**：dynamic-handler.ts 4 個 handler（create/update/del/transition）沒 try/catch → DB 拋錯 → 500 + 暴露 SQL 內部錯誤
- **Bug B**：hooks-registry.ts 中央映射表 + `registerAllExtensions()` 在 route.ts setup() 內呼叫 → 修「`Cannot read properties of undefined (reading 'cancelled')`」之前未註冊的 hook

### 交付
1. `lib/runtime/error-sanitizer.ts`（60 行，sanitizeErrorMessage + SAFE_PATTERNS）
2. `lib/runtime/dynamic-handler.ts`：4 個 handler 包 try/catch + sanitizeErrorMessage；invokeHook 回傳邏輯修正
3. `lib/extensions/hooks-registry.ts`：+`beforeCreateTodo` import + safeRegister
4. `app/api/crud/[spec]/route.ts`：setup() 內呼叫 `registerAllExtensions()`
5. `tests/integration/tech-056-p3-5-hook-registration-error-handling.test.ts`（10 → 13 測試）
6. `tests/e2e/tech-056-p3-5-event-create-error-handling.spec.ts`（3 E2E）

### 架構決策
- **手動映射表**（vs 自動掃描 manifest）
- **registry 完整性靠「completeness guard 測試」保護**
- **safeRegister** 用 try/catch 容錯「already registered」（dev hot reload 安全）
- **error-sanitizer** 只允許 SAFE_PATTERNS（Zod / 業務錯誤）暴露
- **try/catch 範圍**只包 hook + Prisma 區塊，不包 Zod/auth/early return

### Reviewer 表現
- 第一輪：攔截 `beforeCreateTodo` 漏註冊問題（**blocking**）
- 第二輪：OK with notes（5 個 P2/P3 不阻 merge）

### 4 Gate 全綠
- Gate 1 TDD（3 failed → 13 passed）
- Gate 2 lint/typecheck
- Gate 3 regression（80 files / 907 vitest）
- Gate 4 reviewer + E2E

---

## Stage 3 重點（Dark mode）

### 交付
1. `components/theme/theme-provider.tsx`（~30 行，client component 包 NextThemesProvider）
2. `components/theme/theme-toggle.tsx`（~50 行，client component，DropdownMenu 三選項 + Sun/Moon/Monitor icons）
3. `app/layout.tsx`：body 內加 ThemeProvider
4. `app/admin/admin-sidebar.tsx`：user info 下、登出上加 `<ThemeToggle />`
5. 安裝：`next-themes 0.4.6`

### 架構決策（重要）
- **ThemeProvider**（next-themes）：全局主題（Light/Dark/System），放 `app/layout.tsx`
- **Extension 自有樣式**：保持獨立（不需要知道 dark mode），與全局主題共存
- **不使用 Extension 機制**做 dark mode（避免 mountPoints 未實作的衝突）

### 配置
- `attribute="class"` 配合 tailwind `darkMode: ['class']`
- `defaultTheme="system"` 尊重 OS 偏好
- `enableSystem + disableTransitionOnChange`

### 守護測試
- tech-057 15 個（ThemeProvider + ThemeToggle + 整合）
- 3 個 E2E（含截圖 tech-057-dark-mode.png，整頁深色確認）

### 4 Gate 全綠
- Gate 1 TDD（15 passed）
- Gate 2 lint/typecheck
- Gate 3 regression（81 files / 922 vitest）
- Gate 4 reviewer + E2E

---

## Stage 4 重點（Toast sonner 升級）

### 交付
1. `components/ui/sonner.tsx`（~25 行，client component，包 SonnerToaster）
2. `app/layout.tsx`：ThemeProvider 內加 `<Toaster />`
3. `components/admin/extension-card.tsx`：useToast() show() → toast.success() / toast.error() from sonner
4. `app/admin/extensions/extensions-page-client.tsx`：移除 ToastProvider wrapper
5. **刪除**：`components/ui/toast.tsx` + `components/ui/toast.test.tsx` + `components/admin/extension-card.test.tsx`
6. **移除依賴**：`@radix-ui/react-toast`（pnpm remove，package.json 死依賴）

### 配置
- `position="top-right"` + `richColors` + `closeButton` + `duration 4000`
- `useTheme` 動態 theme prop（跟 ThemeProvider 整合）

### 架構決策
- **徹底改寫**，無兼容層，無 useToast shim
- **Toaster 在 root layout**（ThemeProvider 同級，全站共用）
- **呼叫端對稱改寫**（toast.success() / toast.error()）

### 守護測試
- tech-058 13 個（sonner 整合 + theme prop 防 regression 守護）
- 4 個 E2E（含 light + **dark** 截圖 tech-058-sonner-toast-dark.png）

### Reviewer 表現
- 第一輪：**BLOCK**（1 P1 dark mode 整合缺口 + 1 P2 死依賴 + 1 P3 恆真斷言）
- 第二輪：**MERGE OK** with notes（1 P3 housekeeping note：`bun.lock` 陳舊，非功能問題）

### 4 Gate 全綠
- Gate 1 TDD（11 failed → 13 passed）
- Gate 2 lint/typecheck
- Gate 3 regression（80 files / 923 vitest）
- Gate 4 reviewer + E2E

---

## 📊 揭露的技術債（留 Sprint 21+）

| 優先級 | 項目 | 影響文件 |
|---|---|---|
| **P2** | list/get handler 沒 try/catch（DB 拋錯 → 500 暴露 SQL）| `lib/runtime/dynamic-handler.ts` |
| **P2** | Sanitizer SAFE_PATTERNS 漏 `Cannot register for cancelled/past event` | `lib/runtime/error-sanitizer.ts` |
| **P3** | Hook type contract vs runtime 不一致（hook-sdk 型別要求 vs 4 個 production hook 全 return data）| `lib/hooks/hook-sdk.ts` |
| **P3** | Registry completeness regex 不支援嵌套 JSON | `lib/extensions/hooks-registry.ts` |
| **P3** | State machine 錯誤在 production 被過濾（不匹配 SAFE_PATTERNS）| `lib/runtime/error-sanitizer.ts` |
| **P3** | TooltipProvider 重複建立（10 欄位 = 10 Provider）| `components/admin/sortable-header-cell.tsx:59` |
| **P3** | `bun.lock` 陳舊（CI 用 pnpm 不讀 bun.lock）| `bun.lock` |

---

## 🎓 跨 Stage 共同教訓

| 觀察 | 說明 |
|---|---|
| **Reviewer 兩輪制有效** | P3.5 攔截 `beforeCreateTodo` 漏註冊；Stage 4 攔截 dark mode 整合缺口 + 死依賴 |
| **徹底改寫 vs 兼容層** | Stage 4 採「徹底改寫 + 移除 useToast shim」省去未來維護負擔 |
| **架構決策文件化** | Dark mode 不走 Extension 機制的原因（mountPoints 未實作）寫入 backlog 與 reflection |
| **截圖是視覺驗證唯一手段** | 5 張截圖確認 Sheet/Tooltip/Dark mode/Sonner 在 light + dark 下行為正確 |
| **P3.5 user 報 bug 揭露深層問題** | 不只是「handler 加 try/catch」，還揭露 hook 註冊時機 race + 錯誤訊息暴露風險 |

---

**Sprint 負責人**：TBD
**PRD/Backlog 連結**：[Sprint 20 規劃](../backlog.md#-當前狀態2026-08-26)