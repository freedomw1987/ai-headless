# Sprint 24 Reflection — UI 條件渲染動態版

> **Sprint**: 24
> **User Story**: US-102-P2 Q6 漸進式遷移第 4 步
> **日期**: 2026-08-26
> **狀態**: ✅ **100% 收尾（2/2 SP）**
> **PRD**: [docs/prd/09-rbac.md §12.4 Q6](../prd/09-rbac.md)

---

## 🎯 Sprint 目標

依 PRD §12.4 Q6 漸進式遷移路線圖第 4 步：

> **Sprint 24**: UI 條件渲染（`hasPermission` → `hasDynamicPermission`）

---

## 📊 最終數據

| 項目 | 數據 |
|---|---|
| **總 SP** | **2 / 2**（100%）|
| **Commits** | 1 個 + 1 docs = 2 個 push |
| **新增檔案** | 2 個（ui-permissions.ts + test）|
| **修改檔案** | 3 個（auth.ts + page.tsx + sidebar.tsx）|
| **新增測試** | **11 個純函數測試** |
| **測試基線** | 1031 → **1042 通過**（+11 新測試）|
| **4 Gate 全綠** | ✅ |

---

## 📅 Sprint 24 執行紀錄

| Day | 計劃 | 實際 | 狀態 |
|---|---|---|---|
| Day 1 | Plan Gate (Q1-Q4) | ✅ Q1: 範圍 / Q2: 元件類型 / Q3: Wildcard / Q4: 測試 | ✅ |
| Day 2 | commit 1: ui-permissions.ts + 2 UI 點遷移 + 11 個測試 | ✅ 一氣呵成 | ✅ |
| Day 3 | Sprint 24 reflection（本檔）| ✅ | ✅ |

---

## 🎯 Plan Gate 決議

| Q# | 問題 | 決策 |
|---|---|---|
| Q1 | 動態化範圍 | **A**：完整動態化 2 個 UI 點（page.tsx + sidebar.tsx）|
| Q2 | 元件類型 | **A**：`lib/auth/ui-permissions.ts` server helper + client hook |
| Q3 | Wildcard | **A**：UI helper 自動處理（與 hasDynamicPermission 一致）|
| Q4 | 測試 | **A**：純函數 helper 測試 + 手動驗證 |

---

## 🏗️ 核心技術成果

### 新增 helper

```typescript
// lib/auth/ui-permissions.ts

// 純函數: server/client 通用
hasUIPermission(permissions: string[] | null | undefined, code: string): boolean {
  if (!permissions || permissions.length === 0) return false;
  if (permissions.includes('*')) return true;  // admin wildcard
  return permissions.includes(code);
}

// Client hook: Auth.js useSession + hasUIPermission
useHasUIPermission(code: string): boolean {
  const { data: session } = useSession();
  return hasUIPermission(session?.user?.permissions, code);
}
```

### UI 遷移對照表

| 檔案 | Sprint 24 前 | Sprint 24 後 |
|---|---|---|
| `app/admin/crud/[spec]/page.tsx` | `hasPermission(session.user.role, 'user.manage')` | `hasUIPermission(session.user.permissions, 'users:assign')` |
| `app/admin/admin-sidebar.tsx` | `user.role === 'admin'` | `hasUIPermission(user.permissions, 'roles:write')` |

---

## 🎯 端到端驗證

| 場景 | 結果 |
|---|---|
| admin 訪問 /admin/crud/blog | ✅ HTTP 200 + 進入 |
| editor 訪問 /admin/crud/blog | ✅ HTTP 200 + 顯示「權限不足」 |
| admin 訪問 /admin（sidebar） | ✅ Roles 入口顯示 |
| editor 訪問 /admin（sidebar）| ✅ Roles 入口隱藏 |
| admin session | ✅ 24 permissions 含 `*` |
| editor session | ✅ `['users:read']` |

---

## 🔍 Quick Audit: `hasPermission` 純函式剩餘使用點

Sprint 25 強制清前先盤點：

| # | 檔案 | 行數 | 用途 | Sprint 25 遷移策略 |
|---|---|---|---|---|
| 1 | `lib/auth/auth.ts:59` | 函式本體 | `hasPermission` 定義 | 🗑️ 整個函式刪除 |
| 2 | `lib/auth/auth.ts:76,80,136,152` | 內部使用 | `hasAnyPermission` / `hasAllPermissions` / `checkPermission` / `requirePermission` | 🔄 重構成 `hasDynamicPermission` |
| 3 | `lib/auth/rbac.ts:10` | re-export | 提供 `@/lib/auth/rbac` 入口 | 🗑️ 整個檔案可刪（需檢查所有 import） |
| 4 | `lib/runtime/dynamic-handler.ts:153-154` | 內部使用 | `checkPermission(ctx.user.role, ...)` | 🔄 改用 `hasDynamicPermission` |

**結論**：Sprint 25 工作明確，需：
1. `lib/auth/auth.ts`：刪除 `hasPermission` + 重構 4 個內部使用
2. `lib/auth/rbac.ts`：刪除整個檔案
3. `lib/runtime/dynamic-handler.ts`：改用 `hasDynamicPermission`
4. 既有測試 `lib/auth/auth.test.ts`：14 個純函式測試 — 需更新或刪除
5. `tests/integration/tech-032-dynamic-handler.test.ts` 等：用純函式的測試需更新

---

## 🎓 關鍵學習

### L9：UI 條件渲染的 Server/Client helper 雙軌設計

**為什麼不用單一 component**：
- 兩個 UI 點一個是 Server Component（page.tsx），一個是 Client Component（sidebar.tsx）
- Server Component 不能用 `useSession()`（hooks）
- Client Component 不能用 `await auth()`（async server function）
- **單一 component 強行統一會破壞 Next.js 渲染模型**

**設計**：
- Server：`hasUIPermission(perms, code)` 純函數 + `await auth()`
- Client：`useHasUIPermission(code)` hook + `useSession()`

兩者共用同一純函數邏輯，確保行為一致。

### L10：Wildcard 處理在 helper 層自動展開

**決策**：使用端不需要知道 wildcard 存在。

理由：
- 與 `hasDynamicPermission` 邏輯一致
- 減少使用端重複 `permissions.includes('*') || permissions.includes(code)`
- 維護只改一個地方

### L11：向下相容「無 permissions 的舊 JWT」

測試「session 結構模擬: 舊 JWT 沒有 permissions 欄位」揭示：
- 升級部署時，舊 JWT 仍存在（沒過期），但無 permissions 欄位
- `hasUIPermission(undefined, code)` 返回 false → 視為無權限
- **安全性**：強制重新登入拿新 JWT（失效舊 session）
- **使用者體驗**：sessions 在 60s 後自動刷新（jwt callback 會注入新 permissions）

---

## 📈 Phase 2 RBAC 漸進式遷移完成度

| Sprint | 任務 | 狀態 |
|---|---|---|
| Sprint 21-23 | 後端 + Schema + 中間層 + Extension permissions | ✅ 100% |
| **Sprint 24** | **UI 條件渲染動態版** | **✅ 100%（本 sprint）** |
| Sprint 25 | 刪除 `hasPermission` 純函式（強制清） | 📋 Ready (~1 SP) |

**Phase 2 RBAC 路線圖進度**：10/11 完成（剩 Sprint 25 強制清）。

---

## 🏆 Sprint 24 收尾確認

- ✅ **2/2 SP**（100%）
- ✅ **2 個 UI 點** 動態化完成
- ✅ **`lib/auth/ui-permissions.ts`** 新 helper 建立
- ✅ **11 個純函數測試** 全綠
- ✅ **1042/1042 測試全綠**
- ✅ **4 Gate 全綠**
- ✅ **Quick audit 完成**（Sprint 25 強制清準備）

**Sprint 24 正式結束。可進入 Sprint 25。**

---

**Reflection 作者**: AI Assistant
**Reviewer**: AI Assistant（Gate 4 self-check）
**日期**: 2026-08-26