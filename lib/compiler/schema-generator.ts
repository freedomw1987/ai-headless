/**
 * ==============================================
 *  Schema Generator — JSON → Prisma
 * ==============================================
 *
 * 將 JsonSpec 轉換為 Prisma schema 字串
 * 對應：docs/prd/01-framework-core.md §2.2 FR-2.1
 */

import type {
  JsonSpec,
  Model,
  Field,
  FieldType,
  FieldValidation,
} from '@/lib/specs/json-spec.types';

// ==============================================
// 類型映射
// ==============================================

/**
 * JsonSpec FieldType → Prisma 類型（含 @db 註解）
 */
const TYPE_MAPPING: Record<FieldType, string> = {
  string: 'String',
  text: 'String',
  richText: 'String  @db.Text',
  number: 'Float',
  integer: 'Int',
  decimal: 'Decimal',
  boolean: 'Boolean',
  datetime: 'DateTime',
  date: 'DateTime  @db.Date',
  time: 'String',
  enum: 'String',
  json: 'Json',
  file: 'String',
  image: 'String',
  reference: 'String',
};

// ==============================================
// 預設值格式化
// ==============================================

function formatDefault(value: unknown, type: FieldType): string {
  if (value === undefined || value === null) return '';

  if (type === 'string' || type === 'text' || type === 'richText' || type === 'enum') {
    return `@default("${String(value).replace(/"/g, '\\"')}")`;
  }

  if (type === 'boolean') {
    return `@default(${value})`;
  }

  if (type === 'json') {
    return `@default("${JSON.stringify(value).replace(/"/g, '\\"')}")`;
  }

  return `@default(${value})`;
}

// ==============================================
// Field → Prisma Field
// ==============================================

interface PrismaFieldOptions {
  /** 跳過（不生成 Prisma 欄位）*/
  skip?: boolean;
  /** 強制 required（不加 ?）*/
  forceRequired?: boolean;
}

function fieldToPrisma(field: Field, options: PrismaFieldOptions = {}): string {
  const { skip = false, forceRequired = false } = options;
  if (skip) return '';

  const type = TYPE_MAPPING[field.type] ?? 'String';
  const validation: FieldValidation = field.validation ?? {};
  const hasDefault = validation.default !== undefined;

  // 判斷 required：顯式 required、有 default、或 unique
  const required =
    forceRequired ||
    validation.required === true ||
    hasDefault ||
    validation.unique === true;

  // Optional 加 ?
  const typeWithOptional = required ? type : addOptional(type);

  // 修飾符
  const modifiers: string[] = [];
  if (validation.unique) modifiers.push('@unique');

  const defaultValue = hasDefault
    ? formatDefault(validation.default, field.type)
    : '';
  if (defaultValue) modifiers.push(defaultValue);

  const modifierStr = modifiers.length > 0 ? '  ' + modifiers.join('  ') : '';

  return `${field.name}  ${typeWithOptional}${modifierStr}`;
}

function addOptional(type: string): string {
  return type.includes('?') ? type : `${type}?`;
}

// ==============================================
// Relation → Prisma Field
// ==============================================

function relationToPrismaFields(
  model: Model,
): { fkField: string; relationField: string } {
  const belongsToRelations = (model.relations ?? []).filter((r) => r.type === 'belongsTo');

  if (belongsToRelations.length === 0) {
    return { fkField: '', relationField: '' };
  }

  // 取第一個 belongsTo 關係（MVP 簡化：每個 model 只有一個 belongsTo）
  const relation = belongsToRelations[0]!;
  const fk = relation.foreignKey ?? `${camelCase(relation.model)}Id`;

  // 檢查用戶是否已在 fields 中定義了這個 FK 欄位
  const userDefinedFK = model.fields.some((f) => f.name === fk);

  const fkField = userDefinedFK ? '' : `${fk}  String?`;
  const relationField = `${camelCase(relation.model)}  ${relation.model}?  @relation(fields: [${fk}], references: [id])`;

  return { fkField, relationField };
}

/**
 * 生成反向關聯欄位
 *
 * 語義：「當前 model」是 「被指向的 model」（target）。
 * 當某個 otherModel.belongsTo model 時，model 上加 `otherModels  OtherModel[]`。
 */
function reverseRelationFields(model: Model, allModels: Model[]): string[] {
  const fieldsSet = new Set<string>();

  for (const otherModel of allModels) {
    for (const relation of otherModel.relations ?? []) {
      if (relation.model !== model.name) continue;

      // 某個 otherModel 指向我
      if (relation.type === 'belongsTo') {
        // otherModel.belongsTo 我 → 我上加指向 otherModel 的 array
        const otherPlural = camelCase(otherModel.name) + 's';
        fieldsSet.add(`${otherPlural}  ${otherModel.name}[]`);
      }
      // hasMany/hasOne 在 target 上不需要加反向（型別重複）
    }
  }

  return Array.from(fieldsSet);
}

function camelCase(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

// ==============================================
// Model → Prisma Model
// ==============================================

function modelToPrisma(model: Model, allModels: Model[]): string {
  const lines: string[] = [];

  // 標頭
  lines.push(`/// ${model.label ?? model.name}（AI 自動生成）`);
  lines.push(`model ${model.name} {`);

  // 系統欄位
  lines.push('  id  String  @id @default(cuid())');

  // 業務欄位
  const isSoftDelete = model.softDelete !== false;  // 預設 true
  let hasStatusField = false;

  for (const field of model.fields) {
    // 檢查是否已有 status 欄位
    if (field.name === 'status') hasStatusField = true;

    // 跳過已存在的 belongsTo 外鍵欄位（會由 relation 函數生成）
    const defaultFKs = (model.relations ?? [])
      .filter((r) => r.type === 'belongsTo')
      .map((r) => r.foreignKey ?? `${camelCase(r.model)}Id`);
    if (field.name.endsWith('Id') && defaultFKs.includes(field.name)) {
      continue;
    }

    const prismaLine = fieldToPrisma(field);
    if (prismaLine) lines.push('  ' + prismaLine);
  }

  // 自動加入 status 欄位（如有 workflow 且尚未有）
  if ((model.workflows?.length ?? 0) > 0 && !hasStatusField) {
    lines.push('  status  String?');
  }

  // Relations
  const { fkField, relationField } = relationToPrismaFields(model);
  if (fkField) lines.push('  ' + fkField);

  // 反向關聯
  for (const reverse of reverseRelationFields(model, allModels)) {
    lines.push('  ' + reverse);
  }

  if (relationField) lines.push('  ' + relationField);

  // 軟刪除
  if (isSoftDelete) {
    lines.push('  deletedAt  DateTime?');
  }

  // 時間戳
  lines.push('  createdAt  DateTime  @default(now())');
  lines.push('  updatedAt  DateTime  @updatedAt');

  // 結束
  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

// ==============================================
// 對應 relation 列表（給反向關聯用）
// ==============================================

// 已在 reverseRelationFields 中處理

// ==============================================
// Main: JsonSpec → Prisma Schema
// ==============================================

export function generatePrismaSchema(spec: JsonSpec): string {
  const parts: string[] = [];

  // Header
  parts.push('// ==============================================');
  parts.push('// 此文件由 ai-headless 自動生成');
  parts.push(`// Spec: ${spec.name} (${spec.label})`);
  parts.push(`// Models: ${spec.models.length}`);
  parts.push('// 不要手動修改！修改請改 JsonSpec，重新編譯');
  parts.push('// ==============================================');
  parts.push('');

  // Generator
  parts.push('generator client {');
  parts.push('  provider = "prisma-client-js"');
  parts.push('}');
  parts.push('');

  // Datasource
  parts.push('datasource db {');
  parts.push('  provider = "postgresql"');
  parts.push('  url      = env("DATABASE_URL")');
  parts.push('}');
  parts.push('');

  // Models
  for (const model of spec.models) {
    parts.push(modelToPrisma(model, spec.models));
  }

  return parts.join('\n');
}

// ==============================================
// 進階 API：附帶 schema 寫入檔案
// ==============================================

/**
 * 將 Prisma schema 寫入 .prisma 檔案
 *
 * 用於開發模式：把生成的 schema 附加到 prisma/schema.prisma
 */
export function appendPrismaSchema(
  spec: JsonSpec,
  existingSchema?: string,
): string {
  const generated = generatePrismaSchema(spec);

  // 加 marker 標明是 AI 生成區塊
  const block = `
// >>> AI-GENERATED: ${spec.name} (start)
${generated}
// <<< AI-GENERATED: ${spec.name} (end)
`;

  if (!existingSchema) {
    return block;
  }

  // 移除舊的同 spec 區塊
  const marker = new RegExp(
    `\\n// >>> AI-GENERATED: ${spec.name} \\(start\\)[\\s\\S]*?// <<< AI-GENERATED: ${spec.name} \\(end\\)\\n?`,
    'g',
  );
  const cleaned = existingSchema.replace(marker, '');
  return cleaned + block;
}
