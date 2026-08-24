/**
 * ==============================================
 *  API Generator — JSON → Next.js Route Handlers
 * ==============================================
 *
 * 將 JsonSpec 轉換為 Next.js App Router 的 route handler 代碼
 * 對應：docs/prd/01-framework-core.md §2.2 FR-2.2
 *
 * 生成的代碼：
 * - 自動 RBAC 檢查
 * - 自動 Hook 調用（beforeCreate, afterCreate, ...）
 * - 自動 Zod 校驗
 * - 自動軟刪除支援
 * - Custom Action endpoints
 */

import type { JsonSpec, Model, Action, Field } from '@/lib/specs/json-spec.types';
import { parseHookReference } from '@/lib/specs/json-spec.validator';

// ==============================================
// 公開類型
// ==============================================

export type GeneratedRoute = {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  handler: string;
  code: string;
  model: string;
  operation: 'list' | 'read' | 'create' | 'update' | 'delete' | 'action';
};

// ==============================================
// 輔助：model 命名轉換
// ==============================================

function modelToTableName(modelName: string): string {
  // PascalCase → snake_case（Prisma 模型名是 PascalCase，但 prisma client 用駝峰）
  return modelName.charAt(0).toLowerCase() + modelName.slice(1);
}

function modelToKebab(modelName: string): string {
  // PascalCase → kebab-case
  return modelName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function modelToRouteBase(spec: JsonSpec, modelName: string): string {
  // 設計選擇：
  // - 沒設 apiBase → /api/crud/[model-kebab]（預設·一 spec 多 model）
  // - 有設 apiBase → 直接用 apiBase 作為 base（單一 model / Extension 風格）
  if (spec.apiBase) return spec.apiBase;
  return `/api/crud/${modelToKebab(modelName)}`;
}

// ==============================================
// Hook 引用提取
// ==============================================

function hookFn(hookRef: string | undefined): string | null {
  if (!hookRef) return null;
  return parseHookReference(hookRef);
}

// ==============================================
// 通用代碼片段
// ==============================================

const HEADER_IMPORTS = `// 此文件由 ai-headless 自動生成
// 不要手動修改！修改請改 JsonSpec，重新編譯
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth/config';
import { checkPermission } from '@/lib/auth/rbac';
import { invokeHook } from '@/lib/extensions/hooks';
`;

function permissionCheck(action: string): string {
  return `
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hasPermission = await checkPermission(session.user, '${action}');
  if (!hasPermission) {
    return NextResponse.json({ error: 'Forbidden: ${action}' }, { status: 403 });
  }
`;
}

// ==============================================
// LIST Handler
// ==============================================

function generateListHandler(
  spec: JsonSpec,
  model: Model,
  path: string,
): GeneratedRoute {
  const tableName = modelToTableName(model.name);
  const isSoftDelete = model.softDelete !== false;
  const hooks = model.hooks ?? {};
  const searchableFields = model.fields.filter((f) => f.ui?.searchable);
  const sortableFields = model.fields.filter((f) => f.ui?.sortable !== false);

  // 構建 where 子句（搜尋）
  const searchCode =
    searchableFields.length > 0
      ? searchableFields
          .map(
            (f) => `
        ...(search && { ${f.name}: { contains: search, mode: 'insensitive' } }),`,
          )
          .join('')
      : '';

  // 排序
  const orderByCode = sortableFields.length > 0
    ? `orderBy: { [sortBy]: sortOrder },`
    : '';

  const softDeleteFilter = isSoftDelete ? `deletedAt: null,` : '';

  const code = `${HEADER_IMPORTS}

export async function ${'GET'}(request: NextRequest) {
  ${permissionCheck(`${tableName}.read`)}

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') ?? '1');
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20');
  const search = searchParams.get('search') ?? '';
  const sortBy = searchParams.get('sortBy') ?? 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') ?? 'desc') as 'asc' | 'desc';

  const where = {
    ${softDeleteFilter}${searchCode}
  };

  const [items, total] = await Promise.all([
    prisma.${tableName}.findMany({
      where,
      ${orderByCode}
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.${tableName}.count({ where }),
  ]);

  // afterList hook
  const afterListHook = hookFn('${hooks.afterList ?? ''}');
  const transformed = afterListHook
    ? (
        await invokeHook(afterListHook, { result: items, model: '${model.name}' })
      ).result
    : items;

  return NextResponse.json({
    items: transformed,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
`;

  return {
    path,
    method: 'GET',
    handler: 'GET',
    code,
    model: model.name,
    operation: 'list',
  };
}

// ==============================================
// READ Handler
// ==============================================

function generateReadHandler(
  spec: JsonSpec,
  model: Model,
  path: string,
): GeneratedRoute {
  const tableName = modelToTableName(model.name);
  const isSoftDelete = model.softDelete !== false;
  const hooks = model.hooks ?? {};

  const softDeleteFilter = isSoftDelete ? `deletedAt: null,` : '';

  const code = `${HEADER_IMPORTS}

export async function ${'GET'}(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  ${permissionCheck(`${tableName}.read`)}

  const { id } = await params;

  const item = await prisma.${tableName}.findFirst({
    where: { id, ${softDeleteFilter} },
  });

  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // afterRead hook
  const afterReadHook = hookFn('${hooks.afterRead ?? ''}');
  const transformed = afterReadHook
    ? (
        await invokeHook(afterReadHook, { data: item, model: '${model.name}' })
      ).data
    : item;

  return NextResponse.json(transformed);
}
`;

  return {
    path,
    method: 'GET',
    handler: 'GET',
    code,
    model: model.name,
    operation: 'read',
  };
}

// ==============================================
// CREATE Handler
// ==============================================

function generateCreateHandler(
  spec: JsonSpec,
  model: Model,
  path: string,
): GeneratedRoute {
  const tableName = modelToTableName(model.name);
  const hooks = model.hooks ?? {};

  // Zod schema
  const zodFields = model.fields
    .map((f) => {
      return `  ${f.name}: ${zodType(f)}${f.validation?.required ? '' : '.optional()'},`;
    })
    .join('\n');

  const beforeCreateFn = hookFn(hooks.beforeCreate);
  const afterCreateFn = hookFn(hooks.afterCreate);

  const beforeCreateCall = beforeCreateFn
    ? `({ data } = await invokeHook('${beforeCreateFn}', { data, model: '${model.name}', ctx: { user: session.user } }));`
    : '';

  const afterCreateCall = afterCreateFn
    ? `await invokeHook('${afterCreateFn}', { result: created, model: '${model.name}', ctx: { user: session.user } });`
    : '';

  const code = `${HEADER_IMPORTS}

const ${model.name}CreateSchema = z.object({
${zodFields}
});

export async function ${'POST'}(request: NextRequest) {
  ${permissionCheck(`${tableName}.create`)}

  const body = await request.json();
  const parsed = ${model.name}CreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 });
  }

  let data = parsed.data;

  // beforeCreate hook
  ${beforeCreateCall}

  const created = await prisma.${tableName}.create({ data });

  // afterCreate hook
  ${afterCreateCall}

  return NextResponse.json(created, { status: 201 });
}
`;

  return {
    path,
    method: 'POST',
    handler: 'POST',
    code,
    model: model.name,
    operation: 'create',
  };
}

// ==============================================
// UPDATE Handler
// ==============================================

function generateUpdateHandler(
  spec: JsonSpec,
  model: Model,
  path: string,
): GeneratedRoute {
  const tableName = modelToTableName(model.name);
  const hooks = model.hooks ?? {};

  const zodFields = model.fields
    .map((f) => `  ${f.name}: ${zodType(f)}.optional(),`)
    .join('\n');

  const beforeUpdateFn = hookFn(hooks.beforeUpdate);
  const afterUpdateFn = hookFn(hooks.afterUpdate);

  const beforeUpdateCall = beforeUpdateFn
    ? `({ data } = await invokeHook('${beforeUpdateFn}', { id, data, existing, model: '${model.name}', ctx: { user: session.user } }));`
    : '';

  const afterUpdateCall = afterUpdateFn
    ? `await invokeHook('${afterUpdateFn}', { id, data: updated, existing, model: '${model.name}', ctx: { user: session.user } });`
    : '';

  const code = `${HEADER_IMPORTS}

const ${model.name}UpdateSchema = z.object({
${zodFields}
});

export async function ${'PATCH'}(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  ${permissionCheck(`${tableName}.update`)}

  const { id } = await params;
  const body = await request.json();
  const parsed = ${model.name}UpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 });
  }

  const existing = await prisma.${tableName}.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let data = parsed.data;

  // beforeUpdate hook
  ${beforeUpdateCall}

  const updated = await prisma.${tableName}.update({ where: { id }, data });

  // afterUpdate hook
  ${afterUpdateCall}

  return NextResponse.json(updated);
}
`;

  return {
    path,
    method: 'PATCH',
    handler: 'PATCH',
    code,
    model: model.name,
    operation: 'update',
  };
}

// ==============================================
// DELETE Handler
// ==============================================

function generateDeleteHandler(
  spec: JsonSpec,
  model: Model,
  path: string,
): GeneratedRoute {
  const tableName = modelToTableName(model.name);
  const hooks = model.hooks ?? {};
  const isSoftDelete = model.softDelete !== false;

  const beforeDeleteFn = hookFn(hooks.beforeDelete);
  const afterDeleteFn = hookFn(hooks.afterDelete);

  const beforeDeleteCall = beforeDeleteFn
    ? `await invokeHook('${beforeDeleteFn}', { id, existing, model: '${model.name}', ctx: { user: session.user } });`
    : '';

  const afterDeleteCall = afterDeleteFn
    ? `await invokeHook('${afterDeleteFn}', { id, existing, model: '${model.name}', ctx: { user: session.user } });`
    : '';

  // 軟刪除 vs 硬刪除
  const deleteOperation = isSoftDelete
    ? `await prisma.${tableName}.update({ where: { id }, data: { deletedAt: new Date() } });`
    : `await prisma.${tableName}.delete({ where: { id } });`;

  const code = `${HEADER_IMPORTS}

export async function ${'DELETE'}(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  ${permissionCheck(`${tableName}.delete`)}

  const { id } = await params;

  const existing = await prisma.${tableName}.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // beforeDelete hook
  ${beforeDeleteCall}

  // ${isSoftDelete ? '軟刪除' : '硬刪除'}
  ${deleteOperation}

  // afterDelete hook
  ${afterDeleteCall}

  return NextResponse.json({ success: true });
}
`;

  return {
    path,
    method: 'DELETE',
    handler: 'DELETE',
    code,
    model: model.name,
    operation: 'delete',
  };
}

// ==============================================
// CUSTOM ACTION Handler
// ==============================================

function generateActionHandler(
  spec: JsonSpec,
  model: Model,
  action: Action,
  path: string,
): GeneratedRoute {
  const tableName = modelToTableName(model.name);
  const implFn = parseHookReference(action.implementation);
  const permAction = action.requires?.permission ?? `${tableName}.update`;

  const code = `${HEADER_IMPORTS}

export async function ${'POST'}(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  ${permissionCheck(permAction)}

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  // Action endpoint — invoke the user-defined action function via hook SDK
  const result = await invokeHook(
    '${implFn}',
    { id, ...body },
    { user: session.user, entity: '${model.name}' }
  );

  return NextResponse.json(result);
}
`;

  return {
    path,
    method: 'POST',
    handler: 'POST',
    code,
    model: model.name,
    operation: 'action',
  };
}

// ==============================================
// Zod Type Mapper
// ==============================================

function zodType(field: Field): string {
  const t = field.type;
  switch (t) {
    case 'string':
    case 'text':
    case 'richText':
    case 'file':
    case 'image':
      return field.validation?.pattern
        ? `z.string().regex(/${field.validation.pattern}/)`
        : 'z.string()';
    case 'number':
    case 'decimal':
      return 'z.number()';
    case 'integer':
      return 'z.number().int()';
    case 'boolean':
      return 'z.boolean()';
    case 'datetime':
    case 'date':
      return 'z.coerce.date()';
    case 'time':
      return 'z.string()';
    case 'enum':
      if (field.validation?.enum && field.validation.enum.length > 0) {
        const values = field.validation.enum.map((v) => `'${v}'`).join(', ');
        return `z.enum([${values}])`;
      }
      return 'z.string()';
    case 'json':
      return 'z.unknown()';
    case 'reference':
      return 'z.string()';
    default:
      return 'z.unknown()';
  }
}

// ==============================================
// Main: JsonSpec → GeneratedRoute[]
// ==============================================

export function generateRouteHandlers(spec: JsonSpec): GeneratedRoute[] {
  const routes: GeneratedRoute[] = [];

  for (const model of spec.models) {
    const basePath = modelToRouteBase(spec, model.name);

    // CRUD 5 個 endpoint
    routes.push(generateListHandler(spec, model, basePath));
    routes.push(generateReadHandler(spec, model, `${basePath}/[id]`));
    routes.push(generateCreateHandler(spec, model, basePath));
    routes.push(generateUpdateHandler(spec, model, `${basePath}/[id]`));
    routes.push(generateDeleteHandler(spec, model, `${basePath}/[id]`));

    // Custom Actions
    for (const action of model.actions ?? []) {
      const actionPath = `${basePath}/[id]/actions/${action.name}`;
      routes.push(generateActionHandler(spec, model, action, actionPath));
    }
  }

  return routes;
}
