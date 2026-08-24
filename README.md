# ai-headless

> **AI Headless CRUD Framework**
> WordPress 風格的 AI 開發框架 — JSON 規範 + Extension Code（混合模式）

**🤖 AI 驅動 · 📋 JSON Schema-Driven · 🔌 Extension 可擴展**

一個讓你用 **自然語言** 就能生成完整 CRUD 系統的 Headless 框架。
AI 對話 → JSON 規範 → 可運行系統 → 終端用戶即用。

---

## ✨ 核心特性

| 特性 | 說明 |
|---|---|
| 🤖 **AI Pipeline** | 自然語言 → JsonSpec → Schema/API/UI/RBAC 自動生成 |
| 📋 **Schema-Driven** | 單一 JSON 同時約束前端 / 後端 / 資料庫 |
| 🔌 **Extension 機制** | 鉤子（Hooks）+ 動作（Actions）+ 計算（Computed）+ 工作流（Workflows）|
| 🔐 **Auth.js v5 + RBAC** | 內建身份驗證與角色權限 |
| 📝 **Tiptap 富文本** | WYSIWYG 編輯器 |
| 🎨 **shadcn/ui + Tailwind** | 現代化 UI 元件庫 |
| ⚡ **Next.js 15 + React 19** | 最新的 React Server Components 架構 |
| 🗄️ **Prisma + PostgreSQL** | 類型安全的 ORM |

---

## 🚀 快速開始

### 1. 環境需求

```bash
node >= 20
bun >= 1.2        # 套件管理器（推薦；也可用 pnpm/npm/yarn）
postgres >= 14    # 資料庫
```

### 2. 安裝

```bash
git clone <repo>
cd ai-headless
bun install
```

### 3. 設定環境變數

```bash
cp .env.example .env
# 編輯 .env，設定：
#   DATABASE_URL=postgresql://user:pass@localhost:5432/ai_headless
#   AUTH_SECRET=<隨機 32 字元>
#   OPENAI_API_KEY=sk-...（可選，用於 AI Chat）
```

### 4. 初始化資料庫

```bash
bun run db:push          # 推送 Prisma schema 到 DB
```

### 5. 啟動開發伺服器

```bash
bun run dev
# → http://localhost:3000
```

---

## 🎯 三大入口

| 路徑 | 用途 |
|---|---|
| **`/`** | 首頁（框架介紹）|
| **`/chat`** | AI Chat — 用自然語言生成 JsonSpec |
| **`/admin/extensions`** | Extension 管理後台 |

---

## 📂 專案結構

```
ai-headless/
├── app/                       # Next.js App Router
│   ├── chat/                  # AI Chat UI（S3.4）
│   ├── admin/extensions/      # Extension 管理（S3.5）
│   ├── api/                   # API routes（含 /api/crud/[model], /api/chat/stream）
│   └── page.tsx               # 首頁
│
├── components/
│   ├── admin/                 # 後台組件（DataTable / FormField / ExtensionCard ...）
│   ├── chat/                  # Chat UI（Sidebar / MessageBubble / ChatInput）
│   └── ui/                    # shadcn/ui 元件
│
├── lib/
│   ├── ai/                    # AI Pipeline（Pipeline Runner）
│   ├── chat/                  # Chat 工具（Markdown / JsonSpec extraction）
│   ├── auth/                  # Auth.js v5 + RBAC
│   ├── compiler/              # 4 個 Generator（Schema / API / UI / Permission）
│   ├── computed/              # Computed SDK
│   ├── actions/               # Action SDK
│   ├── hooks/                 # Hook SDK
│   ├── workflows/             # Workflow Engine（狀態機）
│   ├── extensions/            # Extension Loader / Manager
│   ├── refs/                  # 引用解析器（{{fn:...}}）
│   ├── specs/                 # JsonSpec 定義 + Validator
│   ├── db.ts                  # Prisma Client singleton
│   └── utils.ts
│
├── extensions/                # 已安裝的 Extensions
│   ├── todo/                  # 待辦事項（S3.1）
│   └── event/                 # 活動管理（S3.2）
│
├── prisma/
│   └── schema.prisma          # 包含 BlogPost / Todo / Event / EventRegistration
│
├── tests/
│   ├── integration/           # 整合測試（Pipeline / Extension / E2E）
│   └── e2e/                   # 端到端測試
│
└── docs/
    ├── backlog.md             # Backlog + Sprint 規劃
    ├── system-design.md       # 系統架構
    ├── DESIGN.md              # UI/UX 設計
    ├── specs/
    │   ├── json-spec.md       # JsonSpec 規範
    │   └── extension-spec.md  # Extension 規範
    ├── prd/                   # 8 個 PRD（產品需求文件）
    └── getting-started.md     # 新手入門指南
```

---

## 🧪 測試

```bash
# 跑全部測試（468 個 / 29 個 test files）
bunx vitest --run

# 跑特定測試
bunx vitest --run tests/integration/todo-extension.test.ts

# Type check
bun run typecheck

# Lint
bun run lint
```

---

## 🏗️ AI Pipeline 工作流

```
自然語言需求
  ↓ (AI Chat: /chat)
JsonSpec（JSON 規範）
  ↓ (4 個 Generators 自動生成)
   ├─ Prisma Schema
   ├─ API Routes (/api/crud/[model])
   ├─ UI Pages (/admin/[model])
   └─ RBAC Permissions
  ↓ (Extension Code 處理 L3 複雜邏輯)
   ├─ Hooks (beforeCreate / afterCreate ...)
   ├─ Actions (自定義動作)
   ├─ Computed (計算字段)
   └─ Workflows (狀態機)
  ↓
可運行的 CRUD 系統
```

---

## 🔌 Extension 範例

### Todo Extension（S3.1）

```typescript
// extensions/todo/hooks/before-create.ts
import type { HookContext } from '@/lib/hooks/hook-sdk';

export async function beforeCreateTodo(ctx: HookContext<'beforeCreate'>) {
  // 自動 trim title
  if (typeof ctx.data.title === 'string') {
    ctx.data.title = ctx.data.title.trim();
  }
  // 預設 priority
  ctx.data.priority ??= 'medium';
  // 預設 dueDate = 7 天後
  if (!ctx.data.dueDate) {
    ctx.data.dueDate = new Date(Date.now() + 7 * 86400000).toISOString();
  }
  return ctx;
}
```

### Event Extension（S3.2）

```typescript
// extensions/event/hooks/before-create.ts
export async function beforeCreateEvent(ctx) {
  const { startAt, endAt, capacity } = ctx.data;
  if (new Date(startAt) >= new Date(endAt)) {
    throw new Error('startAt 必須早於 endAt');
  }
  if (capacity < 0) throw new Error('capacity 不能為負');
  ctx.data.status ??= 'upcoming';
  return ctx;
}
```

---

## 📊 當前狀態

| 維度 | 數據 |
|---|---|
| **測試** | **468 / 468 全綠**（29 個 test files）|
| **型別檢查** | ✅ 0 errors |
| **Lint** | ✅ 0 warnings |
| **完成的 Sprints** | Sprint 1（35 SP）+ Sprint 2（35 SP）+ Sprint 1 Review Fixes（7 SP）+ Sprint 3（35/40 SP）|
| **總完成** | **112 / 152 SP**（74%）|

---

## 📚 深入閱讀

- 📘 [新手入門指南](docs/getting-started.md)
- 📐 [系統架構設計](docs/system-design.md)
- 📋 [JsonSpec 規範](docs/specs/json-spec.md)
- 🔌 [Extension 規範](docs/specs/extension-spec.md)
- 🎨 [UI/UX 設計](docs/DESIGN.md)
- 📦 [Backlog 與 Sprint 計劃](docs/backlog.md)
- 📂 [PRD 列表](docs/prd/)

---

## 🤝 貢獻

歡迎 PR！請確保：
1. 所有測試通過（`bunx vitest --run`）
2. Type check 通過（`bun run typecheck`）
3. Lint 通過（`bun run lint`）
4. 新功能包含測試（TDD Gate 1）

---

## 📄 授權

MIT
