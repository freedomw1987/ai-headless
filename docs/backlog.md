# Backlog — ai-headless

> **框架定位**：WordPress 風格的 AI Headless CRUD 框架
> **核心**：單一 JSON 規範 → AI 編譯成可運行系統（前端 + 後端 + DB）
> **可擴展**：底基 + Extension 機制（Extension 也是 AI 生成）

---

## 📑 目錄（TOC）

| Section | 用途 |
|---------|------|
| [📌 當前狀態](#-當前狀態) | 最新 sprint 進度、測試基線、下一個 P0 |
| [📊 Backlog 主表](#-backlog-主表單一表按優先級排序) | P0~P3 + Icebox 全部待辦 item |
| [🗂️ Sprint 進度歷史](#️-sprint-進度歷史高層摘要) | Sprint 1-29 高層摘要 + Reflection 連結 |
| [🏗️ 模組劃分](#️-模組劃分modules) | M0~M6 模組定義 |
| [📝 規範文檔目錄](#-規範文檔目錄核心交付物) | docs/ 內核心交付物索引 |
| [📋 US-102 Phase 2 開工 checklist](#-us-102-phase-2-開工-checklist2026-08-26-sprint-21-開工) | Sprint 21 RBAC 開工細節 |
| [🚀 Sprint 46 Plan Gate](./sprint46-plan-gate.md) | Sprint 46 三主題 Plan Gate 決策與 SP 規劃（22 SP 全包）|
| [📋 Sprint 46 PRD](./prd/10-chat-attachments.md) | 14 章節 PRD：FR/Schema/US/測試/計劃/風險/Plan Gate/Design 交付（22 SP / 7 Stage / 34 FR / 14 風險）|
| [📞 對話記錄](./conversation-log.md) | 用戶 ↔ Agent 重要決策對話（已獨立）|

---

## 📌 當前狀態（2026-09-01）

| 項目 | 數據 |
|------|------|
| **當前 Sprint** | **Sprint 48 Submit Gate ✅（5 commits + 1 hotfix = 6 commits / 2.1 SP 完成，剩 3 SP 帶下 Sprint 49）** |
| **上個 Sprint** | Sprint 47 Plan Gate ✅ + Design Gate ✅ + Execution Gate ✅ + Submit Gate ✅（13.5 SP / 8 commits 100% 完成，1795 → 1881 tests） |
| **Sprint 46 總計** | Commit 1 (3) + Commit 2 (5) + Commit 3 SDK (3) + Commit 4 Markdown (4) + Commit 5 Attachment Reader (3) + Commit 6 Cleanup (1) + Commit 7 E2E (3) = 22 SP ✅ + Bug Fix 4 個 (2.5 SP extra) = 22.5 SP delivered |
| **Sprint 46 Reflection** | ✅ [docs/reflection/sprint-46-reflection.md](./reflection/sprint-46-reflection.md)：6 項發現 (3 P1 + 3 P2)；Sprint 47 全數回應 5/6 |
| **Sprint 47 總計** | Commit 1 (47-0 Spike 2) + Commit 2 (47-1 2) + Commit 3 (47-2 2) + Commit 4 (47-3 2) + Commit 5 (47-4 2) + Commit 6 (47-5 2) + Commit 7 (47-6 1) + Commit 8 (47-7 0.5) = 13.5 SP ✅ |
| **Sprint 47 Reflection** | ✅ [docs/reflection/sprint-47-reflection.md](./reflection/sprint-47-reflection.md)：5 項發現 (2 P1 + 3 P2)；Sprint 46 揭露 5/6 回應 |
| **Sprint 48 總計** | Commit 1 (48-1 Lint 0.5) + Commit 2 (48-2 ChatStatus 0.3) + Commit 3 (48-3 UploadOwnership 0.5) + Commit 4 (48-4 Office Rest Spike 0.5) + Commit 5 (48-5 Office Rest 3 SP) + Hotfix (48-4.1 audit P0 0.3) = **5.1 SP 完成 (Office Rest 已入 Sprint 48)**, 詳見 Sprint 48 Reflection |
| **Sprint 49 總計** | Commit 1 (49-0 UIMessage Spike 0.2) + Commit 2 (49-1 Office Rest Guard 0.3) + Commit 3 (49-2 UIMessage 切斷 0.3) = **0.8 SP 完成** (從 1.0 降到 0.8, spike 刪 dead code) |
| **Sprint 48 Reflection** | ✅ [docs/reflection/sprint-48-reflection.md](./reflection/sprint-48-reflection.md)：mid-review audit 揭露 9 項 (3 P0 + 6 P1/P2)，P0 全部 hotfix 修完，P1 部分帶下 Sprint 49 (Sprint 49-1 已回應 audit #4-#6) |
| **Sprint 49 Reflection** | ✅ [docs/reflection/sprint-49-reflection.md](./reflection/sprint-49-reflection.md)：0 新功能, 3 commits / 0.8 SP 100% 完成；移除 ~75 行 dead code (Sprint 49-0 spike 揭露)；Sprint 50+ 帶下項目: SourcesList 升級 / CRUD List 增強 / 其他 SDK type dep 切斷 |
| **下個 Sprint 計劃** | Sprint 49 Submit Gate ✅（3 commits / 0.8 SP 完成）：Commit 1 (49-0 UIMessage Spike 0.2) + Commit 2 (49-1 Office Rest Guard 0.3) + Commit 3 (49-2 UIMessage 切斷 0.3) = 0.8 SP 100% ｜ 0 新功能 (技術債清理 sprint) ｜ 移除 ~75 行 dead code (意外好處) ｜ Sprint 48 mid-review audit #4-#6 全部回應 ｜ 測試基線 1938 → **1956** (+18 tests, 0 regression) ｜ Sprint 50 選擇待定 |
| **Sprint 46 範圍** | 7 個 Stage 46-A 到 46-G，完整決策與風險見 [sprint46-plan-gate.md](sprint46-plan-gate.md) + [PRD 10-chat-attachments.md](prd/10-chat-attachments.md) |
| **Sprint 46 累計測試** | 1795 passed（既有 1629 baseline + Sprint 46 新增 166：Commit 1 守護 26 + Commit 2 守護 28 + mime-validator 57 + Bug Fix 20 + Commit 4 守護 10 + Commit 5 守護 7 + Commit 6 單元 5 + Commit 6 守護 6 + 其他 7）+ Playwright E2E 6 passed（Commit 7）|
| **Sprint 44 狀態** | ✅ **100% 收尾（17/17 SP）**（Reflection 清理 4 SP + Admin AI Chat FAB 13 SP：FAB + 拖動 snap + 兩欄 Drawer + sessions CRUD + SSE streaming + 7 E2E）|
| **測試基線** | **1629 integration + 134/134 E2E**（Sprint 45 +42 守護測試 + 7 E2E）|
| **Sprint 45 狀態** | ✅ **100% 收尾（14/14 SP）**（AI SDK Elements 混合方案 + Chat 功能擴展：4 元件安裝 + AdminChatPanel 重構 + 檔案附件 UI + 程式碼高亮 + 7 E2E）|
| **Sprint 26 狀態** | ✅ **100% 收尾（2.5/2.5 SP）**（Sprint 20 P2 技術債 5/5 全清）|
| **Sprint 27 狀態** | ✅ **100% 收尾（28/28 SP）**（CRUD 列表頁 5 大功能 + 8 個 bug 修補）|
| **Sprint 28-29 狀態** | ✅ **100% 收尾（23/23 SP）**（users/roles 統一 CRUD + sidebar 重組 + profile 美化 + settings page）|
| **Sprint 30 狀態** | ✅ **100% 收尾（5.5/5.5 SP）**（TD-801/802/523/524/519 全部守護測試 + JWT name refresh code 改動）|
| **Sprint 31 狀態** | ✅ **100% 收尾（3/3 SP）**（TD-911 * wildcard bug 3 層修法 + TD-911b permission code 雙格式 + admin RWD 5 E2E 守護）|
| **Sprint 33-40 狀態** | ✅ **100% 收尾**（View Feature：5 種 views + 4 CRUD + Kanban DnD + localStorage + calendar/gallery）|
| **Sprint 41 狀態** | ✅ **100% 收尾（~4 SP）**（4 P1 fixes：TD-803/804/806/812 + RWD audit 4 頁 + VIEW_REGISTRY 重構 + sidebar 3 關閉路徑 E2E；reflection 由 Sprint 42 開工時反向補寫）|
| **Sprint 42 狀態** | ✅ **100% 收尾（3/3 SP）**（清完 Sprint 32 review 全部 7 個未處理項目：TD-805/807/808/809/810/815/818）|
| **Sprint 43 狀態** | ✅ **100% 收尾（13/13 SP，原估 15 SP）**（AI Config v2.0: Custom LLM Endpoint + 4-type Provider + AES-256-GCM 加密 + 統一錯誤 + log redaction + /admin/settings/ai-config UI）|
| **測試基線** | **1919 integration tests + 0 E2E 變動**（Sprint 48 +38 tests, 0 regression）|
| **測試基線** | **1587 integration + 127/127 E2E**（Sprint 44 +81 守護測試 + 7 E2E）|
| **測試基線** | **1506 integration + 120/120 E2E**（Sprint 43 +56 守護測試）|
| **下一個 P0** | Sprint 49 Execution Gate：開 Commit 1（US-S49-OfficeParserRest, 3 SP）→ 跑 Gate 1（TDD 紅→綠）→ Gate 2（lint+typecheck）→ Gate 3（regression）→ Gate 4（reviewer）|
| **路線圖關鍵** | ✅ Sprint 21-32 → ✅ Sprint 33-40（View Feature + bug fixes）→ ✅ Sprint 41（4 P1 + RWD audit + 重構）→ 📋 Sprint 42+（剩餘風險 + 新方向）|
| **Sprint 27 反省報告** | [docs/reflection/module-crud-list-enhancements-reflection.md](reflection/module-crud-list-enhancements-reflection.md) |
| **Sprint 28-29 反省報告** | [docs/reflection/module-sprint28-29-reflection.md](reflection/module-sprint28-29-reflection.md) |
| **Sprint 30 反省報告** | [docs/reflection/module-sprint30-reflection.md](reflection/module-sprint30-reflection.md) |
| **Sprint 31 反省報告** | [docs/reflection/module-sprint31-reflection.md](reflection/module-sprint31-reflection.md) |
| **Sprint 33-40 反省報告** | [docs/reflection/module-sprint33-40-reflection.md](reflection/module-sprint33-40-reflection.md)（跨 8 sprints 反思）|
| **Sprint 41 反省報告** | [docs/reflection/module-sprint41-reflection.md](reflection/module-sprint41-reflection.md)（反向補寫：4 P1 + RWD + VIEW_REGISTRY + batch 安全）|
| **Sprint 42 反省報告** | [docs/reflection/module-sprint42-reflection.md](reflection/module-sprint42-reflection.md)（清完 Sprint 32 review 7 個項目 + TD-815 偽守護修復）|
| **Sprint 43 反省報告** | [docs/reflection/module-sprint43-reflection.md](reflection/module-sprint43-reflection.md)（AI Config v2.0 + Custom URL + 揭露 5 個後續事項）|
| **Sprint 44 反省報告** | [docs/reflection/module-sprint44-reflection.md](reflection/module-sprint44-reflection.md)（Reflection 清理 4 SP + Admin AI Chat FAB 13 SP：FAB + 拖動 snap + 兩欄 Drawer + sessions CRUD + 7 E2E）|
| **Sprint 45 反省報告** | [docs/reflection/module-sprint45-reflection.md](reflection/module-sprint45-reflection.md)（AI SDK Elements 混合方案 14 SP：4 元件安裝 + AdminChatPanel 重構 + 附件 UI + 程式碼高亮 + 7 E2E）|
| **Sprint 46 規劃** | ✅ Plan Gate ✅ + Design Gate ✅ + Execution Gate ✅（22.5 SP 100% 完成） — 見 [sprint46-plan-gate.md](sprint46-plan-gate.md) + [PRD 10-chat-attachments.md](prd/10-chat-attachments.md) + [reflection](reflection/sprint-46-reflection.md) |
| **Sprint 47 規劃** | ✅ Plan Gate ✅ + Design Gate ✅ + Execution Gate ✅ + Submit Gate ✅（[docs/sprint47-plan-gate.md](sprint47-plan-gate.md) + [PRD 11-chat-v2-completions.md](prd/11-chat-v2-completions.md) + [Reflection](reflection/sprint-47-reflection.md)，**13.5 SP / 8 commits 100%**）：Commit 1 (47-0 Office Parser Spike 2 SP) + Commit 2 (47-1 Sources/Reasoning 2 SP) + Commit 3 (47-2 Vision 2 SP) + Commit 4 (47-3 Frontend Upload 2 SP) + Commit 5 (47-4 PDF Parser 2 SP) + Commit 6 (47-5 Cleanup Cron 2 SP) + Commit 7 (47-6 Session Ownership 1 SP) + Commit 8 (47-7 XSS 守護 0.5 SP) ｜ 测试基線 1795 → **1881** (+86 tests, 0 regression) |
| **Sprint 48 規劃** | ✅ Plan Gate ✅ + Design Gate ✅ + Execution Gate ✅ + Submit Gate ✅（[docs/sprint48-plan-gate.md](sprint48-plan-gate.md) + [PRD 11-chat-v2-completions.md](prd/11-chat-v2-completions.md) §2.10 + [Reflection](reflection/sprint-48-reflection.md)，**2.1 SP / 6 commits 83%**）：Commit 1 (48-1 Lint Cleanup 0.5 SP) + Commit 2 (48-2 ChatStatus 0.3 SP) + Commit 3 (48-3 UploadOwnership 0.5 SP) + Commit 4 (48-4 Office Rest Spike 0.5 SP) + Hotfix 48-4.1 (audit P0 修補 0.3 SP) ｜ Stage 48-5 Office Rest 實作 (3 SP) 帶下 Sprint 49 ｜ 测试基線 1881 → **1919** (+38 tests, 0 regression) ｜ mid-review audit 揭露 9 項問題 (3 P0 + 6 P1/P2)，P0 全部 hotfix 修完 |

### Sprint 21 規劃（US-102-P2 動態 RBAC，預估 7 SP）

> **日期**: 2026-08-26
> **用戶決定**: M2 唯一 P1 user story — 後台用戶管理 Phase 2（動態 RBAC）
> **Plan Gate 狀態**: 🟡 進行中（Q1-Q4 ✅ / Q5-Q7 待解決）
> **PRD**: [docs/prd/09-rbac.md](prd/09-rbac.md)

| 進度 | 內容 | 狀態 |
|---|---|---|
| **Q1** | 內建 role 不能刪（`isSystem=true`）| ✅ A 已確認 |
| **Q2** | 自定義 role 命名規則（小寫 + 底線 + ≤32 字 + 唯一 + 預留 `admin/editor/viewer`）| ✅ A 已確認 |
| **Q3** | `/admin/roles` 公開但只有 admin 可進可改 | ✅ A 已確認 |
| **Q4** | 只有 admin 能授權權限 | ✅ A 已確認 |
| **Q5** | Session strategy（JWT vs database）| ✅ A — JWT + 1 分鐘快取 + 失效 API |
| **Q6** | hasPermission 重構策略 | ✅ A — 保留純函式 + `hasDynamicPermission` 漸進式遷移 |
| **Q7** | 既有 auth.test.ts 22 個測試處理 | ✅ A — 保留寫死矩陣測試 + 新增動態查 DB 測試 |

---

### Sprint 20 收尾紀錄

✅ **Sprint 20 全收尾（7/7 SP）** — 2026-08-26
- **測試基線**：866 → **923**（+57）
- **檔案基線**：74 → **80**（+6：sheet / tooltip / sonner / theme-provider / theme-toggle / error-sanitizer）
- **截圖**：5 張（tech-053 sheet-open、tech-054 tooltip-sortable、tech-056 event-error-ui、tech-057 dark-mode、tech-058 sonner-toast-light + dark）
- **4 Gate 全綠**：每 Stage 1+2+3+4+P3+P3.5
- **完整反思**：[Sprint 20 Reflection](reflection/sprint-20.md)

| Stage | 主題 | SP | 狀態 | 反思章節 |
|---|---|---|---|---|
| **Stage 1** | Sheet（抽屜式編輯）| 1.5 | ✅ | [→](reflection/sprint-20.md#stage-1-重點sheet) |
| **Stage 2** | Tooltip（sortable header）| 1 | ✅ | [→](reflection/sprint-20.md#stage-2-重點tooltip) |
| **Stage 3** | Dark mode（next-themes ThemeProvider）| 1.5 | ✅ | [→](reflection/sprint-20.md#stage-3-重點dark-mode) |
| **Stage 4** | Toast sonner 升級（徹底改寫）| 1.5 | ✅ | [→](reflection/sprint-20.md#stage-4-重點toast-sonner-升級) |
| **P3** | Dead code + null date | 0 | ✅ | [→](reflection/sprint-20.md#p3-重點dead-code--null-date) |
| **P3.5** | Event 500 + Hook 註冊（user 報 bug）| 1.5 | ✅ | [→](reflection/sprint-20.md#p35-重點event-500--hook-註冊) |

### Sprint 28-29 進度（Admin Sidebar & Profile 改造 — 100% 收尾）

> **日期**: 2026-08-30
> **Sprint 範圍**: users/roles 統一 CRUD pattern + sidebar 重組 + profile 美化 + settings page + auth session image refresh fix
> **反省報告**: [docs/reflection/module-sprint28-29-reflection.md](reflection/module-sprint28-29-reflection.md)

| Sprint | 標題 | SP | 狀態 | 關鍵交付 |
|---|---|---|---|---|
| 28-1 | users/roles 整合 CrudListClient | 5 | ✅ | Server Component + `users-list-shell` + `roles-list-shell` + 自訂 Row Actions |
| 28-2 | renderActions + allowBatchDelete props | 1 | ✅ | CrudListClient 支援自訂 actions |
| 28-3 | UserRowActions + RoleRowActions (TDD) | 5 | ✅ | 12 個新測試（5 + 7）|
| 28-4 | DropdownMenu portal + ARIA role 修正 | - | ✅ | E2E selector 改用 menuitem |
| 29-1 | Sidebar 結構重組 (TDD) | 4 | ✅ | 系統設定 section + Extensions 管理底部 + 13 個新測試 |
| 29-2 | User Profile 重設計 (TDD) | 3 | ✅ | icon-only buttons 一行 + name + email + role badge + 13 個新測試 |
| 29-3 | Settings page + API (TDD) | 4 | ✅ | /admin/settings + PATCH /api/profile/me + 20 個新測試 |
| 29-修 | Auth session image refresh fix | - | ✅ | 修 JWT callback 三層 bug（初次登入 / cache miss / 獨立 query）|
| **總計** | | **23** | **100%** | |

**Bug 修補（本期 3 個）**：

| # | 問題 | 類型 | 修法 |
|---|---|---|---|
| 1 | Server → Client 傳 function 報錯 | Bug | 建 client wrapper shell（users-list-shell / roles-list-shell）|
| 2 | Radix DropdownMenu 改變 ARIA role | Bug | E2E selector 改用 `getByRole('menuitem')` |
| 3 | JWT session 沒帶 image（3 層 root cause）| Bug | 1. 初次登入 set token.image 2. cache miss 時 set 3. **每次都跑獨立 query refresh** |

**最終測試基線**：
- ✅ integration 816/816（Sprint 28-29 新增 49 測試）
- ✅ E2E 79/79
- ✅ typecheck 0 errors

**關鍵學習**：
1. **Server/Client Component 序列化限制** — function prop 不能跨 server→client，用 shell pattern 隔離
2. **JWT session 不會自動 refresh** — cache 只放不常變資料（permissions），常變的（image）獨立 query
3. **測試 fixture 應貼近真實 schema** — fakeUser 缺 image 欄位讓 bug 溜過去
4. **Radix ARIA role 可能改變** — Playwright selector 要驗證實際 role
5. **設計決策要讓用戶參與** — 3 個方案 + ASCII mockup 讓用戶選，比直接實作省時間

**Sprint 30+ 建議**（背在 Backlog 主表）：
- E2E 守護測試：avatar reload 後仍顯示同張圖
- 把 JWT refresh 策略套用到 name 欄位
- 其他 admin 頁面（dashboard / role 矩陣）RWD 健檢
- 批次刪除 undo 機制 + 鍵盤快捷鍵

---

### Sprint 30 進度（5 個技術債守護 — 100% 收尾）

> **日期**: 2026-08-30
> **Sprint 範圍**: TD-801/802/523/524/519 守護測試 + JWT name refresh code 改動
> **反省報告**: [docs/reflection/module-sprint30-reflection.md](reflection/module-sprint30-reflection.md)

| ID | 主題 | 類型 | 改動 | 測試 |
|---|---|---|---|---|
| **TD-801** | E2E 守護測試：avatar reload | 防回歸 | 只加測試（auth/config.ts Sprint 29-3 已修）| +1 E2E |
| **TD-802** | JWT refresh 套用到 name | code + 防回歸 | auth/config.ts JWT/session callback 加 name | +4 unit |
| **TD-523** | HookFunction type contract | 防回歸 | 只加測試（Sprint 27 已加 StrictHookFunction）| +5 unit |
| **TD-524** | Sanitizer error taxonomy | 防回歸 | 只加測試（Sprint 27 已加 AppError + ErrorCategory）| +12 unit |
| **TD-519** | Order 列表分頁 | 防回歸 | 只加測試（Sprint 19 已加 skip+take）| +5 unit |
| **總計** | | | **1 code 改動 + 27 守護測試** | |

**關鍵學習**：
1. **守護測試 > 改 code**：技術債處理優先補測試而非 refactor（ROI 高）
2. **JWT user-mutable 欄位**：獨立查詢 vs permission cache 是正確的 trade-off
3. **兩種守護測試**：source-code guard（簡單防移除）+ behavior test（防行為退化）
4. **E2E setup 重要**：beforeEach reset + page.evaluate 是穩定模式
5. **vi.stubEnv for env-dependent code**：避免直接 mutate process.env

**Sprint 31+ 建議**（加到 Backlog）：
- TD-901: 其他 CRUD 頁面 RWD 健檢 (todo/event)
- TD-902: 批次刪除 undo 機制
- TD-903: Toolbar 鍵盤快捷鍵
- TD-905: 移除 hook-sdk.ts 的 deprecated HookFunction（破壞性變更）
- TD-906: 移除 app-error.ts 的 regex fallback（破壞性變更）

---

### Sprint 31 進度（用戶報 Bug + Admin RWD 健檢 — 100% 收尾）

> **日期**: 2026-08-30
> **Sprint 範圍**: TD-911 * wildcard 3 層修法 + TD-911b permission 雙格式 + admin RWD 守護
> **反省報告**: [docs/reflection/module-sprint31-reflection.md](reflection/module-sprint31-reflection.md)

| ID | 主題 | 類型 | 改動 | 測試 |
|---|---|---|---|---|
| **TD-911** | `*` wildcard 過濾 | Bug 3 層修法 | API GET filter + PATCH reject + 前端 filter | +4 unit |
| **TD-911b** | permission code 雙格式 (`:` + `.`) | Bug Zod regex | Zod regex 改用 `[:.]` 接受兩種分隔符 | +3 unit |
| **Sprint 31-1** | admin 頁面 mobile RWD | 守護測試 | 5 E2E (dashboard / extensions / users / roles / matrix) | +5 E2E |
| **總計** | | | **3 個檔案改動 + 12 新守護測試** | |

**關鍵 bug 修法**：

1. **TD-911 `*` wildcard 3 層 root cause**：
   - API GET 不過濾 → 加 `codes.filter(c => c !== PermissionCode.ADMIN_WILDCARD)`
   - API PATCH 不拒絕 → 加 explicit check return 400
   - 前端不防禦 → 加 `filter(p => p.code !== ADMIN_WILDCARD)`
   - DB 清理：`scripts/cleanup-wildcard-permissions.ts` 刪 1 個管理員 role 的 `*` permission

2. **TD-911b 雙格式 regex**：
   - 舊 regex 只接受 `:`（Sprint 21 設計）
   - 但 Sprint 21 之前 extension manifest 用 `.` (e.g., `blog.create`)
   - 新 regex：`/^(\*|[a-z][a-z0-9_]*[:.][a-z][a-z0-9_]*)$/` 用 `[:.]` 同時接受

**關鍵學習**：

1. **用戶報 bug 多半是 3 層 root cause** — 修最底層 + 多層 defensive check
2. **Test fixture 應貼近真實資料** — Sprint 21 fixture 全用 `users:read`，沒測 `blog.create` dot 格式
3. **底層 fix 投資報酬率高** — Sprint 27 min-w-0 同時修好所有 admin 頁面 RWD
4. **Zod regex 是隱形契約** — 重構時要確認所有合法格式都被測試覆蓋

**Sprint 32+ 建議**：
- TD-1001: API/DB 一致性測試（測真實 schema，不只 fixture）
- TD-1002: 統一 permission code 格式（全轉 colon 或保留雙格式）
- TD-1003: User CRUD form RWD 健檢
- TD-1004: CRUD form RWD 健檢

---

### Sprint 27 進度（CRUD 列表頁增強 v1.1 — 100% 收尾）

> **日期**: 2026-08-30
> **Sprint 範圍**: CRUD 列表頁 5 大功能 + RWD + 多個 bug 修補
> **反省報告**: [docs/reflection/module-crud-list-enhancements-reflection.md](reflection/module-crud-list-enhancements-reflection.md)

| Sprint | 標題 | SP | 狀態 | 關鍵交付 |
|---|---|---|---|---|
| Sprint A | Infinite scroll pagination | 5 | ✅ | `InfiniteScrollTrigger` + server-side 重撈累積 render |
| Sprint B | Checkbox + 批次刪除 | 8 | ✅ | Row checkbox + 全選 + BatchDeleteDialog + `lib/runtime/batch-delete.ts` |
| Sprint C | 顯示欄位設定 | 5 | ✅ | ColumnTogglePopover + localStorage 持久化（三層 fallback）|
| Sprint D | 進階篩選 | 8 | ✅ | `lib/crud/list-query.ts` 5 類型 + AdvancedFilterDialog + Prisma where 編譯器 |
| Sprint E | Mobile card view | 2 | ✅ | MobileListView + useMediaQuery + 3 viewport 驗證 |
| **總計** | | **28** | **100%** | |

**Bug 修補（本期 8 個）**：

| # | 問題 | 類型 | 修法 |
|---|---|---|---|
| 1 | Sprint C hydration mismatch（localStorage 影響 SSR）| Bug | useMemo 不讀 localStorage，useEffect mount 後才讀 |
| 2 | Sprint D filter-after-pagination | Bug | `buildPrismaWhere` 編譯 5 類型 operators，handler.findMany 前套用 |
| 3 | Sprint D FieldType 缺 integer | 缺失功能 | 加 `integer` type，跟 `number` 共用 operators |
| 4 | Sprint D enumValues 雙來源 | Bug | `validation.enum ?? options` 向上相容 |
| 5 | Pre-existing Prisma entityId (todo-extension) | Bug | 測試改用 `db.todo.create()` 拿 id |
| 6 | Pre-existing Prisma entityId (three-cruds-e2e) | Bug | 同上 |
| 7 | Blog mobile card overflow (3 層 root cause) | Bug RWD | (1) MobileListView truncate (2) search Input flex-1 (3) admin-shell min-w-0 |
| 8 | 批次刪除 button 改為隱藏 (無選取時) | UX | conditional render `selectedIds.size > 0` |
| 9 | 移除 toolbar 小「新增」button | UX | 只保留 page header 大按鈕 |

**最終測試基線**：
- ✅ integration 1258/1258（含 Sprint 27 新增 49 測試）
- ✅ E2E 79/79（含 tech-039 RWD 新增 mobile card view 測試）
- ✅ typecheck 0 errors
- ✅ lint 0 errors

**關鍵 Sprint E RWD 三層 root cause 學習**：
1. MobileListView 沒 truncate 長欄位值（HTML content 全文顯示）
2. search Input 用 `w-full` 在 flex form 內撐開
3. admin-shell flex parent 缺 `min-w-0`，flex items 預設 `min-width: auto` 被內容撐大

**Sprint 28+ 建議**：
1. 其他 CRUD 頁面 RWD 健檢（todo/order/event）
2. CRUD detail page / form page RWD
3. admin 後台其他頁面 RWD（dashboard/roles/extensions）
4. 批次刪除 undo 機制（toast 內加 undo button）
5. Toolbar 鍵盤快捷鍵（Cmd+A 全選、Delete 開批次刪除）

---

### Sprint 20 揭露的技術債（已 Sprint 26 100% 完成）

| 優先級 | 項目 | 描述 | 文件 | 狀態 |
|---|---|---|---|---|
| **P2** | list/get handler 沒 try/catch | DB 拋錯 → 500（Prisma 錯誤訊息暴露給前端）| `lib/runtime/dynamic-handler.ts` | ✅ Sprint 26 commit 1 (TD-401) |
| **P2** | Sanitizer SAFE_PATTERNS 漏 | `Cannot register for cancelled/past event` 在 production 被過濾為通用「提交失敗」 | `lib/runtime/error-sanitizer.ts` | ✅ Sprint 26 commit 2 (TD-402) |
| **P3** | Hook type contract vs runtime 不一致 | hook-sdk.ts 型別要求回傳完整 ctx，但 4 個 production hook 全 return data | `lib/hooks/hook-sdk.ts` | ✅ Sprint 26 commit 3 (TD-403) |
| **P3** | Registry completeness regex 不支援嵌套 JSON | `"hooks"\s*:\s*\{([^{}]*)\}` 不支援嵌套 JSON 物件 | `lib/extensions/hooks-registry.ts` | ✅ Sprint 26 commit 4 (TD-404) |
| **P3** | State machine 錯誤在 production 被過濾 | `StateMachine "x" 拒絕 event "y"` 不匹配 SAFE_PATTERNS | `lib/runtime/error-sanitizer.ts` | ✅ Sprint 26 commit 2 (TD-402 涵蓋) |
| **P3** | TooltipProvider 重複建立 | 每個 SortableHeaderCell 各自包 Provider（10 欄位 = 10 Provider），狀態隔離（純優化）。未來可抽 SortableHeader 整個 TableHeader 共享 | `components/admin/sortable-header-cell.tsx:59` | 📋 待做（Sprint 27+） |
| **P3** | `bun.lock` 陳舊 | 之前用 Bun 安裝留下，非 pnpm 流程用（CI 用 pnpm install --frozen-lockfile，不讀 bun.lock） | `bun.lock` | 📋 待做（Sprint 27+） |

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

### Sprint 21-26 完整演進表（Phase 2 RBAC + 技術債清理）

| Sprint | SP | 累計測試 | 重點成就 |
|---|---|---|---|
| **Sprint 21** | 8.25 | 923 → 999 (+76) | US-102-P2 Phase 2 RBAC: schema + seed-rbac + 5 API + 2 UI + Middleware + 4 TD 修正 |
| **Sprint 22** | 0.5 | 999 → 999 | Silent bug audit (0 silent bug) + PR checklist (SOP-R1) |
| **Sprint 23** | 2 | 999 → 1006 (+7) | Middleware 動態化 (jwt/session permissions) + TD-7 extension perms |
| **Sprint 24** | 2 | 1006 → 1028 (+22) | UI 條件渲染動態版 (hasUIPermission + useHasUIPermission) |
| **Sprint 25** | 1 | 1028 → 1025 (-3) | 強制清 hasPermission 純函式 (PRD §12.4.1) |
| **Sprint 26** | 2.5 | 1025 → 1054 (+29) | Sprint 20 P2 技術債 5/5 全清 (TD-401/402/403/404/405) |
| **總計** | **16.25** | **+131** | Phase 2 RBAC 11/11 + Sprint 20 P2 5/5 |

**Sprint 21-26 重點交付**：
- ✅ Phase 2 RBAC 路線圖 11/11 (Sprint 21-25)
- ✅ Sprint 20 P2 技術債 5/5 (Sprint 26)
- ✅ 測試 923 → 1054 (+131)
- ✅ 8 條新 SOP (L1-L18 累計)
- ✅ 4 條新 refactor (SOP-R1/R2)
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
| **US-102-P2** | User Story | 後台用戶管理（Phase 2 動態 RBAC）| Role table + Permission table + 自定義角色管理 UI + 動態權限授權 | 5 | SP2 | M2 | ✅ Done（Sprint 21-25 完整：schema + seed + cache + 5 API + 2 UI + Middleware + 強制清，Phase 2 RBAC 路線圖 11/11 完成）|
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
| **TD-518** | Tech Debt | Order transition 權限檢查 | `POST /api/order/{id}/transition` 沒檢查「誰」可以切狀態 | 1 | SP8 | M1-WS | ✅ Done（Sprint 21-25 動態 RBAC 完成：Order transition 自動用 hasDynamicPermission 守衛） |
| **TD-519** | Tech Debt | Order 列表分頁 | 訂單 >50 筆會慢，沒分頁 | 1 | SP8 | M1-WS | ✅ Done（Sprint 19 dynamic-handler 加 skip+take，Sprint 30 5 unit 守護） |
| **TD-520** | Tech Debt | Order 用 Zod 驗證 form | 目前 createOrderDialog 手寫 if 驗證 | 1 | SP8 | M1-WS | 📋 Ready（Sprint 9+）|
| **TD-523** | Tech Debt | Hook function type contract 太鬆 | HookFunction<T = unknown> 接受任何型別 → silent type drift 風險 (Sprint 26 TD-403 揭露) | 1 | SP27+ | M1 | ✅ Done（Sprint 27 加 StrictHookFunction，Sprint 30 5 unit 守護）|
| **TD-524** | Tech Debt | Sanitizer 用 regex 而非 error taxonomy | SAFE_PATTERNS 用 regex 陣列 → 手動加 regex 易遺漏 (Sprint 26 揭露) | 1.5 | SP27+ | M1 | ✅ Done（Sprint 27 加 AppError + ErrorCategory，Sprint 30 12 unit 守護） |
| **TD-521** | Tech Debt | Disable Guard 測試補完 | Sprint 9 補完 Disable Guard 時發現：`listEnabledExtensions()` 有個 `\|\| true` bug，Sidebar filter 形同失效；其他 helper 也沒 unit test | 1 | SP9 | M6 | ✅ Done（本 session Sprint 9 補完）|
| **TD-522** | Tech Debt | Order Extension manifest 缺失 | `extensions/order/` 沒有 `manifest.json`，導致 extension-manager filesystem scan 漏掉，/api/extensions 看不到 order（但 API guard 仍 work） | 0.5 | SP9+ | M6 | ✅ Done（Sprint 32 audit：extensions/order/manifest.json 已存在，內容完整含 hooks/actions/computed/workflows/permissions/nav） |
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
| **TD-803** | Defect | JWT callback 每次都打 DB 抵銷 Sprint 23 cache | `lib/auth/config.ts:155-167` 把 name/image 獨立 query 設成「總是查詢」，違反 Sprint 28-29 教訓（cache 只放不常變）。修正：只在 cache miss 路徑查，或拆兩個獨立 cache | 0.5 | SP30 | M2 | ✅ Done（Sprint 41 修 code + 2 unit guard）|
| **TD-804** | Defect | `?filters=` parse 失敗 silent swallow 導致無過濾回傳 | `lib/runtime/dynamic-handler.ts:262-279` `catch {}` 吃掉錯誤 → user 看到不該看到的 rows（資料洩漏風險）。修正：parse 失敗要回 400 或 warning log | 0.5 | SP30 | M1 | ✅ Done partial（Sprint 41 加 console.warn；Sprint 42+ 可考慮完整修 400）|
| **TD-805** | Defect | Infinite scroll 無 page 上限（self-DoS 風險） | `app/admin/crud/[spec]/page.tsx` Sprint A：`Promise.all(1..N)` 累積查詢，user 不斷 scroll 自我 DoS。修正：hard cap（例如 ≤20）後改 cursor pagination | 1 | SP30 | M4 | ✅ Done（Sprint 42 雙層防禦：server clamp MAX_PAGE=50 + client UI 提示 + 4 unit guard）|
| **TD-806** | Defect | Batch delete 缺 TransitionLog + 無 batch size cap | `app/api/crud/[spec]/route.ts` Sprint B3：沒寫 audit log（與 Sprint 31 `cancelEvent` 補法不一致），可一次砍整張表。修正：每筆寫 TransitionLog + max batch ≤ 100 | 1 | SP30 | M4 | ✅ Done（Sprint 41 MAX_BATCH_SIZE=100 + TransitionLog + 3 unit guard）|
| **TD-807** | Tech Debt | `lib/auth/config.ts` 縮排壞掉 | `:99` `callbacks: {` 少 2 空格，`:134` `if (fresh) {` 少 6 空格 — 繞過 formatter 編輯。修正：跑 prettier 再 commit | 0.1 | SP30 | M2 | ✅ Done（Sprint 42 prettier + source-code guard）|

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
| **TD-808** | Tech Debt | 手機 sidebar 缺 Escape 鍵關閉 | `app/admin/admin-sidebar.tsx`：開啟後只能用 close button 或 backdrop 關，keyboard user 不友善。修正：加 `useEffect` listener | 0.5 | SP30 | M7 | ✅ Done（Sprint 42 useEffect Escape listener + source-code guard）|
| **TD-809** | Tech Debt | 手機 sidebar 缺 body scroll lock + route-change auto-close | sidebar 開啟時內容仍可滾動；programmatic navigation 後 sidebar 維持開啟。修正：`document.body.style.overflow='hidden'` + `usePathname` 監聽 | 0.5 | SP30 | M7 | ✅ Done（Sprint 42 2 個獨立 useEffect + source-code guard）|
| **TD-810** | Tech Debt | 手機 sidebar backdrop 用 `<button>` 違反 keyboard 慣例 | backdrop 是 `<button>`，鍵盤 user 必須 Tab 才能關。修正：用 `<div role="presentation">` 或加鍵盤 listener | 0.3 | SP30 | M7 | ✅ Done（Sprint 42 backdrop `<div role="presentation">` + source-code guard）|
| **TD-811** | Tech Debt | Working tree 50+ 檔案未提交需拆 commit | Sprint A/B3/C/D + 29-3 + TD-802 + users/roles page-client 刪除 refactor 全在 working tree，未進任何 commit。風險：`git checkout .` 會全部遺失。修正：拆成 4-5 個獨立 commit，每個跑 Gate 1-4 | 1 | SP30 | M0 | ✅ Done（自動滿足 — working tree 已 clean，Sprint 33-40 已正確 commit）|

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
| **TD-7xx** | Tech Debt | 其他 CRUD 頁面 RWD 健檢 (todo/order/event) | Sprint 27 只修 blog，其他 CRUD 頁面需要同樣健檢 | 1 | SP28 | M4 | 📋 Ready |
| **TD-7xx** | Tech Debt | CRUD detail / form page RWD | CRUD edit drawer / form page 在 mobile 下的 RWD 健檢 | 2 | SP28 | M4 | 📋 Ready |
| **TD-7xx** | Tech Debt | admin 其他頁面 RWD (dashboard/roles/extensions) | admin 後台非 CRUD 頁面的 RWD 健檢 | 2 | SP28 | M4 | 📋 Ready |
| **US-7xx** | User Story | 批次刪除 undo 機制 | 批次刪除完成後 toast 加 undo button，防止誤刪 | 2 | SP28 | M4 | 📋 Ready |
| **US-7xx** | User Story | Toolbar 鍵盤快捷鍵 | Cmd+A 全選、Delete 開批次刪除 dialog、Esc 關 dialog | 1 | SP28 | M4 | 📋 Ready |
| **US-7xx** | User Story | 進階篩選 localStorage 持久化 | 目前用 URL params，可考慮存 localStorage 保留最近一次篩選 | 1 | SP28 | M4 | 📋 Ready |
| **TD-7xx** | Tech Debt | Pre-existing Prisma 預防 E2E | 寫 E2E 確保 transitionLog.entityId 必填，防止再犯 | 1 | SP28 | M1 | 📋 Ready |
| **TD-801** | Tech Debt | E2E 守護測試：avatar reload 後仍顯示同張圖 | Sprint 28-29 修的 JWT image bug 改守護測試，防止 session callback 漏欄位 | 1 | SP30 | M2 | ✅ Done（Sprint 30 +1 E2E）|
| **TD-802** | Tech Debt | JWT refresh 策略套用到 name 欄位 | user.name 也有同樣 session 不 refresh 的問題（Sprint 28-29 教訓）| 1 | SP30 | M2 | ✅ Done（Sprint 30 JWT callback 加 name refresh + 4 unit 守護）|
| **US-801** | User Story | Admin dashboard RWD 健檢 | 跟 Sprint 27 CRUD 列表頁同樣處理 | 1 | SP30 | M4 | 📋 Ready |
| **US-802** | User Story | Role 矩陣頁 RWD 健檢 | /admin/roles/:id/permissions 頁面在 mobile 下檢查 | 1 | SP30 | M2 | 📋 Ready |
| **US-803** | User Story | 批次刪除 undo 機制 | toast 內加 undo button，防止誤刪（從 Sprint 27 延續）| 2 | SP30 | M4 | 📋 Ready |
| **US-804** | User Story | Toolbar 鍵盤快捷鍵 | Cmd+A 全選 / Delete 開批次刪除 dialog / Esc 關 dialog | 1 | SP30 | M4 | 📋 Ready |
| **TD-812** | Tech Debt | Batch delete RBAC + TransitionLog 守護測試 | 補 unit + integration test：RBAC 邊界 + 每筆刪除有 TransitionLog 紀錄 | 0.5 | SP30 | M4 | ✅ Done（Sprint 41 admin RBAC + source-code guard）|
| **TD-813** | Tech Debt | `?filters=` parse 邊界測試 | 補 integration test：malformed JSON、無效欄位、injection 防護、Sprint 32 review R2 守護 | 0.5 | SP30 | M1 | 📋 Ready（Sprint 42+ partial：source-code guard 已有，behavior test 缺）|
| **TD-814** | Tech Debt | Infinite scroll trigger + 累積 render 測試 | 補 unit test：max page guard、`useTransition`、cumulative render 正確性 | 0.5 | SP30 | M4 | 📋 Ready（Sprint 42 必修）|
| **TD-815** | Tech Debt | Sidebar Escape / route-change / backdrop 三種關閉路徑 E2E | Playwright 補 3 個情境測試（目前 `admin-mobile-rwd.spec.ts` 只測漢堡 toggle） | 0.5 | SP30 | M7 | ✅ Done（Sprint 42 改寫強斷言：dispatchEvent + toHaveCount(0)；3 個 E2E 從偽綠變真綠）|
| **TD-816** | Tech Debt | JWT name/image cache miss vs hit 路徑測試 | 補 unit test：cache miss 查 DB、cache hit 不查；防止 R1 再犯 | 0.5 | SP30 | M2 | ⚠️ Partial（source-code guard 已有；Sprint 42+ 可加 behavior test）|
| **TD-817** | Tech Debt | `lib/runtime/batch-delete.ts` 檔案健檢 | 被 `route.ts` 引用但不在 working tree 改動清單。確認檔案存在、有 unit test、respects permission checks、寫 TransitionLog | 0.5 | SP30 | M4 | ✅ Done（Sprint 41 source-code guard + RBAC 測試覆蓋）|
| **TD-818** | Tech Debt | Lockfile 雙軌整理 | `bun.lock` + `pnpm-lock.yaml` 都改動，CI 一邊裝一邊不裝。修正：挑一個（推薦 pnpm，CI 已用 `--frozen-lockfile`）並 `.gitignore` 另一個 | 0.3 | SP30 | M0 | ✅ Done（Sprint 42 `.gitignore` bun.lock + git rm + source-code guard）|
| **US-S46-SourcesReasoning** | User Story | Sprint 46 補做 SourcesList + ReasoningSection | PRD §7 規劃「自製 SourcesList + ReasoningSection 元件，從 AI 回應 metadata 顯示」；Sprint 46 只做了 Markdown + 附件 2/3 主題 | 3 | SP47 | M5 | ✅ Done（Sprint 47-1 降階方案：Sources 改附件引用折疊區）|
| **US-S47-Vision** | User Story | 圖片 vision 整合 (pi-agent-sdk multi-modal) | `attachment-reader.ts` 有 `kind: 'image'` 但 `agent-sdk.ts` 只 call `readAttachmentText`；圖片 vision 從未送進 AI context。用戶上傳 PNG/JPG 看不到 AI 回應 | 3 | SP47 | M5 | ✅ Done（Sprint 47-2 用 SDK PromptOptions.images 原生）|
| **US-S47-FrontendUpload** | User Story | 前端真實上傳整合 + XHR abort + 進度條 | Backend `/api/admin/chat/upload` 已實作，但 `useChatStream.ts` 仍用 Sprint 45「📎 filename」字串拼進 user content。AI 看不到任何附件內容 | 4 | SP47 | M5 | ✅ Done（Sprint 47-3 multipart + UploadProgressBar）|
| **TD-S47-SessionOwnership** | Tech Debt | Stream route session ownership check | `app/api/admin/chat/stream/route.ts` 從 body 拿 sessionId 沒驗證歸屬；理論上 user A 可送別人的 sessionId + attachment ID 讀到別人的附件 | 1 | SP47 | M5 | ✅ Done（Sprint 47-6 requireSessionOwnership helper + source-code guard）|
| **TD-S47-MarkdownXSS** | Tech Debt | Markdown 輸出 XSS E2E 守護 | Sprint 46 守護測試顯式避免 `rehype-raw` 但沒對 Markdown 輸出做端到端 XSS 測試；防 Sprint 47+ 加 `rehype-raw` 時引入 XSS | 0.5 | SP47 | M5 | ✅ Done（Sprint 47-7 7 個 XSS 守護測試全綠）|
| **US-S48-SourcesList** | User Story | Sources 完整列表（PRD §2.3 FR-1.4） | Sprint 47-1 採降階「附件引用折疊區」，未實作完整 SourcesList 元件。用戶看不到 AI 引用來源列表 | 3 | SP48 | M5 | 📋 Ready（Sprint 47 reflection 揭露）|
| **US-S48-OfficeParserRest** | User Story | DOCX/XLSX/PPTX 解析 (PRD §2.5 FR-5.2/5.3) | Sprint 47-4 只做 PDF (D-1 方案)，DOCX/XLSX/PPTX 仍 `unsupported`。PDF 動態 import 已證明可行，可延伸 | 3 | SP48 | M5 | 📋 Ready（Sprint 47 reflection 揭露，需重跑 bundle spike）|
| **TD-S48-LintCleanup** | Tech Debt | 修 6 個 pre-existing lint 錯誤 | `react-hooks/exhaustive-deps` (admin-sidebar, settings/page) + `await-thenable` (roles/page, users/page) + `no-floating-promises` (conversation.tsx) | 0.5 | SP48 | M0 | 📋 Ready（Sprint 47 reflection 揭露）|
| **TD-S48-UploadOwnershipRefactor** | Tech Debt | Upload route 改用 requireSessionOwnership helper | Sprint 47-6 stream route 改用 helper，但 upload route 仍用內聯 `db.chatSession.findUnique` + userId 比對。風格不一致 | 0.5 | SP48 | M5 | 📋 Ready（Sprint 47 reflection 揭露）|
| **TD-901** | Tech Debt | 其他 CRUD 頁面 RWD 健檢 (todo/event) | Sprint 27 只修 blog，其他 CRUD 頁面需要同樣健檢 | 1 | SP31 | M4 | ✅ Done（Sprint 41 spec loader mtime cache + admin 4 頁 RWD 健檢）|
| **TD-902** | Tech Debt | 批次刪除 undo 機制 | toast 內加 undo button，防止誤刪 | 2 | SP31 | M4 | 📋 Ready |
| **TD-903** | Tech Debt | Toolbar 鍵盤快捷鍵 | Cmd+A 全選 / Delete 開批次刪除 dialog | 1 | SP31 | M4 | 📋 Ready |
| **TD-S47-ChatStatus** | Tech Debt | ChatStatus 自訂型別 | `use-chat-stream.ts` 從 `'ai'` SDK import `ChatStatus` 型別；整個專案 Sprint 45 起都刻意避免依賴 AI SDK UIMessage，卻唯獨 `ChatStatus` 用 'ai' SDK 型別 | 0.3 | SP47 | M5 | 📋 Ready（Sprint 46 reflection 揭露）|
| **TD-904** | Tech Debt | admin dashboard RWD 健檢 | dashboard 頁面在 mobile 下檢查 | 1 | SP31 | M4 | ✅ Done（Sprint 41 admin RWD audit 已涵蓋 dashboard）|
| **TD-905** | Tech Debt | 移除 hook-sdk.ts 的 deprecated HookFunction | TD-523 完整清理（破壞性變更：所有 hook 必須改用 StrictHookFunction）| 2 | SP31 | M1 | 📋 Ready |
| **TD-906** | Tech Debt | 移除 app-error.ts 的 regex fallback | TD-524 完整清理（破壞性變更：所有 throw 必須改用 AppError）| 3 | SP31 | M1 | 📋 Ready |

### 冰盒（Backlog Icebox）

| ID | 類型 | 標題 | 描述 | SP | 模組 | 狀態 |
|----|------|------|------|----|------|------|
| **TECH-003** | Tech Spike | Extension 開發規範 | OpenSpec（MD + JSON Schema + TS Types + 範例）| 5 | M6 | ✅ Done（盤點 2026-08-24，`docs/specs/extension-spec.md` 已存在）|
| **TECH-004** | Tech Spike | 雙模型抽象層 | OpenAI + Claude interface + Provider 實作 + token 計算 | 3 | M4 | ✅ Done（盤點 2026-08-24，`lib/ai/providers/providers.ts` 含 OpenAI + Anthropic 真實串接 + mock fallback）|
| **EN-301** | Tech Debt | MVP 完成後改進 | CI/CD、測試覆蓋率、Extension Marketplace | 13 | M0 | 🧊 Icebox |

---

## 🗂️ Sprint 進度歷史（高層摘要）

> **完整細節**：見 `docs/reflection/` 各 Sprint 報告。

| Sprint | 主題 | 範圍 / 狀態 | Reflection |
|--------|------|------------|------------|
| Sprint 1 | 跑通單一 CRUD pipeline | 35 SP ✅ Done（11 個子任務）| [sprint-1](#) |
| Sprint 2 | 混合模式 SDK 主力 | 35 SP ✅ Done（Hook/Action/Computed/Workflow SDK）| [sprint-2](#) |
| Sprint 3 | 完整 Demo | 40 SP ✅ Done（Todo/Event Extensions + AI Chat + E2E）| [sprint-3](reflection/sprint-3-reflection.md) |
| Sprint 4 | Tech Debt 清整期 | ✅ Done（RWD/UX 債）| [sprint-4](reflection/sprint-4-reflection.md) |
| Sprint 5 | Tech Debt 清整期 | ✅ Done（6 個 TD + Chat 重構）| [sprint-5](reflection/sprint-5-reflection.md) |
| Sprint 6 | 持續修復 | ✅ Done（發現→修復→預防 pattern + TD-514 P0）| [sprint-6](reflection/sprint-6-reflection.md) |
| Sprint 7 | StateMachine + CI | ✅ Done | [sprint-7](#) |
| Sprint 8 | US-204 Demo UI | ✅ Done | [sprint-8](reflection/sprint-8-reflection.md) |
| Sprint 9 | Blog/Event/Todo CRUD + Disable Guard | ✅ Done | [sprint-9](reflection/sprint-9-reflection.md) |
| Sprint 10 | Compiler Pipeline | ✅ Done（修正 Sprint 9 §13 違背）| [sprint-10-phase-1](reflection/sprint-10-phase-1.md) / [phase-2](reflection/sprint-10-phase-2.md) |
| Sprint 11 | Compiler 完善 | ✅ Done | [phase-a](reflection/sprint-11-phase-a.md) / [phase-b](reflection/sprint-11-phase-b.md) |
| Sprint 13 | RWD/UX + DataTable | ✅ Done | [sprint-13](reflection/sprint-13.md) |
| Sprint 14 | Runtime 取代 Compiler | ✅ Done（9.5/9.5 SP）| [sprint-14](reflection/sprint-14.md) |
| Sprint 15 | Runtime Spec 精簡化 | ✅ Done | [sprint-15](reflection/sprint-15.md) |
| Sprint 16 | Runtime 精簡化收尾 + RWD | ✅ Done | [sprint-16](reflection/sprint-16.md) |
| Sprint 17 | customRenderer 客戶端 | ✅ Done | [sprint-17](reflection/sprint-17.md) |
| Sprint 18 | Shadcn UI + DropdownMenu | ✅ Done（6.5/6.5 SP）| [sprint-18](#) |
| Sprint 19 | List Sort + Filter | ✅ Done（8.5/8.5 SP）| [sprint-19](#) |
| Sprint 20 | 多對多 + Audit | ✅ Done（7/7 SP）| [sprint-20](reflection/sprint-20.md) |
| Sprint 21 | US-102-P2 動態 RBAC | ✅ Done（11/11 SP）| [sprint-21](reflection/sprint-21.md) |
| Sprint 22 | RBAC 完成 + P2 細節 | ✅ Done | [sprint-22](reflection/sprint-22.md) |
| Sprint 23 | Permission System 完善 | ✅ Done | [sprint-23](reflection/sprint-23.md) |
| Sprint 24 | Sidebar Mobile | ✅ Done | [sprint-24](#) |
| Sprint 25 | 強制清 hasPermission | ✅ Done | [sprint-25](#) |
| Sprint 26 | Sprint 20 P2 技術債批量修復 | ✅ Done（2.5/2.5 SP）| [sprint-26](reflection/sprint-26.md) |
| Sprint 27 | Clean code 改進（TD-523/524）| ✅ Done | [sprint-27](reflection/sprint-27.md) |
| Sprint 27-A | Module: CRUD 列表頁增強 v1.1 | ✅ Done（28/28 SP）| [module-crud-list-enhancements-reflection.md](reflection/module-crud-list-enhancements-reflection.md) |
| Sprint 28-29 | Module: Admin Sidebar & Profile | ✅ Done（23/23 SP）| [module-sprint28-29-reflection.md](reflection/module-sprint28-29-reflection.md) |
| Sprint 30+ | 下一個 P0（✅ Sprint 41 收尾 / ✅ Sprint 42 清完剩餘風險）| — | [sprint-32-review.md](reflection/sprint-32-review.md) |
| Sprint 41 | 4 P1 fixes + RWD audit + VIEW_REGISTRY + batch 安全 | ✅ Done（~4 SP；commit `bf53301`）| [sprint-41](reflection/module-sprint41-reflection.md)（反向補寫）|
| Sprint 42 | 清 Sprint 32 review 剩餘 7 項目（TD-805/807/808/809/810/815/818） | ✅ Done（3/3 SP；3 commits：`9b41476` `a4f0401` `01c9d81`）| [sprint-42](reflection/module-sprint42-reflection.md) |

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

## 📋 US-102 Phase 2 開工 checklist（2026-08-26 Sprint 21 開工）

> **Sprint 21 開工狀態**：✅ **Plan Gate 完成**（Q1-Q4 產品問題全部確認，2026-08-26）
> **確認對話**：見上方「對話記錄」區塊（2026-08-26 Sprint 21 段）
> **下一個 Gate**：Design Gate（PRD 骨架 + Q5-Q7 技術問題確認）

### 產品問題（✅ 已確認，2026-08-26）

#### Q1 ✅ A — 內建 role 不可刪
- **答案**：內建3 個 role（`admin` / `editor` / `viewer`）`isSystem=true`，不能刪只能「自定義新 role」
- **影響**：
  - `Role` table 加 `isSystem: Boolean @default(false)` 欄位
  - seed 重跑時自動重建內建3 個
  - UI 內建3 個行內顯示「系統」 badge + 隱藏刪除按鈕
  - 用戶故事分數：**5 SP**（不變）

#### Q2 ✅ A — 小寫 + 底線 + ≤32 字 + 唯一 + 預留保留字
- **答案**：`^[a-z][a-z0-9_]{0,31}$`，DB unique index，內建3 個為保留字
- **影響**：
  - Zod schema：`name: z.string().regex(/^[a-z][a-z0-9_]{0,31}$/)`
  - DB：`@@unique([name])`
  - UI 新增 role form 即時驗證 + 預留字防呆（`admin`/`editor`/`viewer`）
  - 允許長度範圍：1–32 字（`a` 是合法最短）

#### Q3 ✅ A — `/admin/roles` 是公開資源但只有 admin 可進可改
- **答案**：`/admin/roles` 公開（其他用戶看 sidebar 入口），但 middleware 守衛只有 admin 能進
- **影響**：
  - Sidebar 新增「Roles」入口（admin 才顯示）
  - `/admin/roles` middleware：非 admin → redirect `/admin`
  - `/admin/users` 的 Role 下拉：列出**用戶實際可被指派**的 role（含內建3 + 自定義），由當前用戶的 permissions 決定可選範圍

#### Q4 ✅ A — 只有 admin 能授權權限
- **答案**：只有 admin 能進 `/admin/roles`、能 CRUD 自定義 role、能改 role 的 permissions、能在 `/admin/users` 指派 role
- **影響**：
  - `Permission.code` 命名：`resource:action`（預留 Phase 3+ 細粒度授權）
  - Phase 2 MVP 只實作：`roles:write` / `users:assign` 兩個 permission，預設 admin role 全有
  - API guard：所有 `/api/roles/*` 端點需 `roles:write` permission
  - API guard：所有 `/api/users/*` 指派 role 端點需 `users:assign` permission

### 技術問題（下個 session 開工時決定）
5. **Session strategy：JWT vs database？**（現狀 JWT + jwt() 重讀 DB hack 已運作）
6. **hasPermission 重構策略**：保留純函式 + 加 `hasDynamicPermission` 平行函式（漸進式遷移）
7. **既有 auth.test.ts 22 個測試**：保留寫死矩陣測試 + 新增動態查 DB 測試

### 開工時程
- 預估 5 SP，3-4 天完成
- 順序：(1) Prisma migration → (2) seed 重寫 → (3) auth.ts 重構 + 新測試 → (4) `/admin/roles` UI → (5) 4 Gate
