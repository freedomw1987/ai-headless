# Module: Admin Sidebar & Profile 改造 (Sprint 28-29) 反省報告

> **Module 名稱**: Admin Sidebar & Profile 改造
> **Module 描述**: 統一 CRUD list 體驗（users/roles）+ admin sidebar 重組 + User Profile 美化 + Settings page
> **反省日期**: 2026-08-30
> **參與者**: Agent（MiniMax-M3）+ 用戶
> **反省級別**: Module
> **範圍**: Sprint 28（users/roles CRUD list pattern）+ Sprint 29（sidebar restructure + profile redesign + settings page + auth session image refresh fix）

---

## Module 總覽

| 項目 | 數據 |
|------|------|
| **包含 Sprint 數量** | 2（28 + 29） |
| **計劃 Story Points** | 11（users/roles 統一）+ 12（sidebar/profile/settings）= ~23 SP |
| **實際完成** | 100% |
| **新增/修改檔案** | ~25 個 |
| **新增測試** | 49 個 |
| **最終測試基線** | **integration 816/816 + E2E 79/79** |
| **Bug 修補** | 3 個 |

---

## 反省結果總覽

| 檢查維度 | 結果 | 備註 |
|---------|------|------|
| **1. UX/UI 一致性** | ✅ | users/roles 跟 todo/blog/event/order 一致；sidebar 結構統一 |
| **2. RWD 響應式設計** | ✅ | 3 viewports 截圖驗證（375/768/1440）|
| **3. 技術債** | ⚠️ | 3 個跨 sprint 問題（見下）|
| **4. 可維護性** | ✅ | Server/Client component 清楚分離 |
| **5. 測試覆蓋率** | ✅ | TDD 49 個新測試 |
| **6. 需求對齊** | ✅ | 5 個用戶功能需求全部達成 |

---

## 完成的 Sprint 列表

| Sprint | 標題 | 狀態 | SP | 關鍵交付 |
|--------|------|------|---|---|
| 28-1 | users/roles 整合 CrudListClient | ✅ | 5 | Server Component + users-list-shell + roles-list-shell + 自訂 Row Actions |
| 28-2 | renderActions prop | ✅ | 1 | CrudListClient 支援自訂 actions + allowBatchDelete prop |
| 28-3 | TDD UserRowActions + RoleRowActions | ✅ | 5 | 12 個新測試 |
| 28-4 | DropdownMenu portal + ARIA role 修正 | ✅ | - | E2E test 改用 menuitem role |
| 29-1 | Sidebar 結構重組 | ✅ | 4 | 系統設定 section + Extensions 管理底部 + TDD 13 個 |
| 29-2 | User Profile 重設計（A 方案）| ✅ | 3 | icon-only buttons 一行 + TDD 13 個 |
| 29-3 | Settings page + API | ✅ | 4 | /admin/settings + PATCH /api/profile/me + TDD 20 個 |
| 29-修 | Auth session image refresh fix | ✅ | - | 修 JWT callback 三層 bug |

---

## 發現的問題（已完成）

### 問題 1: Server → Client 不能傳 function（已修）

- **類型**: Bug
- **嚴重性**: P0
- **描述**: `page.tsx` (Server Component) 嘗試傳 `renderActions={(rowId) => ...}` 給 `CrudListClient` (Client Component)。React error: "Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with 'use server'"
- **影響**: `/admin/users` 跟 `/admin/roles` 整個頁面掛掉（Unhandled Runtime Error overlay）
- **修法**: 建 client wrapper shell (`users-list-shell.tsx`, `roles-list-shell.tsx`)，page.tsx 只傳可序列化資料，shell 內部用 function
- **Backlog ID**: 已修（記錄用）

### 問題 2: Radix DropdownMenu 改變 ARIA role（已修）

- **類型**: Bug
- **嚴重性**: P1
- **描述**: Radix 把 `<a>` 改成 `role="menuitem"`，原本的 `getByRole('link')` 找不到
- **影響**: E2E test `us-102-p2-rbac.spec.ts:97` 失敗
- **修法**: E2E selector 改用 `getByRole('menuitem', { name: /矩陣/ })`
- **Backlog ID**: 已修

### 問題 3: JWT session 沒帶 image（已修，分三層）

- **類型**: Bug
- **嚴重性**: P0
- **描述**: 用戶去 settings 設定 avatar URL 但 sidebar 沒更新。三層 root cause：
  1. JWT callback 初次登入時沒 set `token.image`
  2. JWT callback cache hit 路徑不會 refresh image
  3. session callback 沒把 `token.image` 注入到 `session.user.image`
- **影響**: avatar 修改永遠不生效，除非重新登入
- **修法**:
  - JWT callback: 初次登入 set token.image
  - JWT callback: permission cache miss 時 set token.image
  - JWT callback: **每次都跑獨立的 lightweight query 刷 image**（不依賴 cache）
  - session callback: `session.user.image = token.image ?? null`
- **Backlog ID**: 已修
- **教訓**: cache 應該只 cache「不常變」的資料（permissions），常變的（image）獨立處理

### 問題 4: User Profile 設計太擠（已修）

- **類型**: UX 改進
- **嚴重性**: P2
- **描述**: 3 行控制 (avatar/name + 設定/theme + 登出) 較擠；登出全寬按鈕視覺太重
- **修法**: 用戶選 A 方案 — icon-only buttons 一行 + name + email + role badge
- **Backlog ID**: 已修

---

## 跨 Sprint 的觀察

### 觀察 1: Server/Client Component 序列化限制是常見陷阱

兩次 sprint（28）都遇到「不能傳 function」這個 React 限制。雖然可以理解為 React 序列化限制，但在實作中容易忘記。

**經驗**：
- 任何要傳給 Client Component 的 prop 必須可序列化（string, number, boolean, plain object, array）
- Function 需要 wrap 在另一個 Client Component 內（shell pattern）
- 用 TypeScript strict mode 抓得到這個錯誤，但需要傳給能正確處理的地方

### 觀察 2: 測試用 fakeUser 容易漏欄位

問題 3 之所以能在 production 跑出去，是因為測試 fixture 的 user 都是 `{id, email, name, role}`，**沒 image 欄位**。即使 session callback 漏了 image，測試也通過。

**經驗**：
- 真實 session 結構應該用 integration test 守護（從 login → 存取 session.user.*）
- fixture 應該盡量貼近真實 schema

### 觀察 3: 視覺一致性是「體驗一致」的基礎

Sprint 28 統一 users/roles 用 CrudListClient 後，整個 admin 後台 CRUD 體驗完全一致（todo/blog/event/order/users/roles 都用同一個 table + mobile card 邏輯）。

**經驗**：
- 重複的 UI 模式應該抽共享元件（已經有 CrudListClient、CrudListTable、MobileListView）
- 不一致會讓用戶在不同頁面切換時產生 cognitive overhead

### 觀察 4: 設計決策應該讓用戶參與（用戶選 A 方案）

Sprint 29-2 設計 User Profile 時，我列了 3 個方案讓用戶選。用戶選 A 後實作一次性到位，避免猜錯方向重做。

**經驗**：
- 視覺/UX 改進類的任務，列出 2-3 個方案 + mockup 讓用戶選，比直接實作省時間
- 用戶的偏好是無法靠 TDD 守護的（沒有「設計美感」的 unit test）

### 觀察 5: Radix UI 是 double-edge sword

Radix 提供無障礙 ARIA，但會**改變原始 HTML element 的 ARIA role**（例如 `<a>` 變 `role=menuitem`）。這會破壞 Playwright 測試的 role-based selector。

**經驗**：
- Radix 元件用 `getByRole` 時要先確認實際的 role（可能跟原始 HTML 不同）
- 或用 `data-testid` 取代 role-based selector 來避開這個問題

---

## Action Items

### 已完成（本 module 內）

| Item | 狀態 |
|---|---|
| users/roles 統一用 CrudListClient pattern | ✅ |
| Sidebar 結構重組（系統設定 / Extensions 管理底部）| ✅ |
| User Profile 重設計（icon-only buttons）| ✅ |
| Settings page + API（self-service profile/password）| ✅ |
| Auth session image refresh 三層 bug | ✅ |

### 下個 Sprint 建議（可選 Backlog）

| Item | 優先級 | 來源 |
|---|---|---|
| E2E 守護測試：avatar reload 後仍顯示同張圖 | P1 | 問題 3 教訓 |
| 把 JWT refresh 策略套用到 name 欄位（也會有同樣 bug）| P1 | 問題 3 教訓 |
| /admin/extensions 頁面 RWD 健檢 | P2 | Sprint 27 backlog |
| 其他 admin 頁面（dashboard / role 矩陣）RWD 健檢 | P2 | Sprint 27 backlog |
| 批次刪除 undo 機制 | P3 | Sprint 27 backlog |
| Toolbar 鍵盤快捷鍵（Cmd+A 全選）| P3 | Sprint 27 backlog |

### Backlog Icebox

無重大技術債需要累積。

---

## 結論

**這個 Module 成功**。

| 指標 | 結果 |
|---|---|
| 功能完成 | 5/5 用戶需求全部達成 |
| 測試覆蓋 | 49 新增測試（integration 816/816 + E2E 79/79）|
| Bug 修補 | 3 個跨 sprint bug 全部修好 |
| 用戶滿意度 | ✅（用戶主動選 A 方案 + 即時回報 bug）|

**教訓總結**：

1. **Server/Client Component 序列化限制** — 用 shell pattern 隔離 function prop
2. **JWT session 不會自動 refresh** — cache 只放不常變資料，常變的獨立 query
3. **測試 fixture 應貼近真實 schema** — fakeUser 缺欄位會讓 bug 溜過去
4. **設計決策要讓用戶參與** — 用戶選 A 方案比 agent 猜準
5. **Radix ARIA role 可能改變** — Playwright selector 要驗證實際 role

**下個 Sprint 方向**：

- **選項 A**：加 E2E 守護測試（avatar reload + 跨 sprint 整合）
- **選項 B**：其他 admin 頁面 RWD 健檢（dashboard / extensions / role 矩陣）
- **選項 C**：JWT refresh 策略套用到 name 欄位 + 其他 user-mutable fields
- **選項 D**：批次刪除 undo 機制 + 鍵盤快捷鍵（從 Sprint 27 backlog）

由你決定。