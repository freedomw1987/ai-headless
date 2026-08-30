// Sprint 14 TECH-032 — Dynamic CRUD Handler
//
// 從 JsonSpec 動態組裝 CRUD handler：
// - list / get / create / update / delete
// - Zod runtime 驗證（從 spec.fields 推導）
// - Workflow transition（從 spec.workflows + extension code）
// - Disable Guard（從 spec.name 推導 extension name，Sprint 15 TECH-040）
//
// 80% 標準 CRUD 走這裡；20% 自定義邏輯仍走 extension workflow.ts。
//
// 重要：Handler 不直接 import auth()，route.ts 負責 auth 注入 ctx.user。
// 理由：讓 handler 可獨立測試（不需 Next.js 環境）。

import { z } from 'zod';
import { db } from '@/lib/db';
import { getRequiredExtension } from '@/lib/specs/extension-derive';
import { hasDynamicPermission } from '@/lib/auth/dynamic-permission';
import { guardExtensionApi } from '@/lib/extensions/api-guard';
import { parseHookReference } from '@/lib/specs/json-spec.validator';
import { applyFilters, buildPrismaWhere, type FieldType, type Filter, type FilterableField } from '@/lib/crud/list-query';
import { invokeHook, hasHook } from '@/lib/extensions/hooks';
import { sanitizeErrorMessage } from '@/lib/runtime/error-sanitizer';
import { createStateMachine } from '@/lib/state-machine/state-machine';
import type { JsonSpec, Model, Field } from '@/lib/specs/json-spec.types';

// ==============================================
// 型別
// ==============================================

export type HandlerUser = {
  id: string;
  role: string; // Role enum from RBAC
};

export type HandlerContext = {
  body?: Record<string, unknown>;
  params?: Record<string, string>;
  query?: Record<string, string | string[] | undefined>;
  user?: HandlerUser;
};

export type HandlerResult = {
  status: number;
  data?: unknown;
  error?: string;
};

export type DynamicHandlers = {
  list: (ctx: HandlerContext) => Promise<HandlerResult>;
  get: (ctx: HandlerContext) => Promise<HandlerResult>;
  create: (ctx: HandlerContext) => Promise<HandlerResult>;
  update: (ctx: HandlerContext) => Promise<HandlerResult>;
  delete: (ctx: HandlerContext) => Promise<HandlerResult>;
  transition?: (ctx: HandlerContext) => Promise<HandlerResult>;
};

// ==============================================
// Zod Schema 從 spec 推導
// ==============================================

function buildZodSchema(model: Model, mode: 'create' | 'update') {
  const fields = model.fields;
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    let schema = fieldToZod(field);
    if (mode === 'update') {
      schema = schema.optional();
    } else if (mode === 'create' && !field.validation?.required) {
      schema = schema.optional();
    }
    shape[field.name] = schema;
  }

  return z.object(shape);
}

function fieldToZod(field: Field): z.ZodTypeAny {
  const v = field.validation ?? {};
  let s: z.ZodTypeAny;

  switch (field.type) {
    case 'string':
    case 'text':
      s = z.string();
      if (v.min !== undefined) s = (s as z.ZodString).min(v.min);
      if (v.max !== undefined) s = (s as z.ZodString).max(v.max);
      if (v.pattern) s = (s as z.ZodString).regex(new RegExp(v.pattern));
      break;
    case 'number':
    case 'decimal':
      s = z.number();
      break;
    case 'integer':
      s = z.number().int();
      if (v.min !== undefined) s = (s as z.ZodNumber).min(v.min);
      break;
    case 'boolean':
      s = z.boolean();
      break;
    case 'enum':
      s = field.validation?.enum?.length
        ? z.enum(field.validation.enum as [string, ...string[]])
        : z.string();
      break;
    case 'date':
    case 'datetime':
      s = z.union([
        z.string().refine((val) => !isNaN(Date.parse(val)), {
          message: 'Invalid date',
        }),
        z.null(),
      ]);
      break;
    case 'json':
      s = z.unknown();
      break;
    case 'image':
      s = z.string();
      break;
    default:
      s = z.unknown();
  }

  return s;
}

// ==============================================
// Helpers
// ==============================================

function getTableName(model: Model): string {
  return model.name.charAt(0).toLowerCase() + model.name.slice(1);
}

function getPermission(action: string, specName: string): string {
  // action 是 'read' | 'create' | 'update' | 'delete'
  return `${specName}.${action}`;
}

function checkAuth(ctx: HandlerContext): HandlerResult | null {
  if (!ctx.user) {
    return { status: 401, error: 'Unauthorized' };
  }
  return null;
}

async function checkPermission(
  ctx: HandlerContext,
  action: string,
  specName: string,
): Promise<HandlerResult | null> {
  if (!ctx.user) return { status: 401, error: 'Unauthorized' };
  // Sprint 25: 改用 hasDynamicPermission (async, 從 session.user.permissions 判斷)
  const permission = getPermission(action, specName);
  const allowed = await hasDynamicPermission(permission);
  if (!allowed) {
    return { status: 403, error: `Forbidden: ${permission}` };
  }
  return null;
}

async function checkDisabled(spec: JsonSpec): Promise<HandlerResult | null> {
  // Sprint 15 TECH-040：從 spec.name 推導 extension name（除非顯式 override）
  const extName = getRequiredExtension(spec);
  const guard = await guardExtensionApi(extName);
  return guard
    ? { status: 403, error: `Extension "${extName}" is disabled` }
    : null;
}

// ==============================================
// 動態組裝 Handler
// ==============================================

export function createDynamicHandlers(spec: JsonSpec): DynamicHandlers {
  const model = spec.models[0];
  if (!model) throw new Error(`Spec "${spec.name}" has no models`);

  const tableName = getTableName(model);
  const zodCreate = buildZodSchema(model, 'create');
  const zodUpdate = buildZodSchema(model, 'update');

  const workflow = spec.workflows?.[0];

  // 嘗試載入 extension workflow code（覆蓋 spec workflow）
  let extTransition:
    | ((id: string, event: string, payload?: Record<string, unknown>) => Promise<unknown>)
    | null = null;
  try {
    const extPath = require.resolve(
      `@/extensions/${spec.name}/workflow/${spec.name}-workflow`,
      { paths: [process.cwd()] },
    );
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const extModule = require(extPath);
    const fnName = `transition${model.name}`;
    extTransition = extModule[fnName];
  } catch {
    // 沒 extension code → fallback 到 spec workflow
  }

  // ==============================================
  // List
  // ==============================================
  const list: DynamicHandlers['list'] = async (ctx) => {
    const disabled = await checkDisabled(spec);
    if (disabled) return disabled;
    // 讀取不強迫權限（dynamic handler 適用所有 spec）
    // Permission check 由 route 層 / page 層負責

    // Sprint 19 Stage 1: Server Side 分頁
    // 從 ctx.query 讀取 page / pageSize（URL ?page= ?pageSize=）
    const rawPage = Number(ctx.query?.page ?? 1);
    const rawPageSize = Number(ctx.query?.pageSize ?? 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
    const pageSize =
      Number.isFinite(rawPageSize) && rawPageSize > 0 && rawPageSize <= 100
        ? Math.floor(rawPageSize)
        : 10;
    const skip = (page - 1) * pageSize;

    const modelClient = (db as unknown as Record<string, {
      findMany: (args?: unknown) => Promise<unknown[]>;
      count: (args?: unknown) => Promise<number>;
    }>)[tableName];

    if (!modelClient) {
      return { status: 500, error: `找不到 model: ${tableName}` };
    }

    const where: Record<string, unknown> = model.softDelete ? { deletedAt: null } : {};

    // Sprint 19 Stage 3: Sort + Filter 支援
    // - sort 欄位必須在 spec fields 白名單內（防 SQL injection）
    // - order 方向為 asc / desc
    // - q 對所有 string 欄位做 contains 搜尋（OR 組合）
    const rawSort = String(ctx.query?.sort ?? '');
    const rawOrder = String(ctx.query?.order ?? 'desc');
    const rawQ = String(ctx.query?.q ?? '').trim();

    const sortField = spec.models[0]?.fields?.some((f) => f.name === rawSort)
      ? rawSort
      : 'createdAt';
    const sortOrder = rawOrder === 'asc' ? 'asc' : 'desc';

    if (rawQ) {
      const stringFields = (spec.models[0]?.fields ?? [])
        .filter((f) => f.type === 'string' || f.type === 'text')
        .map((f) => ({ [f.name]: { contains: rawQ } }));
      if (stringFields.length > 0) {
        where.OR = stringFields;
      }
    }

    // Sprint D 修補：filter 條件轉 Prisma where（避免「先分頁再 filter」bug）
    const rawFiltersForWhere = ctx.query?.filters;
    if (rawFiltersForWhere) {
      try {
        const parsed = typeof rawFiltersForWhere === 'string'
          ? JSON.parse(rawFiltersForWhere)
          : rawFiltersForWhere;
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filterableFields: FilterableField[] = (spec.models[0]?.fields ?? []).map((f) => ({
            name: f.name,
            type: f.type as unknown as FieldType,
            enumValues: (f as { validation?: { enum?: string[] }; options?: string[] }).validation?.enum
              ?? (f as { options?: string[] }).options,
          }));
          const filterWhere = buildPrismaWhere(parsed as Filter[], filterableFields);
          // 合併到 where：AND 語意
          if (Object.keys(filterWhere).length > 0) {
            where.AND = where.AND
              ? [...(where.AND as Record<string, unknown>[]), filterWhere]
              : [filterWhere];
          }
        }
      } catch (e) {
        // TD-804: 不要 silent swallow 解析錯誤。記錄警告方便 debug,
        // 隱私風險: 默認行為就是不 filter → 看到全部 rows (本來設計)
        // 若 filter 解析失敗, 保留這個語意但加 log 提醒開發者
        console.warn(
          `[TD-804] ${spec.name} filter parse failed:`,
          rawFiltersForWhere?.toString().substring(0, 200),
          e instanceof Error ? e.message : e,
        );
      }
    }

    // 平行查詢 items + total（效能優化）
    // TD-401: try/catch 避免 DB 拋錯 → 500 + 暴露 Prisma 訊息
    let items: unknown[];
    let total: number;
    try {
      [items, total] = await Promise.all([
        modelClient.findMany({
          where,
          orderBy: { [sortField]: sortOrder },
          skip,
          take: pageSize,
        }),
        modelClient.count({ where }),
      ]);
    } catch (e) {
      return { status: 500, error: sanitizeErrorMessage(e) };
    }
    // Sprint D 修補：filter 已在 Prisma where 套用（讓 DB 先 filter 再分頁）

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const afterList = parseHookReference(spec.models[0]?.hooks?.afterList);
    if (afterList && hasHook(afterList)) {
      const r = await invokeHook(afterList, {
        result: { items, total, page, pageSize, totalPages },
        model: model.name,
      });
      return { status: 200, data: r };
    }

    return {
      status: 200,
      data: { items, total, page, pageSize, totalPages },
    };
  };

  // ==============================================
  // Get
  // ==============================================
  const get: DynamicHandlers['get'] = async (ctx) => {
    const disabled = await checkDisabled(spec);
    if (disabled) return disabled;
    const id = ctx.params?.id;
    if (!id) return { status: 400, error: 'id 必填' };
    // 讀取不強迫權限

    // TD-401: try/catch 避免 DB 拋錯 → 500 + 暴露 Prisma 訊息
    let item: unknown;
    try {
      // @ts-expect-error dynamic Prisma access
      item = await (db as unknown as Record<string, { findFirst: (args: unknown) => Promise<unknown> }>)[tableName].findFirst({
        where: model.softDelete ? { id, deletedAt: null } : { id },
      });
    } catch (e) {
      return { status: 500, error: sanitizeErrorMessage(e) };
    }
    if (!item) return { status: 404, error: 'Not found' };

    return { status: 200, data: item };
  };

  // ==============================================
  // Create
  // ==============================================
  const create: DynamicHandlers['create'] = async (ctx) => {
    const disabled = await checkDisabled(spec);
    if (disabled) return disabled;
    // 寫入需要登入 + 權限
    const authErr = checkAuth(ctx);
    if (authErr) return authErr;
    const permErr = await checkPermission(ctx, 'create', spec.name);
    if (permErr) return permErr;

    const parsed = zodCreate.safeParse(ctx.body ?? {});
    if (!parsed.success) {
      return {
        status: 400,
        error: parsed.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; '),
      };
    }

    let data = parsed.data as Record<string, unknown>;

    try {
      const beforeCreate = parseHookReference(spec.models[0]?.hooks?.beforeCreate);
      if (beforeCreate && hasHook(beforeCreate)) {
        const r = await invokeHook(beforeCreate, {
          data,
          model: model.name,
          ctx: { user: ctx.user },
        });
        // hook 直接 return data（不是 { data: ... }）
        data = r as Record<string, unknown>;
      }

      // @ts-expect-error dynamic Prisma access
      const created = await (db as unknown as Record<string, { create: (args: { data: unknown }) => Promise<unknown> }>)[tableName].create({
        data,
      });

      const afterCreate = parseHookReference(spec.models[0]?.hooks?.afterCreate);
      if (afterCreate && hasHook(afterCreate)) {
        await invokeHook(afterCreate, {
          result: created,
          model: model.name,
          ctx: { user: ctx.user },
        });
      }

      return { status: 201, data: created };
    } catch (e) {
      // Sprint 20 P3.5：Hook 業務驗證錯誤 或 Prisma 寫入錯誤 → 400 + 訊息
      // （原本未 catch 導致 500，使用者看不到錯誤訊息）
      return {
        status: 400,
        error: sanitizeErrorMessage(e),
      };
    }
  };

  // ==============================================
  // Update
  // ==============================================
  const update: DynamicHandlers['update'] = async (ctx) => {
    const disabled = await checkDisabled(spec);
    if (disabled) return disabled;
    const id = ctx.params?.id;
    if (!id) return { status: 400, error: 'id 必填' };

    const authErr = checkAuth(ctx);
    if (authErr) return authErr;
    const permErr = await checkPermission(ctx, 'update', spec.name);
    if (permErr) return permErr;

    const parsed = zodUpdate.safeParse(ctx.body ?? {});
    if (!parsed.success) {
      return {
        status: 400,
        error: parsed.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; '),
      };
    }

    try {
      // @ts-expect-error dynamic Prisma access
      const updated = await (db as unknown as Record<string, { update: (args: { where: { id: string }; data: unknown }) => Promise<unknown> }>)[tableName].update({
        where: { id },
        data: parsed.data,
      });
      return { status: 200, data: updated };
    } catch (e) {
      return {
        status: 400,
        error: sanitizeErrorMessage(e),
      };
    }
  };

  // ==============================================
  // Delete
  // ==============================================
  const del: DynamicHandlers['delete'] = async (ctx) => {
    const disabled = await checkDisabled(spec);
    if (disabled) return disabled;
    const id = ctx.params?.id;
    if (!id) return { status: 400, error: 'id 必填' };

    const authErr = checkAuth(ctx);
    if (authErr) return authErr;
    const permErr = await checkPermission(ctx, 'delete', spec.name);
    if (permErr) return permErr;

    if (model.softDelete) {
      try {
        // @ts-expect-error dynamic Prisma access
        await (db as unknown as Record<string, { update: (args: unknown) => Promise<unknown> }>)[tableName].update({ where: { id }, data: { deletedAt: new Date() } });
      } catch (e) {
        return {
          status: 400,
          error: sanitizeErrorMessage(e),
        };
      }
    } else {
      try {
        // @ts-expect-error dynamic Prisma access
        await (db as unknown as Record<string, { delete: (args: unknown) => Promise<unknown> }>)[tableName].delete({ where: { id } });
      } catch (e) {
        return {
          status: 400,
          error: sanitizeErrorMessage(e),
        };
      }
    }

    return { status: 204 };
  };

  // ==============================================
  // Transition
  // ==============================================
  let transition: DynamicHandlers['transition'] | undefined;
  if (workflow || extTransition) {
    transition = async (ctx) => {
      const disabled = await checkDisabled(spec);
      if (disabled) return disabled;
      const id = ctx.params?.id;
      const event = (ctx.body?.event ?? ctx.body?.to) as string | undefined;
      if (!id || !event) return { status: 400, error: 'id + event 必填' };

      const authErr = checkAuth(ctx);
      if (authErr) return authErr;

      try {
        // 優先 extension code
        if (extTransition) {
          // Sprint 29 commit 1: 統一注入 userId (從 ctx.user)
          // 若 caller 已設 userId (非 undefined), 尊重 caller
          // 若 ctx.user 缺, 拋 401 Unauthorized (auth 守衛)
          const authErr = checkAuth(ctx);
          if (authErr) return authErr;

          const payload = ctx.body as Record<string, unknown> | undefined;
          const payloadWithUserId: Record<string, unknown> = {
            ...(payload ?? {}),
            userId:
              payload?.userId !== undefined
                ? payload.userId
                : ctx.user?.id ?? null,
          };

          const updated = await extTransition(
            id,
            event,
            payloadWithUserId,
          );
          return { status: 200, data: updated };
        }

        if (!workflow) return { status: 400, error: 'no workflow' };

        // @ts-expect-error dynamic Prisma access
        const item = await (db as unknown as Record<string, { findUnique: (args: unknown) => Promise<unknown> }>)[tableName].findUnique({ where: { id } });
        if (!item) return { status: 404, error: 'Not found' };
        const itemWithStatus = item as { status: string };

        const stateSchema = {
          id: workflow.name,
          initial: workflow.initialState,
          states: Object.fromEntries(
            Object.entries(workflow.states).map(([key]) => [
              key,
              {
                on: Object.fromEntries(
                  workflow.transitions
                    .filter((t) =>
                      Array.isArray(t.from) ? t.from.includes(key) : t.from === key,
                    )
                    .map((t) => [t.to, t.to]),
                ),
              },
            ]),
          ),
        };

        const sm = createStateMachine(stateSchema);
        sm.setState(itemWithStatus.status);
        const newState = sm.transition({ event });

        // TD-516: 用 Prisma transaction + 重新查 status 避免並發 race condition
        // - Transaction 確保讀寫原子性
        // - 重新查 status 確認仍是 itemWithStatus.status (未被其他 transaction 改)
        // - 若已被改, 拋錯 → catch → 409 Conflict
        const txClient = (db as any)[tableName];
        const updated = await txClient.$transaction(async (tx: any) => {
          const fresh = await tx.findUnique({ where: { id } });
          if (!fresh) throw new Error('Not found in transaction');
          const freshStatus = (fresh as { status: string }).status;
          if (freshStatus !== itemWithStatus.status) {
            // 並發其他 transaction 已改 status
            throw new Error(`Race condition: status changed from ${itemWithStatus.status} to ${freshStatus}`);
          }
          return tx.update({
            where: { id },
            data: { status: newState },
          });
        });

        return { status: 200, data: updated };
      } catch (e) {
        // TD-516: Race condition (status 被其他 transaction 改) → 409 Conflict
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.startsWith('Race condition:')) {
          return {
            status: 409,
            error: msg,
          };
        }
        return {
          status: 400,
          error: sanitizeErrorMessage(e),
        };
      }
    };
  }

  return { list, get, create, update, delete: del, transition };
}