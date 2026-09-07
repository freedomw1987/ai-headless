# Sprint 58 Plan Gate — P0-7 Onboarding + P0-8 ToS / Privacy

**建立日期**：2026-09-05
**預估 SP**：2.3
**對應路線**：Option A（產品化路線）
**前導**：Sprint 57 ✅

---

## 1. 為什麼這 2 件事放一起？

| 項目 | 性質 | 為什麼一起做 |
|------|------|-------------|
| **P0-7 Onboarding** | GA 必修 | 第一印象（empty state + walkthrough） |
| **P0-8 ToS / Privacy** | GA 必修 | 法律合規 — GDPR / CCPA 要求 |

兩個都影響「第一次用」的體驗。

---

## 2. P0-7 Onboarding Flow（1.3 SP）

### 目標

新用戶註冊後（或現有用戶第一次登入）看到結構化 onboarding，引導他們完成首次設定。

### 範圍

1. **`/api/auth/register`** API route
   - POST `{ email, password, name, acceptTos, acceptPrivacy }`
   - 自動建立 User（role=viewer，isActive=true）
   - 自動建立 VerificationToken（24h 過期）
   - 寄驗證信（同 Sprint 56 的模板）
   - 回 201

2. **`/admin/register`** 頁面 + form
   - 表單欄位：email、password、name、ToS checkbox、Privacy checkbox
   - 客戶端驗證（zod + react-hook-form）
   - 註冊成功 → 顯示「請查收驗證信」畫面
   - 驗證信連結 → `/api/auth/verify` → 標記 emailVerified → redirect 到 login

3. **Empty state for `/admin`**
   - 偵測 `User.emailVerified = null` → 顯示「請驗證 email」banner
   - 偵測 extensions 數量 = 0 → 顯示「開始建立你的第一個 extension」CTA

4. **Onboarding wizard component**（可重用）
   - 4 步驟：
     1. 完成 profile（name / avatar）
     2. 建立第一個 Extension（spec）
     3. 建立第一個 AI Config
     4. 試用 Chat
   - 每步完成 → 寫 `User.onboardingStep` (新欄位)
   - 全部完成 → 顯示 confetti + redirect 到 dashboard

### 不做

- SSO / OAuth（Option A 不做；multi-tenant 已取消）
- Email 雙重確認（verify 信已涵蓋）
- 多語系 wizard（Sprint 62 才做 i18n）

### 設計決定

| 問題 | 決定 | 理由 |
|------|------|------|
| Register 開放給任何人？ | **否**（需 Admin invite） | Self-host 為主；防 spam |
| 開放 Register 時誰審核？ | 自動 active，email verify 後才能 login | 降低摩擦但擋 bot |
| 用戶預設 role | viewer | 最小權限；admin 提升另設 |
| Onboarding 強制？ | 否，可跳過 | 既有 seed admin 已熟悉系統 |
| 哪裡顯示 onboarding banner | `/admin` 頂部 | 最常見入口 |

---

## 3. P0-8 ToS / Privacy（1.0 SP）

### 目標

提供公開的法律文件頁面，符合 GDPR / CCPA 基本要求。

### 範圍

1. **`/legal/terms`** 頁面
   - Markdown 內容（`content/legal/terms.md`）
   - 顯示「最後更新」日期
   - 中文版 + 英文版（預設 zh-TW，可切 en）
   - 註冊時 checkbox 引用本文版本日期

2. **`/legal/privacy`** 頁面
   - 同 terms 結構
   - 說明收集的資料、使用方式、保留期限、用戶權利

3. **Content 結構**
   - `content/legal/terms.zh-TW.md`
   - `content/legal/terms.en.md`
   - `content/legal/privacy.zh-TW.md`
   - `content/legal/privacy.en.md`
   - `content/legal/_meta.json`（最後更新日期、版本）

4. **註冊時的 ToS / Privacy 版本控制**
   - DB 存 `acceptedTosVersion` + `acceptedPrivacyVersion` 在 User
   - 文件更新時提示用戶重新同意

### 不做

- Cookie banner / consent management（自架簡單，不需 consent platform）
- 自動偵測用戶所在地區
- 多語系細節（Sprint 62 才做完整 i18n）

### 設計決定

| 問題 | 決定 | 理由 |
|------|------|------|
| Markdown 還是 CMS | **Markdown** | 簡單、版控、可預覽 |
| 誰寫內容 | **Agent 起草 + 用戶審** | 法律條款需法務確認 |
| 多語版 | zh-TW + en | 兩個主要市場 |
| 條款更新 | 自動偵測並顯示差異 | 用戶需重新同意 |

---

## 4. 風險與緩解

| 風險 | 衝擊 | 緩解 |
|------|------|------|
| Register API 被 spam 攻擊 | 中 | Rate limit（Sprint 60 才做完整）+ CAPTCHA（如必要） |
| Onboarding wizard 太複雜 | 低 | 設計簡潔、每步可跳過 |
| ToS 法律用語不準確 | 高 | Agent 起草 + 用戶法務審 |
| 條款版本不同步 | 中 | `_meta.json` 用 build-time check |

---

## 5. Gate 清單

- [ ] **Plan Gate** — 本文件建立
- [ ] **Design Gate** — 介面 / DB migration / 測試設計
- [ ] **Execution Gate 1 (TDD)** — 測試先紅後綠
- [ ] **Gate 2 (Lint/Typecheck)** — typecheck + lint
- [ ] **Gate 3 (Regression)** — 全測試綠
- [ ] **Gate 4 (Reviewer)** — build 成功 + 手動跑 register flow

---

## 6. SP 細目

| 任務 | 預估 | 備註 |
|------|------|------|
| P0-7 DB 擴充 (User.acceptedTosVersion, acceptedPrivacyVersion, onboardingStep) | 0.3 SP | migration + prisma update |
| P0-7 /api/auth/register API | 0.3 SP | 含驗證信寄送 |
| P0-7 /admin/register 頁面 + form | 0.3 SP | shadcn Form |
| P0-7 empty state / onboarding banner | 0.2 SP | /admin 頁面 |
| P0-7 onboarding wizard component | 0.2 SP | 4 步驟 |
| P0-8 /legal/terms + privacy 頁面 | 0.4 SP | 含 Markdown 渲染 |
| P0-8 content/legal/*.md (4 個文件) | 0.4 SP | Agent 起草 |
| P0-8 _meta.json + 版本控制 | 0.2 SP | build-time check |
| **總計** | **2.3 SP** | |

---

## 7. 檔案計劃

### 新增

**API**
- `app/api/auth/register/route.ts`
- `app/api/user/onboarding/route.ts`

**UI**
- `app/(public)/admin/register/page.tsx` + register-form.tsx
- `app/(public)/legal/terms/page.tsx`
- `app/(public)/legal/privacy/page.tsx`
- `components/admin/onboarding-wizard.tsx`
- `components/admin/onboarding-banner.tsx`

**Content**
- `content/legal/terms.zh-TW.md`
- `content/legal/terms.en.md`
- `content/legal/privacy.zh-TW.md`
- `content/legal/privacy.en.md`
- `content/legal/_meta.json`

**Lib**
- `lib/legal.ts`（讀 markdown + meta）

**Migration**
- `prisma/migrations/<timestamp>_sprint58_user_legal/migration.sql`
- `prisma/schema.prisma`（加欄位）

### 修改

- `app/(public)/admin/login/page.tsx` — 加「建立帳號」連結
- `app/(public)/admin/page.tsx` — 加 onboarding banner
- `middleware.ts` — 加 `/admin/register` 為 public route
- `prisma/schema.prisma` — User model 加欄位

---

## 8. 依賴

- 既有：zod, react-hook-form, shadcn/ui, gray-matter（解析 frontmatter）
- 不引入新依賴

---

## 9. 完成定義

- [ ] `pnpm typecheck` 全綠
- [ ] `pnpm lint` 無新錯誤
- [ ] `pnpm test` 2,287 → ~2,320 tests 全綠
- [ ] `pnpm build` 成功
- [ ] 手動流程：
  - [ ] 訪問 `/admin/register` → 填表 → 提交 → 看到「請查收驗證信」
  - [ ] 點驗證信連結 → 自動登入或 redirect 到 login
  - [ ] 訪問 `/admin` → 看到 onboarding banner
  - [ ] 訪問 `/legal/terms` → 看到中文條款 + 切換英文

---

## 10. 待用戶決定

開始執行前需要確認：

1. **Register 開放程度**
   - Agent 推薦：**開放但須 email verify 才能登入**
   - 備註：admin 可從 seed 或手動 invite 加入

2. **Onboarding wizard 強制 vs 跳過**
   - Agent 推薦：**可跳過**（既有 admin 已熟悉）
   - 備註：新用戶可能會想跳過

3. **ToS / Privacy 內容來源**
   - Agent 推薦：**Agent 起草 4 個 markdown + 用戶法務審**
   - 備註：標準 SaaS 條款，可線上找模板參考

4. **Trust Mode deadline**
   - Agent 推薦：**2 小時**（比 Sprint 57 略多 — 因 register flow + markdown + wizard）
   - 理由：DB migration + register flow + 4 個 markdown 起草

如果用戶都不修正 → 採 Agent 推薦值開始執行

---

**參考**：
- [`docs/roadmap/option-a-productization.md`](roadmap/option-a-productization.md)
- [`docs/audit/productization-gap-audit.md`](audit/productization-gap-audit.md)
- [`docs/sprint57-plan-gate.md`](sprint57-plan-gate.md) — 前一個 sprint
