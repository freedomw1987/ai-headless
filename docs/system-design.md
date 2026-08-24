# System Design — ai-headless

> **框架**：WordPress 風格的 AI Headless CRUD 框架
> **核心**：JSON 規範 + Extension Code（混合模式）→ AI 生成完整系統
> **可擴展**：底基 + Extension 機制（Extension 也是 AI 生成）

---

## 1. 設計原則

1. **JSON 是資料層的 Single Source of Truth** —— CRUD 的資料模型、欄位、UI 結構由 JSON 表達，AI 讀 JSON 生成資料層代碼
2. **Convention over Configuration** —— 框架有強約定，AI 不用記住所有規則
3. **Extension 是 first-class** —— Extension 不是 hack，是框架核心
4. **混合模式（JSON + Extension Code）** —— **不是所有業務邏輯都能 JSON 表達**。簡單 CRUD 由 JSON 自動生成，複雜業務邏輯（狀態機、計算、副作用、外部整合）由 Extension 代碼表達，**AI 同時生成 JSON 和 Extension 代碼**。詳見 §13。
5. **AI 是 Compiler + Author** —— AI 不只翻譯 JSON，還能「從零寫」Extension 程式碼（hook、computed、state machine、API 整合），因為 pi agent 能完整生成 TypeScript 代碼。
6. **TypeScript 全棧** —— 類型從 JSON Schema → TS Types → Prisma → Next.js 一路打通
7. **pi agent 是 AI 執行者** —— AI Pipeline 用 pi agent 驅動（不直接呼叫 LLM API），因為 pi agent 讀過所有規範、會跑 SOP Gate、能自我迭代。詳見 §6。

---

## 2. 技術棧

| 層 | 技術 | 用途 |
|---|---|---|
| **前端框架** | Next.js 15 (App Router) | 全棧框架、SSR、API Routes |
| **UI 庫** | React 19 + TypeScript | 核心 UI |
| **組件庫** | shadcn/ui + Radix UI | 可複製源碼、AI 友好 |
| **樣式** | Tailwind CSS | 原子化 CSS |
| **表格** | TanStack Table | 列表頁 CRUD |
| **表單** | React Hook Form + Zod | 表單驗證 |
| **狀態** | Zustand | 輕量狀態管理 |
| **後端框架** | Next.js Route Handlers + Hono | API + 可獨立部署 |
| **資料庫** | PostgreSQL | 關係型 CRUD 首選 |
| **ORM** | Prisma | Schema-driven |
| **認證** | Auth.js (NextAuth) | 登入、OAuth |
| **權限** | RBAC（自實現 + JSON 配置） | 角色權限 |
| **AI Provider 1** | OpenAI GPT-4o | 主模型 |
| **AI Provider 2** | Anthropic Claude | 備選模型 |
| **AI SDK** | Vercel AI SDK | 統一接口 |
| **測試** | Vitest + Playwright | 單測 + E2E |
| **部署** | Docker / Vercel | 容器化部署 |

---

## 3. 系統組成部件

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (用戶)                          │
│            Chat UI / 後台 UI / 自動生成的 CRUD UI           │
└─────────────────────────────────────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 15 Application                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  App Router  │  │  Route       │  │  Server          │  │
│  │  (Pages)     │  │  Handlers    │  │  Components      │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
       │                │                  │
       │                │                  ▼
       │                │        ┌──────────────────────┐
       │                │        │  AI Pipeline         │
       │                │        │  ┌────────────────┐  │
       │                │        │  │ Requirement    │  │
       │                │        │  │ Analyzer       │  │
       │                │        │  └────────────────┘  │
       │                │        │  ┌────────────────┐  │
       │                │        │  │ JSON           │  │
│                │        │  │ Generator       │  │ │
       │                │        │  └────────────────┘  │
       │                │        │  ┌────────────────┐  │
       │                │        │  │ Code           │  │
       │                │        │  │ Compiler       │  │
       │                │        │  └────────────────┘  │
       │                │        └──────────────────────┘
       │                │                  │
       ▼                ▼                  ▼
┌─────────────────┐ ┌──────────────┐ ┌──────────────┐
│ shadcn/ui       │ │ Prisma ORM   │ │ AI Providers │
│ React Hook Form │ │              │ │ OpenAI       │
│ TanStack Table  │ │              │ │ Claude       │
└─────────────────┘ └──────────────┘ └──────────────┘
                          │
                          ▼
              ┌──────────────────────┐
              │  PostgreSQL          │
              │  - 用戶 / 角色       │
              │  - 動態生成的表      │
              │  - Extension 註冊表  │
              └──────────────────────┘
```

---

## 4. 模組劃分（Module）

每個 Module 都有獨立的：執行、測試、PR Review、提交成果流程。一個 Module 的變更不會污染全局。

| Module | 路徑 | 職責 | 依賴 |
|---|---|---|---|
| **M0 — Architecture** | `docs/` | 系統架構、規範文檔 | — |
| **M1 — Framework Core** | `lib/compiler/`、`lib/extensions/`、`docs/specs/` | JSON 規範、AI Pipeline、Extension 機制 | — |
| **M2 — Auth & RBAC** | `lib/auth/`、`lib/rbac/`、`app/(auth)/` | 用戶管理、登入、權限 | M1 |
| **M3 — Blog** | `extensions/blog/`、`app/(admin)/blog/` | 第一個 CRUD 範例 | M1, M2 |
| **M4 — AI Config** | `lib/ai/`、`app/(admin)/ai-config/` | AI 模型配置（OpenAI + Claude） | M1 |
| **M5 — AI Chat** | `app/(admin)/ai-chat/`、`components/chat/` | AI 對話界面 | M1, M4 |
| **M6 — Extension System** | `extensions/`、`app/(admin)/extensions/` | Extension 註冊、加載、管理 UI | M1, M2 |

---

## 5. 目錄結構

```
ai-headless/
├── app/                                # Next.js App Router
│   ├── (admin)/                        # 後台路由組（需登入）
│   │   ├── layout.tsx                  # 後台 shell
│   │   ├── page.tsx                    # 後台首頁（Dashboard）
│   │   ├── users/                      # M2: 用戶管理
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── blog/                       # M3: Blog
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── extensions/                 # M6: Extension 管理
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── ai-config/                  # M4: AI 模型配置
│   │   │   └── page.tsx
│   │   └── ai-chat/                    # M5: AI 對話
│   │       └── page.tsx
│   ├── (auth)/                         # 認證路由組
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── api/                            # API 路由
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── ai/
│   │   │   ├── chat/route.ts
│   │   │   └── generate/route.ts
│   │   ├── extensions/
│   │   │   └── route.ts
│   │   ├── generated/                  # AI 生成的 API（動態）
│   │   │   └── [entity]/route.ts
│   │   └── admin/
│   │       └── ...
│   ├── layout.tsx                      # 根 layout
│   └── page.tsx                        # 首頁
├── components/                         # 共用組件
│   ├── ui/                             # shadcn/ui
│   ├── admin/                          # 後台專用
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   └── data-table.tsx
│   ├── chat/                           # AI Chat UI
│   │   ├── chat-window.tsx
│   │   └── message-bubble.tsx
│   └── crud/                           # 自動生成的 CRUD 組件
│       ├── entity-list.tsx
│       ├── entity-form.tsx
│       └── entity-detail.tsx
├── lib/                                # 工具庫
│   ├── ai/                             # M4: AI Provider 抽象
│   │   ├── providers/
│   │   │   ├── openai.ts
│   │   │   ├── claude.ts
│   │   │   └── base.ts
│   │   ├── config.ts                   # 模型配置管理
│   │   └── index.ts
│   ├── auth/                           # M2: 認證
│   │   ├── options.ts                  # NextAuth options
│   │   └── session.ts
│   ├── rbac/                           # M2: 權限
│   │   ├── permissions.ts
│   │   ├── roles.ts
│   │   └── guard.ts
│   ├── db/                             # 資料庫
│   │   └── prisma.ts                   # Prisma client singleton
│   ├── compiler/                       # M1: JSON → 代碼 compiler
│   │   ├── json-parser.ts              # 解析 JSON 規範
│   │   ├── schema-generator.ts         # 生成 Prisma schema
│   │   ├── api-generator.ts            # 生成 API routes
│   │   ├── ui-generator.ts             # 生成前端組件
│   │   └── index.ts
│   ├── extensions/                     # M1, M6: Extension runtime
│   │   ├── registry.ts                 # Extension 註冊
│   │   ├── loader.ts                   # 動態加載
│   │   └── hooks.ts                    # Extension hooks
│   └── utils.ts                        # 共用工具
├── extensions/                         # Extension 目錄
│   ├── blog/                           # M3: Blog Extension
│   │   ├── index.ts                    # Extension 入口
│   │   ├── schema.json                 # JSON 規範
│   │   ├── components/                 # Extension UI 組件
│   │   └── api/                        # Extension API
│   └── _template/                      # Extension 模板（給 AI 用）
│       ├── index.ts
│       └── README.md
├── prisma/                             # Prisma
│   ├── schema.prisma                   # 基礎 schema（用戶、角色、Extension）
│   ├── migrations/                     # DB migrations
│   └── seed.ts
├── tests/                              # 測試
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/                               # 文檔
│   ├── specs/
│   │   ├── json-spec.md                # M1: JSON 功能規範
│   │   └── extension-spec.md           # M1, M6: Extension 規範
│   ├── prd/
│   ├── DESIGN.md                       # UX/UI 規劃
│   ├── system-design.md                # 本文檔
│   └── backlog.md
├── public/
├── .env.example
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── README.md
```

---

## 6. AI Pipeline 流程（pi agent 驅動）

### 6.1 為什麼用 pi agent？

ai-headless 的 AI Pipeline **不用純 LLM API**（如直接呼叫 OpenAI），而是用 **pi agent** 作為執行者。

**核心原因**：

| 純 LLM API | pi agent |
|---|---|
| 沒有專案上下文 | 自動注入所有規範文檔（AGENTS.md、json-spec.md、extension-spec.md 等） |
| 不會跑測試 / lint | 會跑完整 Gate 流程（TDD → lint → regression → reviewer） |
| 不會讀專案源碼 | 能用 read / bash / edit 工具實際操作檔案 |
| 出錯只回文字 | 能自我迭代修正（看測試失敗 → 改代碼 → 重跑） |
| 無 SOP | 內建 SOP（從 AGENTS.md 讀取） |

### 6.2 AI Pipeline 流程圖

```
┌─────────────────────────────────────────────────────────────────┐
│              1. 用戶在 Chat UI 輸入自然語言需求                   │
│              「幫我做個待辦事項，每項有標題、截止日期、優先級」    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│         2. AI Pipeline 觸發器（Next.js API Route）              │
│              • 儲存用戶訊息到 ChatMessage                         │
│              • 啟動 pi subagent（async 或 sync）                 │
│              • 回傳 taskId 給前端（用戶看到 loading）             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              3. pi agent 接管（讀取專案上下文）                  │
│                                                                  │
│   自動注入：                                                      │
│   • AGENTS.md（萬事原則、SOP、gates.json）                       │
│   • docs/specs/json-spec.md                                      │
│   • docs/specs/extension-spec.md                                 │
│   • docs/system-design.md                                        │
│   • docs/DESIGN.md                                               │
│   • docs/backlog.md                                              │
│   • 專案所有源代碼（按需讀取）                                    │
│                                                                  │
│   pi agent 內部 8 Stage 流程：                                   │
│   ┌────────────────────────────────────────────────────────┐    │
│   │ Stage 1: 需求分析                                       │    │
│   │   - 讀用戶輸入                                          │    │
│   │   - 判斷類型：CRUD 功能 vs Extension                     │    │
│   │   - 列出需要釐清的問題                                   │    │
│   └────────────────────────────────────────────────────────┘    │
│   ┌────────────────────────────────────────────────────────┐    │
│   │ Stage 2: 反問釐清（如需要）                              │    │
│   │   - 用 ask_user / stream 提問                            │    │
│   │   - 用戶回答後繼續                                       │    │
│   └────────────────────────────────────────────────────────┘    │
│   ┌────────────────────────────────────────────────────────┐    │
│   │ Stage 3: 生成 JSON 規範                                  │    │
│   │   - 讀 json-spec.md                                     │    │
│   │   - 寫到 .ai/specs/<name>.json                          │    │
│   │   - 用 JSON Schema 校驗                                  │    │
│   └────────────────────────────────────────────────────────┘    │
│   ┌────────────────────────────────────────────────────────┐    │
│   │ Stage 4: TDD Gate                                       │    │
│   │   - 先寫測試（紅）                                       │    │
│   │   - 執行測試確認失敗                                     │    │
│   │   - 寫實作（綠）                                         │    │
│   │   - 執行測試確認通過                                     │    │
│   └────────────────────────────────────────────────────────┘    │
│   ┌────────────────────────────────────────────────────────┐    │
│   │ Stage 5: 寫 Schema / API / UI / 業務邏輯                   │    │
│   │   - Schema Generator → prisma/schema.prisma             │    │
│   │   - API Generator → app/api/<name>/route.ts             │    │
│   │   - UI Generator → app/(admin)/<name>/page.tsx          │    │
│   │   - Permission / Menu 註冊                                │    │
│   │   - Extension Code Generator（如需要）                    │    │
│   │     * hooks/*.ts（beforeCreate / afterUpdate 等）        │    │
│   │     * actions/*.ts（自定義 action）                     │    │
│   │     * computed/*.ts（computed field）                   │    │
│   │     * workflows/*.ts（state machine / 審批流程）          │    │
│   │   - 跑 prisma migrate dev                                │    │
│   │                                                            │    │
│   │   判斷何時需要寫代碼：                                    │    │
│   │     - JSON 規範引用 {{fn:...}} → 生成對應函數            │    │
│   │     - 用戶需求包含狀態機、計算、外部 API → 生成代碼      │    │
│   │     - 純 CRUD 功能                       → 只生成 Schema/API/UI │    │
│   └────────────────────────────────────────────────────────┘    │
│   ┌────────────────────────────────────────────────────────┐    │
│   │ Stage 6: Lint Gate                                      │    │
│   │   - 跑 eslint / tsc                                       │    │
│   │   - 修正錯誤                                              │    │
│   └────────────────────────────────────────────────────────┘    │
│   ┌────────────────────────────────────────────────────────┐    │
│   │ Stage 7: Regression Gate                                 │    │
│   │   - 跑所有測試                                           │    │
│   │   - 確保沒破壞既有功能                                    │    │
│   └────────────────────────────────────────────────────────┘    │
│   ┌────────────────────────────────────────────────────────┐    │
│   │ Stage 8: Reviewer Gate + Submitter                       │    │
│   │   - 啟動 reviewer subagent 校驗質量                       │    │
│   │   - 用 submitter skill 產出交付摘要                       │    │
│   │   - 更新 backlog.md（標記完成）                           │    │
│   └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│         4. 結果回傳給用戶                                        │
│            • Chat UI 顯示「功能已上線」                          │
│            • 提供「下載 JSON」按鈕                                │
│            • 提供「查看交付摘要」連結                             │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 pi agent 的調用方式

**簡單 CRUD**：單個 pi subagent 處理（async: false，等結果）

```typescript
// app/api/ai/generate/route.ts
import { runAgent } from '@/lib/ai/agent-runner';

export async function POST(request: Request) {
  const { userInput } = await request.json();
  
  const result = await runAgent({
    agent: 'json-spec-compiler',
    task: `用戶需求：${userInput}\n請按 docs/specs/json-spec.md 生成對應的 CRUD 規範與代碼。`,
  });
  
  return Response.json(result);
}
```

**複雜需求**：用 workflowScript 編排多個 subagent

```typescript
// lib/ai/pipelines/crud-generation.workflow.ts
import { runs } from 'pi-subagents';

export const crudGenerationPipeline = runs.all([
  { key: 'analyze', agent: 'analyst', task: '分析需求...' },
  { key: 'spec', agent: 'json-spec-generator', task: '生成 JSON...' },
  { key: 'tdd', agent: 'tdd-test-writer', task: '寫測試...' },
  { key: 'code', agent: 'dev', task: '寫代碼...' },
  { key: 'review', agent: 'reviewer', task: '校驗...' },
]);
```

### 6.4 pi agent 的 Context 管理

每次 pi agent 啟動時，**自動注入**以下檔案到 context：

1. `AGENTS.md` — SOP 和萬事原則
2. `docs/specs/json-spec.md` — JSON 功能規範
3. `docs/specs/extension-spec.md` — Extension 規範
4. `docs/system-design.md` — 系統架構
5. `docs/DESIGN.md` — 設計規範
6. `docs/backlog.md` — 當前任務狀態

> 💡 為什麼自動注入？因為這些是規範的 source of truth。如果 AI 不知道這些規範，生成的代碼會不一致。

### 6.5 為什麼這個設計對 AI 開發特別好？

1. **規範一致性**：所有 AI 行為都來自同一份規範文檔
2. **可審計**：交付摘要、測試結果、commit log 全都有
3. **可改進**：規範文檔改了，所有 AI 行為同步改
4. **可擴展**：未來加新功能，只需更新規範文檔
5. **可教學**：新人看規範文檔就能理解框架

---

## 7. Extension 機制

### 7.1 Extension 結構

每個 Extension 是一個獨立的目錄，位於 `extensions/<name>/`：

```
extensions/blog/
├── index.ts                    # Extension 入口（必須）
├── schema.json                 # JSON 規範（描述這個 Extension）
├── components/                 # Extension 提供的 React 組件
├── api/                        # Extension 提供的 API routes
├── prisma/                     # Extension 引入的 Prisma 模型
└── config.json                 # Extension 配置（名稱、版本、依賴）
```

### 7.2 Extension 生命週期

1. **發現**（Discovery）：掃描 `extensions/` 目錄，讀取 `index.ts`
2. **註冊**（Registration）：把 Extension 註冊到 Extension Registry
3. **加載**（Loading）：按需加載 Extension 代碼
4. **掛載**（Mount）：Extension 的 UI 組件掛載到指定路由
5. **卸載**（Unmount）：停用 Extension 時執行清理

### 7.3 Extension 與 JSON 規範

Extension 的 `schema.json` 跟「功能 JSON」**風格一致**，但多了 Extension 專屬欄位：

```json
{
  "name": "blog",
  "version": "1.0.0",
  "type": "crud-extension",
  "models": [...],
  "api": [...],
  "ui": {...},
  "mountPoints": [
    { "slot": "admin-sidebar", "component": "BlogMenuItem" }
  ],
  "permissions": [...]
}
```

完整定義見 `docs/specs/extension-spec.md`。

---

## 8. 資料模型（Prisma Schema 草案）

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// M2: 用戶與認證
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  passwordHash  String?
  role          Role      @relation(fields: [roleId], references: [id])
  roleId        String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  sessions      Session[]
}

model Role {
  id          String       @id @default(cuid())
  name        String       @unique
  description String?
  permissions Permission[]
  users       User[]
}

model Permission {
  id     String @id @default(cuid())
  action String // e.g., "blog.create", "blog.delete"
  role   Role   @relation(fields: [roleId], references: [id])
  roleId String
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
}

// M6: Extension 系統
model Extension {
  id          String   @id @default(cuid())
  name        String   @unique
  version     String
  enabled     Boolean  @default(true)
  config      Json     // Extension 配置
  schemaJson  Json     // JSON 規範
  installedAt DateTime @default(now())
}

// M4: AI 配置
model AIConfig {
  id           String  @id @default(cuid())
  provider     String  // "openai" | "claude"
  apiKey       String  // 加密存儲
  model        String  // e.g., "gpt-4o", "claude-3-5-sonnet"
  isDefault    Boolean @default(false)
  createdAt    DateTime @default(now())
}

// M1: AI 生成的 Function（動態 CRUD）
model GeneratedFunction {
  id          String   @id @default(cuid())
  name        String   @unique
  jsonSpec    Json     // 完整 JSON 規範
  compiledAt  DateTime @default(now())
  status      String   // "active" | "disabled"
  source      String   // "user-input" | "extension"
}

// M1: AI 對話歷史
model ChatMessage {
  id        String   @id @default(cuid())
  userId    String
  role      String   // "user" | "assistant" | "system"
  content   String
  metadata  Json?    // 例如：生成的 JSON 規範、編譯狀態
  createdAt DateTime @default(now())
}
```

---

## 9. 部署架構

### MVP 階段（簡單）

```
┌──────────────────────┐
│   Vercel / Docker    │
│   Next.js Application│
│   (含 Hono API)       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│   PostgreSQL         │
│   (Supabase / Neon)  │
└──────────────────────┘
```

### 未來擴展

```
┌──────────────────────┐
│   CDN (CloudFront)   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐    ┌──────────────────┐
│   Next.js (Vercel)   │───▶│  AI Queue         │
│   - SSR / API       │    │  (BullMQ)        │
└──────────┬───────────┘    └──────────┬───────┘
           │                           │
           ▼                           ▼
┌──────────────────────┐    ┌──────────────────┐
│   PostgreSQL (RDS)   │    │  OpenAI / Claude │
└──────────────────────┘    └──────────────────┘
```

---

## 10. 安全考量

1. **認證**：所有 admin 路由需登入（Middleware 攔截）
2. **RBAC**：每個 API 端點檢查權限
3. **API Key 加密**：AI Config 的 API Key 用 AES-256 加密存儲
4. **SQL 注入**：Prisma 自動防護（參數化查詢）
5. **XSS**：React 自動轉義；富文本編輯器需 sanitize
6. **CSRF**：NextAuth + SameSite cookies
7. **Rate Limiting**：AI API 加 rate limit（防止 token 刷爆）

---

## 11. 性能考量

1. **資料庫索引**：所有外鍵、unique 欄位建索引
2. **API 快取**：列表頁 API 加 ETag 或 SWR
3. **AI 回應**：串流回應（streaming），提升 UX
4. **AI 編譯**：編譯過程異步化（用戶看到進度條）
5. **Extension 加載**：按需加載，不打包進主 bundle

---

## 12. 開發流程

每個 Module 獨立開發，每個 User Story 走完整 SOP §2.3 流程：

1. **Gate 1（TDD）**：先寫測試，紅 → 綠
2. **Gate 2（Lint）**：ESLint + TypeScript 必須通過
3. **Gate 3（Regression）**：跑 regression-guard
4. **Gate 4（Reviewer）**：用 dev-checker-loop 校驗

---

## 13. 混合模式架構（JSON + Extension Code）

### 13.1 為什麼需要混合模式？

業務邏輯有三個層次：

| 層次 | 範例 | JSON 表達？ |
|---|---|---|
| **L1 — 標準 CRUD** | 增刪改查、列表、表單 | ✅ 100% |
| **L2 — 業務規則** | 必填、enum、唯一、正則、簡單 computed field | ✅ 80% |
| **L3 — 複雜業務邏輯** | 狀態機、複雜計算、副作用、外部 API、審批 | ❌ 幾乎不可能 |

**L3 真實案例**：
- 訂單狀態機：待付款 → 已付款 → 已發貨 → 已完成 + 自動過期 / 自動通知
- 價格計算：單價 × 數量 × 折扣率 + 動態稅額
- 副作用鏈：建立訂單 → 扣庫存 → 發 Email → 通知倉庫（一個 transaction）
- 審批流程：多部門、多步驟、不同處理人

**架構原理**：JSON 處理 L1+L2，Extension Code 處理 L3。**AI 同時生成兩層**。

### 13.2 三層架構圖

```
┌──────────────────────────────────────────────┐
│           JSON 規範層（資料 + UI）             │
│                                              │
│  • 資料模型（models）                         │
│  • 欄位定義（fields / types / validation）    │
│  • UI 配置（list / form / badge / sortable）   │
│  • Permissions、Menu、Page metadata          │
│  • Hook 引用（hooks: { beforeCreate: ...}）  │
└──────────────────┬───────────────────────────┘
                   ↓ JSON Compiler 生成
┌──────────────────────────────────────────────┐
│           框架自動生成層                       │
│                                              │
│  • Prisma schema                              │
│  • REST API routes（GET/POST/PUT/DELETE）     │
│  • CRUD 頁面（list / form / detail）           │
│  • Permission 註冊                            │
└──────────────────┬───────────────────────────┘
                   ↓ 業務需求時
┌──────────────────────────────────────────────┐
│           Extension Code 層（業務邏輯）        │
│                                              │
│  • Hooks（beforeCreate / afterUpdate 等）     │
│  • Actions（自定義 action / command）         │
│  • Computed Fields（動態計算欄位）             │
│  • Workflows（狀態機 / 審批流程）              │
│  • Integrations（外部 API、第三方服務）        │
└──────────────────────────────────────────────┘
```

### 13.3 JSON 規範中如何引用代碼

JSON 規範中以 **`{{fn:函数名稱}}`** 語法引用 Extension 提供的函數：

```json
{
  "name": "order",
  "models": [
    {
      "name": "Order",
      "fields": [
        { "name": "status", "type": "enum", "values": ["draft", "paid", "shipped", "completed"] },
        { "name": "totalPrice", "type": "decimal", "computed": "{{fn:calculateOrderTotal}}" },
        { "name": "validUntil", "type": "datetime", "computed": "{{fn:getOrderExpiry}}" }
      ]
    }
  ],
  "hooks": {
    "beforeCreate": "{{fn:validateOrderBeforeCreate}}",
    "afterCreate": "{{fn:onOrderCreated}}",
    "onTransition": "{{fn:handleOrderTransition}}"
  },
  "actions": [
    {
      "name": "markAsPaid",
      "label": "標記為已付款",
      "implementation": "{{fn:markOrderAsPaid}}"
    },
    {
      "name": "cancelOrder",
      "label": "取消訂單",
      "implementation": "{{fn:cancelOrder}}"
    }
  ]
}
```

### 13.4 Extension 代碼層的結構

```typescript
// extensions/order/index.ts
import { defineExtension } from '@/lib/extensions';

export default defineExtension({
  name: 'order',
  version: '1.0.0',
  schema: () => import('./schema.json'),
  
  hooks: {
    beforeCreate: () => import('./hooks/before-create'),
    afterCreate: () => import('./hooks/after-create'),
    onTransition: () => import('./hooks/on-transition'),
  },
  
  actions: {
    markOrderAsPaid: () => import('./actions/mark-paid'),
    cancelOrder: () => import('./actions/cancel'),
  },
  
  computed: {
    calculateOrderTotal: () => import('./computed/calculate-total'),
    getOrderExpiry: () => import('./computed/get-expiry'),
  },
});
```

```typescript
// extensions/order/computed/calculate-total.ts
import type { Order } from '@/generated/order.types';

export function calculateOrderTotal(order: Order): number {
  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity, 0
  );
  const discount = getDiscountRate(order.userId);
  const tax = calculateTax(order.shippingAddress, subtotal);
  return subtotal * (1 - discount) + tax;
}
```

### 13.5 AI 生成範例

用戶輸入自然語言需求：

> 「幫我做個訂單管理，有狀態機（待付款→已付款→已發貨→已完成），含計算總價、自動扣庫存、Email 通知」

AI（透過 pi agent）自動生成：

```
extensions/order/
├── index.ts                     # 入口
├── schema.json                  # JSON 規範（含 {{fn:...}} 引用）
├── prisma/
│   └── extension.prisma         # Order、OrderItem、OrderTransition
├── hooks/
│   ├── before-create.ts         # validateOrderBeforeCreate
│   ├── after-create.ts          # onOrderCreated（扣庫存 + Email）
│   └── on-transition.ts         # handleOrderTransition
├── actions/
│   ├── mark-paid.ts             # markOrderAsPaid
│   └── cancel.ts                # cancelOrder
├── computed/
│   ├── calculate-total.ts       # calculateOrderTotal
│   └── get-expiry.ts            # getOrderExpiry
├── workflows/
│   └── order-state-machine.ts   # 狀態機定義
├── tests/
│   ├── hooks.test.ts
│   ├── actions.test.ts
│   └── computed.test.ts
└── README.md                    # 使用說明
```

### 13.6 混合模式的關鍵設計原則

| 原則 | 說明 |
|---|---|
| **JSON 是契約** | JSON 規範描述「要做什麼」，Extension Code 描述「怎麼做」 |
| **Type 共享** | JSON Schema 生成 TS Types（訂單 Order、訂單項 OrderItem），Extension Code 用同一份 Types |
| **AI 能生成兩層** | AI 不只生成 JSON，還生成 hook/action/computed 的完整 TypeScript 實作 + 測試 |
| **Hook 是可選** | JSON 規範中不寫 hook，就走純自動生成的路徑 |
| **Action 是標準化** | Extension Action 是框架定義的 interface，不能隨便寫任意函數 |
| **Workflow 是聲明式** | 狀態機用 xstate 或自定義 DSL 表達，不是 hardcode 跳轉邏輯 |
| **可測試性** | hook/action/computed 都是純函數或 class，易於單測 |
| **可逐步遷移** | 未來某些 L3 邏輯如果結構化了，可以搬上 JSON Workflow DSL |

### 13.7 框架提供的 SDK

```typescript
// lib/extensions/sdk.ts

// Hook 定義
export interface ExtensionHooks<T> {
  beforeCreate?: (data: Partial<T>) => Promise<Partial<T>>;
  beforeUpdate?: (data: Partial<T>, existing: T) => Promise<Partial<T>>;
  afterCreate?: (data: T) => Promise<void>;
  afterUpdate?: (data: T, previous: T) => Promise<void>;
  beforeDelete?: (data: T) => Promise<void>;
  afterDelete?: (data: T) => Promise<void>;
  onTransition?: (data: T, from: string, to: string) => Promise<void>;
}

// Action 定義
export interface ExtensionAction<TInput, TOutput> {
  name: string;
  label: string;
  description?: string;
  input: ZodSchema<TInput>;
  output: ZodSchema<TOutput>;
  execute: (input: TInput, context: ActionContext) => Promise<TOutput>;
}

// Computed Field 定義
export interface ComputedField<T> {
  name: string;
  compute: (entity: T) => unknown;
}

// Workflow 定義
export interface Workflow<T> {
  states: Record<string, StateConfig<T>>;
  transitions: Transition[];
}
```

### 13.8 限制與邊界

| 可表達 | 不可表達 |
|---|---|
| 單純 CRUD | 動態類型決策（需要 runtime code） |
| 狀態機（含 transition 條件） | 複雜的 type narrowing |
| 計算（純函數） | ML / AI 推理業務邏輯 |
| 同步副作用（Email / DB / API） | 長時 connection（websocket） |
| 簡單外部 API 呼叫 | 處理高並發、手動 connection pool |

> 💡 這些限制推動框架未來演進。MVP 階段只記錄這些邊界，並提供實現路徑。

---

## 14. 待辦與開放問題

- [ ] Extension Marketplace：未來可上線
- [ ] 多語言支援：i18n 設計待定
- [ ] 實時協作：用戶多人同時編輯 JSON
- [ ] AI 編譯的 undo/redo 機制
- [ ] Workflow DSL：是否使用 xstate 或自定義
- [ ] Computed Field 快取策略
- [ ] Extension Code 的 permission / sandbox 限制

---

**相關文檔**：
- 📐 [UX/UI 設計](./DESIGN.md)
- 📝 [JSON 功能規範](./specs/json-spec.md)
- 🔌 [Extension 開發規範](./specs/extension-spec.md)
- 📊 [Backlog](./backlog.md)