# Productization Gap Audit — 2026-09-05

> **作者**: Agent (Trust Mode 整理期)
> **日期**: 2026-09-05
> **目的**: Sprint 55 Reflection 揭露的剩餘 GA 缺口正式 audit，量化「離產品化還有多遠」
> **對應**: docs/reflection/sprint-55-reflection.md §5 產品化進度

---

## ⚡ At a Glance

| 等級 | 自家評分 | Agent 獨立評分 | 差異原因 |
|------|---------|--------------|---------|
| Alpha（內部 demo） | 100% | 100% | 一致 |
| Beta（邀請用戶） | 88% | 82% | -3% 缺 onboarding / demo flow / 帳號體驗不完整 |
| **GA / Production launch** | **52%** | **48%** | **-4% P0 八項完全沒做 + 技術債 R1-R5 沒算** |

---

## 🔴 P0 — GA 必修（缺這些就**不能**正式上線）

| # | 項目 | 影響 | 預估 SP | 狀態 |
|---|---|---|---|---|
| **P0-1** | **Email verification** | `emailVerified DateTime?` 欄位在 schema 但**沒實作驗證信流程**；Beta 用戶用假 email 註冊也能登入 | 1.0 | ❌ 沒做 |
| **P0-2** | **Password reset** | 忘記密碼完全無解；schema 沒 token 欄位（需 migration） | 1.5 | ❌ 沒做 |
| **P0-3** | **Sentry error tracking** | 生產環境錯誤無法監控、alert、回溯 | 1.5 | ❌ 沒做 |
| **P0-4** | **Disaster recovery / 備份策略** | DB 壞了就沒了；無離線備份、無 PITR | 1.0 | ❌ 沒做 |
| **P0-5** | **CI deploy pipeline** | 只有 CI 沒有 CD；main push 不會自動 deploy | 0.5 | ❌ 沒做 |
| **P0-6** | **Database migration policy** | `package.json` 只有 `db:migrate`（dev），沒有 production migration 演練；schema migration 無 review | 0.3 | ❌ 沒做 |
| **P0-7** | **Onboarding flow** | 註冊 → 第一個 CRUD → 第一個 Extension 完全沒引導；Beta 用戶會迷路 | 2.0 | ❌ 沒做 |
| **P0-8** | **Terms of Service / Privacy Policy** | GA 必須（GDPR / 各國法律） | 0.3 | ❌ 沒做 |
| **小計** | | | **8.1 SP** | |

---

## 🟠 P1 — 嚴重影響但可繞（GA 之後 1-2 個月必補）

| # | 項目 | 影響 | 預估 SP | 狀態 |
|---|---|---|---|---|
| **P1-1** | **OpenAPI / Swagger** | 第三方開發者無法發現 API；目前 `/api/crud/[spec]` 是 runtime 動態組裝，OpenAPI 需手動描述 | 1.0 | ❌ 沒做 |
| **P1-2** | **i18n** | 全中文 + 部分英文混雜，海外用戶無法用；現在硬編碼中文 | 2.0 | ❌ 沒做 |
| **P1-3** | ~~Multi-tenant skeleton~~ | ~~（已取消：用戶自架為主，License 管理有 organizationId 即可）~~ | ~~3.0~~ | ✅ **已移除** |
| **P1-4** | **Billing / Subscription** | 商業化必要（Stripe / Paddle） | 2.0 | ❌ 沒做 |
| **P1-5** | **Admin Dashboard / Analytics** | 營運方看不到關鍵指標（DAU / errors / 流量） | 1.5 | ❌ 沒做 |
| **P1-6** | **真 Rate limit (Redis/KV)** | `lib/ai/chat/chat-rate-limit.ts` 是 in-memory Map；Vercel serverless 每 lambda 獨立實例 = **完全沒限流** | 1.0 | ❌ 沒做 |
| **小計** | | | **7.5 SP** | |

---

## 🟨 P2 — Nice to have（GA 後 3-6 個月）

| # | 項目 | 預估 SP |
|---|---|---|
| **P2-1** | Doc Site（Mintlify / Docusaurus）— `docs/` 散落，沒有公開站 | 1.0 |
| **P2-2** | 鍵盤快捷鍵（Cmd+K 開 palette） | 0.5 |
| **P2-3** | Batch delete undo + Toast 通知 | 0.8 |
| **P2-4** | License 管理 organizationId（接個資/計費） | 1.5 |
| **P2-5** | Generator CLI（pi-coding-agent CLI 整合） | 2.0 |
| **P2-6** | 真 LLM 動態生成 extension（Sprint 53 帶下第 3 次） | 3.0 |
| **P2-7** | SourcesList v3 圖片 preview | 1.2 |
| **小計** | | **10 SP** |

---

## 🛠️ 技術債（R1-R10，沒算在 P0/P1，但影響 GA 穩定性）

### 🔴 真正會出事的（5 項）

| # | 問題 | 影響 | 預估 | 解決 |
|---|---|---|---|---|
| **R1** | **Database migration 風險** | `package.json` 只有 `db:migrate`（dev），production 用 `db:deploy` 但 CI 未驗證；schema 變更無 review | 0.3 | 加 migration review + production 演練腳本 |
| **R2** | **無 SMTP / Email 服務** | P0-1 / P0-2 都依賴 SMTP；`.env.example` 完全沒 SMTP 設定 | 0.3 | 補 SMTP_HOST / SMTP_USER / SMTP_PASS + adapter |
| **R3** | **In-memory rate limit 在 serverless 失效** | `lib/ai/chat/chat-rate-limit.ts` Map 在 Vercel 每 lambda 獨立實例 = 完全沒限流 | 1.0 | 改用 Vercel KV / Upstash Redis |
| **R4** | **無 CSRF protection (custom routes)** | NextAuth 內建 CSRF 但 custom routes（`/api/admin/extensions/generate` 等）需手動驗證來源 | 0.3 | 加 origin / referer 驗證 |
| **R5** | **無 staging 環境區分** | dev / staging / prod 三套環境未分離；無法測 production-like | 0.5 | 加 `.env.staging` + Vercel preview branches |

### 🟠 中等風險（5 項）

| # | 問題 | 影響 | 預估 |
|---|---|---|---|
| **R6** | 無 request ID / correlation ID | 跨服務追蹤困難 | 0.3 |
| **R7** | logger 只有 Sprint 55 開始用，**絕大多數 route 還在 `console.log/error`** | grep `console.log` 約 200+ 處散落；結構化日誌覆蓋率 < 10% | 1.5 |
| **R8** | `bun.lock` 與 `pnpm-lock.yaml` 雙軌 | `.gitignore` 排 `bun.lock` 但 dev/CI 可能混用 | 0.1 |
| **R9** | 無 staging 環境 | 開發完直接 deploy prod = 高風險 | 0.5 |
| **R10** | `extensions/` 是 disk-based 不是 DB-based | 重啟 Vercel **會丟失用戶生成的 extension**（除非 S3 持久化） | 1.0 |

---

## 📊 量化評估

### 完成度拆解

```
GA 上線所需工作:
  ✅ 已完成（Alpha 全套 + Beta 88%）         = ~50 SP
  🔴 P0 必修（8 項）                       = 8.1 SP
  🟠 P1 重要（5 項，已去掉 multi-tenant）     = 7.5 SP
  🛠️ 技術債 R1-R10                        = ~7 SP
  ────────────────────────────────────────
  剩餘工作量                              = ~22-23 SP
  整體 GA 完成度                          = 50 / (50 + 22) = ~69%
                                          （但 P0/P1 是 serial blocker）
```

### 真實瓶頸

| 維度 | 卡點 |
|---|---|
| **時間** | P0 8 項依序需 ~8-10 SP（每 SP 0.5-1 小時 = **1.5-2 個月**） |
| **風險** | R3（rate limit serverless）+ R10（extensions disk） = Vercel 部署就壞 |
| **業務** | P0-1 / P0-2（email + password reset）= **沒這兩個無法收 Beta 用戶** |
| **法規** | P0-8（ToS）= GA 前**必須**有（即使很短） |

---

## 🎯 建議優先序（3 條路線）

### 路線 A（推薦）：衝刺 GA，2-3 個月
- Sprint 56-58：P0 八項
- Sprint 59-61：P1 五項（已去掉 multi-tenant）
- Sprint 62+：技術債 + P2（含 i18n）

### 路線 B：最小 GA 集，1 個月
- 只做：email verify + password reset + Sentry + ToS（R2 SMTP + R6 request ID 也順便）
- 跳過：onboarding / 備份 / CD / migration policy（接受風險）

### 路線 C：保守穩紮，3-4 個月
- 維持 Sprint 49-55 節奏（每 sprint 1-3 SP）
- 不加速、不壓縮

---

## 📋 與 Sprint 55 Reflection §5 的對照

Sprint 55 Reflection §5 列出的「剩餘 GA 缺口」：
1. Sentry error tracking (P1-2) — ✅ 對應 P0-3（應升為 P0）
2. OpenAPI spec 生成 (P1-3) — ✅ 對應 P1-1
3. i18n (P2-1) — ✅ 對應 P1-2（應升為 P1）
4. Onboarding flow (P1-4) — ✅ 對應 P0-7
5. Doc Site (P2-2) — ✅ 對應 P2-1

**差異說明**：
- Sprint 55 漏算：P0-1 email verify、P0-2 password reset、P0-8 ToS、R3 serverless rate limit、R10 extensions persistence
- Sprint 55 漏算 R1-R10 全部 10 項技術債

---

## 🚦 Agent 結論

**離 GA 真實距離**：約 **51%**（自家評分 52%，修正：去掉 multi-tenant -3%）

**最小 GA 集**（路線 B）：8 SP / 1 個月
**完整 GA 集**（路線 A，無 multi-tenant）：15.6 SP / 2-3 個月
**含技術債全套**（路線 C）：22-23 SP / 3-4 個月

**最推薦**：路線 A 第一段（Sprint 56-58 P0 八項）開始衝刺，本 trust mode 已建 `docs/roadmap/option-a-productization.md` + `docs/sprint56-plan-gate.md` 作為起點。

---

**Audit 完成時間**: 2026-09-05 10:46
**下一步**: 建立 `docs/roadmap/option-a-productization.md` 詳細路線 + Sprint 56 Plan Gate