# Extensions 教學

本目錄存放 ai-headless 的 **Extension 系統**。每個 extension 是一個可啟用/停用的功能模組，由 5 個檔案組成。

---

## 目錄結構

```
extensions/
├── blog/         ← 部落格 (含 workflow state machine)
│   ├── manifest.json        ← extension metadata + UI nav
│   ├── blog-spec.json       ← JSON 規格 (Single Source of Truth)
│   ├── workflow/            ← Extension Code (實作 workflow.ts)
│   ├── actions/             ← 自定義 API actions
│   ├── hooks/               ← lifecycle hooks
│   ├── computed/            ← computed fields
│   └── examples/            ← 使用範例 (給開發者參考)
├── order/        ← 訂單 (複雜 state machine, US-204 demo)
├── event/        ← 活動管理
└── todo/         ← 待辦事項 (最簡單)
```

---

## 必備檔案

每個 extension 至少要有：

| 檔案 | 必要性 | 用途 |
|---|---|---|
| `manifest.json` | **必要** | extension 啟用狀態、UI nav、permissions |
| `<name>-spec.json` | 強烈建議 | JSON 規格 — **Single Source of Truth** |
| `workflow/<name>-workflow.ts` | 強烈建議 | Extension Code — 商務邏輯實作 |

---

## Quick Start — 建立新 extension

### 1. `manifest.json` (必要)

```json
{
  "name": "my-feature",
  "label": "我的功能",
  "version": "0.1.0",
  "description": "功能說明",
  "isEnabled": true,
  "permissions": ["my-feature.read", "my-feature.write"],
  "nav": {
    "path": "/admin/my-feature",
    "label": "我的功能",
    "order": 70
  }
}
```

`nav.order`：決定 Sidebar 顯示順序（越小越前面）。預設放最後。

### 2. `<name>-spec.json` (JSON 規格)

```json
{
  "name": "my-feature",
  "label": "MyFeature",
  "apiBase": "/api/my-feature",
  "uiBase": "/admin/my-feature",
  "requiresExtension": "my-feature",
  "models": [{
    "name": "MyFeature",
    "label": "功能",
    "fields": [
      { "name": "title", "type": "string", "validation": { "required": true } },
      { "name": "status", "type": "enum", "options": ["draft", "published"] }
    ]
  }]
}
```

**驗證範圍**：
- `apiBase` / `uiBase`：自動生成對應路由
- `requiresExtension`：當 extension 被停用，自動加 Disable Guard
- `workflows`：自動生成 transition buttons + workflow schema
- `models.actions`：自動生成 `/api/.../actions/<name>` endpoint

### 3. `workflow/<name>-workflow.ts` (Extension Code)

商務邏輯放這裡。**workflow.ts 是 runtime 入口**，Sprint 9+ 採 State Machine Library 模式：

```typescript
import { createStateMachine } from '@/lib/state-machine/state-machine';
import { db } from '@/lib/db';

export const schema = {
  id: 'myFeature',
  initial: 'draft',
  states: {
    draft: { on: { publish: 'published' } },
    published: { on: { archive: 'archived' } },
    archived: {},
  },
};

export async function list() {
  return db.myFeature.findMany();
}

export async function create(input) {
  return db.myFeature.create({ data: { ...input, status: 'draft' } });
}

export async function transition(id, event) {
  const sm = createStateMachine(schema);
  const item = await db.myFeature.findUniqueOrThrow({ where: { id } });
  sm.setState(item.status);
  const newState = sm.transition({ event });
  return db.myFeature.update({ where: { id }, data: { status: newState } });
}
```

---

## Compiler Pipeline (Sprint 10-12)

`<name>-spec.json` + `manifest.json` 會經過 compiler 自動生成：

```
spec.json  ──┐
             ├─→  lib/compiler/compile.ts  ─→  app/api/<apiBase>/...
manifest ────┘                              app/admin/<uiBase>/...
```

**重要**：compiler **不取代手寫 workflow.ts**，而是自動生成 CRUD 路由 + UI scaffold。

---

## Disable Guard (Sprint 11)

當 extension `isEnabled: false`：
- API 自動回 403 (`guardExtensionApi`)
- Sidebar 自動隱藏對應連結 (`getEnabledExtensionNavItems`)
- Admin page 自動 redirect (`ExtensionPageGuard`)

只要在 `manifest.json` 設定 `isEnabled: false` 即可，不需要改程式。

---

## Workflow / State Machine (Sprint 12)

`spec.json` 內 `workflows` 欄位會：

1. 自動生成 `app/admin/<uiBase>/[id]/page.tsx` 內的 `<TransitionButtons>` 區塊
2. 自動內嵌 state machine schema 到 client component
3. 提供 `endpoint="/api/crud/<kebab>/{id}/transition"` 給 transition 按鈕呼叫

**範例** (`blog-spec.json`)：
```json
"workflows": [{
  "name": "blogPost",
  "initialState": "draft",
  "states": { "draft": {...}, "pending": {...}, ... },
  "transitions": [
    { "from": "draft", "to": "pending" },
    { "from": "pending", "to": "published" }
  ]
}]
```

`workflows.transitions` 為空陣列則跳過 transition buttons。

---

## Sidebar 自動生成 (Sprint 12)

`manifest.json` 加 `nav` 物件：

```json
"nav": { "path": "/admin/blog", "label": "部落格", "order": 40 }
```

- `order` 越小越前面
- 沒設 `order` 排最後（與其他沒 order 一同 tiebreaker）
- `isEnabled: false` 時自動隱藏

---

## 範例

每個 extension 都有 `examples/` 子目錄：

- `blog/examples/list-and-transition.ts` — 基本 CRUD + workflow
- `order/examples/full-lifecycle.ts` — 7 states 完整生命週期
- `event/examples/list-and-cancel.ts` — 簡單 status 管理
- `todo/examples/toggle-and-filter.ts` — toggle + filter

---

## 4 個 extension 對照表

| Extension | Workflow | States | Use Case |
|---|---|---|---|
| blog | State Machine | 4 | 內容審核流程 |
| order | State Machine | 7 | 電商訂單 (Sprint 9 US-204 demo) |
| event | 自動 computed | 4 | 活動時間軸 |
| todo | 無 | 1 | 簡單 todo |

---

## 如何擴展

要新增 extension「X」：

1. `mkdir extensions/x/`
2. 寫 `extensions/x/manifest.json`
3. 寫 `extensions/x/x-spec.json`
4. 寫 `extensions/x/workflow/x-workflow.ts`
5. `pnpm compile` 自動生成 CRUD 路由
6. `pnpm typecheck` 確認產出沒錯

詳細 spec 格式見 `docs/specs/json-spec.md` 和 `docs/specs/extension-spec.md`。