# Contributing Guide

本專案使用 **4 Gate SOP** 開發流程。每個 commit / PR 必須走完 4 個 Gate 才算完成。

---

## 🚦 4 Gate SOP（必走）

### Gate 1 — TDD Gate
- 先寫失敗測試 → 看到紅 → 寫實作 → 測試綠
- **新功能**：先寫 happy path 測試，再寫邊界 case
- **修 bug**：先寫重現 bug 的測試（red），再修（green）
- 工具：`pnpm test <path>` 或 `pnpm test --watch`

### Gate 2 — Lint / Typecheck Gate
- `pnpm typecheck` 必須 0 error
- `pnpm lint` 不能新增 error（既有 warning 不擋）
- **不允許** `// @ts-ignore` / `any` 型別

### Gate 3 — Regression Gate
- `pnpm test` 全部測試全綠（含新測試 + 既有測試）
- 不可破壞既有測試

### Gate 4 — Reviewer Gate
- 走 `dev-checker-loop` skill 校驗
- UI 任務必須跑 playwright-cli 真實 e2e
- 確認 commit message 符合 template

---

## 🛠️ 開發工作流

### 開始前
```bash
git pull
pnpm install        # 自動跑 prisma generate (postinstall hook)
```

### 開發中（每次改動後）
```bash
pnpm typecheck      # 確認沒 TS error
pnpm test <path>    # 跑特定測試
```

### 改動 prisma/schema.prisma 後 ⚠️
```bash
pnpm db:migrate     # dev 環境
# 或 pnpm db:deploy  (production)
```
> **不跑 migrate 會 runtime 失敗**（API 操作新欄位會 throw P2022）
> Sprint 43 連續 4 個 bug 共同根因之一。

### 提交前（驗證一切）
```bash
pnpm validate       # typecheck + lint + test 一次跑完
git add -A
git commit -m "..." # 用下面 template
```

---

## 📝 Commit Message Template

每個 commit 必須包含：

```bash
<type>(<scope>): <subject>

<body>

<footer>
```

### Type
- `feat` — 新功能
- `fix` — bug 修復
- `refactor` — 重構（沒新功能沒修 bug）
- `test` — 純測試改動
- `docs` — 文件改動
- `chore` — 雜項（build / ci / config）

### Scope
- sprint-XX — Sprint 編號
- module 名稱（ai-config / crud-list / admin 等）

### Body
- 說明「為什麼」改（不只是「改什麼」）
- 揭露的問題、根因、修法

### Footer
- `Gate 驗證:` 區塊列出跑的指令 + 結果
- `Reflection:` 列出新的揭露（給後續 Sprint）
- `Co-Authored-By:` （如用 AI agent）

### 範例

```
feat(sprint-44): §4.2 placeholder data migration + 5 個守護測試

問題揭露 (Sprint 43 reflection §4.2):
- Commit C/E 把 placeholder (string reverse) 換成 AES-GCM
- 既有 db 資料解密會 throw (格式不相容)
- 需 defensive migration 避免 production deploy 時失敗

修法:
1. 偵測 placeholder 格式 (2 階段防護):
   - Step 1: array_length(string_to_array(apiKeyEnc, ':')) != 3 → 清空
   - Step 2: EXISTS (SELECT 1 FROM unnest(...) WHERE part !~ hex) → 清空
2. 安全檢查: WHERE apiKeyEnc IS NOT NULL AND apiKeyEnc != ''
3. 不動 AES-GCM 合法資料 (3 段 hex 都過)

Gate 驗證:
- pnpm typecheck ✅
- pnpm lint: 無新增 issue ✅
- pnpm test: 1527/1527 pass (+5 新守護)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## ✅ Commit 前驗證步驟 Checklist

每次 commit 前必做：

- [ ] `pnpm validate` 全綠
- [ ] 新功能有對應測試（Gate 1 TDD）
- [ ] 改了 `prisma/schema.prisma` → 已跑 `pnpm db:migrate`
- [ ] 改了 `.env` schema → 已更新 `.env.example`
- [ ] 改了 API route → 已加 try/catch + 守護測試
- [ ] commit message 符合 template（含 Gate 驗證）
- [ ] 跑了 `dev-checker-loop` skill（如是 UI / API 改動）

---

## 🔧 常用指令速查

| 指令 | 用途 |
|---|---|
| `pnpm dev` | 啟動 dev server（predev 自動 generate） |
| `pnpm build` | 跑 build（prebuild 自動 generate） |
| `pnpm validate` | typecheck + lint + test 一次跑完 |
| `pnpm test` | 跑全部測試 |
| `pnpm test:e2e` | 跑 Playwright e2e |
| `pnpm typecheck` | TypeScript 編譯檢查 |
| `pnpm lint` | ESLint 檢查 |
| `pnpm db:migrate` | dev 環境套用 migration（含 drift detection）|
| `pnpm db:deploy` | prod 環境套用 migration |
| `pnpm db:generate` | 只生成 Prisma client（不套用 migration）|

---

## 📂 必讀文件

- 📘 [新手入門指南](docs/getting-started.md)
- 📐 [系統架構設計](docs/system-design.md)
- 📋 [PRD 列表](docs/prd/)
- 📦 [Backlog](docs/backlog.md)
- 📝 [Sprint Reflections](docs/reflection/)

---

## 💡 給 AI Agent 的指引

如果你是一個 AI Agent 在本專案開發：

1. **必走 SOP** — `pnpm validate` 必綠
2. **每個 commit 寫 reflection** — 揭露的問題給後續 Sprint
3. **守護測試 vs 行為測試** — source-code guard 不能防邏輯錯，重要 API 必須 e2e
4. **不要靜默改用戶輸入** — 表單自動補完要有 fallback
5. **不要偽守護** — 測試斷言要對應功能，不是只驗 pattern 存在

詳細 SOP 見 `docs/sop/`。