# Sprint 7 計劃（修正版）

> **Sprint 範圍**: Sprint 7 — CI 基礎建設
> **計劃日期**: 2026-08-24（基於本 session 盤點修正）
> **參與者**: Agent + 用戶
> **計劃級別**: Sprint
> **觸發原因**: Backlog 真實盤點發現原 Sprint 7 plan 4/5 項目早已完成

---

## 🚨 修正說明

原 Sprint 7 plan 寫 17 SP / 5 個項目，盤點後**只剩 1 個真實未做**：

| 原 plan | 修正 |
|--------|------|
| TD-514 CI workflow (2 SP) | ✅ **唯一保留** |
| TECH-006 StateMachine (5 SP) | ✅ 本 session 完成 |
| US-201 Extension hooks (3 SP) | ✅ 早已完成（盤點時發現）|
| US-202 Extension actions (3 SP) | ✅ 早已完成（盤點時發現）|
| US-203 Extension compute (3 SP) | ✅ 早已完成（盤點時發現）|
| TD-301/302 Generator TODO (1 SP) | ✅ TD-301 早已完成；TD-302 不適用 |

**修正後 Sprint 7 = 只做 TD-514 CI workflow（2 SP）**

詳細盤點見 `docs/backlog-audit-2026-08-24.md`。

---

## Sprint 總覽（修正版）

| 項目 | 數據 |
|------|------|
| 計劃完成 US | 1 個（TD-514）|
| 計劃 Story Points | 2 SP |
| Sprint 開始狀態 | 709 tests / 50 files / 4 Gate 全綠；Tech 基礎已超出預期完成度 |
| Sprint 結束狀態 | ⏳ 待執行 |
| 預估測試增量 | 0（純 CI 配置）|
| 預估 E2E 增量 | 0（但 CI 會跑現有 E2E）|

---

## 🎯 唯一工作

| 優先 | ID | 標題 | 計劃 SP | 為何排此處 |
|------|-----|------|---------|-----------|
| **P0** | **TD-514** | CI workflow：lint + typecheck + test + Playwright E2E | 2 | 沒 CI = 沒保護。Sprint 6 reflection 自己列的 P0，本 session 跳過直接做 TECH-006，現在補回。|

---

## 📋 TD-514 設計決策

### GitHub Actions Workflow 結構

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-typecheck-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: lemontree
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/lemontree?schema=ai_headless
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm vitest --run --exclude='**/td-405-extensions-admin-smoke.test.ts'
      - run: pnpm exec prisma migrate deploy
      - run: pnpm exec prisma db seed
      - run: pnpm playwright test
```

### 環境注意事項

1. **PostgreSQL service**：CI 用 docker postgres:16，避免測試依賴外部服務
2. **lockfile**：用 `--frozen-lockfile` 確保 CI 用確定版本
3. **DB 遷移**：跑 `prisma migrate deploy`（不是 `migrate dev`）+ seed
4. **E2E**：`pnpm playwright test`（用 `PLAYWRIGHT_WEBSERVER=auto` 自動起 dev server，TD-511 已配）
5. **環境敏感測試**：跳過 `td-405-extensions-admin-smoke.test.ts`（這個測試依賴實際運行環境）

---

## ⚠️ 為何以下**不**納入 Sprint 7

### US-204 訂單狀態機範例（8 SP）
- 依賴 TECH-006（本 session 已完成 ✅）
- 但 Sprint 8+ 做更穩妥（等 TD-514 CI 先把關）

### US-102-P2 動態 RBAC（5 SP）
- 依賴 US-102 Phase 1（本 session 已完成 ✅）
- 需先回答 4 個產品問題
- Sprint 8+ 做

### TD-402 RWD（0.5 SP）
- 小任務，可隨時做
- 不影響主軸
- Sprint 8 順手做

### TD-304 泛型重構（1 SP）
- Tech Debt
- 等有真實需求再做

---

## 🎯 Sprint 7 成功標準（DoD）

| 項目 | 標準 |
|------|------|
| CI yml | `.github/workflows/ci.yml` 存在且格式正確 |
| Lint | CI 跑 `pnpm lint` 全綠 |
| Typecheck | CI 跑 `pnpm typecheck` 全綠 |
| Unit Tests | CI 跑 `pnpm vitest --run` 全綠 |
| E2E | CI 跑 `pnpm playwright test` 全綠（環境敏感測試除外）|
| PR 觸發 | 開 PR 自動跑 CI |
| Push 觸發 | push main 自動跑 CI |

---

## 📊 預估產出

| 類別 | 預估 |
|------|------|
| 新檔案 | 1 個（.github/workflows/ci.yml）|
| 修改檔案 | 0（純新增）|
| 程式碼行數 | ~50 行（yml 配置）|
| 測試變化 | 0（純 CI 配置，不改測試）|

---

## 🔄 Sprint 7 之後（下個 Sprint 候選）

Sprint 7 完成後，下個 sprint 候選（**不**在本 sprint 計畫內）：

| Sprint | 候選工作 | 預估 SP |
|--------|---------|---------|
| **Sprint 8** | US-204 訂單狀態機範例 + TD-402 RWD 收尾 | 8 + 0.5 |
| **Sprint 9** | US-104 AI 模型配置 | 5 |
| **Sprint 10** | US-105 AI 對話界面 + US-108 下載 JSON | 5 + 1 |
| **Sprint 11** | US-205 審批請假單 + US-102-P2 動態 RBAC | 5 + 5 |
| **Sprint 12** | US-206 AI 生成狀態機 + US-207 Blog Extension | 8 + 3 |

---

## 🎓 本 Sprint 學到的教訓

### 1. Backlog 不等於程式碼

> 寫 Sprint plan 時**必須驗證實際程式碼**，不能只看 backlog 標籤。

### 2.「已完成但沒更新」是常見問題

> 11 個項目早已實作但 backlog 顯示待做。
> 解法：每個 sprint 結束都做盤點流程。

### 3. 規劃錯誤要立刻修正

> 我寫了錯誤的 Sprint 7 plan 後，用戶立刻發現問題（11 個項目不存在）。
> 這次誠實面對並修正，比硬撐下去好。

---

> **最後更新**：2026-08-24（盤點修正版）
> **下次檢查時機**：Sprint 7 結束時（執行 TD-514 完成後做 reflection）