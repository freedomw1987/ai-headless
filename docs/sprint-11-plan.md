# Sprint 11 規劃 — Compiler 完善（修正 Sprint 10 Phase 2 揭露問題）

> **規劃日期**：2026-08-25
> **動機**：Sprint 10 Phase 2 揭露 compiler 產出程式碼有多個 bug，需多個 Sprint 完善

---

## 🎯 Sprint 10 Phase 2 揭露問題清單

### 🅐 Compiler 架構問題（Phase 2 已修）
- ✅ `route.ts` 多 method 合併（修 `mergeHandlerCodes`）
- ✅ UI page path suffix（加 `page.tsx`）
- ✅ `outputBase` 選項（隔離編譯用）
- ✅ PATCH vs PUT 一致化（統一 PATCH）

### 🅑 Compiler 產出 bug（需 Sprint 11 修）
1. **api-generator schema 丟失**：Zod schema 在 body 切斷處遺失（影響 POST/PATCH handler）
2. **api-generator 假 import**：生成 `runAction`, `triggerWorkflowTransition` 等不存在的 import
3. **api-generator 引用不存在函數**：`hookFn(model.hooks?.afterList)` 中的 `model`, `hookFn` 未定義
4. **api-generator `[id]/route.ts` ctx 缺 `Promise<>` wrap**：ctx.params 應該是 Promise
5. **ui-generator 缺 workflow transition 按鈕**：Sprint 9 Order/Blog 手寫了，compiler 完全沒生成

### 🅒 Compiler 功能缺失（需 Sprint 11+）
1. **Disable Guard**：compiler 生成的 API 沒有 `guardExtensionApi` — disable extension 仍可呼叫
2. **Sidebar nav item**：compiler 生成 page 但 sidebar 沒自動加
3. **共用元件**（blog-status-badge, dialog 等）：Sprint 9 手寫 6 個，compiler 完全沒生成
4. **Workflow endpoint**：`POST /api/blog/[id]/transition` 缺失
5. **4 個 extension 反向驗證**：Order / Event / Todo schema.json 都不存在

---

## 📋 Sprint 11 規劃（建議）

### Phase A — 修 compiler 產出 bug（高優先）

| Task | 標題 | SP | 說明 |
|---|---|---|---|
| **TECH-018** | 修 api-generator schema 丟失 + 假 import | 3 | 統一從 imports 解構；schema 在 body 內完整保留 |
| **TECH-019** | 修 api-generator hook 引用錯誤 | 1 | `hookFn(model.hooks?.x)` 改為 `extractHookName(...)` + `invokeHook(name, ctx)` |
| **TECH-020** | 修 api-generator `ctx.params` Promise wrap | 1 | Sprint 9 都是 `Promise<{ id: string }>`，compiler 要一致 |
| **TECH-021** | 統一編譯結果 typecheck 通過 | 2 | `pnpm compile && pnpm typecheck` 腳本；產出程式 0 error |

### Phase B — 補 compiler 功能（中優先）

| Task | 標題 | SP | 說明 |
|---|---|---|---|
| **TECH-022** | Disable Guard 自動注入 | 2 | JsonSpec 加 `requiresExtension` → compiler 自動注入 `guardExtensionApi` |
| **TECH-023** | Sidebar 自動加 nav item | 2 | ui-generator 同時生成 sidebar entry；NAV_ITEMS 改為程式生成 |
| **TECH-024** | Workflow transition 按鈕自動生成 | 3 | JsonSpec 加 `workflow` 欄位 → 自動生成 transition buttons + endpoint |

### Phase C — 4 個 extension 全遷移（中優先）

| Task | 標題 | SP | 說明 |
|---|---|---|---|
| **TECH-025** | Order schema.json 反向 + apiBase/uiBase | 2 | Sprint 11 從 Order workflow 反向出 schema.json |
| **TECH-026** | Event / Todo schema.json | 2 | 同上 |
| **TECH-027** | 4 個 extension 全刪手寫檔 + compiler 生成 | 2 | Sprint 11 收尾 |

**Sprint 11 總計**：19 SP（偏多，可拆 Phase）

---

## 🎯 建議 Sprint 11 範圍（10 SP）

**Phase A 必做**（7 SP）：
- TECH-018, 019, 020, 021

**Phase B 部分**（3 SP）：
- TECH-022（Disable Guard — Sprint 9 已驗證需求重要）

**Phase C 留 Sprint 12**（待 compiler 完整可 typecheck）

---

## 📊 Sprint 11 完成的定義

- [ ] `pnpm compile --all` 執行成功
- [ ] 所有產出檔案 `pnpm typecheck` 通過
- [ ] Blog 編譯後啟動 dev server，E2E 測試通過
- [ ] Disable extension 後 compiler 生成的 API 403
- [ ] TD-522 Order manifest 缺失補完

---

## 🚫 不在 Sprint 11 範圍

- TECH-023 Sidebar（低優先，Sprint 12）
- TECH-024 Workflow button（中優先，但需 ui-generator 大改）
- TECH-025~027 4 個遷移（依賴 Phase A 完成）
- TECH-007 Disable Guard UX polish（Sprint 9 揭露的小項目）
- TD-522 Order manifest 缺失（**必做但簡單，0.5 SP，併入 Sprint 11**）
