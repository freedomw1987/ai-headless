# 🚀 新手入門指南（Getting Started）

> 5 分鐘帶你從零到跑通第一個 CRUD。

---

## 步驟 1：安裝

```bash
# 需要 node >= 20 + bun >= 1.2 + postgres >= 14
bun install
cp .env.example .env
```

編輯 `.env`：

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/ai_headless"
AUTH_SECRET="<用 openssl rand -base64 32 生成>"
```

```bash
bun run db:push
```

---

## 步驟 2：啟動開發伺服器

```bash
bun run dev
```

打開 http://localhost:3000

---

## 步驟 3：用 AI Chat 生成第一個 JsonSpec

打開 http://localhost:3000/chat

輸入：

```
幫我做個書評系統，有標題、作者、評分（1-5）、內容（富文本）和發布狀態
```

AI 會回應：

```json
{
  "name": "book-review",
  "label": "書評",
  "models": [
    {
      "name": "BookReview",
      "fields": [
        { "name": "title", "type": "string" },
        { "name": "author", "type": "string" },
        { "name": "rating", "type": "integer", "validation": { "min": 1, "max": 5 } },
        { "name": "content", "type": "richtext" },
        { "name": "published", "type": "boolean" }
      ]
    }
  ]
}
```

按下「啟用」即可上線。

---

## 步驟 4：管理 Extensions

打開 http://localhost:3000/admin/extensions

可以看到已安裝的 Extensions：

- ✅ **todo**（v1.0.0）— 待辦事項
- ✅ **event**（v1.0.0）— 活動管理

點擊「停用」可暫時關閉某個 Extension（不會刪除檔案）。

---

## 步驟 5：建立自己的 Extension

### 5.1 建立目錄結構

```bash
mkdir -p extensions/my-extension/{hooks,actions,computed,workflows}
```

### 5.2 寫 manifest.json

```json
{
  "name": "my-extension",
  "version": "1.0.0",
  "label": "我的擴充",
  "description": "示範 Extension",
  "author": "your-name",
  "hooks": ["beforeCreateItem"],
  "actions": ["customAction"],
  "computed": ["customComputed"]
}
```

### 5.3 寫 JsonSpec

`extensions/my-extension/my-extension-spec.json`：

```json
{
  "name": "item",
  "models": [
    {
      "name": "Item",
      "fields": [
        { "name": "title", "type": "string" },
        { "name": "value", "type": "integer" }
      ],
      "hooks": {
        "beforeCreate": "{{fn:beforeCreateItem}}"
      },
      "computed": {
        "displayValue": "{{fn:customComputed}}"
      },
      "actions": [
        {
          "name": "customAction",
          "implementation": "{{fn:customAction}}"
        }
      ]
    }
  ]
}
```

### 5.4 寫 Hook

`extensions/my-extension/hooks/before-create.ts`：

```typescript
import type { HookContext } from '@/lib/hooks/hook-sdk';

export async function beforeCreateItem(ctx: HookContext<'beforeCreate'>) {
  if (typeof ctx.data.title === 'string') {
    ctx.data.title = ctx.data.title.trim();
  }
  return ctx;
}
```

### 5.5 寫 Computed

`extensions/my-extension/computed/custom-computed.ts`：

```typescript
export function customComputed(record: Record<string, unknown>) {
  return `$${record.value}`;
}
```

### 5.6 寫 Action

`extensions/my-extension/actions/custom-action.ts`：

```typescript
import type { ActionContext } from '@/lib/actions/action-sdk';

export async function customAction(
  input: unknown,
  ctx: ActionContext,
) {
  return { ...ctx.data, processed: true };
}
```

### 5.7 重新載入

刷新 http://localhost:3000/admin/extensions 即可看到新的 Extension。

---

## 🔧 常見問題

### Q1. 如何重置資料庫？

```bash
bun run db:reset
```

### Q2. 測試如何跑？

```bash
bunx vitest --run                       # 全部
bunx vitest --run tests/integration/    # 整合測試
bun run typecheck                       # Type check
bun run lint                            # ESLint
```

### Q3. 怎麼擴展 Auth？

編輯 `lib/auth/config.ts`，參考 [Auth.js v5 文件](https://authjs.dev/)。

### Q4. JsonSpec 怎麼驗證？

```typescript
import { validateJsonSpec } from '@/lib/specs/json-spec.validator';
const result = validateJsonSpec(spec);
if (!result.success) console.error(result.error);
```

---

## 📚 下一步

- 📐 [系統架構設計](system-design.md) — 了解框架底層
- 📋 [JsonSpec 規範](specs/json-spec.md) — 學習 JSON 規範
- 🔌 [Extension 規範](specs/extension-spec.md) — 深入 Extension
- 📦 [Backlog](backlog.md) — 看完整開發計劃
