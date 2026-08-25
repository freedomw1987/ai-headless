# Sprint 13 Reflection — TECH-025 Order schema + Extension 教學範例

**完成日期**：2026-08-25
**Sprint Goal**：補完 Order JSON 規格 + 為 4 個 extension 提供教學範例
**SP**：2 / 2（100%）

---

## ✅ 完成項目

### TECH-025a — Order schema.json 反向（1 SP）
- 從 `order-workflow.ts` 反向出 7 states + 8 transitions workflow
- 從 Prisma `Order` model 反向出 fields（orderNumber/customer/amount/status/stateData）
- 加入 `apiBase` / `uiBase` / `requiresExtension`
- 加入 2 個 actions（markAsPaid / cancelOrder）
- **重要**：這次 sprint **揭露並修正** Sprint 11 Phase A 的 false positive typecheck 過綠

### TECH-025b — 4 個 extension 加 examples/（0.5 SP）
- `blog/examples/list-and-transition.ts` — 4 states + transition 範例
- `order/examples/full-lifecycle.ts` — 7 states + stateData payload + InvalidTransitionError 處理
- `event/examples/list-and-cancel.ts` — 自動 computed status 範例
- `todo/examples/toggle-and-filter.ts` — toggle + filter 範例

### TECH-025c — `extensions/README.md` 教學文檔（0.5 SP）
- 完整覆寫從舊版（29 行 placeholder）到新版（239 行教學）
- 涵蓋：目錄結構、必備檔案、Quick Start、Compiler Pipeline、Disable Guard、Workflow、Sidebar、4 個 extension 對照

---

## 🐛 揭露並修正的 **真實 bug**

**重要**：Sprint 11 Phase A 我聲稱「Compiler 產出能 typecheck」，**這是 false claim**。Sprint 13 加 Order workflow 後揭露真實情況：

### Bug 1: `import { prisma } from '@/lib/db'`
- `db.ts` 只有 `export const db`，沒有 `prisma`
- Sprint 11 沒被測試抓到是因為當時 test 用 grep `expect().not.toMatch(/error TS/)` 配 `tsc --noEmit`，但某種原因被靜默通過
- **修**：header import 改為 `import { db } from '@/lib/db'`

### Bug 2: `hookFn()` 沒在產出程式碼定義
- Generator 把 `hookFn()` 字串塞進 template，但 `hookFn` 是 generator 內部函數
- **修**：產出 template 用 `parseHookReference()`（runtime import）取代

### Bug 3: `checkPermission(session.user, action)` 簽名錯
- 實際 `checkPermission(permission: Permission)` 只 1 個參數
- Generator 寫 2 個參數
- **修**：用 `hasPermission(session.user.role, action)`

### Bug 4: `useToast()` API 簽名錯
- ToastContextValue 是 `{ show: (toast) => void }`，不是 `{ toast: (...) => void }`
- Generator 用 `const { toast } = useToast()`
- **修**：改用 `const { show: toast } = useToast()`

### Bug 5: `ToastInput` 用 `title` 而非 `message`
- `toast.tsx` 定義 `type ToastInput = { message: string; variant?: ...; }`
- Generator 用 `title` 和不存在的 `variant: 'destructive'`
- **修**：改用 `message: '...'` 和 `variant: 'success' | 'error'`

### Bug 6: `use-toast` import 路徑錯
- Generator 用 `@/components/ui/use-toast`
- 實際檔案是 `@/components/ui/toast.tsx`
- **修**：改為正確路徑

### Bug 7: `TransitionButtons` 沒定義
- Generator 注入 `<TransitionButtons>` JSX 但沒 import
- **修**：建立集中元件 `app/_components/transition-buttons.tsx`，generator 加 import

### Bug 8: `Form` 介面用 `[key: string]: unknown`
- JSX 用 `form.title ?? ''` 期望 string
- **修**：改為 `[key: string]: string | number | boolean | undefined`，JSX 用 `String(form.title ?? '')` 或 `as string`

### Bug 9: `form.date?.slice` 型別錯
- optional chaining 對 non-nullable string 報錯
- **修**：型別改 `string | undefined`

### Bug 10: `db.update()` 缺少 typecast
- Prisma 期望 `JsonValue` 但 form 給 `unknown`
- **修**：`data as Parameters<typeof db.update>[0]['data']`

### Bug 11: `parseHookReference` crash on undefined
- generator 傳 `hooks.beforeCreate` 可能 undefined
- **修**：validator 簽名改 `string | undefined | null`，回 null if empty

---

## 📊 教訓

### 教訓 1：**typecheck 過綠不等於「compiler 真的能用」**
Sprint 11 的「過綠」其實只在 blog 沒 workflows 時成立。加 workflows 後揭露 11 個 bug。
**新 SOP**：
- 每次新增 spec 特性（如 workflows）必須重跑 typecheck
- test 不只用「expect not error TS」，要主動 `result === ''`

### 教訓 2：**改 generator 不能只改 header，要追蹤每個產出點**
11 個 bug 散佈在 api-generator（4 個）+ ui-generator（7 個）。
**新 SOP**：
- generator 修改必須跑完整 typecheck
- 不可只 grep `error TS` — 要看具體錯誤訊息

### 教訓 3：**「expected to pass」不等於「實際 pass」**
Sprint 11 Phase A 我**以為** typecheck 過了，但實際是測試邏輯漏洞（catch e 但 e.message 是別的東西）。
**新 SOP**：
- 測試要 assert 具體 stderr
- Sprint 結束時**重新跑完整 Sprint 測試**確認所有綠

### 教訓 4：**集中元件比 inline 程式碼好**
`TransitionButtons` 原本想 inline `createStateMachine`，但測試設計太複雜。
Sprint 13 改成集中元件：測試只驗證「產出含正確 import + schema + endpoint」，元件處理 state machine 邏輯。
**好處**：UI generator 專注 CRUD scaffold，元件專注 state machine 邏輯。

### 教訓 5：**Extension Code 不該被 compiler 取代**
我曾在 Sprint 13 計畫中提「撤手寫 workflow.ts」（TECH-027）。這次 Sprint 13 沒做這項，**是對的決定**：
- workflow.ts 有複雜商務邏輯（stateData payload、transaction、event payload）
- compiler 產出只有 CRUD + 通用 state machine 模板
- 撤手寫會丟失：跨 extension hooks、custom validation、複雜 transition guards

**修正 Sprint 14 計劃**：TECH-027 改為「可選：用 compiler 取代純 CRUD extension（如 todo）」「不可取代 state machine extension（如 order）」

---

## 📈 測試基線

| 項目 | Sprint 12 結束 | Sprint 13 結束 | 增減 |
|---|---|---|---|
| vitest | 804 / 59 | **809 / 61** | +5 / +2 ✅ |
| E2E | 22 | **22** | 不變 ✅ |
| 主 typecheck | ✓ | ✓ | 不變 ✅ |
| Compiler typecheck | (未跑) | **0 errors** | 從 false claim → real ✅ |
| Lint | ✓ | ✓ (1 warning) | 不變 ✅ |

**新增 5 個 test**：
- `tech-025-order-spec.test.ts` (5 tests) — Order spec 結構 + workflow states 7 個 + 編譯產出 + typecheck

**修改 4 個 test**：
- `compiler-blog-compile.test.ts` — 已存在（無改動）
- `ui-generator-workflow.test.ts` — 改測試期望為 `<TransitionButtons` JSX
- `api-generator.test.ts` — 改 prisma → db / checkPermission → hasPermission
- `td-522-order-manifest.test.ts` — Order manifest 已存在（Sprint 11）

---

## 🎯 Sprint 14 規劃（建議）

| Task | 內容 | SP |
|---|---|---|
| TECH-028 | 修「撤手寫」誤區 — 把 compiler scope 寫成「CRUD scaffold + UI form」明確不可取代 workflow | 1 |
| TECH-029 | 用 compiler 取代 todo（純 CRUD，無 state machine）— 真實撤回 Sprint 9 手寫 | 2 |
| TECH-030 | Sprint 13 揭露的 11 個 bug 加 regression test 守護 | 1 |
| **合計** | | **4 SP** |

**不做**：
- TECH-031 撤 order 手寫 — 因 workflow 太複雜
- TECH-032 撤 blog/event 手寫 — workflow + 自動 computed 都有

---

## 🔧 Sprint 13 主要 commit

待 commit（見 git status）：
- `extensions/order/order-spec.json` — 新
- `extensions/{blog,order,event,todo}/examples/*.ts` — 新（4 個檔案）
- `extensions/README.md` — 改（從 29 行 placeholder 改為 239 行教學）
- `app/_components/transition-buttons.tsx` — 新（Sprint 12 應該做但漏的集中元件）
- `lib/compiler/api-generator.ts` — 修 4 個 bug
- `lib/compiler/ui-generator.ts` — 修 7 個 bug
- `lib/specs/json-spec.validator.ts` — 修 1 個 bug（parseHookReference 加 null check）
- `lib/compiler/api-generator.test.ts` — 修 2 個測試期望
- `lib/compiler/ui-generator-workflow.test.ts` — 修 3 個測試期望
- `tests/integration/tech-025-order-spec.test.ts` — 新（5 tests）
- `scripts/compile-order-to-temp.ts` — 新（用於測試編譯 Order）