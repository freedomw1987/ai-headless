/**
 * ==============================================
 *  JSON Spec Types — 框架核心類型定義
 * ==============================================
 *
 * 對應規範：docs/specs/json-spec.md
 * 對應 PRD：docs/prd/01-framework-core.md §2.1
 *
 * 這是整個 ai-headless 框架的「靈魂」—— JSON 規範的 TypeScript 類型表達。
 * 框架的 Compiler 讀這些類型，自動生成 Prisma schema / REST API / CRUD UI。
 * 框架的 Extension API 也通過這些類型與用戶代碼互動。
 */

// ==============================================
// 1. 基礎類型（Field / Type / Validation）
// ==============================================

/**
 * 支援的欄位類型
 */
export type FieldType =
  | 'string'
  | 'text'
  | 'richText'
  | 'number'
  | 'integer'
  | 'decimal'
  | 'boolean'
  | 'datetime'
  | 'date'
  | 'time'
  | 'enum'
  | 'json'
  | 'file'
  | 'image'
  | 'reference';

export type FieldValidation = {
  /** 必填（DB NOT NULL）*/
  required?: boolean;
  /** 唯一（DB UNIQUE INDEX）*/
  unique?: boolean;
  /** 字串最大長度 */
  maxLength?: number;
  /** 字串最小長度 */
  minLength?: number;
  /** 數字最小值 */
  min?: number;
  /** 數字最大值 */
  max?: number;
  /** 正則表達式 */
  pattern?: string;
  /** enum 值 */
  enum?: string[];
  /** 預設值 */
  default?: unknown;
};

export type FieldUI = {
  /** 是否在列表顯示（簡寫：listable） */
  list?: boolean;
  /** 是否在表單顯示（簡寫：editable） */
  form?: boolean;
  /** 是否可搜尋 */
  searchable?: boolean;
  /** 是否可排序 */
  sortable?: boolean;
  /** 是否顯示為徽章 */
  badge?: boolean;
  /** 完全隱藏（簡寫：hidden） */
  hidden?: boolean;
  /** 只讀（簡寫：readonly） */
  readonly?: boolean;
  /** 列表別名（簡寫：listable） */
  listable?: boolean;
  /** 表單別名（簡寫：editable） */
  editable?: boolean;
  /** widget 類型（input / textarea / editor / select / date / switch）*/
  widget?: 'input' | 'textarea' | 'editor' | 'select' | 'date' | 'switch' | 'file' | 'image';
  /** 列表顯示順序 */
  order?: number;
  /** 列表欄寬（CSS grid columns）*/
  width?: string;
  /** 欄位說明（placeholder / tooltip）*/
  help?: string;
};

export type Field = {
  name: string;
  type: FieldType;
  label?: string;
  description?: string;
  validation?: FieldValidation;
  ui?: FieldUI;
  /**
   * 顯式關聯元數據（TD-305 二元性統一）
   * - 如設定，Generator 會自動合併到 model.relations
   * - 不設定時若 type='reference' 自動推導為 { type: 'belongsTo', model: ... }
   */
  relation?: Relation;
};

// ==============================================
// 2. Computed Field（動態計算欄位）
// ==============================================

export type ComputedField = {
  name: string;
  type: FieldType;
  /** Extension Code 中的函數引用，例如 {{fn:calculateReadingTime}} */
  compute: string;
  /** 依賴的欄位（用於快取失效）*/
  dependencies?: string[];
  label?: string;
  description?: string;
};

// ==============================================
// 3. Relation（關聯）
// ==============================================

export type RelationType =
  | 'belongsTo'
  | 'hasOne'
  | 'hasMany'
  | 'manyToMany';

export type Relation = {
  type: RelationType;
  model: string;
  foreignKey?: string;
  through?: string;
  onDelete?: 'Cascade' | 'SetNull' | 'Restrict';
};

// ==============================================
// 4. Hook（生命週期）
// ==============================================

/**
 * Hook 名稱（11 種）
 */
export type HookName =
  // CRUD 生命週期
  | 'beforeCreate'
  | 'afterCreate'
  | 'beforeUpdate'
  | 'afterUpdate'
  | 'beforeDelete'
  | 'afterDelete'
  // 狀態機生命週期
  | 'onTransition'
  // 查詢生命週期
  | 'beforeList'
  | 'afterList'
  | 'beforeRead'
  | 'afterRead';

/**
 * Hook 對映表：每個 hook 對應 Extension Code 中的函數引用
 *
 * 範例：{ beforeCreate: "{{fn:generateSlugFromTitle}}" }
 */
export type Hooks = Partial<Record<HookName, string>>;

// ==============================================
// 5. Action（自定義動作）
// ==============================================

export type ActionVariant = 'default' | 'danger' | 'primary';

export type Action = {
  name: string;
  label: string;
  description?: string;
  /** Extension Code 中的函數引用 */
  implementation: string;
  /** 危險操作的確認訊息 */
  confirmation?: string;
  /** 限制條件 */
  requires?: {
    state?: string[];
    permission?: string;
  };
  icon?: string;
  variant?: ActionVariant;
};

// ==============================================
// 6. Workflow（狀態機）
// ==============================================

export type StateBadge = 'default' | 'success' | 'warning' | 'danger';

export type StateConfig = {
  label: string;
  description?: string;
  badge?: StateBadge;
  /** 此狀態下可用的 action 名稱 */
  allowedActions?: string[];
  /** 進入此狀態時執行的 hook，{{fn:函數名}} */
  onEnter?: string;
  /** 離開此狀態時執行的 hook */
  onExit?: string;
};

export type Transition = {
  from: string | string[];
  to: string;
  /** 條件檢查函數，{{fn:函數名}}，返回 boolean */
  guard?: string;
  /** 轉換後執行，{{fn:函數名}} */
  effect?: string;
  requires?: {
    permission?: string;
  };
};

export type Workflow = {
  name: string;
  initialState: string;
  states: Record<string, StateConfig>;
  transitions: Transition[];
};

// ==============================================
// 7. Model（資料模型）
// ==============================================

export type Model = {
  name: string;
  label?: string;
  description?: string;
  fields: Field[];
  computed?: ComputedField[];
  relations?: Relation[];
  hooks?: Hooks;
  actions?: Action[];
  workflows?: Workflow[];
  /** 軟刪除（默認 true）*/
  softDelete?: boolean;
  /** 顯示順序 */
  order?: number;
};

// ==============================================
// 8. Permission（權限）
// ==============================================

export type Permission = {
  action: string;
  roles: string[];
  description?: string;
};

// ==============================================
// 9. UI 設定
// ==============================================

export type MenuConfig = {
  label: string;
  icon?: string;
  path: string;
  /** 顯示順序 */
  order?: number;
};

export type PageConfig = {
  columns?: string[];
  defaultSort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  pageSize?: number;
  filters?: string[];
};

export type UIConfig = {
  menu?: MenuConfig;
  pages?: {
    list?: PageConfig;
    detail?: PageConfig;
    form?: PageConfig;
  };
};

// ==============================================
// 10. JsonSpec（頂層）
// ==============================================

/**
 * 完整的 JSON 規範
 *
 * 範例：
 * ```json
 * {
 *   "name": "blog-post",
 *   "label": "Blog 文章",
 *   "models": [...],
 *   "ui": {...},
 *   "permissions": [...]
 * }
 * ```
 */
export type JsonSpec = {
  /** 唯一識別（小寫，連字號）*/
  name: string;
  /** 顯示名稱 */
  label: string;
  /** 描述 */
  description?: string;
  /** 版本 */
  version?: string;
  /** 資料模型清單 */
  models: Model[];
  /** UI 設定 */
  ui?: UIConfig;
  /** 權限定義 */
  permissions?: Permission[];
  /** 全域 hooks（適用所有 model）*/
  hooks?: Hooks;
  /** 全域 actions（適用所有 model）*/
  actions?: Action[];
  /** Workflow 狀態機清單 */
  workflows?: Workflow[];
  /** 標籤（用於分類、搜尋）*/
  tags?: string[];
  /**
   * 自訂 API base path（預設 /api/crud/[model-kebab]）
   * 例如 blog spec 設 apiBase: '/api/blog' → 所有 CRUD route 用這個 prefix
   * Sprint 10 新增：讓每個 spec 可以自訂 URL，兼容 Sprint 9 手寫風格
   */
  apiBase?: string;
  /**
   * 自訂 UI base path（預設 /admin/[model-kebab]）
   * 例如 blog spec 設 uiBase: '/admin/blog' → 所有 page 用這個 prefix
   */
  uiBase?: string;
  /**
   * Extension 名稱（如 'blog'），啟用 Disable Guard
   * 設了之後，compiler 生成的 API route 會自動呼叫 `guardExtensionApi(name)`
   * 未啟用 extension 時 API 返 403
   * Sprint 11 TECH-022 新增
   */
  requiresExtension?: string;
};

// ==============================================
// 11. 編譯輸出類型（給 Compiler 用）
// ==============================================

export type CompiledOutput = {
  /** Prisma schema 片段 */
  prisma: string;
  /** REST API routes 列表 */
  apiRoutes: ApiRoute[];
  /** CRUD pages 列表 */
  pages: PageDefinition[];
  /** RBAC policies */
  policies: Policy[];
};

export type ApiRoute = {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  handler: string;
  model: string;
  operation: 'list' | 'read' | 'create' | 'update' | 'delete';
};

export type PageDefinition = {
  path: string;
  component: string;
  model: string;
};

export type Policy = {
  action: string;
  model: string;
  roles: string[];
};
