# Extension 開發規範（Extension Development Specification）

> **這份文檔是給 AI 看的**：AI 讀了這份規範，就能生成可安裝、可運行的 Extension 模塊。
>
> **版本**：1.0.0
> **形式**：OpenSpec（Markdown SOP + JSON Schema + TypeScript Types + 範例代碼）

---

## 目錄

1. [總覽](#1-總覽)
2. [Extension 結構](#2-extension-結構)
3. [Manifest Schema](#3-manifest-schema)
4. [Extension API](#4-extension-api)
5. [TypeScript Types](#5-typescript-types)
6. [完整範例](#6-完整範例)
7. [開發 SOP](#7-開發-sop)
8. [最佳實踐](#8-最佳實踐)
9. [測試規範](#9-測試規範)
10. [發布規範](#10-發布規範)

---

## 1. 總覽

### 1.1 什麼是 Extension？

Extension 是 ai-headless 框架的**可插拔功能模塊**。它可以是：
- 📝 **CRUD Extension**：提供一組相關的 CRUD 功能（例如 Blog、Todo）
- 🎨 **UI Extension**：自定義 UI 組件、頁面、主題
- 🔌 **Integration Extension**：整合第三方服務（例如 Stripe、Slack）
- ⚙️ **Feature Extension**：為現有功能添加新能力（例如「Blog Comments」）

### 1.2 為什麼要 Extension？

1. **核心穩定**：框架核心只提供基礎功能，業務邏輯都在 Extension 裡
2. **可插拔**：用戶可啟用/停用 Extension，不污染主框架
3. **可分享**：Extension 可打包、發布、社群共用
4. **AI 友好**：AI 只需讀這個規範，就能生成 Extension

### 1.3 Extension 的邊界

| 框架核心負責 | Extension 負責 |
|---|---|
| 認證、RBAC | 業務功能（Blog、CRM、ERP 等） |
| 基礎 UI 組件 | 行業專用 UI |
| AI Pipeline | Extension 專用 prompt |
| Extension 加載機制 | Extension 自身邏輯 |

### 1.4 誰會讀這份文檔？

- 🤖 **AI（主要讀者）**：生成 Extension 代碼
- 👨‍💻 **Extension 開發者**：理解 Extension API、debug

---

## 2. Extension 結構

### 2.1 目錄結構

每個 Extension 是 `extensions/` 目錄下的一個獨立個子：

```
extensions/<extension-name>/
├── index.ts                 # 入口文件（必須）
├── manifest.json            # Extension 元數據（必須）
├── schema.json              # 功能 JSON（CRUD Extension 才需要）
├── components/              # React 組件
│   ├── AdminMenu.tsx        # 範例：後台選單項
│   └── *.tsx
├── pages/                   # 自定義頁面（可選）
│   └── *.tsx
├── api/                     # API routes（可選）
│   └── route.ts
├── hooks/                   # Extension hooks（可選）
│   └── *.ts
├── prisma/                  # Prisma 模型擴充（可選）
│   └── extensions.prisma
├── config.json              # 用戶可改的配置（可選）
├── README.md                # Extension 文檔
└── tests/                   # 測試（可選但推薦）
    └── *.test.ts
```

### 2.2 命名規則

| 項目 | 規則 | 範例 |
|---|---|---|
| Extension 目錄 | kebab-case | `blog`, `stripe-integration` |
| `manifest.json#name` | kebab-case，與目錄同名 | `blog` |
| `manifest.json#displayName` | 任意（用戶可改） | `Blog 文章管理` |
| 組件檔案 | PascalCase | `BlogMenu.tsx` |

### 2.3 入口文件（index.ts）

```typescript
// extensions/blog/index.ts
import { defineExtension } from '@/lib/extensions';
import manifest from './manifest.json';
import BlogMenu from './components/BlogMenu';
import { registerBlogRoutes } from './api/routes';

export default defineExtension({
  manifest,
  
  // 啟動 Extension 時執行
  async onLoad(api) {
    console.log('Blog extension loaded');
    
    // 註冊 API routes
    await registerBlogRoutes(api);
    
    // 註冊選單
    api.registerMenuItem({
      label: 'Blog 文章',
      icon: 'file-text',
      path: '/blog',
      order: 10,
      component: BlogMenu,
    });
    
    // 訂閱事件
    api.on('user.login', (user) => {
      console.log('User logged in:', user.email);
    });
  },
  
  // 卸載時執行
  async onUnload(api) {
    console.log('Blog extension unloaded');
  },
  
  // Extension 配置變更時執行
  async onConfigChange(api, newConfig, oldConfig) {
    console.log('Config changed:', newConfig);
  },
});
```

---

## 3. Manifest Schema

`manifest.json` 描述 Extension 的元數據：

### 3.1 完整 Schema

```json
{
  "name": "blog",
  "version": "1.0.0",
  "displayName": "Blog 文章管理",
  "description": "提供完整的 Blog CRUD 功能，含富文本編輯器",
  "author": "ai-headless Team",
  "license": "MIT",
  "homepage": "https://github.com/example/blog-extension",
  "type": "crud-extension",
  "icon": "file-text",
  "main": "index.ts",
  "minFrameworkVersion": "1.0.0",
  "dependencies": {
    "extensions": []
  },
  "permissions": [
    "blog.read",
    "blog.create",
    "blog.update",
    "blog.delete"
  ],
  "mountPoints": [
    {
      "slot": "admin-sidebar",
      "component": "BlogMenu",
      "order": 10
    }
  ],
  "configSchema": {
    "type": "object",
    "properties": {
      "enableComments": {
        "type": "boolean",
        "default": true,
        "title": "啟用留言功能"
      },
      "postsPerPage": {
        "type": "number",
        "default": 10,
        "minimum": 1,
        "maximum": 100,
        "title": "每頁文章數"
      }
    }
  },
  "aiHints": {
    "category": "content-management",
    "tags": ["blog", "cms", "publishing"],
    "prompts": [
      "幫我做個 Blog 文章管理",
      "我要 CMS 系統"
    ]
  }
}
```

### 3.2 欄位說明

| 欄位 | 類型 | 必填 | 說明 |
|---|---|---|---|
| `name` | string | ✅ | Extension 唯一識別（kebab-case） |
| `version` | string | ✅ | semver |
| `displayName` | string | ✅ | 顯示名稱（用戶可改） |
| `description` | string | ✅ | 簡短描述 |
| `author` | string | ❌ | 作者 |
| `license` | string | ❌ | 授權（預設 MIT） |
| `homepage` | string | ❌ | 網址 |
| `type` | string | ✅ | 見下方類型說明 |
| `icon` | string | ❌ | lucide-react icon 名稱 |
| `main` | string | ✅ | 入口檔案路徑（相對於 Extension 根） |
| `minFrameworkVersion` | string | ❌ | 最低框架版本 |
| `dependencies` | object | ❌ | 依賴其他 Extension |
| `permissions` | string[] | ✅ | Extension 需要的權限 |
| `mountPoints` | array | ❌ | UI 掛載點 |
| `configSchema` | object | ❌ | 用戶可配置項（JSON Schema） |
| `aiHints` | object | ❌ | 給 AI 的提示，用於「智能推薦 Extension」 |

### 3.3 Extension 類型（`type`）

| 值 | 說明 | 範例 |
|---|---|---|
| `crud-extension` | 提供 CRUD 功能 | Blog, Todo, CRM |
| `feature-extension` | 為現有功能添加能力 | Blog-Comments, File-Upload |
| `ui-extension` | 自定義 UI、頁面 | Custom-Dashboard |
| `integration-extension` | 整合第三方 | Stripe, Slack, GitHub |
| `theme-extension` | 主題、樣式 | Dark-Theme |

### 3.4 掛載點（`mountPoints`）

```typescript
interface MountPoint {
  slot: MountSlot;
  component: string;        // 組件名稱（在 Extension 內 export）
  order?: number;
}

type MountSlot =
  | 'admin-sidebar'         // 後台側邊欄
  | 'admin-dashboard'       // 後台首頁小工具
  | 'admin-settings'        // 後台設定頁
  | 'user-profile'          // 用戶個人頁
  | 'global-header'         // 全站頭部
  | 'global-footer';        // 全站底部
```

**未來擴展**：可支援自定義 slot。

### 3.5 權限（`permissions`）

格式：`<extension-name>.<action>`，例如：
- `blog.read`
- `blog.create`
- `blog.update`
- `blog.delete`

AI 在生成 CRUD Extension 時，自動生成對應的權限清單。

---

## 4. Extension API

Extension 透過 `defineExtension` 接收的 `api` 對象，可以呼叫框架的核心能力。

### 4.1 api 對象完整 API

```typescript
interface ExtensionAPI {
  // ─── 基本資訊 ───
  manifest: ExtensionManifest;
  config: Record<string, any>;      // 用戶配置
  
  // ─── 資料庫 ───
  db: typeof prisma;                // Prisma client
  
  // ─── 認證 ───
  auth: {
    getSession(): Promise<Session | null>;
    requireUser(): Promise<User>;   // 沒登入會 throw
  };
  
  // ─── 權限 ───
  rbac: {
    checkPermission(user: User, action: string): Promise<boolean>;
    requirePermission(user: User, action: string): Promise<void>;
  };
  
  // ─── AI ───
  ai: {
    chat(messages: ChatMessage[]): Promise<string>;
    generateJsonSpec(prompt: string): Promise<JsonSpec>;
  };
  
  // ─── 註冊 UI ───
  registerMenuItem(item: MenuItem): void;
  registerPage(page: PageConfig): void;
  registerWidget(slot: MountSlot, component: ComponentDef): void;
  
  // ─── 註冊 API ───
  registerApiRoute(route: ApiRoute): void;
  
  // ─── 註冊資料模型 ───
  registerModel(model: PrismaModel): void;     // 自動加入 Prisma schema

  // ─── 工作流（狀態機 / 審批）───
  workflow: {
    canTransition<T>(entity: T, to: string): Promise<boolean>;
    transition<T>(entity: T, to: string, context?: any): Promise<T>;
    getState<T>(entity: T): string;
    registerStateMachine<T>(machine: StateMachine<T>): void;
  };

  // ─── 事件 ───
  on(event: ExtensionEvent, handler: Function): void;
  emit(event: ExtensionEvent, data: any): void;
  
  // ─── 日誌 ───
  log: {
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, meta?: any): void;
  };
  
  // ─── Storage ───
  storage: {
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: any): Promise<void>;
    delete(key: string): Promise<void>;
  };
}
```

### 4.2 事件清單（ExtensionEvent）

| 事件 | 觸發時機 | Payload |
|---|---|---|
| `user.login` | 用戶登入 | `{ user: User }` |
| `user.logout` | 用戶登出 | `{ userId: string }` |
| `user.created` | 新建用戶 | `{ user: User }` |
| `user.deleted` | 刪除用戶 | `{ userId: string }` |
| `extension.loaded` | Extension 加載完成 | `{ name: string }` |
| `extension.unloaded` | Extension 卸載 | `{ name: string }` |
| `config.changed` | 配置變更 | `{ key: string, value: any }` |
| `ai.response` | AI 回應完成 | `{ prompt, response, tokens }` |

### 4.3 Hook SDK（生命週期）

Extension 可以提供 hook 函數，讓 JSON 規範引用（`{{fn:...}}`）。AI 生成的 Extension 也會包含這些 hook。

```typescript
interface ExtensionHooks<T = any> {
  // ─── CRUD 生命週期 ───
  beforeCreate?: (data: Partial<T>) => Promise<Partial<T>>;
  //   - 可修改、驗證、拋錯 throw new ValidationError('...')
  //   - 返回修改後的 data

  afterCreate?: (data: T) => Promise<void>;
  //   - 副作用：扣庫存、發 Email、同步到外部

  beforeUpdate?: (data: Partial<T>, existing: T) => Promise<Partial<T>>;
  afterUpdate?: (data: T, previous: T) => Promise<void>;

  beforeDelete?: (data: T) => Promise<void>;
  //   - 可拋錯阻止刪除：throw new Error('無法刪除已付款訂單')

  afterDelete?: (data: T) => Promise<void>;

  // ─── 狀態機生命週期 ───
  onTransition?: (data: T, from: string, to: string) => Promise<void>;
  //   - 狀態轉換後執行（可用於副作用：寄信、扣庫存）

  // ─── 查詢生命週期 ───
  beforeList?: (query: ListQuery) => Promise<ListQuery>;
  //   - 修改查詢條件：例如加 organizationId 過濾

  afterList?: (result: ListResult<T>) => Promise<ListResult<T>>;
  //   - 修改結果：例如加上 computed field

  beforeRead?: (id: string) => Promise<string>;
  afterRead?: (data: T) => Promise<T>;
}
```

**範例：訂單 beforeCreate**

```typescript
// extensions/order/hooks/before-create.ts
import type { Order } from '@/generated/order.types';
import { checkStock } from '@/extensions/inventory';

export async function validateOrderBeforeCreate(data: Partial<Order>): Promise<Partial<Order>> {
  // 1. 驗證商品都有庫存
  for (const item of data.items ?? []) {
    const stock = await checkStock(item.productId);
    if (stock < item.quantity) {
      throw new ValidationError(`${item.name} 庫存不足`);
    }
  }

  // 2. 自動計算訂單編號
  if (!data.orderNumber) {
    data.orderNumber = generateOrderNumber();
  }

  return data;
}
```

**範例：訂單 onTransition**

```typescript
// extensions/order/hooks/on-transition.ts
import type { Order } from '@/generated/order.types';

export async function handleOrderTransition(
  order: Order,
  fromState: string,
  toState: string
): Promise<void> {
  // 已付款 → 扣庫存 + 發 Email
  if (toState === 'paid') {
    await deductStock(order.items);
    await sendOrderEmail(order);
  }

  // 已發貨 → 通知倉庫
  if (toState === 'shipped') {
    await notifyWarehouse(order);
  }

  // 取消訂單 → 退款（如果已付款）
  if (toState === 'cancelled' && fromState === 'paid') {
    await processRefund(order);
  }
}
```

---

### 4.4 Action SDK（自定義動作）

Extension 提供自定義動作，會以按鈕形式出現在 UI。

```typescript
interface ExtensionAction<TInput = any, TOutput = any> {
  name: string;                    // 唯一名稱
  label: string;                   // 按鈕文字
  description?: string;

  // 輸入輸出 schema（用 Zod 或類似）
  inputSchema?: ZodSchema<TInput>;
  outputSchema?: ZodSchema<TOutput>;

  // 執行函數
  execute: (input: TInput, context: ActionContext) => Promise<TOutput>;

  // 可選：條件檢查（返回 false 不顯示按鈕）
  visible?: (entity: T) => boolean | Promise<boolean>;

  // 可選：確認訊息
  confirmation?: string;

  // 可選：UI meta
  icon?: string;                   // 圖標名（lucide-react）
  variant?: 'default' | 'danger' | 'primary';
}

interface ActionContext {
  user: User;                      // 當前用戶
  api: ExtensionAPI;               // Extension API 對象
  logger: Logger;
}
```

**範例：訂單取消動作**

```typescript
// extensions/order/actions/cancel.ts
import { z } from 'zod';
import type { Order } from '@/generated/order.types';
import type { ExtensionAction, ActionContext } from '@/lib/extensions';

const inputSchema = z.object({
  reason: z.string().optional(),
  refund: z.boolean().default(true),
});

export const cancelOrder: ExtensionAction<z.infer<typeof inputSchema>, Order> = {
  name: 'cancelOrder',
  label: '取消訂單',
  icon: 'x-circle',
  variant: 'danger',
  confirmation: '確定取消訂單？已付款會退款。',

  inputSchema,

  async execute(input, ctx: ActionContext) {
    const order = await ctx.api.db.order.findUnique({
      where: { id: input.orderId },
    });

    if (!order) throw new Error('訂單不存在');

    // 1. 狀態檢查
    if (order.status === 'completed') {
      throw new Error('已完成訂單無法取消');
    }

    // 2. 退款（如果已付款）
    if (order.status === 'paid' && input.refund) {
      await ctx.api.emit('order.refund', { orderId: order.id });
    }

    // 3. 觸發狀態轉換（會走 onTransition hook）
    await ctx.api.workflow.transition(order, 'cancelled', {
      reason: input.reason,
    });

    // 4. 返回最新訂單
    return ctx.api.db.order.findUnique({ where: { id: order.id } });
  },

  visible(order) {
    return ['draft', 'pending_payment', 'paid'].includes(order.status);
  },
};
```

---

### 4.5 Computed Field SDK（動態計算）

Extension 提供 computed field 函數，供 JSON 規範引用。

```typescript
interface ComputedFieldFn<T = any> {
  compute: (entity: T, context: ComputedContext) => unknown | Promise<unknown>;
}

interface ComputedContext {
  user: User;
  api: ExtensionAPI;
}
```

**範例：訂單總價**

```typescript
// extensions/order/computed/calculate-total.ts
import type { Order } from '@/generated/order.types';
import type { ComputedFieldFn } from '@/lib/extensions';

export const calculateOrderTotal: ComputedFieldFn<Order & { items: OrderItem[] }> = {
  async compute(order, ctx) {
    const subtotal = order.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // 查詢用戶折扣率
    const userDiscount = await getUserDiscount(order.userId);

    const afterDiscount = subtotal * (1 - userDiscount);

    // 根據配送地址查稅率
    const taxRate = await getTaxRate(order.shippingAddress);

    const tax = afterDiscount * taxRate;

    return Math.round((afterDiscount + tax) * 100) / 100;
  },
};
```

---

### 4.6 Workflow SDK（狀態機 / 審批）

Extension 提供狀態機定義和轉換函數。框架會自動註冊並提供 API。

```typescript
interface StateMachine<T> {
  name: string;
  initialState: string;

  states: Record<string, StateConfig<T>>;
  transitions: TransitionDef<T>[];

  // 可選：判定目前狀態（如果不放在 entity.status 字段）
  getState?: (entity: T) => string;
}

interface StateConfig<T> {
  label: string;
  description?: string;
  badge?: 'default' | 'success' | 'warning' | 'danger';
  allowedActions?: string[];
  onEnter?: (entity: T, context: any) => Promise<void>;
  onExit?: (entity: T, context: any) => Promise<void>;
}

interface TransitionDef<T> {
  from: string | string[];
  to: string;
  guard?: (entity: T, context: any) => boolean | Promise<boolean>;
  effect?: (entity: T, context: any) => Promise<void>;
  requires?: {
    permission?: string;
  };
}
```

**API 對象提供 workflow 控制**：

```typescript
api.workflow = {
  // 檢查轉換是否合法
  canTransition(entity: T, to: string): Promise<boolean>;

  // 觸發轉換（會走 guard → effect → onEnter → onTransition hook）
  transition(entity: T, to: string, context?: any): Promise<T>;

  // 取得目前狀態
  getState(entity: T): string;
};
```

**範例：訂單狀態機**

```typescript
// extensions/order/workflows/state-machine.ts
import type { Order } from '@/generated/order.types';
import type { StateMachine } from '@/lib/extensions';
import { verifyPaymentReceived, canCancelOrder } from './guards';
import { processCancellation, onOrderPaid } from './effects';

export const orderStateMachine: StateMachine<Order> = {
  name: 'orderStateMachine',
  initialState: 'draft',

  states: {
    draft: {
      label: '草稿',
      badge: 'default',
      allowedActions: ['submitOrder', 'cancelOrder'],
    },
    pending_payment: {
      label: '待付款',
      badge: 'warning',
      allowedActions: ['markAsPaid', 'cancelOrder'],
    },
    paid: {
      label: '已付款',
      badge: 'success',
      onEnter: onOrderPaid,
    },
    shipped: {
      label: '已發貨',
      badge: 'success',
    },
    completed: {
      label: '已完成',
      badge: 'success',
    },
    cancelled: {
      label: '已取消',
      badge: 'danger',
    },
  },

  transitions: [
    {
      from: 'draft',
      to: 'pending_payment',
    },
    {
      from: 'pending_payment',
      to: 'paid',
      guard: verifyPaymentReceived,
    },
    {
      from: 'paid',
      to: 'shipped',
      requires: { permission: 'order.ship' },
    },
    {
      from: ['draft', 'pending_payment', 'paid'],
      to: 'cancelled',
      guard: canCancelOrder,
      effect: processCancellation,
    },
  ],
};
```

---

### 4.7 完整範例：使用 Extension API（混合模式）

```typescript
// extensions/blog/index.ts
import { defineExtension } from '@/lib/extensions';
import manifest from './manifest.json';

export default defineExtension({
  manifest,
  
  async onLoad(api) {
    // ─── 註冊資料模型 ───
    api.registerModel({
      name: 'Post',
      fields: {
        title: 'String',
        slug: 'String @unique',
        content: 'String @db.Text',
        publishedAt: 'DateTime?',
        status: 'String @default("draft")',
        authorId: 'String',
      },
      relations: {
        author: 'User @relation(fields: [authorId], references: [id])',
      },
    });
    
    // ─── 註冊 API routes ───
    api.registerApiRoute({
      method: 'GET',
      path: '/api/blog/posts',
      handler: async (request, ctx) => {
        const user = await api.auth.requireUser();
        await api.rbac.requirePermission(user, 'blog.read');
        const posts = await api.db.post.findMany();
        return Response.json({ data: posts });
      },
    });
    
    // ─── 註冊選單 ───
    api.registerMenuItem({
      label: 'Blog',
      icon: 'file-text',
      path: '/blog',
      order: 10,
      component: () => import('./components/BlogMenu'),
    });
    
    // ─── 訂閱事件 ───
    api.on('user.login', (user) => {
      api.log.info(`User ${user.email} logged in, last visit: ${new Date()}`);
    });
    
    // ─── Storage ───
    const visitCount = await api.storage.get<number>('visitCount') || 0;
    await api.storage.set('visitCount', visitCount + 1);
  },
});
```

---

## 5. TypeScript Types

```typescript
// lib/extensions/types.ts

import type { ComponentType } from 'react';
import type { PrismaClient } from '@prisma/client';
import type { User, Session } from '@/lib/auth/types';

export type ExtensionType =
  | 'crud-extension'
  | 'feature-extension'
  | 'ui-extension'
  | 'integration-extension'
  | 'theme-extension';

export type MountSlot =
  | 'admin-sidebar'
  | 'admin-dashboard'
  | 'admin-settings'
  | 'user-profile'
  | 'global-header'
  | 'global-footer';

export interface MountPoint {
  slot: MountSlot;
  component: string;          // 組件名稱
  order?: number;
}

export interface ExtensionManifest {
  name: string;
  version: string;
  displayName: string;
  description: string;
  author?: string;
  license?: string;
  homepage?: string;
  type: ExtensionType;
  icon?: string;
  main: string;
  minFrameworkVersion?: string;
  dependencies?: {
    extensions?: string[];
  };
  permissions?: string[];
  mountPoints?: MountPoint[];
  configSchema?: any;         // JSON Schema
  aiHints?: {
    category?: string;
    tags?: string[];
    prompts?: string[];
  };
}

export interface MenuItem {
  label: string;
  icon: string;
  path: string;
  order?: number;
  parent?: string;
  component?: ComponentType | (() => Promise<{ default: ComponentType }>);
}

export interface PageConfig {
  path: string;
  title: string;
  component: ComponentType | (() => Promise<{ default: ComponentType }>);
  permission?: string;
}

export interface ApiRoute {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  handler: (request: Request, ctx: { api: ExtensionAPI }) => Promise<Response>;
  permission?: string;
}

export interface PrismaModelField {
  name: string;
  type: string;
  optional?: boolean;
  unique?: boolean;
  default?: any;
}

export interface PrismaModel {
  name: string;
  fields: Record<string, string>;
  relations?: Record<string, string>;
}

export type ExtensionEvent =
  | 'user.login'
  | 'user.logout'
  | 'user.created'
  | 'user.deleted'
  | 'extension.loaded'
  | 'extension.unloaded'
  | 'config.changed'
  | 'ai.response';

export interface ExtensionAPI {
  manifest: ExtensionManifest;
  config: Record<string, any>;
  
  db: PrismaClient;
  
  auth: {
    getSession(): Promise<Session | null>;
    requireUser(): Promise<User>;
  };
  
  rbac: {
    checkPermission(user: User, action: string): Promise<boolean>;
    requirePermission(user: User, action: string): Promise<void>;
  };
  
  ai: {
    chat(messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>): Promise<string>;
    generateJsonSpec(prompt: string): Promise<any>;
  };
  
  registerMenuItem(item: MenuItem): void;
  registerPage(page: PageConfig): void;
  registerWidget(slot: MountSlot, component: ComponentType): void;
  registerApiRoute(route: ApiRoute): void;
  registerModel(model: PrismaModel): void;
  
  on(event: ExtensionEvent, handler: (...args: any[]) => void): void;
  emit(event: ExtensionEvent, data: any): void;
  
  log: {
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, meta?: any): void;
  };
  
  storage: {
    get<T = any>(key: string): Promise<T | null>;
    set(key: string, value: any): Promise<void>;
    delete(key: string): Promise<void>;
  };
}

export interface ExtensionDefinition {
  manifest: ExtensionManifest;
  onLoad?(api: ExtensionAPI): void | Promise<void>;
  onUnload?(api: ExtensionAPI): void | Promise<void>;
  onConfigChange?(api: ExtensionAPI, newConfig: any, oldConfig: any): void | Promise<void>;
}

export function defineExtension(definition: ExtensionDefinition): ExtensionDefinition {
  return definition;
}
```

---

## 6. 完整範例

### 6.1 範例 1：Blog Extension（CRUD）

完整檔案結構：

```
extensions/blog/
├── index.ts
├── manifest.json
├── schema.json                # 對應 JSON 功能規範
├── components/
│   ├── BlogMenu.tsx           # 後台選單項
│   ├── PostList.tsx           # 文章列表（可選，框架會自動生成）
│   └── PostEditor.tsx         # 文章編輯器（可選）
├── api/
│   ├── routes.ts              # API routes 註冊
│   └── handlers.ts              # API handlers
├── hooks/
│   └── onPostPublish.ts       # 文章發布 hook
├── README.md
└── tests/
    └── blog.test.ts
```

**manifest.json**：

```json
{
  "name": "blog",
  "version": "1.0.0",
  "displayName": "Blog 文章管理",
  "description": "完整的 Blog CRUD，含富文本編輯器、分類、標籤",
  "type": "crud-extension",
  "icon": "file-text",
  "main": "index.ts",
  "permissions": ["blog.read", "blog.create", "blog.update", "blog.delete"],
  "mountPoints": [
    {
      "slot": "admin-sidebar",
      "component": "BlogMenu",
      "order": 10
    }
  ],
  "configSchema": {
    "type": "object",
    "properties": {
      "enableComments": { "type": "boolean", "default": true },
      "postsPerPage": { "type": "number", "default": 10 }
    }
  },
  "aiHints": {
    "category": "content-management",
    "tags": ["blog", "cms", "publishing"],
    "prompts": ["幫我做 Blog", "我要 CMS"]
  }
}
```

**schema.json**（用 JSON 功能規範）：

```json
{
  "name": "blog-post",
  "label": "Blog 文章",
  "models": [
    {
      "name": "Post",
      "fields": [
        {
          "name": "title",
          "type": "string",
          "required": true,
          "ui": { "list": true, "form": true, "searchable": true }
        },
        {
          "name": "content",
          "type": "richText",
          "required": true,
          "ui": { "form": true, "widget": "editor" }
        },
        {
          "name": "status",
          "type": "enum",
          "validation": { "enum": ["draft", "published", "archived"] },
          "default": "draft",
          "ui": { "list": true, "badge": true }
        }
      ],
      "relations": [
        {
          "type": "belongsTo",
          "model": "User",
          "foreignKey": "authorId"
        }
      ]
    }
  ]
}
```

**index.ts**：

```typescript
import { defineExtension } from '@/lib/extensions';
import manifest from './manifest.json';
import BlogMenu from './components/BlogMenu';
import { registerBlogRoutes } from './api/routes';

export default defineExtension({
  manifest,
  
  async onLoad(api) {
    // 註冊 API
    await registerBlogRoutes(api);
    
    // 註冊選單
    api.registerMenuItem({
      label: 'Blog',
      icon: 'file-text',
      path: '/blog',
      order: 10,
      component: BlogMenu,
    });
    
    // 文章發布時記錄 log
    api.on('post.published', (post) => {
      api.log.info(`Post published: ${post.title}`, { postId: post.id });
    });
  },
});
```

### 6.2 範例 2：Stripe Integration Extension（Integration）

```
extensions/stripe-integration/
├── index.ts
├── manifest.json
├── components/
│   ├── StripeSettings.tsx     # 設定頁
│   └── PaymentButton.tsx      # 付款按鈕（其他 Extension 可用）
├── api/
│   ├── webhook.ts             # Stripe webhook
│   └── checkout.ts            # 結帳流程
└── README.md
```

**manifest.json**：

```json
{
  "name": "stripe-integration",
  "version": "1.0.0",
  "displayName": "Stripe 支付整合",
  "description": "整合 Stripe 支付功能",
  "type": "integration-extension",
  "icon": "credit-card",
  "main": "index.ts",
  "permissions": ["payment.read", "payment.create"],
  "configSchema": {
    "type": "object",
    "properties": {
      "secretKey": { "type": "string", "format": "password" },
      "publishableKey": { "type": "string" },
      "webhookSecret": { "type": "string", "format": "password" }
    },
    "required": ["secretKey", "publishableKey"]
  }
}
```

**index.ts**：

```typescript
import { defineExtension } from '@/lib/extensions';
import manifest from './manifest.json';
import Stripe from 'stripe';

export default defineExtension({
  manifest,
  
  async onLoad(api) {
    // 取得用戶配置的 Stripe key
    const { secretKey, webhookSecret } = api.config;
    
    if (!secretKey) {
      api.log.warn('Stripe secret key not configured');
      return;
    }
    
    const stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' });
    
    // 註冊 webhook 處理器
    api.registerApiRoute({
      method: 'POST',
      path: '/api/stripe/webhook',
      handler: async (request) => {
        const sig = request.headers.get('stripe-signature');
        const body = await request.text();
        const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
        
        // 處理不同事件
        switch (event.type) {
          case 'checkout.session.completed':
            api.emit('payment.completed', event.data.object);
            break;
          case 'invoice.payment_failed':
            api.emit('payment.failed', event.data.object);
            break;
        }
        
        return new Response('ok', { status: 200 });
      },
    });
    
    api.log.info('Stripe integration loaded');
  },
});
```

### 6.3 範例 3：Dark Theme Extension（Theme）

```
extensions/dark-theme/
├── index.ts
├── manifest.json
├── styles/
│   └── dark.css
└── components/
    └── ThemeSwitcher.tsx
```

**manifest.json**：

```json
{
  "name": "dark-theme",
  "version": "1.0.0",
  "displayName": "深色主題",
  "description": "為後台加上深色主題切換",
  "type": "theme-extension",
  "icon": "moon",
  "main": "index.ts",
  "permissions": [],
  "mountPoints": [
    {
      "slot": "global-header",
      "component": "ThemeSwitcher",
      "order": 100
    }
  ]
}
```

---

## 7. 開發 SOP（由 pi agent 執行）

> **重要**：Extension 的開發 SOP 由 **pi agent** 執行，不是純 LLM API。
> pi agent 會讀本規範、AGENTS.md、SOP，並跑完整 Gate 流程。

### 7.0 為什麼用 pi agent 開發 Extension？

| 純 LLM API | pi agent（推薦） |
|---|---|
| 不知道 Extension API | 自動讀 `lib/extensions/types.ts`，理解所有可用 API |
| 不會跑測試 | 會跑完整測試套件（單測、整合、E2E） |
| 不會檢查 manifest | 會校驗 manifest.json 對齊本規範 §3 Schema |
| 命名不一致 | 自動遵循 §8.1 命名規則 |
| 無法迭代 | 看測試失敗 → 改代碼 → 重跑，直到通過 |

### 7.1 pi agent 完整 SOP

```
[Stage 1] 理解需求
   - 讀用戶輸入（「加一個留言板 Extension」）
   - 確定類型（CRUD / Feature / UI / Integration / Theme）
   - 列出功能需求

[Stage 2] 讀規範
   - 讀 docs/specs/extension-spec.md（本規範）
   - 讀 docs/specs/json-spec.md（如 CRUD Extension）
   - 讀 docs/system-design.md（目錄結構、約定）
   - 讀 docs/DESIGN.md（設計 tokens）

[Stage 3] 設計 Manifest
   - 按 §3 Schema 設計 manifest.json
   - 命名遵循 §8.1（kebab-case）
   - 列出 permissions、mountPoints、configSchema

[Stage 4] 設計資料模型（CRUD Extension）
   - 讀 json-spec.md
   - 寫 schema.json（Data Model + API Contract + UI Meta）
   - JSON Schema 校驗

[Stage 5] TDD Gate
   - 先寫測試（紅）
   - 跑 vitest 確認失敗
   - 寫實作（綠）
   - 跑 vitest 確認通過

[Stage 6] 生成 Extension 代碼
   - index.ts（入口）
   - components/（UI 組件）
   - api/（API routes）
   - prisma/（如需擴充模型）
   - README.md
   - tests/

[Stage 7] Lint Gate
   - eslint + tsc 必須通過
   - 修正錯誤

[Stage 8] Regression Gate
   - 跑所有測試
   - 確保沒破壞既有功能

[Stage 9] Reviewer Gate
   - reviewer subagent 校驗：
     - manifest 是否合規
     - 權限是否合理
     - 命名是否一致
     - 文檔是否完整

[Stage 10] Submitter
   - 用 submitter skill 產出交付摘要
   - 更新 docs/backlog.md
   - 更新 docs/prd/<module>.md（如適用）

[輸出] 用戶看到「Extension 已安裝並啟用」+ 「下載 manifest」按鈕
```

### 7.2 pi agent 調用範例

**簡單 Extension**（單個 subagent）：

```typescript
// app/api/ai/generate-extension/route.ts
import { runSubagent } from '@/lib/ai/agent-runner';

export async function POST(request: Request) {
  const { userInput } = await request.json();
  
  const result = await runSubagent({
    agent: 'extension-generator',
    contextFiles: [
      'AGENTS.md',
      'docs/specs/extension-spec.md',
      'docs/specs/json-spec.md',
      'docs/system-design.md',
      'docs/DESIGN.md',
    ],
    task: `
      用戶需求：${userInput}
      
      請按以下流程執行：
      1. 讀 docs/specs/extension-spec.md（必讀）
      2. 確定 Extension 類型（§3.3）
      3. 設計 manifest.json（§3 Schema）
      4. CRUD Extension 還需寫 schema.json（參考 json-spec.md）
      5. 跑 §7.1 Stage 5-10 的 Gate 流程
      6. 安裝到 extensions/<name>/
      7. 註冊到 extensions/_registry.json
      8. 用 submitter skill 產出摘要
    `,
  });
  
  return Response.json(result);
}
```

**複雜 Extension**（workflowScript）：

```typescript
// lib/ai/pipelines/extension-generation.workflow.ts
export const extensionGenerationPipeline = {
  stages: [
    {
      name: 'design',
      agent: 'extension-designer',
      task: '設計 manifest.json 和 schema.json',
    },
    {
      name: 'tdd',
      agent: 'tdd-test-writer',
      task: '寫 Extension 測試',
    },
    {
      name: 'code',
      agent: 'dev',
      task: '生成 Extension 代碼（components/api/hooks）',
    },
    {
      name: 'register',
      agent: 'dev',
      task: '註冊到 _registry.json，跑 prisma migrate',
    },
    {
      name: 'review',
      agent: 'reviewer',
      task: '校驗 manifest、權限、命名、文檔',
    },
    {
      name: 'submit',
      agent: 'submitter',
      task: '產出交付摘要，更新 backlog',
    },
  ],
};
```

### 7.3 pi agent 必須自動讀取的規範文檔

每次 pi agent 啟動時，**自動注入**：

| 檔案 | 用途 |
|---|---|
| `AGENTS.md` | SOP、萬事原則、gates.json |
| `docs/specs/extension-spec.md` | 本規範 |
| `docs/specs/json-spec.md` | JSON 功能規範（如 CRUD Extension） |
| `docs/system-design.md` | 系統架構、目錄結構 |
| `docs/DESIGN.md` | 設計 tokens、組件風格 |
| `lib/extensions/types.ts` | ExtensionAPI 完整類型定義 |
| `docs/backlog.md` | 當前 Sprint 狀態 |

### 7.4 傳統步驟（保留作參考）

下面是手動開發流程，pi agent 會自動跑過，但保留供開發者理解：

## 8. 最佳實踐

### 8.1 命名

1. **目錄 & manifest.name**：`kebab-case`
2. **displayName**：用戶面向，可隨時改
3. **權限**：`<extension-name>.<action>`

### 8.2 性能

1. **組件 lazy load**：`component: () => import('./BlogMenu')`
2. **API handler 快取**：避免重複查詢
3. **Storage 用量**：避免存大資料

### 8.3 安全

1. **永不信任用戶輸入**：API handler 必須驗證
2. **權限檢查**：每個 API 都要 `requirePermission`
3. **secret 不 log**：`api.log` 不輸出 API Key
4. **config 加密**：用戶提供的 secret 在資料庫加密存儲

### 8.4 相容性

1. **寫清楚 `minFrameworkVersion`**
2. **不要 hardcode 路徑**：用 `api.config`
3. **不要直接改框架核心代碼**

### 8.5 UX

1. **menu 排序合理**：核心功能 order < 100，進階功能 order > 100
2. **顯示名稱簡潔**：≤ 6 個中文字
3. **icon 統一**：用 lucide-react

---

## 9. 測試規範

### 9.1 必測項目

每個 Extension 必須包含：
- [ ] 至少 1 個單元測試（核心邏輯）
- [ ] 至少 1 個整合測試（Extension API）
- [ ] manifest.json Schema 校驗通過

### 9.2 測試範例

```typescript
// extensions/blog/tests/blog.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestExtensionContext } from '@/lib/extensions/test-utils';
import blogExtension from '../index';

describe('Blog Extension', () => {
  let ctx: ReturnType<typeof createTestExtensionContext>;
  
  beforeEach(() => {
    ctx = createTestExtensionContext(blogExtension);
  });
  
  it('should register menu item', async () => {
    await blogExtension.onLoad?.(ctx.api);
    expect(ctx.registeredMenuItems).toContainEqual(
      expect.objectContaining({ label: 'Blog', path: '/blog' })
    );
  });
  
  it('should register API routes', async () => {
    await blogExtension.onLoad?.(ctx.api);
    expect(ctx.registeredRoutes).toContainEqual(
      expect.objectContaining({ path: '/api/blog/posts', method: 'GET' })
    );
  });
  
  it('should have valid manifest', () => {
    expect(() => blogExtension.manifest).not.toThrow();
    expect(blogExtension.manifest.name).toBe('blog');
  });
});
```

---

## 10. 發布規範

### 10.1 本地 Extension（v0 階段）

只需放在 `extensions/` 目錄，框架自動發現。

### 10.2 共享 Extension（未來）

未來支援：
1. **npm 發布**：打包成 npm package，加上 `ai-headless-extension` 標籤
2. **GitHub 倉庫**：提供 git URL，安裝時 clone
3. **Extension Marketplace**：瀏覽器內建的 Extension 商店

### 10.3 發布前 Checklist

- [ ] 版本號遵循 semver
- [ ] manifest.json 完整
- [ ] README.md 有使用說明
- [ ] 測試通過
- [ ] 無 hardcoded secret
- [ ] 權限清單正確
- [ ] 相容性測試（與最新框架版本）

---

## 11. 版本與變更

| 版本 | 日期 | 變更 |
|---|---|---|
| 1.0.0 | 2026-08-24 | 初版 |

---

**相關文檔**：
- 📝 [JSON 功能規範](./json-spec.md)
- 🏗️ [系統架構](../system-design.md)
- 🎨 [UX/UI 設計](../DESIGN.md)