# JSON 功能規範（JSON Function Specification）

> **這份文檔是給 AI 看的**：AI 讀了這份規範，就能把 JSON 規範編譯成可運行的 CRUD 系統（前端 + 後端 + DB Migration）。
>
> **版本**：1.0.0
> **形式**：OpenSpec（Markdown SOP + JSON Schema + TypeScript Types + 範例）

---

## 目錄

1. [總覽](#1-總覽)
2. [規範結構總覽](#2-規範結構總覽)
3. [完整 Schema 說明](#3-完整-schema-說明)
4. [JSON Schema（機器可讀）](#4-json-schema機器可讀)
5. [TypeScript Types](#5-typescript-types)
6. [完整範例](#6-完整範例)
7. [編譯流程](#7-編譯流程)
8. [最佳實踐](#8-最佳實踐)
9. [錯誤處理](#9-錯誤處理)

---

## 1. 總覽

### 1.1 什麼是 JSON 功能規範？

JSON 功能規範是描述**一個 CRUD 功能**的完整聲明式文檔。它涵蓋：

- 📊 **Data Model**：實體、欄位、關聯
- 🔌 **API Contract**：REST endpoints、權限
- 🎨 **UI Meta**：列表欄位、表單佈局、頁面配置

### 1.2 為什麼用 JSON？

1. **AI 友好**：JSON 是 AI 最容易讀寫的格式
2. **可驗證**：JSON Schema 可以自動校驗
3. **類型安全**：可自動生成 TypeScript Types
4. **版本控制**：JSON diff 友好，可追蹤變更
5. **跨語言**：不綁定任何程式語言

### 1.3 誰會讀這份文檔？

- 🤖 **AI（主要讀者）**：讀了規範後，自動生成代碼
- 👨‍💻 **開發者**：理解框架、debug、看 AI 生成的結果
- 📋 **產品經理**（進階）：可以直接編輯 JSON（但 MVP 不暴露 UI）

### 1.4 JSON 規範的生命週期

```
[用戶需求]
   ↓ AI Requirement Analyzer
[結構化需求]
   ↓ AI JSON Generator + 本規範
[JSON 規範]
   ↓ JSON Schema 校驗
[編譯：Schema Generator + API Generator + UI Generator]
   ↓
[可運行系統]
   ↓
[用戶下載 JSON]  ←（可選，用戶可在 VSCode 打開看）
```

---

## 2. 規範結構總覽

```typescript
{
  // ─── 基本資訊 ───
  name: string;            // 唯一識別（小寫、英文、kebab-case）
  label: string;           // 顯示名稱（中文 / 多語言）
  version: string;         // semver
  
  // ─── 資料模型 ───
  models: Model[];         // 一個 JSON 規範可有多個 model
  
  // ─── API ───
  api: {
    endpoints: Endpoint[]; // REST endpoints
  };
  
  // ─── UI ───
  ui: {
    menu: MenuConfig;       // 後台側邊欄選單
    pages: {
      list?: ListPageConfig;
      form?: FormPageConfig;
      detail?: DetailPageConfig;
    };
  };
  
  // ─── 權限 ───
  permissions: Permission[];
}
```

---

## 3. 完整 Schema 說明

### 3.1 基本資訊

| 欄位 | 類型 | 必填 | 說明 |
|---|---|---|---|
| `name` | string | ✅ | 唯一識別。命名規則：小寫英文、`kebab-case`。例如：`todo`、`blog-post` |
| `label` | string | ✅ | 顯示名稱。用戶在 UI 看到的名字。例如：「待辦事項」 |
| `version` | string | ❌ | semver 版本號，預設 `1.0.0` |
| `description` | string | ❌ | 這個功能的描述 |

### 3.2 Models（資料模型）

每個 Model 描述一個資料表：

```typescript
{
  name: string;            // Model 名稱（PascalCase）
  tableName?: string;      // 自定義資料表名（預設自動生成）
  fields: Field[];         // 欄位
  relations?: Relation[];  // 關聯
  timestamps?: boolean;    // 是否自動加 createdAt/updatedAt，預設 true
  softDelete?: boolean;    // 是否軟刪除，預設 false
}
```

#### 3.2.1 Field（欄位）

```typescript
{
  name: string;              // 欄位名（camelCase）
  type: FieldType;           // 類型
  required?: boolean;        // 是否必填
  unique?: boolean;          // 是否唯一
  default?: any;             // 預設值
  description?: string;      // 欄位描述
  
  // 驗證
  validation?: {
    min?: number;            // 最小值 / 最短長度
    max?: number;            // 最大值 / 最長長度
    pattern?: string;        // regex
    enum?: any[];            // 列舉值（type=enum 時必填）
  };
  
  // UI Meta
  ui?: {
    list?: boolean;          // 是否顯示在列表頁
    form?: boolean;          // 是否顯示在表單
    detail?: boolean;        // 是否顯示在詳情頁
    sortable?: boolean;      // 是否可排序
    filterable?: boolean;    // 是否可篩選
    searchable?: boolean;    // 是否可搜尋
    hidden?: boolean;        // 是否隱藏（如密碼欄位）
    widget?: WidgetType;     // 表單組件類型
    placeholder?: string;    // 輸入提示
    helpText?: string;       // 說明文字
    badge?: boolean;         // enum 是否顯示為標籤（帶顏色）
  };
}
```

#### 3.2.2 FieldType（欄位類型）

| `type` | 對應 Prisma | 對應前端組件 | 說明 |
|---|---|---|---|
| `string` | `String` | Input | 短文字（255 字以內） |
| `text` | `String` | Textarea | 長文字 |
| `richText` | `String` | 富文本編輯器 | HTML / Markdown |
| `number` | `Int` 或 `Float` | Input (type=number) | 數字 |
| `boolean` | `Boolean` | Switch | 布林值 |
| `datetime` | `DateTime` | DateTime Picker | 日期時間 |
| `date` | `DateTime` | Date Picker | 日期 |
| `enum` | `Enum` | Select | 列舉 |
| `json` | `Json` | Code Editor | JSON 物件 |
| `file` | `String` | File Upload | 檔案 URL |
| `image` | `String` | Image Upload | 圖片 URL |
| `relation` | （見 Relation） | （見 Relation） | 關聯 |

#### 3.2.3 Widget（表單組件）

| `widget` | 適用 type | 說明 |
|---|---|---|
| `input` | string, number | 單行輸入 |
| `textarea` | text | 多行輸入 |
| `select` | enum | 下拉選單 |
| `multiselect` | enum (array) | 多選 |
| `switch` | boolean | 開關 |
| `checkbox` | boolean | 核選方塊 |
| `datepicker` | date | 日期選擇器 |
| `datetimepicker` | datetime | 日期時間選擇器 |
| `editor` | richText | 富文本編輯器（Tiptap） |
| `code` | json | JSON 代碼編輯器 |
| `file-upload` | file, image | 檔案上傳 |

#### 3.2.4 Relation（關聯）

```typescript
{
  type: 'belongsTo' | 'hasMany' | 'hasOne' | 'manyToMany';
  model: string;           // 目標 model 名稱
  foreignKey?: string;     // 外鍵欄位（belongsTo）
  through?: string;        // 中間表（manyToMany）
  onDelete?: 'cascade' | 'setNull' | 'restrict';
  required?: boolean;
}
```

**範例**：

```json
// 一篇文章屬於一個作者（一對多反向）
{
  "type": "belongsTo",
  "model": "User",
  "foreignKey": "authorId"
}

// 一個作者有多篇文章
{
  "type": "hasMany",
  "model": "Post",
  "foreignKey": "authorId"
}

// 文章和標籤多對多
{
  "type": "manyToMany",
  "model": "Tag",
  "through": "PostTag"
}
```

### 3.3 API（API 端點）

```typescript
{
  endpoints: Endpoint[];
}

interface Endpoint {
  path: string;             // 例如 "/api/todos"
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  action: 'list' | 'read' | 'create' | 'update' | 'delete' | 'custom';
  permission: string;       // 對應 permissions 中的 action
  
  // 列表專用
  pagination?: boolean;     // 是否分頁，預設 true
  filter?: string[];        // 可篩選欄位
  
  // 詳情專用
  include?: string[];       // 關聯預載入
}
```

**預設 CRUD 模板**（如果沒寫 endpoints，AI 自動生成）：

```typescript
[
  { path: `/api/${name}`, method: 'GET', action: 'list', permission: `${name}.read` },
  { path: `/api/${name}`, method: 'POST', action: 'create', permission: `${name}.create` },
  { path: `/api/${name}/[id]`, method: 'GET', action: 'read', permission: `${name}.read` },
  { path: `/api/${name}/[id]`, method: 'PUT', action: 'update', permission: `${name}.update` },
  { path: `/api/${name}/[id]`, method: 'DELETE', action: 'delete', permission: `${name}.delete` },
]
```

### 3.4 UI（UI Meta）

#### 3.4.1 Menu（後台選單）

```typescript
{
  menu: {
    label: string;          // 顯示名稱
    icon: string;           // lucide-react icon 名稱
    path: string;           // 例如 "/todos"
    order?: number;         // 排序
    parent?: string;        // 父選單（用於分組）
  }
}
```

#### 3.4.2 ListPage（列表頁）

```typescript
{
  columns: string[];        // 顯示哪些欄位（用 field.name）
  defaultSort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  pageSize?: number;       // 預設 20
  filters?: string[];      // 可篩選欄位
  searchFields?: string[]; // 可搜尋欄位
  rowActions?: RowAction[]; // 行操作（編輯、刪除等）
  bulkActions?: BulkAction[]; // 批量操作
}

interface RowAction {
  label: string;
  icon: string;
  action: 'edit' | 'delete' | 'view' | 'custom';
  permission: string;
  confirm?: boolean;       // 是否需要確認
}

interface BulkAction {
  label: string;
  icon: string;
  action: 'delete' | 'export' | 'custom';
  permission: string;
  confirm?: boolean;
}
```

#### 3.4.3 FormPage（表單頁）

```typescript
{
  layout?: 'one-column' | 'two-column' | 'tabs';  // 預設 'one-column'
  sections: FormSection[];
  submitLabel?: string;    // 預設 "儲存"
  cancelLabel?: string;    // 預設 "取消"
}

interface FormSection {
  title: string;           // 章節標題
  description?: string;
  fields: string[];        // 包含哪些欄位（用 field.name）
  columns?: 1 | 2 | 3;     // 這區幾欄（預設 1）
}
```

#### 3.4.4 DetailPage（詳情頁）

```typescript
{
  layout?: 'tabs' | 'sections';  // 預設 'sections'
  sections: DetailSection[];
}

interface DetailSection {
  title: string;
  fields: string[];
  columns?: 1 | 2 | 3;
}
```

### 3.5 Permissions（權限）

```typescript
{
  permissions: Permission[];
}

interface Permission {
  action: string;          // 例如 "todo.create"
  roles: string[];         // 哪些角色有權限
  description?: string;
}
```

**預設角色**：`admin`、`editor`、`viewer`（可在 AI Config 擴充）

---

### 3.6 Hooks（業務邏輯選項）

JSON 規範可以用 **hook 引用** 指定業務邏輯。Hook 引用使用 **`{{fn:函數名稱}}`** 語法。

> **混合模式重點**：JSON 描述「什麼時候執行」，Extension Code 描述「執行什麼」。兩者透過名稱引用。

```typescript
interface Hooks {
  // 生命週期 hook
  beforeCreate?: string;       // {{fn:函數名}}
  afterCreate?: string;
  beforeUpdate?: string;
  afterUpdate?: string;
  beforeDelete?: string;
  afterDelete?: string;

  // 狀態機 hook
  onTransition?: string;       // 狀態轉換時

  // 查詢 hook
  beforeList?: string;         // 查詢前處理 query
  afterList?: string;          // 查詢後處理 result
  beforeRead?: string;
  afterRead?: string;
}
```

**範例**：

```json
{
  "hooks": {
    "beforeCreate": "{{fn:validateOrderBeforeCreate}}",
    "afterCreate": "{{fn:onOrderCreated}}",
    "onTransition": "{{fn:handleOrderTransition}}",
    "beforeDelete": "{{fn:checkOrderDeletable}}"
  }
}
```

> 詳細 Hook SDK 見 `docs/specs/extension-spec.md §4.3 Hook SDK`。

---

### 3.7 Actions（自定義動作）

自定義動作是 Extension 提供給用戶的**手動操作按鈕**。例如：「標記為已付款」「取消訂單」「發送 Invoice」。

```typescript
interface Action {
  name: string;                 // "markAsPaid"
  label: string;                // "標記為已付款"
  description?: string;
  implementation: string;        // {{fn:函數名}}
  confirmation?: string;        // 危險操作的確認訊息，例如 "確定取消訂單？"
  requires?: {
    state?: string[];           // 哪些狀態下可用
    permission?: string;        // 需要的權限
  };
  icon?: string;                // lucide 圖標名
  variant?: 'default' | 'danger' | 'primary';
}
```

**範例**：

```json
{
  "actions": [
    {
      "name": "markAsPaid",
      "label": "標記為已付款",
      "icon": "check-circle",
      "variant": "primary",
      "implementation": "{{fn:markOrderAsPaid}}",
      "requires": {
        "state": ["draft", "pending_payment"],
        "permission": "order.update"
      }
    },
    {
      "name": "cancelOrder",
      "label": "取消訂單",
      "icon": "x-circle",
      "variant": "danger",
      "confirmation": "確定要取消這個訂單嗎？已付款的訂單會自動退款。",
      "implementation": "{{fn:cancelOrder}}",
      "requires": {
        "state": ["draft", "pending_payment", "paid"],
        "permission": "order.delete"
      }
    }
  ]
}
```

> Action 會自動以按鈕形式出現在列表頁和詳情頁。

---

### 3.8 Workflows（狀態機 / 審批流程）

針對有狀態轉換的實體，用 workflow 表達狀態機。

```typescript
interface Workflow {
  name: string;                 // "orderStateMachine"
  initialState: string;
  states: Record<string, StateConfig>;
  transitions: Transition[];
}

interface StateConfig {
  label: string;
  description?: string;
  badge?: string;               // 顯示徽章顏色: "default" | "success" | "warning" | "danger"
  allowedActions?: string[];    // 此狀態下可用的 action 名稱
  onEnter?: string;             // 進入此狀態時執行的 hook，{{fn:函數名}}
  onExit?: string;              // 離開此狀態時執行的 hook
}

interface Transition {
  from: string | string[];      // 源狀態
  to: string;                   // 目標狀態
  guard?: string;               // 條件檢查函數，{{fn:函數名}}，返回 boolean
  effect?: string;              // 轉換後執行，{{fn:函數名}}
  requires?: {
    permission?: string;
  };
}
```

**範例：訂單狀態機**

```json
{
  "workflows": [
    {
      "name": "orderStateMachine",
      "initialState": "draft",
      "states": {
        "draft": {
          "label": "草稿",
          "badge": "default",
          "allowedActions": ["submitOrder"]
        },
        "pending_payment": {
          "label": "待付款",
          "badge": "warning",
          "onEnter": "{{fn:onPendingPayment}}"
        },
        "paid": {
          "label": "已付款",
          "badge": "success",
          "onEnter": "{{fn:onOrderPaid}}"
        },
        "shipped": {
          "label": "已發貨",
          "badge": "success",
          "onEnter": "{{fn:onOrderShipped}}"
        },
        "completed": {
          "label": "已完成",
          "badge": "success"
        },
        "cancelled": {
          "label": "已取消",
          "badge": "danger"
        }
      },
      "transitions": [
        {
          "from": "draft",
          "to": "pending_payment",
          "effect": "{{fn:submitOrderTransition}}"
        },
        {
          "from": "pending_payment",
          "to": "paid",
          "guard": "{{fn:verifyPaymentReceived}}",
          "effect": "{{fn:onPaymentReceived}}"
        },
        {
          "from": "paid",
          "to": "shipped",
          "requires": { "permission": "order.ship" }
        },
        {
          "from": ["pending_payment", "paid"],
          "to": "cancelled",
          "guard": "{{fn:canCancelOrder}}",
          "effect": "{{fn:processCancellation}}"
        }
      ]
    }
  ]
}
```

> 詳細 Workflow SDK 見 `docs/specs/extension-spec.md §4.6 Workflow SDK`。

---

### 3.9 Computed Fields（動態計算欄位）

某些欄位不是直接從資料庫讀取，而是根據其他欄位動態計算。

```typescript
interface ComputedField {
  name: string;                 // 欄位名
  type: FieldType;              // 返回類型
  compute: string;              // {{fn:函數名}}
  dependencies?: string[];      // 依賴的欄位（用於快取失效）
}
```

**範例**：

```json
{
  "models": [{
    "name": "Order",
    "fields": [
      { "name": "subtotal", "type": "number" },
      { "name": "taxRate", "type": "number" },
      { "name": "discountRate", "type": "number" }
    ],
    "computed": [
      {
        "name": "totalPrice",
        "type": "number",
        "compute": "{{fn:calculateOrderTotal}}",
        "dependencies": ["subtotal", "taxRate", "discountRate"]
      },
      {
        "name": "estimatedDelivery",
        "type": "datetime",
        "compute": "{{fn:estimateDeliveryDate}}",
        "dependencies": ["shippingAddress"]
      }
    ]
  }]
}
```

---

## 4. JSON Schema（機器可讀）

> AI 生成的 JSON 必須通過這個 Schema 校驗。

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://ai-headless.dev/specs/json-spec.schema.json",
  "title": "ai-headless JSON Function Specification",
  "type": "object",
  "required": ["name", "label", "models"],
  "properties": {
    "name": {
      "type": "string",
      "pattern": "^[a-z][a-z0-9-]*$",
      "description": "kebab-case, e.g., 'todo', 'blog-post'"
    },
    "label": {
      "type": "string",
      "minLength": 1
    },
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$"
    },
    "description": { "type": "string" },
    "models": {
      "type": "array",
      "minItems": 1,
      "items": { "$ref": "#/definitions/Model" }
    },
    "api": { "$ref": "#/definitions/Api" },
    "ui": { "$ref": "#/definitions/Ui" },
    "permissions": {
      "type": "array",
      "items": { "$ref": "#/definitions/Permission" }
    },
    "hooks": { "$ref": "#/definitions/Hooks" },
    "actions": {
      "type": "array",
      "items": { "$ref": "#/definitions/Action" }
    },
    "workflows": {
      "type": "array",
      "items": { "$ref": "#/definitions/Workflow" }
    }
  },
  "definitions": {
    "Model": {
      "type": "object",
      "required": ["name", "fields"],
      "properties": {
        "name": {
          "type": "string",
          "pattern": "^[A-Z][a-zA-Z0-9]*$"
        },
        "tableName": { "type": "string" },
        "fields": {
          "type": "array",
          "minItems": 1,
          "items": { "$ref": "#/definitions/Field" }
        },
        "relations": {
          "type": "array",
          "items": { "$ref": "#/definitions/Relation" }
        },
        "timestamps": { "type": "boolean", "default": true },
        "softDelete": { "type": "boolean", "default": false }
      }
    },
    "Field": {
      "type": "object",
      "required": ["name", "type"],
      "properties": {
        "name": {
          "type": "string",
          "pattern": "^[a-z][a-zA-Z0-9]*$"
        },
        "type": {
          "enum": ["string", "text", "richText", "number", "boolean", "datetime", "date", "enum", "json", "file", "image", "relation"]
        },
        "required": { "type": "boolean", "default": false },
        "unique": { "type": "boolean", "default": false },
        "default": {},
        "description": { "type": "string" },
        "validation": {
          "type": "object",
          "properties": {
            "min": { "type": "number" },
            "max": { "type": "number" },
            "pattern": { "type": "string" },
            "enum": { "type": "array" }
          }
        },
        "ui": { "$ref": "#/definitions/FieldUi" }
      }
    },
    "FieldUi": {
      "type": "object",
      "properties": {
        "list": { "type": "boolean", "default": false },
        "form": { "type": "boolean", "default": true },
        "detail": { "type": "boolean", "default": true },
        "sortable": { "type": "boolean", "default": false },
        "filterable": { "type": "boolean", "default": false },
        "searchable": { "type": "boolean", "default": false },
        "hidden": { "type": "boolean", "default": false },
        "widget": {
          "enum": ["input", "textarea", "select", "multiselect", "switch", "checkbox", "datepicker", "datetimepicker", "editor", "code", "file-upload"]
        },
        "placeholder": { "type": "string" },
        "helpText": { "type": "string" },
        "badge": { "type": "boolean", "default": false }
      }
    },
    "Relation": {
      "type": "object",
      "required": ["type", "model"],
      "properties": {
        "type": { "enum": ["belongsTo", "hasMany", "hasOne", "manyToMany"] },
        "model": { "type": "string" },
        "foreignKey": { "type": "string" },
        "through": { "type": "string" },
        "onDelete": { "enum": ["cascade", "setNull", "restrict"] },
        "required": { "type": "boolean" }
      }
    },
    "Endpoint": {
      "type": "object",
      "required": ["path", "method", "action", "permission"],
      "properties": {
        "path": { "type": "string" },
        "method": {
          "enum": ["GET", "POST", "PUT", "PATCH", "DELETE"]
        },
        "action": {
          "enum": ["list", "read", "create", "update", "delete", "custom"]
        },
        "permission": { "type": "string" },
        "pagination": { "type": "boolean", "default": true },
        "filter": { "type": "array", "items": { "type": "string" } },
        "include": { "type": "array", "items": { "type": "string" } }
      }
    },
    "Api": {
      "type": "object",
      "properties": {
        "endpoints": {
          "type": "array",
          "items": { "$ref": "#/definitions/Endpoint" }
        }
      }
    },
    "Ui": {
      "type": "object",
      "properties": {
        "menu": { "$ref": "#/definitions/Menu" },
        "pages": {
          "type": "object",
          "properties": {
            "list": { "$ref": "#/definitions/ListPage" },
            "form": { "$ref": "#/definitions/FormPage" },
            "detail": { "$ref": "#/definitions/DetailPage" }
          }
        }
      }
    },
    "Menu": {
      "type": "object",
      "required": ["label", "icon", "path"],
      "properties": {
        "label": { "type": "string" },
        "icon": { "type": "string" },
        "path": { "type": "string" },
        "order": { "type": "number" },
        "parent": { "type": "string" }
      }
    },
    "ListPage": {
      "type": "object",
      "properties": {
        "columns": { "type": "array", "items": { "type": "string" } },
        "defaultSort": {
          "type": "object",
          "properties": {
            "field": { "type": "string" },
            "order": { "enum": ["asc", "desc"] }
          }
        },
        "pageSize": { "type": "number", "default": 20 },
        "filters": { "type": "array", "items": { "type": "string" } },
        "searchFields": { "type": "array", "items": { "type": "string" } },
        "rowActions": { "type": "array" },
        "bulkActions": { "type": "array" }
      }
    },
    "FormPage": {
      "type": "object",
      "properties": {
        "layout": { "enum": ["one-column", "two-column", "tabs"], "default": "one-column" },
        "sections": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["title", "fields"],
            "properties": {
              "title": { "type": "string" },
              "description": { "type": "string" },
              "fields": { "type": "array", "items": { "type": "string" } },
              "columns": { "enum": [1, 2, 3], "default": 1 }
            }
          }
        }
      }
    },
    "DetailPage": {
      "type": "object",
      "properties": {
        "layout": { "enum": ["tabs", "sections"], "default": "sections" },
        "sections": { "type": "array" }
      }
    },
    "Permission": {
      "type": "object",
      "required": ["action", "roles"],
      "properties": {
        "action": { "type": "string" },
        "roles": { "type": "array", "items": { "type": "string" } },
        "description": { "type": "string" }
      }
    },
    "Hooks": {
      "type": "object",
      "description": "業務邏輯 hook 引用（指向 Extension Code 中的函數）",
      "properties": {
        "beforeCreate": { "type": "string", "pattern": "^\\{\\{fn:.+\\}\\}$" },
        "afterCreate":  { "type": "string", "pattern": "^\\{\\{fn:.+\\}\\}$" },
        "beforeUpdate": { "type": "string", "pattern": "^\\{\\{fn:.+\\}\\}$" },
        "afterUpdate":  { "type": "string", "pattern": "^\\{\\{fn:.+\\}\\}$" },
        "beforeDelete": { "type": "string", "pattern": "^\\{\\{fn:.+\\}\\}$" },
        "afterDelete":  { "type": "string", "pattern": "^\\{\\{fn:.+\\}\\}$" },
        "onTransition": { "type": "string", "pattern": "^\\{\\{fn:.+\\}\\}$" },
        "beforeList":   { "type": "string", "pattern": "^\\{\\{fn:.+\\}\\}$" },
        "afterList":    { "type": "string", "pattern": "^\\{\\{fn:.+\\}\\}$" },
        "beforeRead":   { "type": "string", "pattern": "^\\{\\{fn:.+\\}\\}$" },
        "afterRead":    { "type": "string", "pattern": "^\\{\\{fn:.+\\}\\}$" }
      }
    },
    "Action": {
      "type": "object",
      "required": ["name", "label", "implementation"],
      "properties": {
        "name": { "type": "string" },
        "label": { "type": "string" },
        "description": { "type": "string" },
        "implementation": { "type": "string", "pattern": "^\\{\\{fn:.+\\}\\}$" },
        "confirmation": { "type": "string" },
        "requires": {
          "type": "object",
          "properties": {
            "state": { "type": "array", "items": { "type": "string" } },
            "permission": { "type": "string" }
          }
        },
        "icon": { "type": "string" },
        "variant": { "enum": ["default", "danger", "primary"] }
      }
    },
    "Workflow": {
      "type": "object",
      "required": ["name", "initialState", "states", "transitions"],
      "properties": {
        "name": { "type": "string" },
        "initialState": { "type": "string" },
        "states": {
          "type": "object",
          "additionalProperties": { "$ref": "#/definitions/StateConfig" }
        },
        "transitions": {
          "type": "array",
          "items": { "$ref": "#/definitions/Transition" }
        }
      }
    },
    "StateConfig": {
      "type": "object",
      "required": ["label"],
      "properties": {
        "label": { "type": "string" },
        "description": { "type": "string" },
        "badge": { "enum": ["default", "success", "warning", "danger"] },
        "allowedActions": { "type": "array", "items": { "type": "string" } },
        "onEnter": { "type": "string", "pattern": "^\\{\\{fn:.+\\}\\}$" },
        "onExit":  { "type": "string", "pattern": "^\\{\\{fn:.+\\}\\}$" }
      }
    },
    "Transition": {
      "type": "object",
      "required": ["from", "to"],
      "properties": {
        "from": {
          "oneOf": [
            { "type": "string" },
            { "type": "array", "items": { "type": "string" } }
          ]
        },
        "to": { "type": "string" },
        "guard": { "type": "string", "pattern": "^\\{\\{fn:.+\\}\\}$" },
        "effect": { "type": "string", "pattern": "^\\{\\{fn:.+\\}\\}$" },
        "requires": {
          "type": "object",
          "properties": {
            "permission": { "type": "string" }
          }
        }
      }
    },
    "ComputedField": {
      "type": "object",
      "required": ["name", "type", "compute"],
      "properties": {
        "name": { "type": "string" },
        "type": { "$ref": "#/definitions/FieldType" },
        "compute": { "type": "string", "pattern": "^\\{\\{fn:.+\\}\\}$" },
        "dependencies": { "type": "array", "items": { "type": "string" } }
      }
    }
  }
}
```

---

## 5. TypeScript Types

給 AI 用的 TypeScript 類型定義（也用在生成後端的類型）：

```typescript
// lib/specs/json-spec.types.ts

export type FieldType =
  | 'string'
  | 'text'
  | 'richText'
  | 'number'
  | 'boolean'
  | 'datetime'
  | 'date'
  | 'enum'
  | 'json'
  | 'file'
  | 'image'
  | 'relation';

export type WidgetType =
  | 'input'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'switch'
  | 'checkbox'
  | 'datepicker'
  | 'datetimepicker'
  | 'editor'
  | 'code'
  | 'file-upload';

export type RelationType =
  | 'belongsTo'
  | 'hasMany'
  | 'hasOne'
  | 'manyToMany';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ApiAction =
  | 'list'
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'custom';

export interface FieldUi {
  list?: boolean;
  form?: boolean;
  detail?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  hidden?: boolean;
  widget?: WidgetType;
  placeholder?: string;
  helpText?: string;
  badge?: boolean;
}

export interface FieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
  enum?: any[];
}

export interface Field {
  name: string;
  type: FieldType;
  required?: boolean;
  unique?: boolean;
  default?: any;
  description?: string;
  validation?: FieldValidation;
  ui?: FieldUi;
}

export interface Relation {
  type: RelationType;
  model: string;
  foreignKey?: string;
  through?: string;
  onDelete?: 'cascade' | 'setNull' | 'restrict';
  required?: boolean;
}

export interface Model {
  name: string;
  tableName?: string;
  fields: Field[];
  relations?: Relation[];
  timestamps?: boolean;
  softDelete?: boolean;
}

export interface Endpoint {
  path: string;
  method: HttpMethod;
  action: ApiAction;
  permission: string;
  pagination?: boolean;
  filter?: string[];
  include?: string[];
}

export interface Api {
  endpoints?: Endpoint[];
}

export interface Menu {
  label: string;
  icon: string;
  path: string;
  order?: number;
  parent?: string;
}

export interface ListPage {
  columns?: string[];
  defaultSort?: { field: string; order: 'asc' | 'desc' };
  pageSize?: number;
  filters?: string[];
  searchFields?: string[];
  rowActions?: any[];
  bulkActions?: any[];
}

export interface FormSection {
  title: string;
  description?: string;
  fields: string[];
  columns?: 1 | 2 | 3;
}

export interface FormPage {
  layout?: 'one-column' | 'two-column' | 'tabs';
  sections: FormSection[];
  submitLabel?: string;
  cancelLabel?: string;
}

export interface DetailSection {
  title: string;
  fields: string[];
  columns?: 1 | 2 | 3;
}

export interface DetailPage {
  layout?: 'tabs' | 'sections';
  sections: DetailSection[];
}

export interface Ui {
  menu?: Menu;
  pages?: {
    list?: ListPage;
    form?: FormPage;
    detail?: DetailPage;
  };
}

export interface Permission {
  action: string;
  roles: string[];
  description?: string;
}

// 業務邏輯 hook 引用（指向 Extension Code 中的函數）
export interface Hooks {
  beforeCreate?: string;       // {{fn:函數名}}
  afterCreate?: string;
  beforeUpdate?: string;
  afterUpdate?: string;
  beforeDelete?: string;
  afterDelete?: string;
  onTransition?: string;
  beforeList?: string;
  afterList?: string;
  beforeRead?: string;
  afterRead?: string;
}

// 自定義動作（按鈕）
export interface Action {
  name: string;
  label: string;
  description?: string;
  implementation: string;       // {{fn:函數名}}
  confirmation?: string;        // 危險操作的提示文字
  requires?: {
    state?: string[];           // 哪些狀態下可用
    permission?: string;
  };
  icon?: string;
  variant?: 'default' | 'danger' | 'primary';
}

// 狀態機 / 審批流程
export interface Workflow {
  name: string;
  initialState: string;
  states: Record<string, StateConfig>;
  transitions: Transition[];
}

export interface StateConfig {
  label: string;
  description?: string;
  badge?: 'default' | 'success' | 'warning' | 'danger';
  allowedActions?: string[];    // 此狀態下可用的 action 名
  onEnter?: string;             // {{fn:函數名}}
  onExit?: string;
}

export interface Transition {
  from: string | string[];
  to: string;
  guard?: string;               // {{fn:函數名}}，返回 boolean
  effect?: string;              // {{fn:函數名}}
  requires?: {
    permission?: string;
  };
}

// 動態計算欄位
export interface ComputedField {
  name: string;
  type: FieldType;
  compute: string;              // {{fn:函數名}}
  dependencies?: string[];
}

export interface Model {
  name: string;
  label?: string;
  description?: string;
  fields: Field[];
  computed?: ComputedField[];
  relations?: Relation[];
  timestamps?: boolean;        // 預設 true
  softDelete?: boolean;        // 預設 true
}

export interface JsonSpec {
  name: string;
  label: string;
  version?: string;
  description?: string;
  models: Model[];
  api?: Api;
  ui?: Ui;
  permissions?: Permission[];
  hooks?: Hooks;                 // 業務邏輯 hook
  actions?: Action[];            // 自定義動作
  workflows?: Workflow[];        // 狀態機 / 審批
}
```

---

## 6. 完整範例

### 6.1 範例 1：待辦事項（Todo）

```json
{
  "name": "todo",
  "label": "待辦事項",
  "version": "1.0.0",
  "description": "個人待辦事項管理",
  "models": [
    {
      "name": "Todo",
      "fields": [
        {
          "name": "title",
          "type": "string",
          "required": true,
          "validation": {
            "min": 1,
            "max": 100
          },
          "ui": {
            "list": true,
            "form": true,
            "detail": true,
            "sortable": true,
            "searchable": true,
            "widget": "input",
            "placeholder": "輸入待辦標題"
          }
        },
        {
          "name": "description",
          "type": "text",
          "ui": {
            "list": false,
            "form": true,
            "detail": true,
            "widget": "textarea",
            "placeholder": "詳細說明..."
          }
        },
        {
          "name": "dueDate",
          "type": "datetime",
          "ui": {
            "list": true,
            "form": true,
            "detail": true,
            "sortable": true,
            "filterable": true,
            "widget": "datetimepicker"
          }
        },
        {
          "name": "priority",
          "type": "enum",
          "validation": {
            "enum": ["low", "medium", "high"]
          },
          "default": "medium",
          "ui": {
            "list": true,
            "form": true,
            "detail": true,
            "filterable": true,
            "badge": true
          }
        },
        {
          "name": "completed",
          "type": "boolean",
          "default": false,
          "ui": {
            "list": true,
            "form": true,
            "detail": true,
            "widget": "switch"
          }
        }
      ]
    }
  ],
  "ui": {
    "menu": {
      "label": "待辦事項",
      "icon": "check-square",
      "path": "/todos"
    },
    "pages": {
      "list": {
        "columns": ["title", "dueDate", "priority", "completed"],
        "defaultSort": { "field": "dueDate", "order": "asc" },
        "pageSize": 20,
        "filters": ["priority", "completed"],
        "searchFields": ["title"]
      },
      "form": {
        "layout": "one-column",
        "sections": [
          {
            "title": "基本資訊",
            "fields": ["title", "description"]
          },
          {
            "title": "進階設定",
            "fields": ["dueDate", "priority", "completed"]
          }
        ]
      }
    }
  },
  "permissions": [
    { "action": "todo.read", "roles": ["admin", "editor", "viewer"] },
    { "action": "todo.create", "roles": ["admin", "editor"] },
    { "action": "todo.update", "roles": ["admin", "editor"] },
    { "action": "todo.delete", "roles": ["admin"] }
  ]
}
```

### 6.2 範例 2：Blog 文章（含關聯）

```json
{
  "name": "blog-post",
  "label": "Blog 文章",
  "version": "1.0.0",
  "description": "Blog 文章管理系統",
  "models": [
    {
      "name": "Post",
      "fields": [
        {
          "name": "title",
          "type": "string",
          "required": true,
          "validation": { "min": 1, "max": 200 },
          "ui": {
            "list": true,
            "form": true,
            "detail": true,
            "sortable": true,
            "searchable": true,
            "widget": "input"
          }
        },
        {
          "name": "slug",
          "type": "string",
          "required": true,
          "unique": true,
          "validation": { "pattern": "^[a-z0-9-]+$" },
          "ui": {
            "list": true,
            "form": true,
            "widget": "input",
            "helpText": "URL 友好的識別，例如 'my-first-post'"
          }
        },
        {
          "name": "content",
          "type": "richText",
          "required": true,
          "ui": {
            "form": true,
            "detail": true,
            "widget": "editor"
          }
        },
        {
          "name": "excerpt",
          "type": "text",
          "ui": {
            "form": true,
            "detail": true,
            "widget": "textarea",
            "helpText": "文章摘要，用於列表頁"
          }
        },
        {
          "name": "publishedAt",
          "type": "datetime",
          "ui": {
            "list": true,
            "form": true,
            "detail": true,
            "sortable": true,
            "filterable": true,
            "widget": "datetimepicker"
          }
        },
        {
          "name": "status",
          "type": "enum",
          "validation": {
            "enum": ["draft", "published", "archived"]
          },
          "default": "draft",
          "ui": {
            "list": true,
            "form": true,
            "detail": true,
            "filterable": true,
            "badge": true
          }
        }
      ],
      "relations": [
        {
          "type": "belongsTo",
          "model": "User",
          "foreignKey": "authorId"
        },
        {
          "type": "manyToMany",
          "model": "Tag",
          "through": "PostTag"
        }
      ]
    },
    {
      "name": "Tag",
      "fields": [
        {
          "name": "name",
          "type": "string",
          "required": true,
          "unique": true,
          "ui": {
            "list": true,
            "form": true,
            "widget": "input"
          }
        },
        {
          "name": "slug",
          "type": "string",
          "required": true,
          "unique": true,
          "ui": {
            "list": true,
            "form": true,
            "widget": "input"
          }
        }
      ]
    }
  ]
}
```

---

### 6.3 範例 3：訂單管理（含狀態機、計算、副作用）

> **這個範例展示混合模式**：JSON 規範描述資料 / 狀態轉換，Extension Code 實現業務邏輯。

```json
{
  "name": "order",
  "label": "訂單管理",
  "version": "1.0.0",
  "description": "完整的訂單生命週期管理",

  "models": [
    {
      "name": "Order",
      "label": "訂單",
      "fields": [
        { "name": "orderNumber", "type": "string", "required": true, "unique": true },
        { "name": "status", "type": "enum", "validation": { "enum": ["draft", "pending_payment", "paid", "shipped", "completed", "cancelled"] }, "default": "draft" },
        { "name": "subtotal", "type": "number", "required": true },
        { "name": "taxRate", "type": "number", "default": 0.05 },
        { "name": "discountRate", "type": "number", "default": 0 },
        { "name": "shippingAddress", "type": "text", "required": true },
        { "name": "notes", "type": "text" },
        { "name": "paidAt", "type": "datetime" },
        { "name": "shippedAt", "type": "datetime" },
        { "name": "completedAt", "type": "datetime" }
      ],
      "computed": [
        {
          "name": "totalPrice",
          "type": "number",
          "compute": "{{fn:calculateOrderTotal}}",
          "dependencies": ["subtotal", "taxRate", "discountRate"]
        },
        {
          "name": "estimatedDelivery",
          "type": "datetime",
          "compute": "{{fn:estimateDeliveryDate}}",
          "dependencies": ["shippingAddress"]
        }
      ],
      "relations": [
        { "type": "belongsTo", "model": "User", "foreignKey": "userId" },
        { "type": "hasMany", "model": "OrderItem", "foreignKey": "orderId" }
      ]
    },
    {
      "name": "OrderItem",
      "fields": [
        { "name": "productName", "type": "string", "required": true },
        { "name": "price", "type": "number", "required": true },
        { "name": "quantity", "type": "number", "required": true }
      ],
      "computed": [
        {
          "name": "lineTotal",
          "type": "number",
          "compute": "{{fn:calculateLineTotal}}",
          "dependencies": ["price", "quantity"]
        }
      ]
    }
  ],

  "hooks": {
    "beforeCreate": "{{fn:validateOrderBeforeCreate}}",
    "afterCreate": "{{fn:onOrderCreated}}",
    "onTransition": "{{fn:handleOrderTransition}}",
    "beforeDelete": "{{fn:checkOrderDeletable}}"
  },

  "actions": [
    {
      "name": "submitOrder",
      "label": "提交訂單",
      "icon": "send",
      "variant": "primary",
      "implementation": "{{fn:submitOrderAction}}",
      "requires": {
        "state": ["draft"],
        "permission": "order.update"
      }
    },
    {
      "name": "markAsPaid",
      "label": "標記為已付款",
      "icon": "check-circle",
      "variant": "primary",
      "implementation": "{{fn:markOrderAsPaid}}",
      "requires": {
        "state": ["pending_payment"],
        "permission": "order.update"
      }
    },
    {
      "name": "markAsShipped",
      "label": "標記為已發貨",
      "icon": "truck",
      "variant": "primary",
      "implementation": "{{fn:markOrderAsShipped}}",
      "requires": {
        "state": ["paid"],
        "permission": "order.ship"
      }
    },
    {
      "name": "cancelOrder",
      "label": "取消訂單",
      "icon": "x-circle",
      "variant": "danger",
      "confirmation": "確定要取消訂單嗎？已付款的訂單會自動退款。",
      "implementation": "{{fn:cancelOrder}}",
      "requires": {
        "state": ["draft", "pending_payment", "paid"],
        "permission": "order.delete"
      }
    }
  ],

  "workflows": [
    {
      "name": "orderStateMachine",
      "initialState": "draft",
      "states": {
        "draft": {
          "label": "草稿",
          "badge": "default",
          "allowedActions": ["submitOrder", "cancelOrder"]
        },
        "pending_payment": {
          "label": "待付款",
          "badge": "warning",
          "allowedActions": ["markAsPaid", "cancelOrder"],
          "onEnter": "{{fn:onPendingPayment}}"
        },
        "paid": {
          "label": "已付款",
          "badge": "success",
          "allowedActions": ["markAsShipped", "cancelOrder"],
          "onEnter": "{{fn:onOrderPaid}}"
        },
        "shipped": {
          "label": "已發貨",
          "badge": "success",
          "allowedActions": [],
          "onEnter": "{{fn:onOrderShipped}}"
        },
        "completed": {
          "label": "已完成",
          "badge": "success"
        },
        "cancelled": {
          "label": "已取消",
          "badge": "danger",
          "onEnter": "{{fn:onOrderCancelled}}"
        }
      },
      "transitions": [
        {
          "from": "draft",
          "to": "pending_payment",
          "effect": "{{fn:submitOrderTransition}}"
        },
        {
          "from": "pending_payment",
          "to": "paid",
          "guard": "{{fn:verifyPaymentReceived}}",
          "effect": "{{fn:onPaymentReceived}}"
        },
        {
          "from": "paid",
          "to": "shipped",
          "requires": { "permission": "order.ship" }
        },
        {
          "from": "shipped",
          "to": "completed",
          "effect": "{{fn:completeOrderTransition}}"
        },
        {
          "from": ["draft", "pending_payment", "paid"],
          "to": "cancelled",
          "guard": "{{fn:canCancelOrder}}",
          "effect": "{{fn:processCancellation}}"
        }
      ]
    }
  ],

  "permissions": [
    { "action": "order.read",   "roles": ["admin", "editor", "viewer"] },
    { "action": "order.create", "roles": ["admin", "editor"] },
    { "action": "order.update", "roles": ["admin", "editor"] },
    { "action": "order.ship",   "roles": ["admin"] },
    { "action": "order.delete", "roles": ["admin"] }
  ],

  "ui": {
    "menu": { "label": "訂單", "icon": "shopping-cart", "path": "/orders" },
    "pages": {
      "list": {
        "columns": ["orderNumber", "status", "totalPrice", "createdAt"],
        "defaultSort": { "field": "createdAt", "order": "desc" }
      }
    }
  }
}
```

**對應的 Extension 代碼結構**（AI 也會生成這部分）：

```
extensions/order/
├── index.ts                    # Extension 入口
├── schema.json                 # JSON 規範（含以上內容）
├── prisma/
│   └── extension.prisma        # Order, OrderItem 模型
├── hooks/
│   ├── before-create.ts        # validateOrderBeforeCreate
│   ├── after-create.ts         # onOrderCreated
│   ├── on-transition.ts        # handleOrderTransition
│   └── before-delete.ts        # checkOrderDeletable
├── actions/
│   ├── submit.ts               # submitOrderAction
│   ├── mark-paid.ts            # markOrderAsPaid
│   ├── mark-shipped.ts         # markOrderAsShipped
│   └── cancel.ts               # cancelOrder
├── computed/
│   ├── calculate-total.ts      # calculateOrderTotal
│   ├── calculate-line-total.ts # calculateLineTotal
│   └── estimate-delivery.ts    # estimateDeliveryDate
├── workflows/
│   ├── state-machine.ts        # orderStateMachine
│   └── guards.ts               # verifyPaymentReceived, canCancelOrder
└── tests/
    ├── hooks.test.ts
    ├── actions.test.ts
    ├── computed.test.ts
    └── workflow.test.ts
```

**計算函數範例**（AI 生成）：

```typescript
// extensions/order/computed/calculate-total.ts
import type { Order, OrderItem } from '@/generated/order.types';

export function calculateOrderTotal(order: Order & { items: OrderItem[] }): number {
  const subtotal = order.subtotal;
  const discount = subtotal * order.discountRate;
  const afterDiscount = subtotal - discount;
  const tax = afterDiscount * order.taxRate;
  return Math.round((afterDiscount + tax) * 100) / 100;
}
```

**狀態轉換函數範例**：

```typescript
// extensions/order/hooks/on-transition.ts
import type { Order } from '@/generated/order.types';
import { deductStock } from '@/extensions/inventory/actions/deduct-stock';
import { sendOrderConfirmation } from '@/extensions/email/actions/send-confirmation';
import { processRefund } from '@/extensions/payment/actions/refund';

export async function handleOrderTransition(
  order: Order,
  fromState: string,
  toState: string
): Promise<void> {
  // 進入已付款：扣庫存 + 發 Email
  if (toState === 'paid') {
    await deductStock(order.items);
    await sendOrderConfirmation(order);
  }

  // 進入已發貨：通知倉庫
  if (toState === 'shipped') {
    await notifyWarehouse(order);
  }

  // 進入已取消：退款
  if (toState === 'cancelled' && fromState === 'paid') {
    await processRefund(order);
  }
}
```

---

## 7. 編譯流程（由 pi agent 執行）

> **重要**：這份規範的「編譯流程」由 **pi agent** 執行，不是純 LLM API。
> pi agent 會讀本規範、AGENTS.md、SOP，並跑完整 Gate 流程。

### 7.0 為什麼用 pi agent？

| 純 LLM API | pi agent（推薦）|
|---|---|
| 沒有 SOP 約束 | 內建 SOP（讀 AGENTS.md + gates.json）|
| 不會跑測試 | 會跑 TDD、lint、regression、reviewer |
| 沒有專案上下文 | 自動注入所有規範文檔和專案源碼 |
| 出錯只回文字 | 能自我迭代修正（看測試失敗 → 改代碼 → 重跑） |
| 無審計 log | 完整交付摘要、commit log、測試報告 |

### 7.1 pi agent 執行流程

```
[AI Pipeline 觸發器]
   │  用戶輸入：「幫我做個待辦事項」
   ▼
[pi agent 啟動]
   │ 自動注入：
   │ • AGENTS.md (SOP)
   │ • docs/specs/json-spec.md（本規範）
   │ • docs/specs/extension-spec.md（如需）
   │ • docs/system-design.md
   │ • docs/DESIGN.md
   │ • docs/backlog.md
   │ • 專案源碼
   ▼
[Stage 1] 需求分析
   - 讀用戶輸入
   - 判斷類型（CRUD / Extension / 其他）
   - 列出需要釐清的問題
   ▼
[Stage 2] 反問釐清（如需要）
   - 用 stream 問用戶
   - 用戶回答後繼續
   ▼
[Stage 3] JSON Spec 生成
   - 讀本規範（json-spec.md）
   - 生成 JSON 規範
   - 寫到 .ai/specs/<name>.json
   - 用 JSON Schema 校驗（§4）
   ▼
[Stage 4] TDD Gate
   - 先寫測試（紅）
   - 確認測試失敗
   - 寫實作（綠）
   - 確認測試通過
   ▼
[Stage 5] 編譯代碼
   - Schema Generator → Prisma schema + Migration
   - API Generator → REST API routes
   - UI Generator → 前端組件
   - Permission Generator → RBAC 註冊
   - Menu Generator → 後台選單
   - 跑 prisma migrate dev
   ▼
[Stage 6] Lint Gate
   - eslint + tsc 必須通過
   - 修正錯誤
   ▼
[Stage 7] Regression Gate
   - 跑所有測試
   - 確保沒破壞既有功能
   ▼
[Stage 8] Reviewer Gate + Submitter
   - reviewer subagent 校驗質量
   - submitter 產出交付摘要
   - 更新 backlog.md
   ▼
[輸出] 用戶看到「功能已上線」+ 下載 JSON 按鈕
```

### 7.2 pi agent 調用範例

**簡單 CRUD**（單個 subagent，sync）：

```typescript
// app/api/ai/generate-crud/route.ts
import { runSubagent } from '@/lib/ai/agent-runner';

export async function POST(request: Request) {
  const { userInput } = await request.json();
  
  const result = await runSubagent({
    agent: 'json-spec-compiler',
    contextFiles: [
      'AGENTS.md',
      'docs/specs/json-spec.md',
      'docs/system-design.md',
      'docs/DESIGN.md',
    ],
    task: `
      用戶需求：${userInput}
      
      請按以下流程執行：
      1. 分析需求（必要時反問釐清）
      2. 讀 docs/specs/json-spec.md，生成 JSON 規範
      3. 用 §4 JSON Schema 校驗
      4. 跑 §7.1 Stage 4-8 的 Gate 流程
      5. 寫到 .ai/specs/<name>.json
      6. 跑 prisma migrate dev
      7. 生成 API / UI 代碼
      8. 跑測試、lint、reviewer
      9. 用 submitter skill 產出摘要
      
      規範來源：docs/specs/json-spec.md
    `,
  });
  
  return Response.json(result);
}
```

**複雜需求**（workflowScript 編排）：

```typescript
// lib/ai/pipelines/crud-generation.workflow.ts
export const crudGenerationPipeline = {
  stages: [
    {
      name: 'analyze',
      agent: 'requirement-analyzer',
      task: '分析用戶需求，列出釐清問題',
    },
    {
      name: 'clarify',
      agent: 'clarification-agent',
      task: '向用戶反問，等待回答',
      interactive: true,
    },
    {
      name: 'spec',
      agent: 'json-spec-generator',
      task: '讀 json-spec.md，生成 JSON 規範並校驗',
    },
    {
      name: 'tdd',
      agent: 'tdd-test-writer',
      task: '跑 §7.1 Stage 4 TDD Gate',
    },
    {
      name: 'code',
      agent: 'dev',
      task: '跑 §7.1 Stage 5 編譯代碼',
    },
    {
      name: 'review',
      agent: 'reviewer',
      task: '跑 §7.1 Stage 7-8 regression + reviewer',
    },
  ],
};
```

### 7.3 pi agent 必須自動讀取的規範文檔

每次 pi agent 啟動時，**自動注入**到 context：

| 檔案 | 用途 |
|---|---|
| `AGENTS.md` | SOP、萬事原則、gates.json 觸發規則 |
| `docs/specs/json-spec.md` | 本規範（JSON 功能規範） |
| `docs/specs/extension-spec.md` | Extension 規範（如需） |
| `docs/system-design.md` | 系統架構、目錄結構、模組邊界 |
| `docs/DESIGN.md` | 設計 tokens、組件風格、color palette |
| `docs/backlog.md` | 當前 Sprint 狀態 |

> 💡 為什麼自動注入？因為這些是「規範的 source of truth」。如果 AI 不知道這些，會生成不一致的代碼。

### 7.4 步驟細節（與原 §7.1-§7.5 一致）

下面的步驟由 pi agent 執行：

## 8. 最佳實踐

### 8.1 命名

| 項目 | 規則 | 範例 |
|---|---|---|
| `name` (頂層) | kebab-case | `todo`, `blog-post` |
| `models[*].name` | PascalCase | `Todo`, `BlogPost` |
| `fields[*].name` | camelCase | `title`, `dueDate` |
| `permissions.action` | `<name>.<action>` | `todo.create` |
| API path | `/api/<name>` | `/api/todos` |

### 8.2 欄位設計

1. **永遠加 `id`**：AI 自動加，無需聲明
2. **加 `createdAt`/`updatedAt`**：除非 `timestamps: false`
3. **密碼 / API Key**：用 `ui.hidden: true`，不在 UI 暴露
4. **enum 至少 2 個值**：避免單一值的 enum
5. **外鍵**：用 `<model>Id` 命名，例如 `authorId`

### 8.3 關聯

1. **belongsTo 必須有 foreignKey**
2. **manyToMany 必須有 through 中間表**
3. **onDelete**：預設 `setNull`（保留資料）

### 8.4 權限

1. **每個 action 都要有 permission**
2. **roles 用已存在的角色**：`admin`, `editor`, `viewer`（可在 AI Config 擴充）
3. **delete 通常只給 admin**

### 8.5 UI

1. **list columns ≤ 6 個**：太多會擁擠
2. **form sections ≤ 5 個**：避免太長的表單
3. **description / excerpt 等長文字欄位，list 不顯示**
4. **enum 預設用 badge 顯示**：提升可讀性

---

## 9. 錯誤處理

### 9.1 JSON Schema 校驗失敗

如果 AI 生成的 JSON 沒通過校驗：
- 列出失敗的欄位
- 提供錯誤訊息
- 自動修正（如可推測）

### 9.2 編譯失敗

如果 JSON 通過了校驗但代碼生成失敗：
- 可能是 Prisma 衝突（欄位名已存在）
- 可能是檔案路徑衝突
- 自動 rollback（不污染 prisma schema）

### 9.3 運行時錯誤

如果生成後運行失敗：
- 提供詳細錯誤訊息
- 自動 log 到 ChatMessage，供 debug

---

## 10. 版本與變更

| 版本 | 日期 | 變更 |
|---|---|---|
| 1.0.0 | 2026-08-24 | 初版 |

---

**相關文檔**：
- 🔌 [Extension 開發規範](./extension-spec.md)
- 🏗️ [系統架構](../system-design.md)
- 🎨 [UX/UI 設計](../DESIGN.md)