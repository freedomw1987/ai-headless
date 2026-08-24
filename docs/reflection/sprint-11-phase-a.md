# Sprint 11 Phase A 反省 — TECH-018/019/020/021 修 compiler 產出 bug

> **Sprint**: Sprint 11 — Compiler 完善（Phase A）
> **反省日期**: 2026-08-25
> **對應 Backlog**: TECH-018 + 019 + 020 + 021

---

## 🎯 Phase A 目標

修 Sprint 10 Phase 2 揭露的 compiler 產出 bug：
- TECH-018: schema 丟失 + 假 import（其實是 false alarm，schema 沒丟）
- TECH-019: hook 引用錯誤（真實 bug）
- TECH-020: `ctx.params` Promise wrap（已正確，無需修）
- TECH-021: 統一編譯結果 typecheck 通過

---

## ✅ 實際完成

### 1. 移除假 import（HEADER_IMPORTS）
**前**：
```typescript
import { runAction } from '@/lib/extensions/actions';  // 不存在
import { triggerWorkflowTransition } from '@/lib/workflows/transitions';  // 不存在
```

**後**：移除這兩個

### 2. 修 hook 引用錯誤
**前**（bug — `model` 在 template 內不是字串插值）：
```typescript
const afterListHook = hookFn(model.hooks?.afterList);  // `model` 不存在！
```

**後**（正確 — 用 `${hooks.afterList}` 字串插值）：
```typescript
const afterListHook = hookFn('${hooks.afterList ?? ''}');
```

需要先宣告 `const hooks = model.hooks ?? {};` 在 function 開頭

### 3. Action endpoint 改用 invokeHook
**前**（用不存在的 `runAction`）：
```typescript
const result = await runAction('${implFn}', { id, ...body }, { ... });
```

**後**（用實際存在的 `invokeHook`）：
```typescript
const result = await invokeHook('${implFn}', { id, ...body }, { ... });
```

### 4. 新增整合測試 `compiler-blog-compile.test.ts`（6 tests）
1. ✅ 生成 6 個檔案（3 API + 3 UI）
2. ✅ route.ts 含 GET + POST
3. ✅ `[id]/route.ts` 用 `Promise<{id}>` 而非 `{ id: string }`
4. ✅ 產出不含 `hookFn(model.hooks` 模式
5. ✅ 產出不含假 import（`@/lib/extensions/actions`、`@/lib/workflows/transitions`）
6. ✅ **產出程式碼通過 `tsc --noEmit`** ← 這是 Sprint 10 Phase 1 漏的驗證

### 5. 新增 `tsconfig.test-compiler.json`
- 從 `tsconfig.json` 繼承但**不排除 `_compiled/`**
- 專門給整合測試的 typecheck 步驟用

---

## 📊 驗證結果

| Gate | 結果 |
|---|---|
| Gate 2: `pnpm typecheck` | ✅ 全綠 |
| Gate 3: `pnpm vitest run` | ✅ 783 tests / 57 files（+6 新測試） |
| Gate 3: `lib/compiler` | ✅ 84 tests / 4 files |

---

## 🔍 揭露的事實

### Phase 2 揭露的 bug 其實不是 bug

| Bug | 真相 |
|---|---|
| Schema 丟失 | **False alarm** — schema 在 POST handler 內完整保留，是 tsconfig `_compiled/` 排除的問題 |
| `ctx.params` Promise wrap | **早已正確** — Sprint 9 就是 `Promise<{ id: string }>`，compiler 已對齊 |
| hook 引用錯誤 | **真實 bug** — 修了 |
| 假 import | **真實 bug** — 修了 |

**實際需要修的只有 2 個 bug**（hook 引用 + 假 import），不是 Phase 2 盤點的 6 個。

### Sprint 10 Phase 2 typecheck 看到的錯誤全是 false alarm
原因：Phase 2 期間我**剛加 `tsconfig.json` 排除 `_compiled/`**，但 `beforeAll` 仍寫進去。後續 typecheck 是乾淨的。

但 Sprint 10 的「Bug 1 schema 丟失」其實是 stale code — 後來跑就沒事。

---

## 📋 Sprint 11 剩餘 Phase

### Phase A 剩
- ✅ TECH-018 修 schema 丟失（無需修）+ 假 import
- ✅ TECH-019 修 hook 引用錯誤
- ✅ TECH-020 ctx.params wrap（已正確）
- ✅ TECH-021 typecheck 通過

### Phase B 部分
- [ ] TECH-022 Disable Guard 自動注入（2 SP）

### Phase B 完整
- [ ] TECH-023 Sidebar 自動加 nav item（2 SP）— 留 Sprint 12
- [ ] TECH-024 Workflow transition button（3 SP）— 留 Sprint 12

### Phase C
- [ ] TECH-025~027 4 個 extension 遷移（6 SP）— 留 Sprint 12-13

---

## 🎓 教訓

1. **Phase 2 bug 盤點要驗證再相信**：當時看到「Cannot find name BlogPostCreateSchema」就當真，沒驗證「產出程式碼實際內容」
2. **tsconfig 排除目錄的副作用**：`_compiled/` 被排除導致 typecheck 看不到真實 bug，但 vitest 內 typecheck 跑得到
3. **整合測試要包含 typecheck**：compiler pipeline 必須驗證「產出能運行」，不能只驗證「產出程式碼 string 長度」
4. **bug 盤點要寫實際驗證測試**：Sprint 10 Phase 2 寫 diff report 但沒寫 automated test，這次補上

---

## 🚀 下一步

繼續 Phase A → Phase B 部分：
- TECH-022：JsonSpec 加 `requiresExtension` → compiler 自動注入 `guardExtensionApi`

然後 Sprint 11 完成。
