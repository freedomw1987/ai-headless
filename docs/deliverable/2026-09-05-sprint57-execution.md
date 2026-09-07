# Sprint 57 Execution Gate 交付摘要

**日期**：2026-09-05
**Trust Mode**：Sprint 3，11:30 → 11:42（提早 1 小時 48 分完成）
**Sprint**：57 — P0-3 Sentry + R6 Request ID + R4 CSRF

---

## 🎯 交付目標

從 Sprint 56 完成後，繼續 Option A 路線圖的**第二個 Sprint**：
- **P0-3 Sentry**：prod 錯誤監控（GA 必修）
- **R6 Request ID**：每個 request 有 trace ID，串起 log/audit/Sentry
- **R4 CSRF**：state-changing API 防跨站請求偽造

總計 **2.3 SP**。

---

## ✅ 執行結果

### Gate 1：TDD

| 測試檔 | 數量 | 結果 |
|--------|------|------|
| `lib/request-context.test.ts` | 12 tests | ✅ |
| `lib/csrf.test.ts` | 15 tests | ✅ |
| `tests/integration/sprint57-cross-cutting.test.ts` | 14 guard tests | ✅ |
| `tests/integration/sprint57-csrf-middleware.test.ts` | 6 tests | ✅ |
| `tests/integration/sprint57-sentry-config.test.ts` | 4 tests | ✅ |

### Gate 2：Lint + Typecheck

- ✅ `pnpm typecheck` 全綠
- ✅ `pnpm lint` 無新錯誤

### Gate 3：Regression

- ✅ 2,236 → **2,287 tests**（+51 新測試）
- ✅ 4 skipped（pre-existing dev server smoke test）

### Gate 4：Build + Middleware E2E

- ✅ `pnpm build` 成功
- ✅ Middleware 大小：84 kB → 150 kB（@sentry/nextjs SDK）
- ✅ **真實端對端測試**：
  - POST `/api/users` 無 CSRF token → **403**
  - POST `/api/users` 有 CSRF token + cookie → **401**（進入 auth 檢查）

---

## 📦 新增檔案（13）

### R6 Request ID
- `lib/request-context.ts` — AsyncLocalStorage 注入 request id（edge + nodejs 都安全）
- `lib/request-context.test.ts` — 12 tests

### R4 CSRF
- `lib/csrf.ts` — double-submit cookie + timing-safe 比較（SHA-256 hash）
- `lib/csrf.test.ts` — 15 tests
- `lib/api-client.ts` — client fetch interceptor（自動帶 x-csrf-token + x-request-id）
- `app/api/csrf/route.ts` — CSRF token endpoint

### P0-3 Sentry
- `sentry.server.config.ts` — DSN 缺失時 silent no-op
- `sentry.edge.config.ts` — Edge runtime 設定
- `instrumentation.ts` — Next.js 15 hook（雙 runtime 都註冊）

### 測試
- `tests/integration/sprint57-cross-cutting.test.ts` — 14 guard tests
- `tests/integration/sprint57-csrf-middleware.test.ts` — 6 tests
- `tests/integration/sprint57-sentry-config.test.ts` — 4 tests

---

## 🔧 修改檔案（6）

- `middleware.ts` — 加 request id 注入 + CSRF state-changing 檢查
- `next.config.ts` — `withSentryConfig`
- `lib/log.ts` — 加 request id provider hook（logger 自動帶）
- `.env.example` — 加 SENTRY_* 變數
- `.npmrc` — 加 onlyBuiltDependencies（讓 sentry-cli / protobufjs postinstall 跑）
- `package.json` — 加 `@sentry/nextjs` + 修 `@tiptap/extension-link` 漏列

---

## 🛠 技術決策

| 項目 | 決定 | 理由 |
|------|------|------|
| Request ID 產生 | `crypto.randomUUID()` | 內建、無新依賴 |
| Request ID 信任 client header | 是 | 上游 LB / Vercel 已加時不重複產生 |
| CSRF 方案 | double-submit cookie | 跨瀏覽器、無需 server-side state |
| Timing-safe compare | SHA-256 hash 後 constant-time | 避免 timing attack |
| Sentry sampling | 100% errors + 10% traces | 錯誤全抓、trace 配額保護 |
| Sentry DSN 缺失 | silent no-op | 開發環境沒設不能掛 |
| PII 過濾 | 自動刪 email / ip / username / cookies | GDPR |

---

## 🐛 過程中發現 / 修復的問題

### 1. `@tiptap/extension-link` 漏列 dep（pre-existing 但 Sprint 57 才暴露）

- **問題**：rich-text-editor.tsx 直接 import，但 package.json 沒列
- **為什麼 Sprint 56 全綠**：當時 node_modules 還有 transitive 殘留
- **為什麼 Sprint 57 暴露**：加 `@sentry/nextjs` 後 `pnpm install` 重新計算，pnpm v11 預設不再 hoisting，transitive 消失了
- **修法**：加 `@tiptap/extension-link@3.31.2` 到 dependencies
- **影響**：11 個 rich-text-editor tests 恢復綠
- **建議**：下次 Sprint 開始前先跑 `pnpm install --frozen-lockfile=false` 確認環境

### 2. `pnpm approve-builds` 需要新 dep

- `@sentry/cli` 和 `protobufjs` 都需要跑 postinstall
- pnpm v11 預設拒絕（security）
- 修法：`pnpm approve-builds --all` 或加 `.npmrc` `onlyBuiltDependencies`

### 3. 兩個 `@sentry/nextjs` deprecation warnings

- `withSentryConfig` 從 `@sentry/nextjs` 移到 `@sentry/nextjs/config`
- `disableLogger` 選項 deprecated（用 webpack.treeshake.removeDebugLogging）
- 已修第一個，第二個直接移除

---

## 📊 量化指標

| 指標 | Sprint 56 | Sprint 57 | 差異 |
|------|-----------|-----------|------|
| Test count | 2,236 | 2,287 | **+51** |
| Middleware size | 84 kB | 150 kB | +66 kB (Sentry SDK) |
| API routes | 27 | 28 | +1 (/api/csrf) |
| New dependencies | 2 | 3 | +@sentry/nextjs, +@tiptap/extension-link |

---

## 🚦 路線圖進度

```
✅ Sprint 55 完成 (2,221 tests)
✅ Sprint 56 完成 (2,236 tests) — R2 SMTP + P0-1 Verify + P0-2 Reset
✅ Sprint 57 完成 (2,287 tests) — P0-3 Sentry + R6 RequestID + R4 CSRF ← 你在這裡
   ↓
Sprint 58 — P0-7 Onboarding + P0-8 ToS/Privacy (2.3 SP)
   ↓
Sprint 59 — P0-4 Backup + P0-5 CD + P0-6 Migration Policy (1.8 SP)
   ↓
Sprint 60 — P1-6 Vercel KV Rate Limit + R10 Extensions Persistence (2.0 SP)
   ↓
... Sprint 65 → GA 候選發布
```

**離 GA 還剩**：26 - 2.8 - 2.3 = **20.9 SP**，約 7-8 個 sprints

---

## 🔒 安全性提升

### Before Sprint 57
- ❌ 沒有 request id（除錯時無 trace）
- ❌ 沒有 Sentry（prod 出事不知道）
- ❌ POST/PUT/PATCH/DELETE 無 CSRF 保護

### After Sprint 57
- ✅ 每個 request 有 UUID v4 trace id
- ✅ Logger 自動帶 request id
- ✅ Sentry server/edge 雙 runtime 設定（含 PII 過濾）
- ✅ CSRF 雙重 cookie 驗證（client interceptor 自動加 header）
- ✅ Allow-list：NextAuth callback、email verify/reset、webhook

---

## 📋 待用戶指示

1. **設定 Sentry DSN**（如要實際監控）
   - 開發環境可繼續留空（silent no-op）
   - Production：https://sentry.io → New Project → Next.js → 拿 DSN + Auth Token

2. **Sprint 58 啟動準備**
   - 下一個 sprint = P0-7 Onboarding + P0-8 ToS/Privacy
   - 需先建 `/api/auth/register` 才能 onboard（P0-7 依賴）
   - 建議 deadline 1.5-2 小時

3. **驗收方式**
   - 開發伺服器：觀察 `logger.info('xxx', {...})` 自動帶 `requestId` 欄位
   - 用 curl POST `/api/users` 無 CSRF token → 403
   - 用 Sentry dashboard（如果設了 DSN）看 prod 錯誤

---

## 🎉 成就

✅ **Trust Mode Sprint 3 提早 1 小時 48 分完成**
✅ **0 既有測試被破壞**（td-405 smoke test 是 pre-existing）
✅ **3 個 GA 必修項目完成**（Sentry + Request ID + CSRF）
✅ **意外發現並修了一個 pre-existing dep 問題**

下一步：繼續 Sprint 58 — **P0-7 Onboarding + P0-8 ToS/Privacy**（2.3 SP）

---

**相關文件**：
- [`docs/sprint57-plan-gate.md`](../sprint57-plan-gate.md)
- [`docs/roadmap/option-a-productization.md`](../roadmap/option-a-productization.md)
- [`docs/trust-log.md`](../trust-log.md)
