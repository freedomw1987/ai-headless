# Sprint 59 Plan Gate — P0-4 Backup + P0-5 CD + P0-6 Migration Policy + P0-7 dev DB Baseline

**建立日期**：2026-09-05
**最後更新**：2026-09-07（加 P0-7 dev DB baseline，源於 Sprint 23-58 pending migrations 揭露）
**預估 SP**：2.1（原 1.8 + P0-7 0.3）
**對應路線**：Option A（產品化路線）
**前導**：Sprint 58 ✅

---

## 0. ⚠️ 前置修復 — P0-7 dev DB Baseline + Migrate History（0.3 SP）

### 為什麼加這個

2026-09-07 發現 dev DB 從 Sprint 23 起 **11 個 migration 從未套用**，導致：

- `users.roleId` 缺失 → `JWTSessionError` → admin 無法登入
- `roles` / `permissions` tables 是空 → RBAC 空轉 → 「無權限」
- Sprint 58 用戶 onboarding / legal 欄位不可用

本次修復：跑了 `prisma db push` 補 schema + 手動跑 RBAC seed SQL（修 admin 登入），但 **migration history 仍壞**（11 個仍標 pending）—— Sprint 59 開工前必須先修復。

### 0.1 問題

| 項目 | 現狀 | 風險 |
|------|------|------|
| Schema 缺失 | ✅ 已修（`prisma db push`）| — |
| RBAC seed data | ✅ 已修（手動跑 3 個 seed SQL）| — |
| Migration history | ❌ 11 個仍 pending | `migrate deploy` 會誤判 / 新 dev 無法重現 |
| CI gate | ❌ 沒有 | 下次 sprint 仍會再次發生 |

### 0.2 目標

1. `prisma migrate status` 顯示「No pending migrations」
2. 其他 dev 環境可一鍵重現 RBAC seed（不必手動跑 SQL）
3. CI 自動擋 pending migration PR

### 0.3 範圍

1. **修正 migration history**（標記已套用的 migration 為 resolved）
   ```bash
   for m in 20260826120000_baseline_rbac \
            20260826120100_seed_baseline_rbac \
            20260826120200_backfill_user_role_id \
            20260826130000_backfill_extension_permissions \
            20260830093252_add_blog_cover_url \
            20260830150957_sprint44_chat_sessions_index \
            20260830151015_sprint44_chat_messages_index \
            20260830162750_sprint46_attachments \
            20260830180000_sprint43_ai_config_v2 \
            20260831090000_sprint44_placeholder_cleanup \
            20260905180000_sprint58_user_legal; do
     pnpm prisma migrate resolve --applied "$m"
   done
   ```

2. **`prisma/seed-rbac.sql`** — 整合 RBAC seed SQL（idempotent）
   - 整合 3 個 baseline migration 的 INSERT 語句
   - 含 `ON CONFLICT DO NOTHING`，可重複跑
   - 其他 dev / CI / staging 環境一鍵執行

3. **`scripts/check-prisma-migrations.sh`** — CI gate script
   - 跑 `prisma migrate status`
   - 有 pending migration → exit 1
   - 在 CI 跑，PR 不能 merge

4. **`.github/workflows/ci.yml`** 補完（migration check step）
   - 加 `bash scripts/check-prisma-migrations.sh`
   - 失敗 → PR block

### 0.4 不做

- 重做 baseline_rbac migration（DB 已 sync 過，重做沒意義）
- 自動重跑 seed（idempotent 已夠，自動化反而引入複雜度）

### 0.5 為什麼放在 Sprint 59 而不獨立 sprint

- 0.3 SP 太小，獨立 sprint 浪費 overhead
- Sprint 59 本身有 P0-6 migration policy 主題，這是 P0-6 的前置
- 不修這個 → Sprint 59 一開工就壞（DB state 混亂 → migration safety 檢查 baseline 都不準）

### 0.6 預估 SP 細目

| 任務 | 預估 | 備註 |
|------|------|------|
| 修正 11 個 migration history | 0.05 SP | 一行 bash 迴圈 |
| `prisma/seed-rbac.sql` | 0.1 SP | 整合既有 3 個 migration SQL |
| `scripts/check-prisma-migrations.sh` | 0.1 SP | CI gate script |
| CI workflow 補完 | 0.05 SP | 一個 step |
| **小計** | **0.3 SP** | |

---

## 1. 為什麼這 4 件事放一起？

| 項目 | 性質 | 為什麼一起做 |
|------|------|-------------|
| **P0-7 dev DB Baseline** | Dev 必修 | Sprint 59 開工前置（修 migration history） |
| **P0-4 Backup** | Ops 必修 | DB 資料是最重要的資產 |
| **P0-5 CD** | DevOps 必修 | 部署自動化是 GA 前必備 |
| **P0-6 Migration Policy** | 治理必修 | DB schema 變更要可追蹤、可回滾 |

四者都是「沒出事沒人想，做了救你一命」類型，跨 Dev/Infra/Governance。

---

## 2. P0-4 Backup 策略（0.7 SP）

### 目標

建立 production DB（PostgreSQL）自動備份機制，包含備份執行 + 保留策略 + 還原流程。

### 範圍

1. **`scripts/backup-db.sh`** — Cron 排程的備份腳本
   - 支援兩種 DB：local Postgres / Neon Postgres
   - 使用 `pg_dump` 產出 `.sql.gz`
   - 上傳到 S3（或本地 `./backups/` for dev）
   - 命名規則：`ai-headless-YYYY-MM-DD-HHMM.sql.gz`

2. **`scripts/restore-db.sh`** — 還原腳本
   - 從 `.sql.gz` 還原
   - 含安全確認（require 環境變數 `CONFIRM_RESTORE=1`）

3. **`docs/operations/backup-strategy.md`** — 完整文件
   - 排程建議：每日 03:00 UTC
   - 保留策略：7 daily + 4 weekly + 3 monthly
   - 還原 RTO / RPO 目標
   - 監控：Sentry + Slack alert

4. **GitHub Actions workflow** — `.github/workflows/backup.yml`
   - 每日排程備份
   - 自動上傳到 S3
   - 失敗通知

### 不做

- 自動化還原測試（災難演練，建議每季人工跑）
- 跨 region 備份（self-host 預設單 region）
- 加密 at-rest（S3 自帶 KMS）

### 設計決定

| 問題 | 決定 | 理由 |
|------|------|------|
| 備份頻率 | 每日 03:00 UTC | 夜間離峰 |
| 保留 | 7+4+3（GFS 模式）| 業界標準 |
| 存哪 | S3（生產）/ 本地（dev） | 生產建議 |
| 驗證 | 自動跑 `pg_restore --list` 確認檔案有效 | 避免壞檔 |
| 監控 | Sentry + GitHub Actions status | 兩路通知 |

---

## 3. P0-5 CD（Continuous Deployment）（0.7 SP）

### 目標

建立 staging + production 環境的自動化部署流程，含 PR preview。

### 範圍

1. **`.github/workflows/ci.yml`**（既有基礎上補完）
   - Test + Typecheck + Lint + Build
   - 失敗 → 阻擋 merge

2. **`.github/workflows/deploy-staging.yml`**
   - main branch push → auto deploy to staging
   - 用 Vercel Deploy Hook 或 Vercel GitHub integration

3. **`.github/workflows/deploy-production.yml`**
   - Release tag (e.g. `v0.1.0`) → manual approval → deploy to prod
   - 含 migration step（見 P0-6）

4. **`vercel.json`** 完善（既有）
   - 環境變數 schema
   - Build command
   - Region 設定

5. **`docs/operations/deployment.md`** — 部署指南
   - Staging 流程
   - Production 流程（tag + approval）
   - Rollback 流程（`vercel rollback`）

### 不做

- Canary deployment（GA 後再做）
- Blue-green（Vercel 自動處理）
- 多 region（self-host 預設單 region）

### 設計決定

| 問題 | 決定 | 理由 |
|------|------|------|
| 觸發方式 | tag push (e.g. `v0.1.0`) | 顯式、reproducible |
| Staging | auto on main | 每次 merge 都驗證 |
| Production | manual approval | 加一道防護 |
| Rollback | Vercel dashboard 或 CLI | 業界標準 |
| Migration | deploy 前跑（見 P0-6）| 防止 schema 不一致 |

---

## 4. P0-6 Migration Policy（0.4 SP）

### 目標

規範 DB schema 變更的開發流程，避免「production 跑壞」。

### 範圍

1. **`docs/operations/migration-policy.md`** — 政策文件
   - **規則**：
     - 所有 schema 變更必須透過 `prisma migrate dev` 產生 migration
     - 不接受手動 `db push` 到 production
     - Migration 必須 backward-compatible（含 deploy 階段）
     - 不可逆 migration 需「expand-migrate-contract」3 階段
   - **流程**：
     1. 開發：`prisma migrate dev --name xxx`
     2. 測試：CI 跑 `prisma migrate deploy` 在 staging DB
     3. 部署：prod deploy 前跑 `prisma migrate deploy`
     4. 驗證：deploy 後檢查 row count + sample query

2. **`scripts/check-migration-safety.sh`** — CI 檢查腳本
   - 檢查 migration SQL 是否含 `DROP COLUMN` / `DROP TABLE`
   - 如有，警告（不阻擋，但 review 重點）

3. **PR template** 更新
   - 加 checkbox：「Migration: yes / no / breaking」
   - 如 breaking，需 @dba reviewer

### 不做

- 自動 expand-contract 工具（先政策，工具 GA 後做）
- Migration 加密（schema 不該加密）
- 完整 SQL review（用 prisma 已經擋掉大部分）

### 設計決定

| 問題 | 決定 | 理由 |
|------|------|------|
| 強制執行 | CI 警告 + review（不阻擋） | 實務上 review 比自動化可靠 |
| Breaking change 流程 | 3 階段 expand-contract | 業界標準，避免 downtime |
| Downtime 容忍 | 0（零 downtime 為目標） | Schema 變更須 backward-compat |
| 誰 reviewer | tech lead | （用戶決定）|

---

## 5. 風險與緩解

| 風險 | 衝擊 | 緩解 |
|------|------|------|
| 備份失敗無通知 | 高 | Sentry + GH Actions 失敗自動通知 |
| Deploy 跑壞 production | 高 | manual approval + auto rollback |
| Migration 不可逆 | 高 | 3 階段 policy + CI 警告 |
| 沒還原演練 | 中 | 文件 + 每季手動測試提醒 |

---

## 6. Gate 清單

- [ ] **Plan Gate** — 本文件建立
- [ ] **Design Gate** — 介面 / 文件結構 / 測試設計
- [ ] **Execution Gate 1 (TDD)** — 測試先紅後綠
- [ ] **Gate 2 (Lint/Typecheck)** — typecheck + lint
- [ ] **Gate 3 (Regression)** — 全測試綠
- [ ] **Gate 4 (Reviewer)** — build 成功 + 手動確認 script 可執行

---

## 7. SP 細目

| 任務 | 預估 | 備註 |
|------|------|------|
| P0-7 migrate resolve 11 個 | 0.05 SP | 一行 bash 迴圈 |
| P0-7 prisma/seed-rbac.sql | 0.1 SP | 整合既有 3 個 migration SQL |
| P0-7 check-prisma-migrations.sh | 0.1 SP | CI gate script |
| P0-7 CI workflow 補完 | 0.05 SP | 一個 step |
| P0-4 backup-db.sh + restore-db.sh | 0.3 SP | 含 S3 上傳 |
| P0-4 GitHub Actions backup.yml | 0.2 SP | 每日排程 |
| P0-4 backup-strategy.md | 0.2 SP | 完整文件 |
| P0-5 ci.yml + deploy-staging.yml + deploy-production.yml | 0.4 SP | 3 個 workflow |
| P0-5 deployment.md | 0.2 SP | 部署指南 |
| P0-5 vercel.json 完善 | 0.1 SP | 既有檔案優化 |
| P0-6 migration-policy.md | 0.2 SP | 政策文件 |
| P0-6 check-migration-safety.sh | 0.1 SP | CI 警告腳本 |
| P0-6 PR template | 0.1 SP | checkbox |
| **總計** | **2.1 SP** | （原 1.8 + P0-7 0.3）|

---

## 8. 檔案計劃

### 新增

**腳本**
- `scripts/backup-db.sh`
- `scripts/restore-db.sh`
- `scripts/check-migration-safety.sh`
- `scripts/check-prisma-migrations.sh` ← **P0-7**

**Workflows**
- `.github/workflows/backup.yml`
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/deploy-production.yml`

**Docs**
- `docs/operations/backup-strategy.md`
- `docs/operations/deployment.md`
- `docs/operations/migration-policy.md`
- `prisma/seed-rbac.sql` ← **P0-7**（SQL 檔不是 doc）

**測試**
- `tests/integration/sprint59-ops.test.ts`（guard tests）

### 修改

- `.github/workflows/ci.yml`（補完）
- `vercel.json`（完善）
- `.github/PULL_REQUEST_TEMPLATE.md`（加 migration checkbox）

---

## 9. 依賴

- 既有：pnpm, prisma, Vercel CLI
- 不引入新依賴（純 bash + GitHub Actions）

---

## 10. 完成定義

### P0-7 完成定義（前置，先做）

- [ ] `pnpm prisma migrate status` 顯示「No pending migrations」
- [ ] `bash scripts/check-prisma-migrations.sh` 在乾淨 dev DB 跑 → exit 0
- [ ] `psql -f prisma/seed-rbac.sql` 在空 DB 跑 → roles + permissions 有資料
- [ ] CI workflow 加 migration check step，PR 跑成功
- [ ] （手動驗證）在新 clone 的 repo 跑 migrate + seed → dev DB 可用

### P0-4 / P0-5 / P0-6 完成定義

- [ ] `pnpm typecheck` 全綠
- [ ] `pnpm lint` 無新錯誤
- [ ] `pnpm test` 2,308 → ~2,330 tests
- [ ] `pnpm build` 成功
- [ ] 手動測試：
  - [ ] `bash scripts/backup-db.sh` 在 dev DB 跑成功
  - [ ] `bash scripts/check-migration-safety.sh` 在現有 migration 上跑成功
  - [ ] 讀 `docs/operations/` 三個文件理解流程

---

## 11. 待用戶決定

開始執行前需要確認：

1. **備份儲存位置**
   - Agent 推薦：**生產用 S3 / 開發用本地**
   - 備註：需提供 S3 bucket 名 + IAM credentials

2. **Production deploy 觸發方式**
   - Agent 推薦：**Git tag push + manual approval**
   - 備註：tag push 比 branch 更顯式，避免誤 deploy

3. **Migration reviewer**
   - Agent 推薦：**breaking change 需要 @tech-lead review**
   - 備註：可後續調整

4. **Trust Mode deadline**
   - Agent 推薦：**2 小時**
   - 理由：3 個 workflow + 3 個文件 + 3 個 script + 1 個 PR template

如果用戶都不修正 → 採 Agent 推薦值開始執行

---

**參考**：
- [`docs/roadmap/option-a-productization.md`](roadmap/option-a-productization.md)
- [`docs/audit/productization-gap-audit.md`](audit/productization-gap-audit.md)
- [`docs/sprint58-plan-gate.md`](sprint58-plan-gate.md) — 前一個 sprint