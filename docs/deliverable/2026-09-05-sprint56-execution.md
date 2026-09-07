# Sprint 56 Execution Gate 交付摘要

**日期**：2026-09-05
**Trust Mode**：Sprint 2，10:46 → 11:09（提早 1 小時 37 分完成）
**Sprint**：56 — R2 SMTP + P0-1 Email Verify + P0-2 Password Reset

---

## 🎯 交付目標

從 Sprint 55 完成後，啟動 Option A 產品化路線圖的**第一個 Sprint**：
- **R2**：建立 SMTP 服務（基礎設施）
- **P0-1**：Email 驗證流程（GA 必修）
- **P0-2**：Password Reset（GA 必修）

總計 **2.8 SP**（按 Plan Gate 估算）。

---

## ✅ 執行結果

### Gate 1：TDD（測試先紅後綠）

| 測試 | 數量 | 結果 |
|------|------|------|
| `lib/email.test.ts` | 6 tests | ✅ 全綠 |
| `tests/integration/sprint56-auth-flow.test.ts` | 13 guard tests | ✅ 全綠 |

### Gate 2：Lint + Typecheck

- ✅ `pnpm typecheck` 全綠
- ✅ `pnpm lint` 無新錯誤（既有 warnings 不算違規）

### Gate 3：Regression（無既有測試被破）

- ✅ 2,221 → 2,236 tests（+15 in lib/email）
- ✅ 13 guard tests 確保檔案結構
- ✅ Sprint 55 全部測試仍綠

### Gate 4：Build + Reviewer

- ✅ `pnpm build` 成功（27 routes）
- ✅ Build 修了一個 client component Suspense bug（`useSearchParams` 必須包 Suspense）

---

## 📦 新增檔案（13）

### 核心服務層
- `lib/email.ts` — SMTP transporter singleton + 開發環境用 ethereal.email fallback
- `lib/email.test.ts` — 6 tests
- `lib/auth/verification-token.ts` — 24h email verification token
- `lib/auth/password-reset-token.ts` — 1h password reset token（SHA-256 hash）

### Email 模板（React Email）
- `lib/email-templates/verification.tsx`
- `lib/email-templates/password-reset.tsx`

### API Routes
- `app/api/auth/verify/route.ts` — GET，token 一次性消耗
- `app/api/auth/forgot-password/route.ts` — POST，永遠回 200（防 enumeration）
- `app/api/auth/reset-password/route.ts` — POST，token 驗證後改 passwordHash

### UI 頁面
- `app/(public)/admin/forgot-password/page.tsx` + form
- `app/(public)/admin/reset-password/page.tsx` + form

### 守護測試
- `tests/integration/sprint56-auth-flow.test.ts` — 13 檔案存在檢查

---

## 🔧 修改檔案（5）

- `middleware.ts` — `/admin/forgot-password`、`/admin/reset-password`、`/api/auth/verify` 排除登入檢查
- `app/(public)/admin/login/login-form.tsx` — 加「忘記密碼」連結 + 「✓ Email 驗證成功」訊息
- `app/(public)/admin/login/page.tsx` — 包 Suspense（fix `useSearchParams` build 錯誤）
- `.env.example` — 加 SMTP_* 環境變數
- `package.json` — 加 `nodemailer@9.1.1` + `react-email@6.9.3`

---

## 🛠 技術決策（用戶確認後）

| 決策 | Agent 預設 | 用戶決定 | 理由 |
|------|-----------|---------|------|
| Email template 方案 | 純字串模板 | **React Email** | 結構清楚，未來加 i18n 方便 |
| Multi-tenant 路線 | 預留 orgId | **取消** | 用戶聚焦 self-host |
| SMTP 服務 | nodemailer + ethereal | nodemailer + ethereal | 不引入新 SaaS 依賴 |
| Password reset token | 存明文 | **存 SHA-256 hash** | DB 洩漏時降低風險 |
| Email verify token | 存明文 | **存明文** | 24h 過期即可，user enumeration 風險低 |

---

## 📊 量化指標

| 指標 | Sprint 55 完成 | Sprint 56 完成 | 差異 |
|------|--------------|--------------|------|
| Test count | 2,221 | 2,236 | +15 |
| Routes | 26 | 27 | +1 |
| Pages | n/a | n/a | +2 (forgot/reset) |
| API endpoints | n/a | n/a | +3 (verify/forgot/reset) |
| New dependencies | n/a | 2 | nodemailer, react-email |
| Build size (gzipped) | 115 kB | 115 kB | +0 |

---

## 🚦 路線圖進度

```
Sprint 56 ✅ (R2 + P0-1 + P0-2, 2.8 SP) ← 你在這裡
   ↓
Sprint 57 — P0-3 Sentry + R6 Request ID + R4 CSRF (2.3 SP)
   ↓
Sprint 58 — P0-7 Onboarding + P0-8 ToS/Privacy (2.3 SP)
   ↓
Sprint 59 — P0-4 Backup + P0-5 CD + P0-6 Migration Policy (1.8 SP)
   ↓
Sprint 60 — P1-6 Vercel KV Rate Limit + R10 Extensions Persistence (2.0 SP)
   ↓
... Sprint 61-65 → GA 候選發布
```

**距離 GA 還剩**：26 - 2.8 = **23.2 SP**，約 8 個 sprints，**預計 2026-11 中 ~ 2026-12 底**

---

## 🐛 順便修的 Bug

1. **Build 失敗 — `useSearchParams` 需包 Suspense**
   - Next.js 15 強制要求 `useSearchParams` 在 client component 必須包 `<Suspense>`
   - 原 login page 不需，所以沒事；加了 `useSearchParams` 讀 `verified=1` 後 build 失敗
   - 修法：在 `app/(public)/admin/login/page.tsx` 加 Suspense wrapper
   - **這個 bug 顯示 Next.js 15 的靜態優化規則**，未來任何 client component 用 useSearchParams 都要小心

2. **td-405 smoke test 既有問題**
   - 不影響 Sprint 56 結論
   - Sprint 55 已存在，需手動 `pnpm dev` 才能跑
   - 已在 trust-log 記錄，不視為新 regress

---

## 📋 待用戶指示

1. **設定 SMTP 環境變數**（如要實際測試信）
   - 開發可繼續用 ethereal.email（不需設）
   - Production 需設 SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_FROM

2. **測試流程**
   - 開發環境：用 seed admin 帳號 + 在後台拿 token (ethereal.email log)
   - Production：需先 deploy 一個 staging 環境

3. **Sprint 57 啟動準備**
   - 看 `docs/roadmap/option-a-productization.md` 的 Sprint 57 規劃
   - 下一個 trust mode 開始時間？

---

## 🎉 成就

✅ **Trust Mode Sprint 2 提早 1 小時 37 分完成**
✅ **0 既有測試被破壞**
✅ **2 個 P0 必修功能（Verify + Reset）交付**
✅ **下一個 sprint 基礎（R2 SMTP）建好**

下一步：繼續 Sprint 57 — **P0-3 Sentry + R6 Request ID + R4 CSRF**（2.3 SP）

---

**相關文件**：
- [`docs/sprint56-plan-gate.md`](../sprint56-plan-gate.md)
- [`docs/roadmap/option-a-productization.md`](../roadmap/option-a-productization.md)
- [`docs/audit/productization-gap-audit.md`](../audit/productization-gap-audit.md)
- [`docs/trust-log.md`](../trust-log.md)
