# AGENTS.md — AI 開發 SOP（項目內）

> 本檔給 AI Agent 在此項目內工作時參考。
> 完整 SOP 見 `/Users/davidchu/.pi/agent/AGENTS.md`

---

## 🚦 SOP §2.3 4 Gate（執行階段必走）

| Gate | 名稱 | 必做動作 |
|---|---|---|
| **Gate 1** | TDD gate | 測試先紅後綠：寫失敗測試 → 寫實現 → 測試通過 |
| **Gate 2** | lint / syntax gate | `pnpm lint` + `pnpm typecheck` 必須全綠 |
| **Gate 3** | regression gate | `pnpm test` 全綠（無既有測試被破壞） |
| **Gate 4** | reviewer gate | 用 `dev-checker-loop` skill 校驗質量 |

---

## 🎯 本項目技術棧

| 類別 | 選型 |
|---|---|
| 框架 | Next.js 15（App Router + Turbopack）|
| UI | React 19 + shadcn/ui + Tailwind CSS |
| 語言 | TypeScript 5.7（strict mode）|
| ORM | Prisma 6 |
| DB | PostgreSQL |
| Auth | Auth.js（NextAuth v5 beta）|
| 測試 | Vitest（單元）+ Playwright（E2E）|
| Validation | Zod |
| AI | OpenAI + Anthropic Claude |

---

## 📂 必讀文檔（按順序）

1. `docs/system-design.md` §13 — 混合模式架構
2. `docs/specs/json-spec.md` — JSON 規範
3. `docs/specs/extension-spec.md` — Extension 規範
4. `docs/backlog.md` — 開發待辦
5. `docs/prd/` — 各模組 PRD

---

## 🔑 關鍵設計

### 混合模式（Hybrid Mode）
- JSON 處理 L1 + L2（標準 CRUD + 業務規則）
- Extension Code 處理 L3（狀態機、複雜計算、副作用）
- 兩者用 `{{fn:函數名稱}}` 語法引用

### pi agent 驅動
- 8-Stage Pipeline：analyze → clarify → spec → tdd → compile → lint → regression → review
- 不直接調 LLM API，而是用 pi agent 作為執行者
