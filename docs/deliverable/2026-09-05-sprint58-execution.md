# Sprint 58 Execution Gate 交付摘要

**日期**：2026-09-05
**Trust Mode**：Sprint 4，17:52 → 18:07（提早 1 小時 45 分完成）
**Sprint**：58 — P0-7 Onboarding + P0-8 ToS / Privacy

---

## 🎯 交付目標

從 Sprint 57 完成後，繼續 Option A 路線圖的**第三個 Sprint**：
- **P0-7 Onboarding**：新用戶註冊 + 首次體驗引導
- **P0-8 ToS / Privacy**：法律合規（GDPR / CCPA）

總計 **2.3 SP**。

---

## ✅ 執行結果

### Gate 1：TDD

| 測試檔 | 數量 | 結果 |
|--------|------|------|
| `lib/legal.test.ts` | 7 tests | ✅ |
| `tests/integration/sprint58-onboarding.test.ts` | 14 guard tests | ✅ |

### Gate 2：Lint + Typecheck

- ✅ `pnpm typecheck` 全綠
- ✅ `pnpm lint` 無新錯誤

### Gate 3：Regression

- ✅ 2,287 → **2,308 tests**（+21 新測試）
- ✅ 4 skipped（pre-existing dev server smoke test）

### Gate 4：Build + E2E

- ✅ `pnpm build` 成功（51 routes）
- ✅ **Register E2E**：
  - 正常註冊 → **201** + userId
  - 重複 email → **409** 「此 email 已被註冊」
  - 不勾 ToS → **400** 「請同意服務條款」
- ✅ **頁面渲染測試**：
  - `/legal/terms` → 中文條款
  - `/legal/privacy` → 含 Sentry 等關鍵字
  - `/legal/terms?lang=en` → 英文版
  - `/admin/register` → 註冊表單
- ✅ CSRF 保護生效（register 走 `apiFetch` 帶 token）

---

## 📦 新增檔案（15）

### P0-7 Onboarding
- `app/api/auth/register/route.ts` — POST register API
- `app/api/user/onboarding/route.ts` — POST onboarding step update
- `app/(public)/admin/register/page.tsx` — 註冊頁
- `app/(public)/admin/register/register-form.tsx` — 註冊表單
- `app/(admin)/admin/onboarding/page.tsx` — onboarding wizard 頁
- `components/admin/onboarding-banner.tsx` — 顯示在 `/admin` 頂部
- `components/admin/onboarding-wizard.tsx` — 4 步驟 wizard

### P0-8 ToS / Privacy
- `content/legal/_meta.json` — 版本 + 生效日期 meta
- `content/legal/terms.zh-TW.md` — 繁中 ToS（10 條款）
- `content/legal/terms.en.md` — 英文 ToS
- `content/legal/privacy.zh-TW.md` — 繁中 Privacy
- `content/legal/privacy.en.md` — 英文 Privacy
- `app/(public)/legal/terms/page.tsx` — ToS 顯示頁（含 i18n 切換）
- `app/(public)/legal/privacy/page.tsx` — Privacy 顯示頁
- `lib/legal.ts` — 載入 markdown + meta

### DB
- `prisma/migrations/20260905180000_sprint58_user_legal/migration.sql` — 加 4 欄位

### 測試
- `lib/legal.test.ts` — 7 tests
- `tests/integration/sprint58-onboarding.test.ts` — 14 guard tests

---

## 🔧 修改檔案（4）

- `prisma/schema.prisma` — User 加 `onboardingStep` / `acceptedTosVersion` / `acceptedPrivacyVersion` / `tosAcceptedAt`
- `middleware.ts` — `/admin/register` 為 public route
- `app/admin/page.tsx` — 顯示 `OnboardingBanner`
- `app/(public)/admin/login/login-form.tsx` — 加「建立新帳號」連結
- `instrumentation.ts` — 加 Sentry `onRequestError` hook（Sprint 57 留下的建議）

---

## 🛠 技術決策

| 項目 | 決定 | 理由 |
|------|------|------|
| Register 開放程度 | 開放，須 email verify 才能登入 | 降低 spam 摩擦 |
| 預設 role | viewer | 最小權限 |
| Wizard 可跳過 | 是 | 既有用戶不需要 |
| ToS 內容來源 | Agent 起草（標準 SaaS 模板）| 4 個 markdown |
| Markdown 解析 | `gray-matter` | 處理 frontmatter（title/version/effectiveDate）|
| Register API 用 CSRF | 是（透過 apiFetch） | 防 spam 跨站攻擊 |
| Onboarding 步驟 | 4 步（profile / extension / ai-config / chat） | 引導新用戶 |
| Banner 顯示條件 | emailVerified==null 或 step<99 | 兩種情境 |
| 條款版本控制 | `_meta.json` + DB 記錄 | GDPR 要求 |

---

## 🐛 過程中發現 / 修復的問題

### 1. gray-matter 需要新依賴
- 加 `gray-matter@4.0.3` 解析 markdown frontmatter
- pnpm install 後 tsc 仍找到 @types

### 2. floating promises in client components
- `useEffect(() => { ensureCsrfToken(); })` 觸發 ESLint 錯誤
- `fetch().then()` 也是
- 修法：所有 fire-and-forget 加 `void`

### 3. Sentry 建議加 `onRequestError` hook
- Sprint 57 build 時 Sentry warning
- Sprint 58 順便補上（Sprint 57 的負債）
- 仍剩 `global-error.js` 建議（選擇性，不急）

### 4. wizard setStep type inference
- `useState<Math.max(1, Math.min(4, initialStep)) as Step>` TS 報錯
- 修法：先 `as Step` 後傳入

---

## 📊 量化指標

| 指標 | Sprint 57 | Sprint 58 | 差異 |
|------|-----------|-----------|------|
| Tests | 2,287 | **2,308** | +21 |
| Routes | 28 | **31** | +3 (/admin/register, /legal/terms, /legal/privacy) |
| Content files | 0 | 5 | +5 (4 md + 1 meta) |
| New migrations | 1 | 2 | +1 (sprint58_user_legal) |

---

## 🔒 合規 / 安全提升

### Before Sprint 58
- ❌ 沒有 Register API（只能 seed admin）
- ❌ 沒有 ToS / Privacy（GDPR 不合規）
- ❌ 新用戶無引導（直接空 admin shell）

### After Sprint 58
- ✅ 開放註冊（須 email verify）
- ✅ ToS + Privacy 公開頁（雙語）
- ✅ 用戶同意版本號寫入 DB（audit trail）
- ✅ Onboarding wizard 4 步驟（可跳過）
- ✅ Email 未驗證時顯示 banner
- ✅ Register API 受 CSRF 保護（防止跨站 spam）

---

## 🚦 路線圖進度

```
✅ Sprint 55 (2,221)
✅ Sprint 56 (2,236) — R2 SMTP + P0-1 Verify + P0-2 Reset
✅ Sprint 57 (2,287) — P0-3 Sentry + R6 RequestID + R4 CSRF
✅ Sprint 58 (2,308) — P0-7 Onboarding + P0-8 ToS/Privacy  ← 完成！
   ↓
Sprint 59 — P0-4 Backup + P0-5 CD + P0-6 Migration Policy (1.8 SP)
Sprint 60 — P1-6 Vercel KV Rate Limit + R10 Extensions Persistence (2.0 SP)
Sprint 61 — P1-1 OpenAPI / Swagger + P1-5 Admin Dashboard (2.5 SP)
... Sprint 65 → GA 候選發布
```

**離 GA 還剩**：26 - 2.8 - 2.3 - 2.3 = **18.6 SP**，約 6-7 個 sprints

---

## 📋 待用戶指示

1. **內容法務審查**
   - 4 個 markdown 文件（zh-TW + en ToS/Privacy）
   - 聯絡信箱 `legal@ai-headless.local` / `privacy@ai-headless.local` — 需改成實際信箱

2. **Sprint 59 啟動準備**
   - 下一個 sprint = P0-4 Backup + P0-5 CD + P0-6 Migration Policy
   - 重頭戲：CI/CD 自動化 + DB 備份機制
   - 建議 deadline 2-2.5 小時（CD 配置 + backup script + migration policy doc）

3. **驗收方式**
   - 訪問 `/admin/register` → 填表 → 看到「請查收驗證信」
   - 訪問 `/legal/terms` / `/legal/privacy` → 看內容
   - 註冊新用戶後看 `/admin` 是否有 banner

---

## 🎉 成就

✅ **Trust Mode Sprint 4 提早 1 小時 45 分完成**
✅ **0 既有測試被破壞**
✅ **Register E2E 全綠**（3/3 測試案例通過）
✅ **GDPR 合規基礎建立**（ToS/Privacy + 版本控制）
✅ **順手清掉 Sprint 57 的 Sentry warning**

下一步：繼續 Sprint 59 — **P0-4 Backup + P0-5 CD + P0-6 Migration Policy**（1.8 SP）

---

**相關文件**：
- [`docs/sprint58-plan-gate.md`](../sprint58-plan-gate.md)
- [`docs/roadmap/option-a-productization.md`](../roadmap/option-a-productization.md)
- [`docs/trust-log.md`](../trust-log.md)
- [`content/legal/_meta.json`](../../content/legal/_meta.json)