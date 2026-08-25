// Sprint 14 TECH-032 — Dynamic CRUD Handler
//
// 從 JsonSpec 動態組裝 CRUD handler：
// - list / get / create / update / delete
// - Zod runtime 驗證（從 spec.fields 推導）
// - Workflow transition（從 spec.workflows + extension code）
// - Disable Guard（從 spec.requiresExtension + manifest.isEnabled）
//
// 80% 標準 CRUD 走這裡；20% 自定義邏輯仍走 extension workflow.ts。
//
// 重要：Handler 不直接 import auth()，route.ts 負責 auth 注入 ctx.user。
// 理由：讓 handler 可獨立測試（不需 Next.js 環境）。

import { z } from 'zod';
import { db } from '@/lib/db';
import { hasPermission } from '@/lib/auth/rbac';
import { guardExtensionApi } from '@/lib/extensions/api-guard';
import { parseHookReference } from '@/lib/specs/json-spec.validator';
import { invokeHook, hasHook } from '@/lib/extensions/hooks';
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
      s = z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid date',
      });
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

function checkPermission(
  ctx: HandlerContext,
  action: string,
  specName: string,
): HandlerResult | null {
  if (!ctx.user) return { status: 401, error: 'Unauthorized' };
  const permission = getPermission(action, specName) as Parameters<typeof hasPermission>[1];
  if (!hasPermission(ctx.user.role as 'admin' | 'editor' | 'viewer', permission)) {
    return { status: 403, error: `Forbidden: ${getPermission(action, specName)}` };
  }
  return null;
}

async function checkDisabled(spec: JsonSpec): Promise<HandlerResult | null> {
  if (!spec.requiresExtension) return null;
  const guard = await guardExtensionApi(spec.requiresExtension);
  return guard
    ? { status: 403, error: `Extension "${spec.requiresExtension}" is disabled` }
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
    // eslint-disable-next-line @typescript-eslint/no-require-imports
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
    // 讀取不強迫權限（參考現有 /api/blog、/api/todo 路由）
    // Permission check 由 route 層 / page 層負責

    // @ts-expect-error dynamic Prisma access
    const items = await (db as unknown as Record<string, { findMany: (args?: unknown) => Promise<unknown[]> }>)[tableName].findMany({
      where: model.softDelete ? { deletedAt: null } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const afterList = parseHookReference(spec.models[0]?.hooks?.afterList);
    if (afterList && hasHook(afterList)) {
      const r = await invokeHook(afterList, { result: items, model: model.name });
      return { status: 200, data: r };
    }

    return { status: 200, data: { items } };
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

    // @ts-expect-error dynamic Prisma access
    const item = await (db as unknown as Record<string, { findFirst: (args: unknown) => Promise<unknown> }>)[tableName].findFirst({
      where: model.softDelete ? { id, deletedAt: null } : { id },
    });
    if (!item) return { status: 404, error: 'Not found' };
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
    const permErr = checkPermission(ctx, 'create', spec.name);
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
    const beforeCreate = parseHookReference(spec.models[0]?.hooks?.beforeCreate);
    if (beforeCreate && hasHook(beforeCreate)) {
      const r = await invokeHook(beforeCreate, {
        data,
        model: model.name,
        ctx: { user: ctx.user },
      });
      data = (r as { data: Record<string, unknown> }).data;
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
    const permErr = checkPermission(ctx, 'update', spec.name);
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

    // @ts-expect-error dynamic Prisma access
    const updated = await (db as unknown as Record<string, { update: (args: { where: { id: string }; data: unknown }) => Promise<unknown> }>)[tableName].update({
      where: { id },
      data: parsed.data,
    });

    return { status: 200, data: updated };
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
    const permErr = checkPermission(ctx, 'delete', spec.name);
    if (permErr) return permErr;

    if (model.softDelete) {
      // @ts-expect-error dynamic Prisma access
      await (db as unknown as Record<string, { update: (args: unknown) => Promise<unknown> }>)[tableName].update({ where: { id }, data: { deletedAt: new Date() } });
    } else {
      // @ts-expect-error dynamic Prisma access
      await (db as unknown as Record<string, { delete: (args: unknown) => Promise<unknown> }>)[tableName].delete({ where: { id } });
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

      // 優先 extension code
      if (extTransition) {
        const updated = await extTransition(
          id,
          event,
          ctx.body as Record<string, unknown>,
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

      // @ts-expect-error dynamic Prisma access
      const updated = await (db as unknown as Record<string, { update: (args: unknown) => Promise<unknown> }>)[tableName].update({
        where: { id },
        data: { status: newState },
      });

      return { status: 200, data: updated };
    };
  }

  return { list, get, create, update, delete: del, transition };
}