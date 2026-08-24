# Sprint 6 Closure 備註

> **記錄日期**: 2026-08-24
> **目的**: 補完 Sprint 6 完整收尾備註（含本 session 補齊工作）

---

## Sprint 6 全貌

### 計畫範圍（Sprint 6 起步）

| Task | 標題 | 計劃 SP |
|------|------|---------|
| TD-601（原 TD-405-alt） | `/admin/extensions` async await 修復 | 2 |
| US-S6-1 | TD-503 abort Playwright E2E | 2 |
| TD-508 | useChatStream → useReducer | 2 |
| TD-509 | JWT augmentation JSDoc | 0.5 |

**計畫合計**：6.5 SP / 4 Task

---

### 實際完成範圍（截至 2026-08-24）

| Task | 標題 | 計劃 SP | 實際 SP | 狀態 | Commit |
|------|------|---------|---------|------|--------|
| TD-601 | `/admin/extensions` async await 修復 | 2 | 2 | ✅ | （Sprint 6 起步）|
| US-S6-1 | TD-503 abort Playwright E2E | 2 | 2 | ✅ | （Sprint 6 起步）|
| TD-508 | useChatStream → useReducer | 2 | 2 | ✅ | （Sprint 6 起步）|
| TD-509 | JWT augmentation JSDoc | 0.5 | 0.5 | ✅ | （Sprint 6 起步）|
| TD-510 | Backlog ID 撞號修正 | （P1）| — | ✅ | （Sprint 6 起步重整時完成）|
| TD-511 | Playwright webServer 雙 profile | 0.5 | 0.5 | ✅ | `66146bf` |
| TD-513 | useChatSessions hook 整合測試 | 1 | 1 | ✅ | `66146bf` |
| **US-102 Phase 1** | 後台用戶管理（基礎版）| （跨 Sprint 加值）| 5 | ✅ | `f28eae1` |

**實際合計**：13 SP（6.5 計畫 + 1.5 Sprint 6 P2 補齊 + 5 跨 Sprint 加值）

---

## 🐛 Sprint 6 揭露的 Bug / 修復

1. **SEED_USER_AND_ASSISTANT no-op bug**（TD-513 測試時揭露）
   - 對不存在 sessionId 違反 reference equality 不變量
   - 修法：reducer 加 `let changed = false` 機制
   - 守護：`app/chat/hooks/use-chat-stream.test.ts` 加 1 個 no-op 守護測試

2. **Middleware edge runtime 衝突**（US-102 實作時揭露）
   - Next.js middleware 跑 edge runtime 不能用 Prisma
   - 修法：拆 `lib/auth/auth.config.ts`（edge-safe）給 middleware 用

3. **Auth.js authorize() 兩大安全漏洞**（US-102 實作時揭露）
   - 漏洞 1：無 bcrypt 密碼驗證（可空密碼登入）
   - 漏洞 2：role 寫死 `'viewer'`，跟 DB 脫節
   - 修法：加 bcrypt + 從 DB 讀真實 role + JWT callback 重讀

4. **Auth handler 路由缺失**（US-102 實作時揭露）
   - `/api/auth/[...nextauth]/route.ts` 不存在
   - 修法：建立檔案掛 handlers

---

## 📊 Sprint 6 測試演進

| 階段 | Tests | Files | 4 Gate |
|------|-------|-------|--------|
| Sprint 6 起步前 | 639 | 43 | ✅ |
| Sprint 6 起步後 | 649 | 44 | ✅ |
| 本 session 前 | 662 | 46 | ✅ |
| 本 session 後（Sprint 6 收尾）| **692** | **49** | ✅ |

---

## 🎯 Sprint 6 結束狀態

- ✅ Sprint 6 計畫 100% 完成（4 Task + 2 P2 補齊）
- ✅ 跨 Sprint 加值完成 US-102 Phase 1（5 SP）
- ✅ 揭露並修復 4 個 bug（含 2 個安全漏洞）
- ✅ 692 tests / 49 files / 4 Gate 全綠
- ✅ Working tree 乾淨（3 commits: 66146bf / f28eae1 / bd49b8e）

---

## 📋 下個 Sprint 入口

- Sprint 7 計劃已寫：`docs/sprint-7-plan.md`（17 SP / 5 P1 項目）
- 開工第一個工作：TD-514 CI workflow（2 SP，P0）
- 開工前必看：US-102-P2 開工 checklist（4 個產品問題 + 3 個技術問題）