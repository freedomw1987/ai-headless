# Option A 產品化路線圖

> **日期**: 2026-09-05
> **路線**: A — 衝刺 GA，2-3 個月完成 P0 + P1
> **起點**: Sprint 56（Sprint 55 完成 AI 生成 extension 端到端後）
> **對應 audit**: [docs/audit/productization-gap-audit.md](../audit/productization-gap-audit.md)

---

## 🎯 路線 A 目標

**2-3 個月內讓 ai-headless 達到 GA 可上線狀態**，包含：
- 所有 GA 必修 P0 8 項
- 主要 P1 6 項
- 修正 5 項關鍵技術債（R1-R5）

**最終驗收標準**：可邀請付費用戶、可計費、可承擔法規責任、可監控錯誤。

---

## 📅 Sprint 排程（每 sprint ~1 週節奏）

| Sprint | 期間 | 範圍 | SP | 累計 |
|---|---|---|---|---|
| **Sprint 56** | W+1 | **P0-1 email verify** + **P0-2 password reset** + R2 SMTP 設定 | 2.8 | 2.8 |
| **Sprint 57** | W+2 | **P0-3 Sentry** + R6 request ID + R4 CSRF | 2.3 | 5.1 |
| **Sprint 58** | W+3 | **P0-7 Onboarding flow** + **P0-8 ToS / Privacy** | 2.3 | 7.4 ✅ |
| **Sprint 59** | W+4 | **P0-4 備份策略** + **P0-5 CD** + **P0-6 migration policy** | 1.8 | 9.2 |
| **Sprint 60** | W+5 | **P1-6 真 rate limit (Vercel KV)** + **R10 extensions persistence** | 2.0 | 11.2 |
| **Sprint 61** | W+6 | **P1-1 OpenAPI / Swagger** + **P1-5 Admin Dashboard** | 2.5 | 13.7 |
| **Sprint 62** | W+7 | **P1-2 i18n 預備**（不做 multi-tenant，用戶自架為主） | 2.0 | 15.7 |
| **Sprint 63** | W+8 | **P1-4 Billing skeleton** + R9 staging 環境 + 整合測試 | 3.0 | 18.7 |
| **Sprint 64** | W+9 | 🛠️ R7 logger 全面替換 + R1 production migration 演練 + E2E 補強 | 2.5 | 21.2 |
| **Sprint 65** | W+10 | 🎯 **GA 候選發布** + 文件完整化 + Beta 用戶試用 | 2.0 | 23.2 |

**總計**: ~10 個 sprint × ~1 週 = **2.5 個月**（多 tenant 取消後總 SP 從 26.2 減為 23.2）

---

## 🎯 Sprint 56 詳細範圍（起點）

### P0-1 Email Verification（1.0 SP）

**目標**：用戶註冊後收到驗證信，點擊連結啟用帳號

**範圍**：
- Schema 加 `VerificationToken` model
- 註冊流程產生 token，寄信（含驗證 URL）
- `/api/auth/verify?token=xxx` endpoint
- middleware 阻擋未驗證用戶訪問 `/admin/*`
- Resend 驗證信功能
- Email template（簡單 HTML）

**相依**：R2 SMTP 設定（需先建）

---

### P0-2 Password Reset（1.5 SP）

**目標**：用戶忘記密碼可收重置信重設

**範圍**：
- Schema 加 `PasswordResetToken` model
- `/admin/forgot-password` 頁面（輸入 email）
- `/api/auth/forgot-password` POST（產生 token + 寄信）
- `/admin/reset-password?token=xxx` 頁面
- `/api/auth/reset-password` POST（驗 token + 改密碼）
- Email template
- Token 過期時間（1 小時）

---

### R2 SMTP 設定（0.3 SP）

**目標**：補齊 email 服務基礎設施

**範圍**：
- `.env.example` 加 SMTP_HOST / SMTP_USER / SMTP_PASS / SMTP_FROM
- `lib/email.ts` 包用 nodemailer（輕量、SSR 友善）
- development 環境用 ethereal.email（fake SMTP）
- production 用 Resend / SendGrid

**為何排在 Sprint 56**：P0-1 + P0-2 都需要

---

## ⚠️ 風險與緩解

| 風險 | 緩解 |
|---|---|
| SMTP 在 dev 環境難測 | 用 ethereal.email fake SMTP + 完整單元測試 |
| 密碼 reset 被暴力枚舉 | 固定回應時間（timing-safe）+ rate limit |
| Email template HTML 相容性 | 用 React Email 元件庫（若不引入則純 MJML-like 字串）|
| 沒真實 email 收信 | 開發用 ethereal 預覽連結；CI 用 mock SMTP |
| Token 過期 / 一次性 | DB 強制 unique + 過期時間檢查 + 一次性使用後刪除 |

---

## 📊 驗收標準

Sprint 56 完成後：
- ✅ 新用戶註冊必收到驗證信
- ✅ 點擊驗證連結後可登入 `/admin`
- ✅ 用戶點「忘記密碼」可收重置信
- ✅ 點擊重訊息連結可重設密碼
- ✅ 全部流程有 vitest 整合測試（成功 + 失敗 + 過期）
- ✅ E2E 有至少 2 條 Playwright 守護（驗證 + 重設）
- ✅ 結構化 logger 補齊 email 相關 routes
- ✅ 4 Gate 全綠

---

## 🔄 與既有 sprint 節奏整合

每個 Option A sprint 維持：
- Plan Gate（寫 `docs/sprintXX-plan-gate.md`）
- Design Gate（必要時寫 `docs/sprintXX-design-gate.md`）
- Execution Gate（4 Gate SOP）
- Submit Gate + Reflection

**Trust Mode 結束後**：
- Sprint 56 Plan Gate 已存在於 `docs/sprint56-plan-gate.md`
- 用戶可指示開始 Sprint 56（執行階段）
- 或繼續 trust mode 把 Sprint 57 也做完

---

## 📚 參考文件

- [docs/audit/productization-gap-audit.md](../audit/productization-gap-audit.md) — GA 缺口 audit
- [docs/backlog.md](../../backlog.md) — Backlog 主表（會持續更新 Option A 進度）
- [docs/sprint56-plan-gate.md](../sprint56-plan-gate.md) — Sprint 56 詳細 Plan Gate
- [docs/trust-log.md](../../trust-log.md) — Trust Mode 決策紀錄

---

**路線圖建立時間**: 2026-09-05 10:48
**狀態**: ✅ Option A 路線圖完成，等用戶指示執行 Sprint 56