/**
 * ==============================================
 *  JSON Spec Zod Schemas
 * ==============================================
 *
 * 用途：用 Zod 在 runtime 校驗 JSON 規範
 * 對應：lib/specs/json-spec.types.ts
 * 規範：docs/specs/json-spec.md
 *
 * 為什麼要 Zod？
 * - TypeScript types 只在編譯期生效
 * - AI 生成的 JSON 規範需要 runtime 校驗
 * - Zod 同時提供 TS types（z.infer）
 */

import { z } from 'zod';

// ==============================================
// 基礎 Schemas
// ==============================================

const hookReferenceSchema = z
  .string()
  .regex(/^\{\{fn:[a-zA-Z_][a-zA-Z0-9_]*\}\}$/, {
    message: 'Hook 引用格式必須為 {{fn:函數名稱}}',
  });

const fieldTypeSchema = z.enum([
  'string',
  'text',
  'richText',
  'number',
  'integer',
  'decimal',
  'boolean',
  'datetime',
  'date',
  'time',
  'enum',
  'json',
  'file',
  'image',
  'reference',
]);

const fieldValidationSchema = z
  .object({
    required: z.boolean().optional(),
    unique: z.boolean().optional(),
    maxLength: z.number().int().positive().optional(),
    minLength: z.number().int().nonnegative().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    enum: z.array(z.string()).optional(),
    default: z.unknown().optional(),
  })
  .strict();

const fieldUISchema = z
  .object({
    list: z.boolean().optional(),
    form: z.boolean().optional(),
    searchable: z.boolean().optional(),
    sortable: z.boolean().optional(),
    badge: z.boolean().optional(),
    widget: z
      .enum(['input', 'textarea', 'editor', 'select', 'date', 'switch', 'file', 'image'])
      .optional(),
    order: z.number().int().optional(),
    width: z.string().optional(),
    help: z.string().optional(),
  })
  .strict();

const fieldSchema = z
  .object({
    name: z
      .string()
      .regex(/^[a-z][a-zA-Z0-9_]*$/, '欄位名必須以小寫字母開頭，只含字母數字底線'),
    type: fieldTypeSchema,
    label: z.string().optional(),
    description: z.string().optional(),
    validation: fieldValidationSchema.optional(),
    ui: fieldUISchema.optional(),
  })
  .strict();

// ==============================================
// Computed Field
// ==============================================

const computedFieldSchema = z
  .object({
    name: z.string().regex(/^[a-z][a-zA-Z0-9_]*$/),
    type: fieldTypeSchema,
    compute: hookReferenceSchema,
    dependencies: z.array(z.string()).optional(),
    label: z.string().optional(),
    description: z.string().optional(),
  })
  .strict();

// ==============================================
// Relation
// ==============================================

const relationSchema = z
  .object({
    type: z.enum(['belongsTo', 'hasOne', 'hasMany', 'manyToMany']),
    model: z.string(),
    foreignKey: z.string().optional(),
    through: z.string().optional(),
    onDelete: z.enum(['Cascade', 'SetNull', 'Restrict']).optional(),
  })
  .strict();

// ==============================================
// Hooks
// ==============================================

const hooksSchema = z
  .object({
    beforeCreate: hookReferenceSchema.optional(),
    afterCreate: hookReferenceSchema.optional(),
    beforeUpdate: hookReferenceSchema.optional(),
    afterUpdate: hookReferenceSchema.optional(),
    beforeDelete: hookReferenceSchema.optional(),
    afterDelete: hookReferenceSchema.optional(),
    onTransition: hookReferenceSchema.optional(),
    beforeList: hookReferenceSchema.optional(),
    afterList: hookReferenceSchema.optional(),
    beforeRead: hookReferenceSchema.optional(),
    afterRead: hookReferenceSchema.optional(),
  })
  .strict();

// ==============================================
// Action
// ==============================================

const actionSchema = z
  .object({
    name: z.string().regex(/^[a-z][a-zA-Z0-9_]*$/),
    label: z.string().min(1),
    description: z.string().optional(),
    implementation: hookReferenceSchema,
    confirmation: z.string().optional(),
    requires: z
      .object({
        state: z.array(z.string()).optional(),
        permission: z.string().optional(),
      })
      .optional(),
    icon: z.string().optional(),
    variant: z.enum(['default', 'danger', 'primary']).optional(),
  })
  .strict()
  .refine((action) => /^[a-z][a-zA-Z0-9_]*$/.test(action.name), {
    message: 'Action 名必須符合 [a-z][a-zA-Z0-9_]*',
  });

// ==============================================
// Workflow
// ==============================================

const stateConfigSchema = z
  .object({
    label: z.string().min(1),
    description: z.string().optional(),
    badge: z.enum(['default', 'success', 'warning', 'danger']).optional(),
    allowedActions: z.array(z.string()).optional(),
    onEnter: hookReferenceSchema.optional(),
    onExit: hookReferenceSchema.optional(),
  })
  .strict();

const transitionSchema = z
  .object({
    from: z.union([z.string(), z.array(z.string()).min(1)]),
    to: z.string(),
    guard: hookReferenceSchema.optional(),
    effect: hookReferenceSchema.optional(),
    requires: z
      .object({
        permission: z.string().optional(),
      })
      .optional(),
  })
  .strict();

const workflowSchema = z
  .object({
    name: z.string().regex(/^[a-z][a-zA-Z0-9_]*$/),
    initialState: z.string().min(1),
    states: z.record(z.string(), stateConfigSchema),
    transitions: z.array(transitionSchema),
  })
  .strict();

// ==============================================
// Model
// ==============================================

const modelSchema = z
  .object({
    name: z.string().regex(/^[A-Z][a-zA-Z0-9]*$/, 'Model 名必須 PascalCase'),
    label: z.string().optional(),
    description: z.string().optional(),
    fields: z.array(fieldSchema).min(1),
    computed: z.array(computedFieldSchema).optional(),
    relations: z.array(relationSchema).optional(),
    hooks: hooksSchema.optional(),
    actions: z.array(actionSchema).optional(),
    workflows: z.array(workflowSchema).optional(),
    softDelete: z.boolean().optional(),
    order: z.number().int().optional(),
  })
  .strict();

// ==============================================
// Permission
// ==============================================

const permissionSchema = z
  .object({
    action: z.string().regex(/^[a-z]+\.[a-z]+$/, 'Action 格式：{model}.{operation}'),
    roles: z.array(z.string()).min(1),
    description: z.string().optional(),
  })
  .strict();

// ==============================================
// UI
// ==============================================

const menuConfigSchema = z
  .object({
    label: z.string().min(1),
    icon: z.string().optional(),
    path: z.string().regex(/^\/[a-z0-9-/]*$/),
    order: z.number().int().optional(),
  })
  .strict();

// ==============================================
// Sprint 33: View schema
// ==============================================

const viewSchema = z
  .object({
    type: z.enum(['table', 'todo-list', 'kanban', 'calendar', 'gallery']),
    label: z.string().min(1),
    icon: z.string().optional(),
    primaryField: z.string().optional(),
    secondaryFields: z.array(z.string()).optional(),
    // kanban 需 groupByField
    groupByField: z.string().optional(),
    // calendar 需 dateField
    dateField: z.string().optional(),
    // gallery 需 imageField
    imageField: z.string().optional(),
    default: z.boolean().optional(),
  })
  .strict()
  .refine(
    (v) => {
      // kanban 必須有 groupByField
      if (v.type === 'kanban' && !v.groupByField) return false;
      // calendar 必須有 dateField
      if (v.type === 'calendar' && !v.dateField) return false;
      // gallery 必須有 imageField
      if (v.type === 'gallery' && !v.imageField) return false;
      return true;
    },
    { message: 'kanban view 需 groupByField / calendar view 需 dateField / gallery view 需 imageField' },
  );

const pageConfigSchema = z
  .object({
    columns: z.array(z.string()).optional(),
    defaultSort: z
      .object({
        field: z.string(),
        order: z.enum(['asc', 'desc']),
      })
      .optional(),
    pageSize: z.number().int().positive().optional(),
    filters: z.array(z.string()).optional(),
    // Sprint 33: 多 view 支援
    views: z.array(viewSchema).optional(),
  })
  .strict();

const uiConfigSchema = z
  .object({
    menu: menuConfigSchema.optional(),
    pages: z
      .object({
        list: pageConfigSchema.optional(),
        detail: pageConfigSchema.optional(),
        form: pageConfigSchema.optional(),
      })
      .optional(),
  })
  .strict();

// ==============================================
// JsonSpec（頂層）
// ==============================================

export const jsonSpecSchema = z
  .object({
    name: z
      .string()
      .regex(/^[a-z0-9-]+$/, '名稱只能含小寫字母、數字、連字號'),
    label: z.string().min(1),
    description: z.string().optional(),
    version: z
      .string()
      .regex(/^\d+\.\d+\.\d+$/)
      .optional(),
    models: z.array(modelSchema).min(1),
    ui: uiConfigSchema.optional(),
    permissions: z.array(permissionSchema).optional(),
    hooks: hooksSchema.optional(),
    actions: z.array(actionSchema).optional(),
    tags: z.array(z.string()).optional(),
  })
  .strict()
  .superRefine((spec, ctx) => {
    // 1. Model 名不可重複
    const modelNames = new Set<string>();
    for (const model of spec.models) {
      if (modelNames.has(model.name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Model 名重複：${model.name}`,
        });
      }
      modelNames.add(model.name);
    }

    // 2. 同一 Model 內 Field 名不可重複
    for (const model of spec.models) {
      const fieldNames = new Set<string>();
      for (const field of model.fields) {
        if (fieldNames.has(field.name)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${model.name} 內欄位名重複：${field.name}`,
          });
        }
        fieldNames.add(field.name);
      }
    }

    // 3. Relation 引用的 Model 必須存在
    const allModelNames = new Set(spec.models.map((m) => m.name));
    for (const model of spec.models) {
      for (const relation of model.relations ?? []) {
        if (!allModelNames.has(relation.model)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${model.name} 引用的 relation "${relation.model}" 不存在`,
          });
        }
      }
    }

    // 4. Workflow 必須引用定義的 state
    for (const model of spec.models) {
      for (const workflow of model.workflows ?? []) {
        const stateNames = new Set(Object.keys(workflow.states));

        if (!stateNames.has(workflow.initialState)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${model.name}.workflows.${workflow.name}: initialState "${workflow.initialState}" 未定義`,
          });
        }

        for (const transition of workflow.transitions) {
          const fromStates = Array.isArray(transition.from) ? transition.from : [transition.from];
          for (const from of fromStates) {
            if (!stateNames.has(from)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `${model.name}.workflows.${workflow.name}: transition from "${from}" 未定義`,
              });
            }
          }
          if (!stateNames.has(transition.to)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `${model.name}.workflows.${workflow.name}: transition to "${transition.to}" 未定義`,
            });
          }
        }
      }
    }
  });

// ==============================================
// Inferred Types（從 Zod schema 推導）
// ==============================================

export type JsonSpecZ = z.infer<typeof jsonSpecSchema>;
export type ModelZ = z.infer<typeof modelSchema>;
export type FieldZ = z.infer<typeof fieldSchema>;
