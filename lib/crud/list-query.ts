// Sprint D1 (CRUD 列表頁增強 v1.1) — List Query URL ↔ Filter Parser
//
// URL ↔ ListQuery 雙向轉換 + 5 種類型 filter apply 邏輯。
//
// 設計:
// - parseListQuery(searchParams) 把 URLSearchParams 解析成 ListQuery
// - serializeListQuery(query) 把 ListQuery 序列化成 URLSearchParams
// - applyFilters(items, filters, fields) 在 server-side / client-side 都可用
// - 所有錯誤 (invalid JSON / 未知 field / 錯誤運算子) 都略過不 throw
//
// Gate 1 TDD: 見 tests/integration/list-query.test.ts

export type FieldType = 'string' | 'number' | 'integer' | 'enum' | 'datetime' | 'boolean';

export type Operator =
  | 'contains' // string
  | 'equals' // string / number
  | 'startsWith' // string
  | 'gte' // number
  | 'gt' // number
  | 'eq' // number
  | 'lt' // number
  | 'lte' // number
  | 'between' // number
  | 'in' // enum
  | 'notIn' // enum
  | 'from' // datetime
  | 'to' // datetime
  | 'isTrue' // boolean
  | 'isFalse'; // boolean

export type Filter = {
  field: string;
  operator: Operator;
  value: unknown;
};

export type FilterableField = {
  name: string;
  type: FieldType;
  enumValues?: string[];
};

export type ListQuery = {
  page: number;
  pageSize: number;
  sort: string;
  order: 'asc' | 'desc';
  q: string;
  filters: Filter[];
};

// ==============================================
// URL ↔ ListQuery 解析 / 序列化
// ==============================================

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;
const MAX_PAGE = 50;

function parsePositiveInt(value: string | undefined, fallback: number, max?: number): number {
  const n = parseInt(value ?? '', 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  if (max !== undefined && n > max) return max;
  return n;
}

/**
 * 從 searchParams 解析成 ListQuery
 *
 * 容錯: 任何錯誤（不是 JSON / 未知 filter）都略過不 throw
 */
export function parseListQuery(
  searchParams: Record<string, string | undefined>,
): ListQuery {
  const page = parsePositiveInt(searchParams.page, 1, MAX_PAGE);
  const pageSize = parsePositiveInt(searchParams.pageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const sort = searchParams.sort ?? '';
  const order = searchParams.order === 'asc' ? 'asc' : 'desc';
  const q = searchParams.q ?? '';

  let filters: Filter[] = [];
  if (searchParams.filters) {
    try {
      const parsed = JSON.parse(searchParams.filters);
      if (Array.isArray(parsed)) {
        filters = parsed.filter(
          (f): f is Filter =>
            typeof f === 'object' &&
            f !== null &&
            typeof f.field === 'string' &&
            typeof f.operator === 'string',
        );
      }
    } catch {
      // ignore
    }
  }

  return { page, pageSize, sort, order, q, filters };
}

/**
 * 把 ListQuery 序列化成 URLSearchParams 字串
 *
 * 規則:
 * - page = 1 不寫
 * - pageSize = 10 不寫
 * - sort/order 為空/預設不寫
 * - filters = [] 不寫
 */
export function serializeListQuery(query: ListQuery): string {
  const params = new URLSearchParams();

  if (query.page > 1) params.set('page', String(query.page));
  if (query.pageSize !== DEFAULT_PAGE_SIZE) params.set('pageSize', String(query.pageSize));
  if (query.sort) params.set('sort', query.sort);
  if (query.order !== 'desc') params.set('order', query.order);
  if (query.q) params.set('q', query.q);
  if (query.filters.length > 0) {
    params.set('filters', JSON.stringify(query.filters));
  }

  return params.toString();
}

// ==============================================
// Filter Apply Logic — 5 種類型
// ==============================================

function compareNumber(a: number, op: Operator, b: number | [number, number]): boolean {
  if (op === 'between') {
    if (!Array.isArray(b) || b.length !== 2) return false;
    const [min, max] = b;
    return a >= min && a <= max;
  }
  if (typeof b !== 'number') return false;
  switch (op) {
    case 'gte': return a >= b;
    case 'gt': return a > b;
    case 'eq': return a === b;
    case 'lt': return a < b;
    case 'lte': return a <= b;
    default: return false;
  }
}

function compareString(a: string, op: Operator, b: unknown): boolean {
  if (typeof b !== 'string') return false;
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();
  switch (op) {
    case 'contains': return aLower.includes(bLower);
    case 'equals': return aLower === bLower;
    case 'startsWith': return aLower.startsWith(bLower);
    default: return false;
  }
}

function compareDatetime(a: string, op: Operator, b: unknown): boolean {
  if (typeof b !== 'string') return false;
  // 用 Date 比較（容忍 ISO 字串）
  const aTime = new Date(a).getTime();
  const bTime = new Date(b).getTime();
  if (Number.isNaN(aTime) || Number.isNaN(bTime)) return false;
  if (op === 'from') return aTime >= bTime;
  if (op === 'to') return aTime <= bTime;
  return false;
}

function compareEnum(a: string, op: Operator, b: unknown): boolean {
  if (!Array.isArray(b)) return false;
  const bArr = b.filter((x): x is string => typeof x === 'string');
  if (op === 'in') return bArr.includes(a);
  if (op === 'notIn') return !bArr.includes(a);
  return false;
}

function compareBoolean(a: unknown, op: Operator): boolean {
  if (op === 'isTrue') return a === true;
  if (op === 'isFalse') return a === false;
  return false;
}

// ==============================================
// buildPrismaWhere — Filter[] → Prisma where 條件
// ==============================================
// Sprint D 修補：把 filter 條件轉成 Prisma where，讓 DB 先 filter 再分頁。
// 否則會出「同頁 items 套 filter 後變 0」bug（order amount >= 2000）。
//
// applyFilters 保留作為 fallback（給 in-memory 測試用）。

export function buildPrismaWhere(
  filters: Filter[],
  fields: FilterableField[],
): Record<string, unknown> {
  const conditions: Record<string, unknown>[] = [];

  for (const filter of filters) {
    const field = fields.find((f) => f.name === filter.field);
    if (!field) continue;

    const cond = buildSingleCondition(field, filter);
    if (cond) conditions.push(cond);
  }

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0]!;
  return { AND: conditions };
}

function buildSingleCondition(
  field: FilterableField,
  filter: Filter,
): Record<string, unknown> | null {
  const v = filter.value;

  switch (field.type) {
    case 'string': {
      if (typeof v !== 'string') return null;
      switch (filter.operator) {
        case 'contains': return { [field.name]: { contains: v } };
        case 'equals': return { [field.name]: v };
        case 'startsWith': return { [field.name]: { startsWith: v } };
      }
      return null;
    }
    case 'number':
    case 'integer': {
      switch (filter.operator) {
        case 'gte': return { [field.name]: { gte: Number(v) } };
        case 'gt': return { [field.name]: { gt: Number(v) } };
        case 'eq': return { [field.name]: Number(v) };
        case 'lt': return { [field.name]: { lt: Number(v) } };
        case 'lte': return { [field.name]: { lte: Number(v) } };
        case 'between': {
          if (!Array.isArray(v)) return null;
          return { [field.name]: { gte: Number(v[0]), lte: Number(v[1]) } };
        }
      }
      return null;
    }
    case 'enum': {
      switch (filter.operator) {
        case 'in':
          return { [field.name]: { in: Array.isArray(v) ? v : [] } };
        case 'notIn':
          return { [field.name]: { notIn: Array.isArray(v) ? v : [] } };
      }
      return null;
    }
    case 'datetime': {
      if (typeof v !== 'string') return null;
      switch (filter.operator) {
        case 'from':
          return { [field.name]: { gte: new Date(v) } };
        case 'to':
          return { [field.name]: { lte: new Date(v) } };
      }
      return null;
    }
    case 'boolean': {
      switch (filter.operator) {
        case 'isTrue': return { [field.name]: true };
        case 'isFalse': return { [field.name]: false };
      }
      return null;
    }
  }

  return null;
}

/**
 * 對 items 套用所有 filters (AND 邏輯)
 *
 * 容錯: 未知 field / 錯誤運算子略過該 filter，不 throw
 */
export function applyFilters<T extends Record<string, unknown>>(
  items: T[],
  filters: Filter[],
  fields: FilterableField[],
): T[] {
  if (filters.length === 0) return items;

  return items.filter((item) =>
    filters.every((filter) => {
      const field = fields.find((f) => f.name === filter.field);
      if (!field) return true; // 未知 field 略過

      const value = item[filter.field];

      switch (field.type) {
        case 'string':
          return typeof value === 'string' && compareString(value, filter.operator, filter.value);
        case 'number':
        case 'integer':
          return typeof value === 'number' && compareNumber(value, filter.operator, filter.value as number | [number, number]);
        case 'enum':
          return typeof value === 'string' && compareEnum(value, filter.operator, filter.value);
        case 'datetime':
          return typeof value === 'string' && compareDatetime(value, filter.operator, filter.value);
        case 'boolean':
          return compareBoolean(value, filter.operator);
        default:
          return true;
      }
    }),
  );
}

// ==============================================
// Helper: 取得 field 的可用運算子 (供 UI 用)
// ==============================================

export function getOperatorsForField(type: FieldType): Operator[] {
  switch (type) {
    case 'string': return ['contains', 'equals', 'startsWith'];
    case 'number':
    case 'integer':
      return ['gte', 'gt', 'eq', 'lt', 'lte', 'between'];
    case 'enum': return ['in', 'notIn'];
    case 'datetime': return ['from', 'to'];
    case 'boolean': return ['isTrue', 'isFalse'];
    default: return [];
  }
}

export function operatorLabel(op: Operator): string {
  const labels: Record<Operator, string> = {
    contains: '包含',
    equals: '等於',
    startsWith: '開頭為',
    gte: '>=',
    gt: '>',
    eq: '=',
    lt: '<',
    lte: '<=',
    between: '介於',
    in: '屬於',
    notIn: '不屬於',
    from: '從',
    to: '到',
    isTrue: '是',
    isFalse: '否',
  };
  return labels[op];
}