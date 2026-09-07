# GA Launch Checklist — 上線前必查項目

> **日期**: 2026-09-05
> **用途**: GA 前最後一週逐項打勾，不可遺漏
> **對應**: docs/roadmap/option-a-productization.md
> **取代**: README.md「Production Deployment Checklist」章節（保留 README 為簡版，本份為完整版）

---

## ✅ 環境變數（必填）

- [ ] `DATABASE_URL` — PostgreSQL 連線（生產 DB，**用 connection pooling**，例 pgbouncer）
- [ ] `AUTH_SECRET` — Auth.js session 加密金鑰（`openssl rand -base64 32`）
- [ ] `AUTH_URL` — Production URL（`https://your-domain.com`）
- [ ] `AI_ENCRYPTION_KEY` — AI API Key AES-256-GCM 加密金鑰（64 hex chars）
- [ ] `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` — 原生 provider fallback
- [ ] `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` — **Sprint 56 新增**
- [ ] `SENTRY_DSN` — **Sprint 57 新增**
- [ ] `KV_REST_API_URL` / `KV_REST_API_TOKEN` — Vercel KV（rate limit 用）**Sprint 60 新增**
- [ ] `CRON_SECRET` — bearer token（高熵，**不是** dev-secret）
- [ ] `LOG_LEVEL` — 預設 `info`，debug 環境改 `debug`

---

## ✅ Migration & Deploy

- [ ] **所有 sprint 56-65 migrations 都套用**（`pnpm db:deploy`）
- [ ] **migration 演練過 production-like DB**（Sprint 64 強制）
- [ ] **schema 變更有 review + 簽核**
- [ ] `pnpm build` 成功（無 warning）
- [ ] `pnpm test` 全綠（**最低 2,400 tests** — 含 Sprint 56-65 新增）
- [ ] `pnpm typecheck` 0 errors
- [ ] `pnpm lint` 0 errors
- [ ] CI pipeline 加 deploy stage（Sprint 59）

---

## ✅ Security

- [ ] HTTPS 強制（HSTS header）
- [ ] CORS 設定嚴格（明確 allow origin，非 `*`）
- [ ] Rate limit 啟用（**Vercel KV**，Sprint 60）
- [ ] CSRF protection（custom routes，Sprint 57）
- [ ] Content Security Policy header
- [ ] X-Frame-Options / X-Content-Type-Options
- [ ] Secrets 都用 env var，無 hardcode
- [ ] `.env` 未 commit（`.gitignore` 已擋，但仍 grep 確認）
- [ ] DB password 不在 application code
- [ ] JWT secret 旋轉策略（90 天）

---

## ✅ Email & Auth（Sprint 56+）

- [ ] Email verification 流程完整（註冊 → 收信 → 點擊啟用）
- [ ] Password reset 流程完整（忘記密碼 → 收信 → 重設）
- [ ] SMTP 服務正常（用 Resend / SendGrid）
- [ ] Email template 通過 spam filter 檢查（mail-tester.com ≥ 8 分）
- [ ] Session strategy = JWT + 1 分鐘 permission cache
- [ ] 強制 email verified 才能進 `/admin/*`

---

## ✅ Monitoring & Observability（Sprint 57+）

- [ ] Sentry 連線（前端 + 後端）
- [ ] Sentry source map 上傳
- [ ] Alert rules 設定（error rate > 1% 觸發）
- [ ] Uptime monitoring（Better Uptime / UptimeRobot）
- [ ] Request ID middleware（每 request 有 UUID，便於追蹤）
- [ ] 結構化 logging（12-factor JSON line）— Sprint 64 全 route 替換
- [ ] Log 收集（Vercel Log Drains / Datadog / Logtail）

---

## ✅ Backup & Disaster Recovery（Sprint 59）

- [ ] 每日 DB 自動備份（Vercel Postgres 內建 / Upstash 備份）
- [ ] 備份驗證腳本（restore 到 staging 驗證）
- [ ] RPO（Recovery Point Objective）≤ 24 小時
- [ ] RTO（Recovery Time Objective）≤ 1 小時
- [ ] Disaser recovery runbook（誰負責、怎麼做）

---

## ✅ Onboarding（Sprint 58）

- [ ] 註冊後有引導流程（3 步驟 wizard）
- [ ] 第一個 Extension 範本（歡迎頁面 + 「建立你的第一個 CRUD」按鈕）
- [ ] 文件站連結（Mintlify / Docusaurus，Sprint 62+）
- [ ] Help / Support 入口

---

## ✅ Legal（Sprint 58）

- [ ] Terms of Service 頁面（`/terms`）
- [ ] Privacy Policy 頁面（`/privacy`）
- [ ] Cookie banner（GDPR）
- [ ] Data export / 刪除請求流程（GDPR Article 17）

---

## ✅ API & Docs（Sprint 61）

- [ ] OpenAPI spec（從 runtime 動態生成）
- [ ] Swagger UI（`/api-docs`）
- [ ] Postman collection（從 OpenAPI 匯出）
- [ ] API 版本策略（URL prefix `/v1/`）
- [ ] Deprecation policy（90 天公告 + sunset header）

---

## ✅ Performance

- [ ] Lighthouse score ≥ 90（performance / accessibility / best practices / SEO）
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Bundle size < 200KB（first load JS）
- [ ] DB query 都用 index（無 N+1）
- [ ] Image optimization（next/image）
- [ ] CDN 設定（Vercel 預設）

---

## ✅ Billing（Sprint 63+）

- [ ] Stripe / Paddle 整合
- [ ] Subscription tiers（Free / Pro / Enterprise）
- [ ] Usage tracking（每 user 每月 API call 數）
- [ ] Invoice 自動寄送
- [ ] Webhook 處理（subscription.created / updated / deleted）
- [ ] 退款政策

---

## ✅ Staging 環境（Sprint 63）

- [ ] Vercel Preview Branches（每 PR 自動 deploy）
- [ ] Staging DB 與 Production 分離
- [ ] Staging 用 Stripe test mode
- [ ] Staging 用 Sentry staging project
- [ ] Staging 用 fake SMTP（ethereal.email）

---

## ✅ Final Smoke Test（GA 前 24 小時必跑）

- [ ] 註冊新帳號 → 收驗證信 → 啟用 → 登入 → 建立第一個 Extension → 看到 CRUD
- [ ] 忘記密碼 → 收重置信 → 重設 → 登入
- [ ] 管理員建立新使用者 → 設定 RBAC → 該使用者登入後看到正確權限
- [ ] 上傳附件 → AI Chat 讀到內容 → 正確回應
- [ ] AI 自動生成 extension → 8 個檔案正確建立 → 可在 admin CRUD 操作
- [ ] 刪除帳號 / 刪除 extension / 刪除資料 都有 audit log
- [ ] Rate limit 觸發 → 收到正確錯誤訊息
- [ ] Backup restore 演練成功（從 staging 還原到本地）
- [ ] 監控 alert 觸發（故意製造 500 → Sentry 收到）

---

## 📋 發布當天流程

1. **T-7 天**：凍結 main branch，所有 PR 需 review
2. **T-3 天**：部署到 staging，完整 smoke test
3. **T-1 天**：最終備份 + 通知 on-call
4. **T-0**：deploy 到 production（先 5% canary → 監控 1 小時 → 100%）
5. **T+1 小時**：檢查 Sentry / Vercel metrics / DB 連線數
6. **T+24 小時**：完整 smoke test 過一遍

---

**Checklist 建立時間**: 2026-09-05 10:50
**狀態**: 🟡 待 Sprint 56-65 完成後逐項打勾
**最後更新**: GA 前一週（必須重跑一次）