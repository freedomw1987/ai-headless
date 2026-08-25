# Sprint 11 Phase B 反省 — TECH-022 Disable Guard + TD-522 Order manifest

> **Sprint**: Sprint 11 — Compiler 完善（Phase B）
> **反省日期**: 2026-08-25
> **對應 Backlog**: TECH-022 + TD-522

---

## 🎯 Phase B 目標

- **TECH-022** (2 SP)：JsonSpec 加 `requiresExtension` → compiler 自動注入 `guardExtensionApi`
- **TD-522** (0.5 SP)：補 `extensions/order/manifest.json`

---

## ✅ 實際完成

### 1. JsonSpec 加 `requiresExtension?`
```typescript
/**
 * Extension 名稱（如 'blog'），啟用 Disable Guard
 * 設了之後，compiler 生成的 API route 會自動呼叫 `guardExtensionApi(name)`
 */
requiresExtension?: string;
```

### 2. api-generator HEADER_IMPORTS 加 guard import
```typescript
import { guardExtensionApi } from '@/lib/extensions/api-guard';
```

### 3. 加 `extensionGuard(spec)` helper
```typescript
function extensionGuard(spec: JsonSpec): string {
  if (!spec.requiresExtension) return '';
  return `
    const guard = await guardExtensionApi('${spec.requiresExtension}');
    if (guard) return guard;
  `;
}
```

### 4. 每個 handler 開頭注入
- list / read / create / update / delete / action 各加 `${extensionGuard(spec)}` 在 `${permissionCheck(...)}` 之前

### 5. blog-spec.json 加 requiresExtension
```json
"requiresExtension": "blog"
```

### 6. Order manifest.json 補完
```json
{
  "name": "order",
  "version": "1.0.0",
  "label": "訂單管理",
  ...
  "permissions": ["order.create", "order.read", "order.update", "order.delete", "order.transition"]
}
```

---

## 📊 測試覆蓋

### 新增測試（5 tests）
1. `compiler-blog-compile.test.ts`：3 個 TECH-022 測試
   - route.ts 有 2 個 `guardExtensionApi('blog')` 呼叫（GET + POST）
   - `[id]/route.ts` 有 3 個（GET + PATCH + DELETE）
   - `actions/publish/route.ts` 有 1 個
2. `td-522-order-manifest.test.ts`：2 個測試
   - manifest.json 存在
   - manifest.json 含必要欄位

### 修改測試（3 files）
- `disable-guard-api.spec.ts`：Order test `describe.skip` → `describe`（un-skip）
- `disable-guard-sidebar.spec.ts`：3 個 extension → 4 個
- `td-405-extensions-admin-smoke.test.ts`：3 → 4 extensions

---

## 📊 驗證結果

| Gate | 結果 |
|---|---|
| Gate 1: TDD | ✅ 紅→綠（5 個新測試覆蓋兩個功能）|
| Gate 2: `pnpm typecheck` | ✅ 全綠 |
| Gate 3: `pnpm vitest run` | ✅ 788 tests / 58 files |
| Gate 3 E2E: Playwright | ✅ 22 tests passed（含 2 個從 skip 變 pass 的 Order tests）|

---

## 🔍 揭露的細節

### Order 在 `/api/extensions` 顯示後，3 個既有測試自動 fail

**原因**：extensions/order/manifest.json 補完後，`/api/extensions` 從 3 個變 4 個
- ✅ `disable-guard-sidebar.spec.ts`：3 個 → 4 個
- ✅ `td-405-extensions-admin-smoke.test.ts`：3 個 → 4 個
- ✅ `disable-guard-api.spec.ts`：從 skip 變 pass

**教訓**：補完 manifest 是「跨測試影響」，需同步更新所有相關測試的硬編碼數字

### compiler guard 注入策略
- 在 `${permissionCheck(...)}` **之前**注入 → disable 優先於 auth（更嚴格）
- 用 `if (guard) return guard` 模式 → 一致於 Sprint 9 手寫風格
- 沒有 `requiresExtension` 的 spec（其他未來 spec）→ 完全不注入，零影響

---

## 🎓 教訓

1. **TDD 流程順暢**：寫「compiler 產出有 guard」測試 → fail → 改 generator → pass
2. **跨測試影響要快查**：補完一個東西會同時破多個測試，必須 grep 「3 個」「extensions.size」找所有
3. **Order manifest 是低垂果實**：之前覺得 0.5 SP 太小，結果 un-skip 兩個 E2E test，價值遠超 SP 估算
4. **compiler 注入位置很重要**：guard 在 permissionCheck 前是「拒絕服務」安全設計，確保 disable 狀態完全無法存取

---

## 🚀 Sprint 11 完成狀態

| Task | 計劃 | 實際 | 狀態 |
|---|---|---|---|
| TECH-018 假 import + schema | 3 SP | 1 SP | ✅ |
| TECH-019 hook 引用錯誤 | 1 SP | 1 SP | ✅ |
| TECH-020 ctx.params wrap | 1 SP | 0 SP | ✅ 早已正確 |
| TECH-021 typecheck 通過 | 2 SP | 2 SP | ✅ |
| TECH-022 Disable Guard 自動注入 | 2 SP | 2 SP | ✅ |
| TD-522 Order manifest | 0.5 SP | 0.5 SP | ✅ |
| **合計** | **9.5 SP** | **6.5 SP** | **✅ 全完成** |

節省 3 SP（false alarm + 早已正確）

---

## 📋 Sprint 12 規劃（建議）

剩餘項目：
- **TECH-023** Sidebar 自動加 nav item（2 SP）
- **TECH-024** Workflow transition button 自動生成（3 SP）
- **TECH-025~027** Order/Event/Todo schema.json + 4 個 extension 全遷移（6 SP）

Sprint 12 重點：完成「compiler 自動生成 sidebar + workflow button」+ 啟動「4 個 extension schema.json 化」
