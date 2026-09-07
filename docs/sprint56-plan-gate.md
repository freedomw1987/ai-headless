# Sprint 56 Plan Gate — Email Verification + Password Reset + SMTP 設定

> **日期**: 2026-09-05
> **Sprint**: 56
> **範圍**: P0-1 (email verify) + P0-2 (password reset) + R2 (SMTP 設定)
> **對應路線**: docs/roadmap/option-a-productization.md
> **狀態**: 🟡 Plan Gate 通過，待 Design Gate + Execution Gate

---

## §1 Sprint 目標

**核心**：用戶帳號體驗完整化 — 註冊後驗證 email、忘記密碼可重設

**驗收標準**：
- 新用戶註冊必收到驗證信，點擊啟用帳號才能進 `/admin`
- 用戶點「忘記密碼」可收重置信，重設後可登入
- 所有流程有整合測試 + E2E 守護

---

## §2 範圍拆解

### 2.1 R2 SMTP 設定（0.3 SP，**先做**）

**為何先做**：P0-1 / P0-2 都需要 email 服務

**任務**：
- [ ] `.env.example` 加 SMTP_* 環境變數
- [ ] `lib/email.ts` — nodemailer 包用（輕量、SSR 友善、Next.js 友善）
- [ ] `lib/email.test.ts` — vitest 整合測試（用 nodemailer mock）
- [ ] `lib/email-templates/` — verification.html / password-reset.html
- [ ] dev 環境用 ethereal.email（fake SMTP，自動給預覽連結）
- [ ] production 文件說明用 Resend / SendGrid

**設計決策**：
- 採 **nodemailer**（SMTP 抽象，未來可換 SDK）
- **Email template 用 React Email**（用戶事後決策 #2，30KB+ bundle 可接受，因為可預渲染 SSR 不打 client bundle）
- SMTP 為 transporter 抽象（未來可換 Resend SDK / SendGrid SDK 不改業務邏輯）

---

### 2.2 P0-1 Email Verification（1.0 SP）

**Schema migration**：
```prisma
model VerificationToken {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([token])
}

model User {
  // ... 既有
  emailVerified DateTime?  // 既有欄位，Sprint 56 真正使用
  verificationTokens VerificationToken[]
}
```

**流程**：
1. 註冊成功 → 自動產生 VerificationToken（24 小時有效）→ 寄信
2. 用戶點信中連結 → `/api/auth/verify?token=xxx` → 驗證 + 標記 `usedAt` + 更新 `User.emailVerified`
3. middleware 阻擋未驗證用戶訪問 `/admin/*`（除了 `/admin/login` 和 `/admin/verify`）
4. 提供「重寄驗證信」按鈕（在 login 頁面）

**API 路由**：
- `POST /api/auth/verify` — GET query string 處理（驗證）
- `POST /api/auth/resend-verification` — 重寄
- `POST /api/auth/register` — 既有但補上寄信邏輯

**守護測試**：
- 註冊必產生 token（grep `VerificationToken` + vitest）
- 點擊過期 token 報 410
- 點擊已用 token 報 410
- 重寄信 rate limit（避免 spam）

---

### 2.3 P0-2 Password Reset（1.5 SP）

**Schema migration**：
```prisma
model PasswordResetToken {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash String   @unique  // 存 hash，不存明文
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([tokenHash])
}
```

**流程**：
1. `/admin/forgot-password` 頁面 — 輸入 email
2. 永遠回 200（避免 user enumeration），但若 email 存在則寄信
3. `/admin/reset-password?token=xxx` 頁面 — 輸入新密碼兩次
4. `POST /api/auth/reset-password` — hash 驗證 + 改密碼 + 標記 usedAt
5. Token 1 小時過期、一次性使用

**API 路由**：
- `POST /api/auth/forgot-password` — 產生 token + 寄信
- `POST /api/auth/reset-password` — 驗 token + 改密碼

**UI 頁面**：
- `app/admin/forgot-password/page.tsx`（Server Component）
- `app/admin/reset-password/page.tsx`（Server Component）
- 用既有 shadcn Form + Input + Button

**守護測試**：
- 寄信總是 200（不洩漏 email 是否存在）
- 過期 token 報 410
- 一次性使用（用過不能再用）
- 新密碼 hash 寫進 DB
- 改完密碼後舊 session 失效（強制重新登入）

---

## §3 技術選型決策

| 選項 | 決定 | 理由 |
|---|---|---|
| Email 服務 | **nodemailer** | 零依賴外的選擇、SSR 友善、文件完整 |
| SMTP fake (dev) | **ethereal.email** | 自動給預覽 URL，不污染真實信箱 |
| SMTP (prod) | **Resend** | 推薦給用戶，文件簡單、價格便宜 |
| Token 儲存 | **DB hash** | 比 session store 更易查 + audit |
| Token 過期 | **24h verify / 1h reset** | 業界標準 |
| 密碼 hash | **bcrypt (既有)** | 不變 |
| 頁面 UI | **既有 shadcn Form** | 不引入新依賴 |
| Email template | **React Email** | 用戶決策（30KB+ SSR-only 不打 client bundle） |

---

## §4 檔案結構

### 新建檔案
```
prisma/schema.prisma                              # + VerificationToken / PasswordResetToken
lib/email.ts                                      # SMTP 包用
lib/email.test.ts
lib/email-templates/verification.tsx              # React Email 元件
lib/email-templates/password-reset.tsx
lib/email-templates/templates.test.tsx
lib/auth/verification-token.ts                    # 產生 / 驗證 token
lib/auth/verification-token.test.ts
lib/auth/password-reset-token.ts                  # 產生 / 驗證 token
lib/auth/password-reset-token.test.ts
app/api/auth/verify/route.ts                      # GET 處理
app/api/auth/verify/route.test.ts
app/api/auth/resend-verification/route.ts         # POST 重寄
app/api/auth/resend-verification/route.test.ts
app/api/auth/forgot-password/route.ts             # POST 寄重置信
app/api/auth/forgot-password/route.test.ts
app/api/auth/reset-password/route.ts              # POST 重設
app/api/auth/reset-password/route.test.ts
app/admin/forgot-password/page.tsx
app/admin/reset-password/page.tsx
middleware.ts                                     # 改：未驗證擋 /admin/*
```

### 修改檔案
```
app/api/auth/register/route.ts                     # 註冊後寄驗證信
app/admin/login/page.tsx                          # 加「忘記密碼」連結 + 「重寄驗證信」按鈕
.env.example                                      # 加 SMTP_* 環境變數
package.json                                      # + nodemailer + @types/nodemailer
docs/backlog.md                                   # 更新 Sprint 56 進度
```

---

## §5 風險與緩解

| 風險 | 緩解 |
|---|---|
| nodemailer 在 Edge Runtime 報錯 | `lib/email.ts` 只在 Node runtime 用；middleware 不碰 |
| SMTP 在 dev 環境不可用 | ethereal.email + vitest mock + CI 不寄信 |
| Email 被歸類為 spam | HTML 用 inline style + 純文字 fallback；不附圖片 |
| Token 被暴力枚舉 | 256-bit entropy + 一次性 + 過期 + DB unique |
| User enumeration（forgot-password 端點）| 永遠回 200，固定回應時間 |
| 改密碼後舊 session 仍有效 | 改密碼時清掉所有 session（revoke） |
| Email template 在不同 email client 顯示差異 | 用 table layout + inline style（業界標準）|
| 沒有用戶 email 收信怎麼測 | dev 環境用 ethereal 預覽連結；vitest mock sendMail |

---

## §6 與 Sprint 57+ 的相依

| Sprint | 需要 Sprint 56 的產出 |
|---|---|
| Sprint 57 (Sentry + R6 + R4) | 不需要 |
| Sprint 58 (Onboarding + ToS) | 需要 email verification 才能做 onboarding |
| Sprint 59 (備份 + CD + migration) | 需要 migration 流程完整 |

**結論**：Sprint 56 是其他 P0 的**前置**，必須先做。

---

## §7 Plan Gate 決策記錄

| # | 問題 | 決策 | 理由 |
|---|---|---|---|
| 1 | 用 nodemailer 還是 Resend SDK？ | nodemailer | 零依賴外的選擇、未來可換 |
| 2 | 引入 React Email 嗎？ | 不引入 | bundle size +30KB、Sprint 56 不想加 |
| 3 | VerificationToken 存 DB 還是 Redis？ | DB | 已有 Prisma、audit 易查 |
| 4 | Token 明文還是 hash？ | reset 用 hash / verify 明文（單次）| reset 安全要求高；verify 只用一次且連結已過期 |
| 5 | 用戶忘了 email 怎麼辦？ | 不做（GA 必做但 Sprint 56 不做） | 超出範圍，留 Sprint 62+ |
| 6 | 2FA / TOTP 要做嗎？ | 不做（Sprint 56） | GA P0 不需要；可做 P1 |
| 7 | Email template 用 react-email 嗎？ | ✅ 用 React Email（用戶事後決策） | 30KB SSR-only，可接受 |
| 8 | 怎麼處理現有未驗證用戶？ | 標記為 legacy，下次登入時提示驗證 | 向後相容，不破壞既有流程 |

---

## §8 預估 SP 與時間

| 子項目 | 預估 SP | 預估時間 |
|---|---|---|
| R2 SMTP 設定 | 0.3 | ~30 分鐘 |
| P0-1 Email Verification | 1.0 | ~1.5 小時 |
| P0-2 Password Reset | 1.5 | ~2 小時 |
| Plan Gate + Design Gate + Reflection | — | ~30 分鐘 |
| **總計** | **2.8** | **~4.5 小時** |

按 Trust Mode Sprint 49-55 的經驗：**實際時間常為預估 50-70%**，因此 Sprint 56 預估 1-1.5 天完成。

---

## §9 開始條件

✅ Plan Gate 完成（本文件）
🟡 待用戶指示進入 Design Gate（建議）
🟡 待用戶指示進入 Execution Gate

**執行策略**：
1. 用戶讀完 Plan Gate 後可推翻任一決策
2. 用戶同意後開始 Design Gate（10 分鐘，寫 `docs/sprint56-design-gate.md`）
3. Design Gate 通過後進入 Execution Gate（4 Gate SOP）
4. 完成後 Submit Gate + Reflection

---

**Plan Gate 時間**: 2026-09-05 10:52
**狀態**: ✅ Plan Gate 完成
**下一步**: 等用戶指示 Design Gate 或開始執行

> **最後更新**：2026-09-05 11:09 — Execution Gate 完成
