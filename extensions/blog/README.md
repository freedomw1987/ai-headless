# Blog Extension

> 部落格系統 — 展示 **完整混合模式**：Hook + Action + Computed + Workflow

## 功能

- **Hook** `beforeCreateBlogPost`：自動從 `title` 生成 `slug`，從 `content` 生成 `excerpt`
- **Computed** `computeReadingTime`：根據 `content` 字數估算閱讀時間（200 字/分鐘）
- **Workflow** `lifecycle`：文章狀態機 `draft → pending → published → archived`
- **Action** `publishBlogPost`：一鍵發布（draft/pending → published，自動設定 `publishedAt`）

## 檔案結構

```
extensions/blog/
├── blog-spec.json         # JsonSpec 規範
├── manifest.json          # Extension 元資料
├── hooks/
│   └── before-create.ts   # beforeCreateBlogPost
├── computed/
│   └── reading-time.ts    # computeReadingTime
├── workflows/
│   └── lifecycle.ts       # createStateMachine(...)
├── actions/
│   └── publish.ts         # publishBlogPost
└── README.md
```

## 狀態機

```
   draft ──submit──▶ pending ──approve──▶ published ──archive──▶ archived
     │                  │                     │
     └─────reject───────┘                     │
     │                                        │
     └────────────────────────────────────────┴──unpublish──▶ draft
```

## 使用

啟用後，AI Headless 自動生成：
- Prisma model：`BlogPost`
- API：`/api/blog/blog-post`（CRUD）
- Admin UI：`/admin/blog/blog-post`
- 權限：`blog.create` / `blog.read` / `blog.update` / `blog.delete`

## 範例

```ts
import { publishBlogPost } from '@/extensions/blog/actions/publish';
import { computeReadingTime } from '@/extensions/blog/computed/reading-time';
import { blogLifecycle } from '@/extensions/blog/workflows/lifecycle';

// 發布文章
const result = await publishBlogPost({
  data: { id: '1', title: 'Hello', status: 'draft' },
});
// → { ..., status: 'published', publishedAt: '2025-...' }

// 計算閱讀時間
const minutes = computeReadingTime(longContent); // 5

// 提交審核
const transition = blogLifecycle.transition('draft', 'pending', {
  entityId: '1',
  trigger: 'submit',
});
// → { ok: true, toState: 'pending', ... }
```