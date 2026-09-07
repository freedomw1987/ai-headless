# Sprint 57 Plan Gate — P0-3 Sentry + R6 Request ID + R4 CSRF

**建立日期**：2026-09-05
**預估 SP**：2.3
**對應路線**：Option A（產品化路線）
**前導**：Sprint 56 ✅

---

## 1. 為什麼這 3 件事放一起？

| 項目 | 性質 | 為什麼一起做 |
|------|------|-------------|
| **P0-3 Sentry** | 監控 | 沒有它，prod 出事不知道；request ID 是它偵錯的關鍵基礎 |
| **R6 Request ID** | 觀測性 | middleware 層加 x-request-id header，串起 log/trace/audit |
| **R4 CSRF** | 安全 | 已有 auth 流程（Sprint 56 完成），但 state-changing API 缺保護 |

三件事都是 middleware / 全域層級的橫切關注點，做一次打包，否則下次還要重做 middleware。

---

## 2. P0-3 Sentry（1.0 SP）

### 目標

在 production 環境即時捕捉未捕獲錯誤，並附上 request ID、user context、breadcrumb。

### 範圍

1. **安裝** `@sentry/nextjs`（Next.js 15 相容）
2. **建立** `sentry.client.config.ts` + `sentry.server.config.ts`（SDK 標準）
3. **建立** `instrumentation.ts`（Next.js 15 hook）
4. **整合** Request ID（R6 產出）作為 Sentry tag
5. **整合** 用戶 session 作為 Sentry user context
6. **整合** source map upload（next.config.js withSentryConfig）
7. **環境變數** 加 SENTRY_DSN、SENTRY_AUTH_TOKEN

### 不做

- Custom dashboards / alerting rules（GA 後再加）
- Performance monitoring / tracing（Sprint 64 logger 替換時一起做）
- Session replay（不必要）
- 免費 quota 用完後自動降級

### 設計決定

| 問題 | 決定 | 理由 |
|------|------|------|
| Sampling rate | 100% errors, 10% traces | 錯誤全抓；trace 配額保護 |
| PII 過濾 | email / password / token 自動 redact | GDPR / 個資 |
| Source map | sentry-cli 上傳（CI step） | 線上 stack trace 才能定位 |
| DSN 缺失時 | silent no-op，不 throw | 開發環境沒設不能掛 |

---

## 3. R6 Request ID（0.5 SP）

### 目標

每個 HTTP request 都有唯一 trace ID，串起 log / audit / Sentry / 客戶端報錯。

### 範圍

1. **middleware.ts** 攔截每個 request：
   - 讀 incoming `x-request-id` header（如有，信任 client 提供）
   - 否則產生新 UUID v4
   - 寫入 response header `x-request-id`
   - 注入 server-side `headers()` 供下游讀取
2. **建立** `lib/request-context.ts`：
   - `getRequestId()` — 從 async-local-storage 或 next/headers 讀
   - `withRequestId()` — 在 server action / API handler 包 context
3. **整合 logger**（既有 `lib/log.ts`）：
   - 自動帶 request id prefix
4. **整合 Sentry**：
   - Sentry tag 帶 request id

### 不做

- Distributed tracing（W3C traceparent / OTel）— Sprint 64+ 才做
- Per-route 自訂 ID 規則

---

## 4. R4 CSRF（0.8 SP）

### 目標

所有 state-changing API（POST / PUT / PATCH / DELETE）必須驗證 CSRF token，防止跨站請求偽造。

### 範圍

1. **方案**：double-submit cookie pattern
   - 登入後 server 設 `csrf-token` cookie（httpOnly=false，給 JS 讀）
   - client 從 cookie 讀值，放進 `x-csrf-token` header
   - server API route 驗證 cookie 值 === header 值
2. **API 套用**：
   - 全域 middleware 檢查 POST/PUT/PATCH/DELETE → 必須有 x-csrf-token header
   - 排除：webhook、NextAuth callback、email verification / reset password（用一次性 token）、Sentry tunnel
3. **Form 套用**：
   - shadcn `<Form>` 加 hidden CSRF input
   - 或 client-side interceptor 自動帶 header（推薦）
4. **建立** `lib/csrf.ts`：
   - `verifyCsrf(req)` — server side
   - `useCsrf()` — client hook（從 cookie 讀）
5. **測試**：CSRF 攻擊防禦 + happy path 不破

### 不做

- SameSite=Strict cookie 完全替代（不夠，因部分舊瀏覽器不支援）
- Origin header 驗證（次要，可加但 Sprint 57 不做）
- Custom request signing

---

## 5. 風險與緩解

| 風險 | 衝擊 | 緩解 |
|------|------|------|
| Sentry 引入拖累 build / dev server | 中 | 用 lazy import；只 production 啟動 |
| Request ID 在 edge runtime 失效 | 低 | 兩個 runtime 都測 |
| CSRF middleware 誤擋合法 POST | 中 | 完整回歸測試 + 明確 allow-list |
| Sentry quota 超限 | 低 | 預設 100% errors，10% traces |

---

## 6. Gate 清單

- [ ] **Plan Gate** — 本文件建立
- [ ] **Design Gate** — 三件事的介面 / 測試設計
- [ ] **Execution Gate 1 (TDD)** — 測試先紅後綠
- [ ] **Gate 2 (Lint/Typecheck)** — typecheck + lint
- [ ] **Gate 3 (Regression)** — 全測試綠
- [ ] **Gate 4 (Reviewer)** — dev server smoke + build 成功

---

## 7. SP 細目

| 任務 | 預估 | 備註 |
|------|------|------|
| P0-3 Sentry 安裝 + 設定 | 0.5 SP | SDK 標準檔 |
| P0-3 Sentry 整合 request id + user | 0.3 SP | 串接 R6 |
| P0-3 Sentry source map CI step | 0.2 SP | next.config.js + CI |
| R6 middleware request id | 0.2 SP | |
| R6 logger 整合 | 0.2 SP | 既有 logger 加 prefix |
| R6 Sentry 整合（上面算過） | (併) | |
| R4 CSRF lib + middleware | 0.4 SP | |
| R4 CSRF client integration | 0.3 SP | fetch interceptor |
| R4 測試 | 0.1 SP | |
| 文件 + 守護測試 | 0.1 SP | |
| **總計** | **2.3 SP** | |

---

## 8. 檔案計劃（預計變更）

### 新增

- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `instrumentation.ts`
- `lib/request-context.ts`
- `lib/csrf.ts`
- `lib/csrf.test.ts`
- `lib/request-context.test.ts`
- `tests/integration/sprint57-cross-cutting.test.ts`（guard tests）

### 修改

- `middleware.ts`（加 request id + CSRF 檢查）
- `next.config.js`（withSentryConfig）
- `lib/log.ts`（自動帶 request id）
- `lib/fetcher.ts` 或新增 `lib/api-client.ts`（CSRF header interceptor）
- `.env.example`（加 SENTRY_DSN, SENTRY_AUTH_TOKEN, CSRF 設定）
- `.github/workflows/ci.yml`（加 sentry-cli source map upload step）
- 多個現有 form / API route（如有需要手動 fetch 的地方）

---

## 9. 依賴

- `@sentry/nextjs@^9`（含 edge runtime 支援）
- `uuid@^11`（dev dependency，request id 產生；用 crypto.randomUUID 也可）

評估：用 `crypto.randomUUID()`（Node 19+ / Edge runtime 都內建）— **不引入新依賴**

---

## 10. 完成定義

- [ ] `pnpm typecheck` 全綠
- [ ] `pnpm lint` 無新錯誤
- [ ] `pnpm test` 2,236 → ~2,260 tests 全綠
- [ ] `pnpm build` 成功
- [ ] 開發伺服器啟動時 middleware 顯示 `[request-id] xxx` log
- [ ] 用 curl POST `/api/users`（無 CSRF token）→ 403
- [ ] 用 curl POST `/api/users`（有 CSRF token + cookie）→ 200/正常
- [ ] Sentry DSN 未設時不 throw

---

## 11. 待用戶決定

開始執行前需要確認：

1. **CSRF 範圍**：所有 state-changing API 都要保護？還是只 `/api/admin/*`？
   - Agent 推薦：**所有 state-changing API**（POST/PUT/PATCH/DELETE 不分路徑）
   - 備註：GET-only API 完全不擋

2. **Sentry source map**：CI 一定要上傳？還是開發階段先關？
   - Agent 推薦：**CI 上傳**（不然 prod stack trace 看不懂）

3. **Request ID 信任 client header**：
   - Agent 推薦：**是**（incoming `x-request-id` 信任）— 上游 LB / Vercel 已加時不重複產生

如果用戶都不修正 → 採 Agent 推薦值開始執行

---

**參考**：
- [`docs/roadmap/option-a-productization.md`](roadmap/option-a-productization.md)
- [`docs/audit/productization-gap-audit.md`](audit/productization-gap-audit.md) — P0-3, R6, R4 詳情
- [`docs/sprint56-plan-gate.md`](sprint56-plan-gate.md) — 前一個 sprint
