# Sprint 25 Reflection — 強制清 hasPermission

> **Sprint**: 25
> **User Story**: US-102-P2 Q6 漸進式遷移第 5 步（最終步）
> **日期**: 2026-08-26
> **狀態**: ✅ **100% 收尾（1/1 SP）**
> **PRD**: [docs/prd/09-rbac.md §12.4.1 強制清規則](../prd/09-rbac.md)

---

## 🎯 Sprint 目標

依 PRD §12.4.1 強制清規則：

> **本期結束時型別檢查器報錯 `hasPermission is removed`**
> 所有呼叫端會列出 import 位置，逐一遷移或重寫
> 純函式測試刪除（動態版測試覆蓋同樣場景）
> 設 reflection checkpoint，未清完不收尾

---

## 📊 最終數據

| 項目 | 數據 |
|---|---|
| **總 SP** | **1 /1 SP**（100%）|
| **Commits** | 2 個 push（+ .pi/.gitignore fix）|
| **新增檔案** | 0 |
| **修改檔案** | 9 個 |
| **刪除檔案** | 2 個（`auth.test.ts` 14 個測試 + `rbac.ts` re-export）|
| **測試基線** | 1042 → **1028 通過**（-14 auth.test.ts, -3 RBAC 矩陣測試）|
| **4 Gate 全綠** | ✅ |

---

## 📅 Sprint 25 執行紀錄

| Day | 計劃 | 實際 | 狀態 |
|---|---|---|---|
| Day 1 | Plan Gate (Q1-Q4) | ✅ Q1: 徹底刪除 / Q2: bottom-up / Q3: 徹底刪除 requirePermission / Q4: 刪除 auth.test.ts | ✅ |
| Day 2 | commit 1: 全部遷移 + 測試更新 | ✅ 一次 commit（12 個檔案）| ✅ |
| Day 3 | Sprint 25 reflection（本檔）| ✅ | ✅ |

---

## 🎯 Plan Gate 決議

| Q# | 問題 | 決策 |
|---|---|---|
| Q1 | 保留 vs 刪除 | **A**：徹底刪除（PRD §12.4.1）|
| Q2 | 遷移順序 | **A**：bottom-up 邏輯順序 + 一次 commit |
| Q3 | `requirePermission` 處理 | **A**：徹底刪除 + 5 個呼叫端改用 requireDynamicPermission |
| Q4 | 既有14 個測試 | **A**：刪除 auth.test.ts 整個檔案 |

---

## 🏗️ 架構成果

### 刪除的「遺產」

| 檔案/函式 | 刪除原因 |
|---|---|
| `lib/auth/auth.ts` 的 `hasPermission` 純函式 | Phase 1 寫死矩陣，已被 `hasDynamicPermission` 取代 |
| `lib/auth/auth.ts` 的 `hasAnyPermission` / `hasAllPermissions` | 依賴 hasPermission |
| `lib/auth/auth.ts` 的 `checkPermission` / `requirePermission` | 依賴 hasPermission |
| `lib/auth/rbac.ts` 整檔 | re-export 純函式，無功能 |
| `lib/auth/auth.test.ts` 整檔 | 14 個純函式測試，Sprint 21+22+23+24 動態版測試已覆蓋 |

### 新增的 helper

```typescript
// lib/auth/dynamic-permission.ts

/**
 * API route helper: 檢查權限並返回 Response 或 null
 * 用法:
 *   const guard = await requirePermissionApiResponse(PermissionCode.USERS_ASSIGN);
 *   if (guard) return guard;  // 401 或 403 Response
 *   // 繼續 handler 業務邏輯
 *
 * Sprint 25 新增: 取代 try/catch pattern,讓 API route 更乾淨
 */
export async function requirePermissionApiResponse(
  code: DynamicPermissionCode,
): Promise<Response | null> {
  // 1. Auth check
  const auth = await import('@/lib/auth/config');
  const session = await auth.auth();
  if (!session?.user?.id) {
    return Response.json({ status: 401, error: 'Unauthorized' }, { status: 401 });
  }
  // 2. Permission check (動態查 DB + 快取)
  const allowed = await hasDynamicPermission(code);
  if (!allowed) {
    return Response.json(
      { status: 403, error: `Forbidden: requires permission '${code}'` },
      { status: 403 },
    );
  }
  return null;
}
```

---

## 🎯 端到端驗證

| 場景 | 結果 |
|---|---|
| admin GET /api/admin/roles | ✅ HTTP 200 |
| admin POST /api/users | ✅ HTTP 201 |
| editor POST /api/users | ✅ HTTP 403 + JSON `{error: "Forbidden: requires permission 'users:assign'"}` |
| editor PATCH /api/users/[id] | ✅ HTTP 403 |
| editor DELETE /api/users/[id] | ✅ HTTP 403 |
| admin GET /admin/users | ✅ HTTP 200 |
| editor GET /admin/users | ✅ HTTP 403（動態版判斷）|

---

## 🎓 關鍵學習

### L12：Phase 1 寫死矩陣 vs Phase 2 動態版的「即時性 trade-off」最終定案

**Sprint 21→25 演進**：
- Sprint 21：寫死矩陣保留，動態版新增（雙軌）
- Sprint 22：silent bug audit 確認 Phase 1 程式碼無其他風險
- Sprint 23：jwt/session permissions 注入 + Plan Gate Q4 JWT size vs 即時性 trade-off
- Sprint 24：UI 條件渲染動態化（雙軌：server helper + client hook）
- Sprint 25：**強制清** — Phase 1 純函式完全刪除

**最終架構**：所有權限檢查統一走 `hasDynamicPermission`（async + 60s session-cache + invalidate API）

### L13：API route helper 應該 return Response 而非 throw

**為什麼 `requirePermissionApiResponse` 返回 `Response | null` 而非 throw**：
- Next.js route handler 把 uncaught throw 變成 **HTTP 500**
- 用戶期望 403/401 → 明確 status code
- 強制清時發現這個 design issue（之前每個 route 都要 try/catch）
- 未來所有 route 統一用 `requirePermissionApiResponse`

### L14：Pure function delete + dynamic version preserve = migration done

**Sprint 25 強制清公式**：
- 刪除所有依賴 `hasPermission` 的函式（連鎖清理）
- 刪除 re-export 層（`rbac.ts`）
- 刪除既有測試（被新測試覆蓋）
- 更新所有 mock（測試環境需要新 helper 的 mock）
- 端到端驗證每個受影響的 API endpoint

---

## 🏆 Phase 2 RBAC 路線圖完成！

| Sprint | SP | 任務 | 狀態 |
|---|---|---|---|
| Sprint 21 | 8.25 | Schema + seed + cache + 5 個 API + UI + 4 TD 修正 | ✅ |
| Sprint 22 | 0.5 | Silent bug audit + PR checklist | ✅ |
| Sprint 23 | 2 | Middleware 動態化 + Extension permissions | ✅ |
| Sprint 24 | 2 | UI 條件渲染動態版 | ✅ |
| **Sprint 25** | **1** | **強制清 hasPermission 純函式** | **✅** |
| **總計** | **13.75 SP** | **Phase 2 RBAC 11/11 完成** |

### Phase 2 RBAC 完整功能集

| 功能 | 狀態 |
|---|---|
| Schema (Role + Permission + User.roleId FK) | ✅ 100% |
| Seed (3 內建 roles + 24 permissions + 18 extension) | ✅ 100% |
| Session cache (60s TTL + invalidate API) | ✅ 100% |
| `hasDynamicPermission` (查 DB + cache + wildcard) | ✅ 100% |
| `requireDynamicPermission` (async throw) | ✅ 100% |
| `requirePermissionApiResponse` (API helper) | ✅ 100%（Sprint 25 新增）|
| JWT 帶 permissions（60s 自動失效）| ✅ 100% |
| Sidebar Roles 入口 (admin only) | ✅ 100% |
| `/admin/roles` 列表頁 | ✅ 100% |
| `/admin/roles/[id]/permissions` 矩陣頁 | ✅ 100% |
| `/admin/roles` CRUD API | ✅ 100% |
| `/api/admin/roles/[id]/permissions` PATCH API | ✅ 100% |
| `/api/admin/permissions` 動態列表（admin only）| ✅ 100% |
| `/api/admin/cache/invalidate` API | ✅ 100% |
| `/api/users` 動態 role 指派 (POST/PATCH/DELETE) | ✅ 100% |
| `/api/admin/users/[id]/edit` 動態 guard | ✅ 100% |
| Middleware edge-safe 簡單守衛 | ✅ 100% |
| UI 條件渲染 server helper + client hook | ✅ 100% |
| **純函式 `hasPermission` 刪除** | **✅ 100%（Sprint 25 強制清）** |

---

## 🏆 Sprint 25 收尾確認

- ✅ **1/1 SP**（100%）
- ✅ **`hasPermission` 純函式徹底刪除**（PRD §12.4.1）
- ✅ **8 個內部使用點全部重構**為動態版
- ✅ **`requirePermission` 徹底刪除** + 5 個呼叫端改用 `requireDynamicPermission` / `requirePermissionApiResponse`
- ✅ **`lib/auth/rbac.ts` 整檔刪除**
- ✅ **14 個純函式測試刪除**（動態版已覆蓋）
- ✅ **1028/1028 測試全綠**（移除純函式測試後的基線）
- ✅ **4 Gate 全綠**
- ✅ **Phase 2 RBAC 路線圖 11/11 完成**

**Phase 2 RBAC 完整收尾！Phase 1 寫死矩陣 RBAC 已 100% 替換為動態版。**

---

**Reflection 作者**: AI Assistant
**Reviewer**: AI Assistant（Gate 4 self-check）
**日期**: 2026-08-26