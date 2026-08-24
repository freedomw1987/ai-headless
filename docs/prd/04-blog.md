# PRD: Blog (Module 3)

> **模組代號**：M3
> **模組名稱**：Blog（第一個 CRUD 範例）
> **版本**：1.0.0
> **最後更新**：2026-08-24
> **狀態**：Ready for Sprint 1

---

## 1. 模組概述

### 1.1 模組目標

M3（Blog）是 ai-headless 框架的**第一個 CRUD 範例 Extension**。它的目的是：

1. **驗證框架**：證明 JSON 規範 → 代碼 的 pipeline 能跑
2. **作為範本**：其他 Extension 可以參考 Blog 的實作
3. **提供實用功能**：用戶立刻能用的 Blog 文章管理

### 1.2 為什麼把 Blog 做成 Extension？

- Blog 是「業務功能」，不應該污染核心代碼
- Extension 是 first-class，所以 Blog 是 Extension，不是寫死
- 未來用戶可以 disable Blog，或修改它的 JSON 規範

### 1.3 模組邊界

| 屬於 M3 | 不屬於 M3 |
|---|---|
| Blog CRUD | 用戶認證（M2） |
| 富文本編輯器 | AI Chat（M5） |
| 文章列表 / 詳情 / 表單 | Extension 管理（M6） |

### 1.4 依賴關係

- **依賴**：M1（Framework Core）、M2（Auth & RBAC）
- **被依賴**：無

---

## 2. 功能清單（Functional Requirements）

### 2.1 FR-1：文章 CRUD

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| FR-1.1 | 文章列表頁 | P0 | 1 |
| FR-1.2 | 新增文章 | P0 | 2 |
| FR-1.3 | 編輯文章 | P0 | 1 |
| FR-1.4 | 刪除文章（軟刪除） | P0 | 1 |
| FR-1.5 | 文章詳情頁 | P0 | 1 |
| FR-1.6 | 文章搜尋 / 篩選 / 分頁 | P0 | 1 |

### 2.2 FR-2：富文本編輯

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| FR-2.1 | Tiptap 富文本編輯器 | P0 | 2 |
| FR-2.2 | Markdown 編輯（可選） | P2 | 3 |
| FR-2.3 | 圖片上傳 | P1 | 2 |
| FR-2.4 | 文章預覽 | P1 | 1 |

### 2.3 FR-3：分類與標籤

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| FR-3.1 | 文章分類（Category） | P1 | 2 |
| FR-3.2 | 文章標籤（Tag） | P1 | 2 |
| FR-3.3 | 分類 / 標籤 CRUD | P1 | 2 |

### 2.4 FR-4：JSON 規範

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| FR-4.1 | `extensions/blog/schema.json` | P0 | 已完成（在 [extension-spec.md 範例 §6.1](../../specs/extension-spec.md)）|

### 2.5 FR-5：業務邏輯 Hook（混合模式範例）

> 這個範例展示如何用 **混合模式** 為 Blog 加業務邏輯。AI 會生成下面這些 hook 函數。

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| FR-5.1 | **Hook：`generateSlugFromTitle`**（beforeCreate）— 從標題自動生成 slug | P0 | 1 |
| FR-5.2 | **Hook：`generateExcerpt`**（afterCreate）— 從 content 前 200 字自動生成摘要 | P0 | 1 |
| FR-5.3 | **Hook：`setPublishedAt`**（beforeUpdate）— 當狀態變 published 時自動設定發布時間 | P0 | 1 |
| FR-5.4 | **Action：`publishPost`**（一鍵發布） | P0 | 2 |
| FR-5.5 | **Action：`unpublishPost`**（取消發布） | P0 | 1 |
| FR-5.6 | **Computed：`readingTime`**（計算閱讀時間，純函數） | P1 | 1 |
| FR-5.7 | **Workflow：** 文章狀態機（draft → review → published → archived） | P2 | 3 |

---

## 3. 非功能需求

### 3.1 性能

- 列表頁載入 < 200ms（100 篇文章）
- 富文本編輯器回應 < 100ms

### 3.2 安全

- 富文本 sanitize（防 XSS）
- 圖片上傳大小限制（5MB）
- 圖片上傳類型限制（jpg, png, webp）

### 3.3 編輯器

- 必須支援 undo / redo
- 必須支援自動儲存（draft）
- 必須支援快捷鍵（Ctrl+B, Ctrl+I 等）

---

## 4. JSON 規範（Extension Schema）

Blog Extension 的 schema.json 遵循 `docs/specs/json-spec.md`：

```json
{
  "name": "blog-post",
  "label": "Blog 文章",
  "models": [
    {
      "name": "Post",
      "fields": [
        { "name": "title", "type": "string", "required": true, "ui": { "list": true, "form": true, "searchable": true } },
        { "name": "slug", "type": "string", "required": true, "unique": true, "validation": { "pattern": "^[a-z0-9-]+$" } },
        { "name": "content", "type": "richText", "required": true, "ui": { "form": true, "widget": "editor" } },
        { "name": "excerpt", "type": "text", "ui": { "form": true, "widget": "textarea" } },
        { "name": "status", "type": "enum", "validation": { "enum": ["draft", "review", "published", "archived"] }, "default": "draft", "ui": { "list": true, "badge": true } },
        { "name": "publishedAt", "type": "datetime", "ui": { "list": true, "form": true, "sortable": true } }
      ],
      "computed": [
        {
          "name": "readingTime",
          "type": "number",
          "compute": "{{fn:calculateReadingTime}}",
          "dependencies": ["content"]
        }
      ],
      "relations": [
        { "type": "belongsTo", "model": "User", "foreignKey": "authorId" }
      ]
    }
  ],

  "hooks": {
    "beforeCreate": "{{fn:generateSlugFromTitle}}",
    "afterCreate": "{{fn:generateExcerpt}}",
    "beforeUpdate": "{{fn:setPublishedAt}}"
  },

  "actions": [
    {
      "name": "publishPost",
      "label": "發布文章",
      "icon": "send",
      "variant": "primary",
      "implementation": "{{fn:publishPost}}",
      "requires": {
        "state": ["draft", "review"],
        "permission": "blog.update"
      }
    },
    {
      "name": "unpublishPost",
      "label": "取消發布",
      "icon": "undo",
      "implementation": "{{fn:unpublishPost}}",
      "requires": {
        "state": ["published"],
        "permission": "blog.update"
      }
    }
  ],

  "workflows": [
    {
      "name": "postStateMachine",
      "initialState": "draft",
      "states": {
        "draft":    { "label": "草稿",   "badge": "default" },
        "review":   { "label": "審核中", "badge": "warning" },
        "published":{ "label": "已發布", "badge": "success" },
        "archived": { "label": "已封存", "badge": "danger" }
      },
      "transitions": [
        { "from": "draft",    "to": "review",    "effect": "{{fn:submitForReview}}" },
        { "from": "review",   "to": "published", "guard": "{{fn:approvePost}}", "effect": "{{fn:setPublishedAt}}" },
        { "from": "published","to": "archived",  "effect": "{{fn:archivePost}}" }
      ]
    }
  ],

  "ui": {
    "menu": { "label": "Blog", "icon": "file-text", "path": "/blog" },
    "pages": {
      "list": { "columns": ["title", "status", "publishedAt"], "defaultSort": { "field": "publishedAt", "order": "desc" } }
    }
  },
  "permissions": [
    { "action": "blog.read", "roles": ["admin", "editor", "viewer"] },
    { "action": "blog.create", "roles": ["admin", "editor"] },
    { "action": "blog.update", "roles": ["admin", "editor"] },
    { "action": "blog.delete", "roles": ["admin"] }
  ]
}
```

完整 schema.json 將透過 pi agent 從 extension-spec.md 範例生成。

---

## 5. 資料模型

### 5.1 Prisma Schema

```prisma
model Post {
  id          String    @id @default(cuid())
  title       String
  slug        String    @unique
  content     String    @db.Text
  excerpt     String?
  status      String    @default("draft")
  publishedAt DateTime?
  authorId    String
  author      User      @relation(fields: [authorId], references: [id])
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?
  
  @@index([status])
  @@index([publishedAt])
  @@index([authorId])
  @@map("posts")
}
```

---

## 6. 使用者故事

### 6.1 US-M3-01：撰寫文章

> **作為** 編輯
> **我想要** 用富文本編輯器寫 Blog 文章
> **以便** 發布到後台

**驗收標準**：
- [ ] `/blog/new` 提供 Tiptap 編輯器
- [ ] 支援加粗、斜體、標題、列表、引用、連結、圖片
- [ ] 自動儲存草稿（每 30 秒）
- [ ] 點擊「發布」→ 文章狀態變 published

### 6.2 US-M3-02：瀏覽文章

> **作為** 用戶
> **我想要** 看 Blog 文章列表
> **以便** 找到想看的文章

**驗收標準**：
- [ ] `/blog` 顯示所有 published 文章
- [ ] 可按發布日期排序
- [ ] 可搜尋標題
- [ ] 點擊進入詳情頁

### 6.3 US-M3-03：編輯 / 刪除

> **作為** 編輯
> **我想要** 修改或刪除舊文章
> **以便** 保持內容正確

**驗收標準**：
- [ ] 文章列表有「編輯」「刪除」按鈕（沒權限不顯示）
- [ ] 編輯頁載入既有內容
- [ ] 刪除需二次確認
- [ ] 刪除為軟刪除（資料保留，可恢復）

---

### 6.4 US-M3-04：一鍵發布文章（混合模式 Action 範例）

> **作為** 編輯
> **我想要** 一鍵點「發布」按鈕
> **以便** 快速發文，不需手動改狀態

**驗收標準**：
- [ ] 文章列表 / 詳情頁顯示「發布」按鈕
- [ ] 只在狀態為 `draft` 或 `review` 時顯示
- [ ] 點擊 → 呼叫 `publishPost` action
- [ ] 自動走狀態機轉換 + `onTransition` hook
- [ ] 自動設 publishedAt 時間

**AI 生成的 Action 代碼**：

```typescript
// extensions/blog/actions/publish-post.ts
import { z } from 'zod';
import type { ExtensionAction, ActionContext } from '@/lib/extensions';
import type { Post } from '@/generated/post.types';

const inputSchema = z.object({
  postId: z.string().cuid(),
});

export const publishPost: ExtensionAction<z.infer<typeof inputSchema>, Post> = {
  name: 'publishPost',
  label: '發布文章',
  icon: 'send',
  variant: 'primary',

  inputSchema,

  async execute(input, ctx: ActionContext) {
    // 1. 取文章
    const post = await ctx.api.db.post.findUnique({ where: { id: input.postId } });
    if (!post) throw new Error('文章不存在');

    // 2. 狀態檢查
    if (!['draft', 'review'].includes(post.status)) {
      throw new Error(`無法從 ${post.status} 發布`);
    }

    // 3. 走狀態機（會自動跑 guard → effect → onTransition）
    const updated = await ctx.api.workflow.transition(post, 'published', {
      reason: '一鍵發布',
    });

    return updated;
  },

  visible(post: Post) {
    return ['draft', 'review'].includes(post.status);
  },
};
```

**對應的 Hook 代碼**：

```typescript
// extensions/blog/hooks/before-create.ts
import type { Post } from '@/generated/post.types';

export async function generateSlugFromTitle(data: Partial<Post>): Promise<Partial<Post>> {
  if (!data.slug && data.title) {
    data.slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  return data;
}

// extensions/blog/hooks/after-create.ts
export async function generateExcerpt(data: Post): Promise<void> {
  const excerpt = data.content
    .replace(/<[^>]+>/g, '')    // 去 HTML
    .substring(0, 200)
    .trim();

  await prisma.post.update({
    where: { id: data.id },
    data: { excerpt },
  });
}

// extensions/blog/hooks/before-update.ts
export async function setPublishedAt(
  data: Partial<Post>,
  existing: Post
): Promise<Partial<Post>> {
  if (data.status === 'published' && !existing.publishedAt) {
    data.publishedAt = new Date();
  }
  return data;
}
```

**對應的 Computed Field**：

```typescript
// extensions/blog/computed/calculate-reading-time.ts
import type { Post } from '@/generated/post.types';

export function calculateReadingTime(post: Post): number {
  const text = post.content.replace(/<[^>]+>/g, '');
  const wordsPerMinute = 200;   // 中文 ~200 字/分鐘
  return Math.max(1, Math.ceil(text.length / wordsPerMinute));
}
```

> 💡 **重點**：JSON 規範描述「要做什麼」，Extension Code 描述「怎麼做」。AI 同時生成兩層。

---

## 7. 測試計劃

### 7.1 單元測試

- [ ] Schema 校驗（slug 格式、status enum）
- [ ] Sanitize HTML（XSS 防護）
- [ ] 自動儲存邏輯

### 7.2 E2E 測試

- [ ] 完整流程：新增 → 編輯 → 發布 → 刪除
- [ ] 沒權限的用戶看不到「編輯」按鈕

---

## 8. 開發計劃

### Sprint 1

| Task | FR | SP |
|---|---|---|
| Extension manifest.json + schema.json | FR-4.1 | 1 |
| Prisma model + migration | — | 1 |
| pi agent 自動生成 API + UI 代碼 | FR-1 全 | 3 |
| Tiptap 編輯器整合 | FR-2.1 | 2 |
| 列表 / 詳情 / 表單頁 | FR-1.1~1.5 | 2 |
| 自動儲存草稿 | FR-2.x | 1 |
| 測試 | — | 2 |

**總計**：12 SP

---

## 9. 相關文檔

- 📐 [系統架構](../system-design.md)
- 🎨 [UX/UI 設計](../DESIGN.md)
- 📝 [JSON 功能規範](../specs/json-spec.md)
- 🔌 [Extension 開發規範](../specs/extension-spec.md)
- 📋 [M1 PRD](./01-framework-core.md)
- 📋 [M2 PRD](./03-auth.md)
- 📊 [Backlog](../backlog.md)