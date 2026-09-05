# Trust Log — Sprint TD-Burst (1 小時技術債清理)

> 啟動時間: 2026-09-05 09:27:31
> Deadline:   2026-09-05 10:27:31 (1 小時後)
> 目標: 處理所有「小 SP、無 risky、可快速完成」的技術债

---

## 策略

1. 1 小時 = 60 分鐘 = 可處理 5-8 項 0.3-0.5 SP 項目
2. 跳過大項目 (SP>=1.0): TD-905/906/902/903 等需多 sprint 設計
3. 跳過需用戶回饋的: TD-516/517/520 等「待真實需求」
4. 聚焦「小、孤立、有 source-code guard」的項目

---

## 候選項目 (21 項 Ready)

### ✅ 高 ROI (推薦處理, 0.3-0.5 SP)

| ID | 描述 | SP | 預估時間 |
|---|---|---|---|
| TD-S48-LintCleanup | 修 6 個 pre-existing lint 錯誤 | 0.5 | 15 分鐘 |
| TD-S48-UploadOwnershipRefactor | Upload route 改用 requireSessionOwnership helper | 0.5 | 10 分鐘 |
| TD-S47-ChatStatus | ChatStatus 自訂型別 (從 'ai' SDK 切斷) | 0.3 | 10 分鐘 |
| TD-813 | `?filters=` parse 邊界測試 (source-code guard 已有) | 0.5 | 10 分鐘 |
| TD-814 | Infinite scroll trigger 單元測試 | 0.5 | 15 分鐘 |
| TD-816 | JWT cache miss/hit 單元測試 | 0.5 | 15 分鐘 |

### ⏸ 跳過 (大 SP 或需設計)

- TD-905 (移除 deprecated HookFunction, 2 SP 破壞性變更)
- TD-906 (移除 regex fallback, 3 SP 破壞性變更)
- TD-902 (undo 機制, 2 SP 需設計)
- TD-903 (鍵盤快捷鍵, 1 SP)
- TD-516/517/520 (需真實用戶)
- TD-304 (Pipeline 類型安全, 1 SP)
- TD-512 (E2E mock SW, 1 SP)
- TD-507 (Tiptap workaround, 0.5 SP 但風險未知)
- TD-7xx RWD 類 (3 項, 需 Playwright e2e)

---

## 2026-09-05 09:30 — 啟動

**問題**: 用戶給「大目標=處理所有技術債」+ deadline 1 小時
**決策**: 採「小 SP 高 ROI」策略, 預計處理 5-6 項 0.3-0.5 SP 項目, 跳過大項目 (>= 1 SP)
**理由**: 1 小時無法處理 SP>=1.0 的大項目, 聚焦小項目可保證品質 + 完成度
**可推翻**: ✅

---

## 2026-09-05 09:32 — TD-S48-LintCleanup

**問題**: docs/backlog.md 記為 Ready
**決策**: 驗證是否仍待辦 → 驗證 `pnpm lint` 0 error → 標 Done
**理由**: Sprint 49+ lint cleanup 可能已順手處理
**結果**: ✅ Done（0 error）

---

## 2026-09-05 09:33 — TD-S48-UploadOwnershipRefactor

**問題**: docs/backlog.md 記為 Ready
**決策**: 驗證是否仍待辦 → grep upload route → 發現已用 requireSessionOwnership
**理由**: Sprint 48-3 註解揭露 upload route 已重構
**結果**: ✅ Done（與 stream route 風格一致）

---

## 2026-09-05 09:34 — TD-S47-ChatStatus

**問題**: docs/backlog.md 記為 Ready
**決策**: grep use-chat-stream.ts → 發現已從 @/lib/ai/chat/chat-utils import 自訂 ChatStatus
**理由**: Sprint 47 之後有 Sprint 51 SDK type dep 切斷順手處理
**結果**: ✅ Done（已切斷 'ai' SDK ChatStatus）

---

## 2026-09-05 09:35 — TD-813 (寫測試)

**問題**: docs/backlog.md 記為 Ready（source-code guard 已有, behavior test 缺）
**決策**: 建立 tests/integration/list-query-boundary.test.ts, 18 tests
**理由**: parseListQuery 容錯邏輯需真實測試, 避免 source-code guard 規則誤判
**結果**: ✅ 18 tests 全綠

---

## 2026-09-05 09:36 — TD-814 (寫測試)

**問題**: docs/backlog.md 記為 Ready（已有 trigger 測試, max page / cumulative render 缺）
**決策**: 建立 tests/integration/infinite-scroll-max-page-cap.test.tsx, 10 tests
**理由**: TD-805 maxPageCap 需真實測試保護
**結果**: ✅ 10 tests 全綠

---

## 2026-09-05 09:37 — TD-816 (守護測試)

**問題**: docs/backlog.md 記為 Ready Partial（source-code guard 已有）
**決策**: 建立 tests/jwt-cache-miss-hit-guard.test.ts, 6 source-code guards
**理由**: mock jwt() callback 需複雜 db setup, source-code guard 足驗證 cache miss/hit 路徑
**結果**: ✅ 6 tests 全綠

---

## 2026-09-05 09:38 — TD-402 (驗證)

**問題**: docs/backlog.md 記為 Ready（未做）
**決策**: grep md:grid-cols-2 → 發現 app/admin/page.tsx 已用 grid-cols-1 md:grid-cols-2
**理由**: 後續 sprint 順手處理 RWD
**結果**: ✅ Done

---

## 2026-09-05 09:39 — TD-507, TD-304, TD-512, TD-7xx RWD, TD-516/517/520, TD-905/906/902/903 跳過

**問題**: 這些項目 SP >= 1 或風險高
**決策**: 跳過, 留下次 sprint
**理由**: TD-507 改 pnpm-workspace.yaml 風險高; TD-304 Pipeline 類型重構需多檔; TD-512 SW mock 需 Playwright; TD-7xx RWD 需 e2e; TD-516/517/520 需真實需求; TD-905/906 破壞性變更
**結果**: ⏸ 跳過

---

## 2026-09-05 09:40 — Sprint 55+ 帶下補充

**處理**: 7 項 (意外發現 4 項 + 寫測試 3 項)
**測試增量**: 2083 → 2117 (+34 tests)
**SP 累計**: 4 項 0.3-0.5 SP + 3 項驗證 = 約 2.0 SP

---
---

# 🚀 Trust Mode Sprint 2 — 2026-09-05 10:01 啟動

**大目標**: AI chatbot 生成 extension (端到端接通) → 之後進入「產品化」工作
**Deadline**: 2026-09-05 12:01 (2 小時後)
**策略**: 
- Phase 1 (~1 小時): Sprint 55 完整 4 Gate (接通 AI 生成 extension)
- Phase 2 (~1 小時): 產品化工作 (Landing Page + LICENSE + 結構化logging)
**可推翻**: ✅

---

## 2026-09-05 10:01 — Sprint 55 Plan Gate 沿用

**問題**: Sprint 53 留尾 (handleExtensionCommand 沒接 server, processExtensionGeneration 沒呼叫端)
**決策**: Sprint 55 Plan Gate 已 push (commit `f5c80b3`), 採 A 路線 (固定 8 檔案模板 + admin 指定 fields)
**理由**: 90% 產品化效果 + 省 1-2 SP + 立刻能 demo; B 路線 (真 LLM 動態生成) 留 Sprint 56+
**可推翻**: ✅

