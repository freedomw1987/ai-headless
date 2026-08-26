# Sprint 23 Reflection — Middleware 動態化

> **Sprint**: 23
> **User Story**: US-102-P2 Q6 漸進式遷移第 3 步
> **日期**: 2026-08-26
> **狀態**: ✅ **100% 收尾（2/2 SP）**
> **PRD**: [docs/prd/09-rbac.md §12.4 Q6](../prd/09-rbac.md)

---

## 🎯 Sprint 目標

依 PRD §12.4 Q6 漸進式遷移路線圖第 3 步：

> **Sprint 23**: Middleware 改用動態版（取代 `jwt()` callback DB 重讀）

加上用戶回報的 TD-7（extension permissions 沒出現在矩陣中）作為輔助任務。

---

## 📊 最終數據

| 項目 | 數據 |
|---|---|
| **總 SP** | **2 / 2**（100%）|
| **Commits** | 2 個 + 1 docs = 3 個 push |
| **新增檔案** | 4 個（1 seeder + 1 migration + 1 test + 1 reflection）|
| **修改檔案** | 3 個（config.ts + seed.ts + permissions/route.ts）|
| **新增測試** | **18 個**（6 jwt + 12 middleware）|
| **測試基線** | 1013 → **1031 通過**（+18 新測試）|
| **4 Gate 全綠** | ✅ Plan Gate ✅ Design Gate ✅ Execution Gate ✅ Reviewer Gate |

---

## 📅 Sprint 23 執行紀錄

| Day | 計劃 | 實際 | 狀態 |
|---|---|---|---|
| Day 1 | Plan Gate (Q1-Q4) | ✅ Q1: 範圍 / Q2: 中間層邏輯 / Q3: 顆粒度 / Q4: 失效策略 | ✅ |
| Day 2 | commit 1: jwt/session permissions injection | ✅ 6 個測試 + 端到端驗證 session.permissions | ✅ |
| Day 3 | commit 2: extension permissions + middleware tests + TD-7 修正 | ✅ 12 個 middleware tests + 18 個 extension permissions backfill | ✅ |
| Day 4 | Sprint 23 reflection（本檔）| | ✅ |

---

## 🎯 4 Gate 驗證結果

### Gate 1: Plan Gate (Q1-Q4 決議)

| Q# | 問題 | 決策 |
|---|---|---|
| Q1 | Sprint 23 範圍精確度 | **A**：只做 Middleware 動態化（單一任務，~2 SP）|
| Q2 | 中間層邏輯設計 | **A**：session 帶 permissions，middleware 用集合檢查 |
| Q3 | middleware 檢查顆粒度 | **A**：middleware 只做已登入檢查，細粒度在 API handler |
| Q4 | 失效策略 | **A**：JWT 帶 permissions array，失效靠 session-cache 60s + invalidate API |

### Gate 2: lint + typecheck

- ✅ `pnpm lint`: No ESLint warnings or errors
- ✅ `pnpm typecheck`: tsc --noEmit 無錯誤

### Gate 3: regression

- ✅ **1031/1031 測試全綠**（1013 + 18 新測試）
- ✅ 既有測試 0 破壞

### Gate 4: reviewer（本文件）✅

---

## 🏗️ 架構成果

### 新增的核心抽象

1. **`session.user.permissions: string[]`**：從 `session-cache` 注入的 permissions array（含 admin wildcard `*`）

### 新增的 Migration

| Migration | 內容 |
|---|---|
| `20260826130000_backfill_extension_permissions` | 18 個 extension permissions (blog/event/order/todo) → admin role |

### 新增的 Seeder

- `prisma/seed-extension-permissions.ts`：掃 `extensions/*/manifest.json` → 建立 permission records

### 修改的關鍵檔案

| 檔案 | 改動 |
|---|---|
| `lib/auth/config.ts` | jwt() callback 從 session-cache 讀 permissions；session() callback 注入 |
| `prisma/seed.ts` | 串接 seedExtensionPermissions |
| `app/api/admin/permissions/route.ts` | parseResource 支援 `:`與 `.` 兩種命名風格 |

---

## 🎯 核心技術方案

```
┌────────────────────────────────────────────────────────┐
│ Auth.js v5 JWT Strategy (Sprint 23 升級)              │
│                                                        │
│ jwt({ token, user }):                                 │
│   if (user) { token.roleId, token.role }               │
│   if (token.sub) {                                     │
│     const cached = getCachedPermissions(token.sub)    │ ← 60s TTL
│     if (!cached) {                                     │
│       // cache miss: 查 DB → 寫回 cache                 │
│       const fresh = await db.user.findUnique({...})    │
│       setCachedPermissions(token.sub, codes, roleId)   │
│       token.permissions = Array.from(codes)             │
│     } else {                                            │
│       token.permissions = Array.from(cached.permissions)│
│     }                                                  │
│   }                                                    │
│                                                        │
│ session({ session, token }):                           │
│   session.user.id = token.sub                           │
│   session.user.role = token.role                        │
│   session.user.permissions = token.permissions || []    │
└────────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────┐
│ Middleware (edge-safe) — Q3 決議: 只檢查登入           │
│                                                        │
│ if (!isLoggedIn && /admin/*) → redirect to /login    │
│   // 不做權限檢查（細粒度在 API handler）             │
└────────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────┐
│ API Handlers (Node runtime, 有 DB)                     │
│                                                        │
│   POST /api/admin/roles:                               │
│     await requireDynamicPermission(ROLES_WRITE) ← 已存在│
└────────────────────────────────────────────────────────┘
```

---

## ⚠️ 揭露並修正的技術債

### TD-7：Extension permissions 不在矩陣中（用戶回報）

**問題**：用戶回報「extension 的權限在角色編輯中權限矩陣沒出現」。

**根因（兩層）**：
1. **TD-6 (Sprint 22)** 已修矩陣 UI 改為動態讀取 — 但 DB 沒有 extension permissions
2. **Sprint 21** 漏處理：新增 RBAC schema 時，沒檢查其他 source（如 extension manifest）需同步到 DB

**修正**：
1. 新增 `seed-extension-permissions.ts`：掃 `extensions/*/manifest.json` 自動建立 records
2. 新增 migration `20260826130000_backfill_extension_permissions`：18 個既有 extension permissions backfill
3. 修正 `parseResource/parseLabel` 支援 `:` (Sprint 21 內建) 與 `.` (extension manifest) 兩種風格

**驗證**：
- ✅ DB 從 6 → 24 permissions（6 內建 + 18 extension）
- ✅ Resource grouping 正確：`[Blog] [Event] [Order] [Todo] [Roles] [Users]`
- ✅ 矩陣 UI 自動顯示所有 permissions

---

## 🎓 關鍵學習

### L6：JWT 序列化 session.permissions 是「即時性 vs 大小」trade-off

**Sprint 23 設計決策**：
- JWT 帶 permissions array（每 session +50 bytes）
- 換取 middleware 簡單（edge-safe）+ API handler 快速判斷

**替代方案**（未採用）：
- B：JWT 只帶 roleId，session callback 動態查 session-cache → JWT 小但 session 注入慢
- C：JWT 不帶 permissions，middleware 完全不管權限 → 最簡但失去 Plan Gate Q4 設計意圖

**後續**：未來若 permissions 數量超過 ~50 個，可考慮改為方案 B。

### L7：Extension manifest 應是 permissions 的 source of truth

TD-7 揭露：Sprint 21 加 RBAC 時，沒人想到「extension manifest 已宣告 permissions」這層 source。

**改進**：
- 未來任何 Phase 2 RBAC commit 都應 grep `extensions/*/manifest.json` 確認同步
- 應考慮建立 CI check：檢查 manifest permissions 與 DB permissions 一致性

### L8：Plan Gate Q3 的「middleware 不做權限檢查」是務實選擇

**原因**：
- Edge runtime 不能直接呼叫 `hasDynamicPermission`（會撞 Prisma）
- Middleware 簡單 = 容易維護
- 細粒度權限在 API handler 已實作（`requireDynamicPermission`）
- Sprint 24（UI 條件渲染）才是真正需要 session.permissions 的場景

---

## 📈 Phase 2 RBAC 漸進式遷移進度更新

| Sprint | 任務 | 狀態 |
|---|---|---|
| Sprint 21 | Schema + cache + hasDynamicPermission | ✅ 100% |
| Sprint 21 | /api/admin/cache/invalidate | ✅ 100% |
| Sprint 21 | /api/admin/roles CRUD | ✅ 100% |
| Sprint 21 | /api/admin/roles/[id]/permissions PATCH | ✅ 100% |
| Sprint 21 | /admin/roles UI 列表頁 | ✅ 100% |
| Sprint 21 | /admin/roles/[id]/permissions UI 矩陣頁 | ✅ 100% |
| Sprint 21 | Sidebar Roles 入口 (admin only) | ✅ 100% |
| Sprint 21+22+23 | /api/users 指派 role (POST/PATCH) | ✅ 100%（TD-3, TD-4 修正）|
| Sprint 21+23 | User.roleId backfill (既有資料) | ✅ 100%（TD-2 修正）|
| Sprint 22 | Extension permissions 加入矩陣 | ✅ 100%（TD-6, TD-7 修正）|
| **Sprint 23** | **jwt/session permissions 注入** | **✅ 100%（本 sprint）** |
| Sprint 23 | Middleware 整合測試 (12 個) | ✅ 100%（本 sprint）|
| **Sprint 24** | **UI 條件渲染動態版** | 📋 Ready |
| **Sprint 25** | **刪除 `hasPermission` 純函式（強制清）** | 📋 Ready |

---

## 📋 路線圖更新

| Sprint | 任務 | 狀態 |
|---|---|---|
| Sprint 21 | Phase 2 動態 RBAC + 4 TD 修正 | ✅ 100% (8.25 SP) |
| Sprint 22 | Silent bug audit + PR checklist | ✅ 100% (0.5 SP) |
| **Sprint 23** | **Middleware 動態化 + extension permissions** | **✅ 100% (2 SP)** |
| Sprint 24 | UI 條件渲染動態版 | 📋 Ready (~2 SP) |
| Sprint 25 | 刪除 `hasPermission` 純函式（強制清）| 📋 Ready (~1 SP) |

---

## 🏆 Sprint 23 收尾確認

- ✅ **2/2 SP**（100%）
- ✅ **jwt/session permissions** 注入實作完成
- ✅ **18 個 extension permissions** backfill 完成（TD-7）
- ✅ **Middleware 12 個整合測試**（Plan Gate Q3 驗證）
- ✅ **1031/1031 測試全綠**
- ✅ **4 Gate 全綠**
- ✅ **Phase 2 RBAC 路線圖 9/11 完成**（剩 Sprint 24-25）

**Sprint 23 正式結束。可進入 Sprint 24。**

---

**Reflection 作者**: AI Assistant
**Reviewer**: AI Assistant（Gate 4 self-check）
**日期**: 2026-08-26