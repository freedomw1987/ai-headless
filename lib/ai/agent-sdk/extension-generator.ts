/**
 * Sprint 52 Stage 52-1 (FR-19.2) — Extension Generator 設計
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.14 (FR-19.2)
 * 對應 Plan Gate: docs/sprint52-plan-gate.md
 * 對應 Spike: docs/spike/sprint52-ai-extension-gen.md
 *
 * 設計:
 * - 提供 AI 生成 extension 的 prompt 模板
 * - 提供 manifest schema Zod 驗證
 * - 提供 spec schema Zod 驗證
 * - 不實際執行 AI 生成 (Sprint 52-2 實作)
 *
 * 沿用既有:
 * - extension-loader.ts 的 ExtensionManifestSchema (Sprint 12+)
 * - z.object 模式 (全專案統一)
 */

import { z } from 'zod';

// ==============================================
// Extension Spec Schema (Sprint 52 新增)
// ==============================================

/**
 * Field type: string | text | boolean | datetime | enum | number
 */
const FieldTypeSchema = z.enum([
  'string',
  'text',
  'boolean',
  'datetime',
  'enum',
  'number',
]);

const FieldSchema = z.object({
  name: z.string().regex(/^[a-z][a-zA-Z0-9]*$/, 'Field name must be camelCase'),
  type: FieldTypeSchema,
  label: z.string(),
  validation: z
    .object({
      required: z.boolean().optional(),
      min: z.number().optional(),
      max: z.number().optional(),
      default: z.unknown().optional(),
      enum: z.array(z.string()).optional(),
    })
    .optional(),
  list: z.object({ defaultVisible: z.boolean().optional() }).optional(),
});

const ComputedFieldSchema = z.object({
  name: z.string(),
  type: FieldTypeSchema,
  label: z.string(),
  compute: z.string(), // e.g. "{{fn:remainingDays}}"
});

const HookSpecSchema = z.object({
  beforeCreate: z.string().optional(), // e.g. "{{fn:beforeCreate}}"
  afterCreate: z.string().optional(),
  beforeUpdate: z.string().optional(),
  afterUpdate: z.string().optional(),
});

const ActionSpecSchema = z.object({
  name: z.string().regex(/^[a-z][a-zA-Z0-9]*$/, 'Action name must be camelCase'),
  label: z.string(),
  input: z.array(z.string()).optional(),
  implementation: z.string(), // e.g. "{{fn:complete}}"
});

const ModelSchema = z.object({
  name: z.string().regex(/^[A-Z][a-zA-Z0-9]*$/, 'Model name must be PascalCase'),
  label: z.string(),
  description: z.string().optional(),
  fields: z.array(FieldSchema).min(1),
  computed: z.array(ComputedFieldSchema).optional(),
  hooks: HookSpecSchema.optional(),
  actions: z.array(ActionSpecSchema).optional(),
  softDelete: z.boolean().optional(),
});

const ExtensionSpecSchema = z.object({
  name: z.string().regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/, 'Extension name must be kebab-case'),
  label: z.string(),
  requiresExtension: z.string().optional(),
  list: z
    .object({
      allowColumnToggle: z.boolean().optional(),
      defaultColumns: z.array(z.string()).optional(),
      views: z
        .array(
          z.object({
            type: z.string(),
            label: z.string(),
            primaryField: z.string().optional(),
            groupByField: z.string().optional(),
            dateField: z.string().optional(),
          }),
        )
        .optional(),
    })
    .optional(),
  models: z.array(ModelSchema).min(1),
});

export type ExtensionSpec = z.infer<typeof ExtensionSpecSchema>;

/**
 * FR-19.2: 驗證 AI 生成的 spec.json
 */
export function validateExtensionSpec(input: unknown): ExtensionSpec {
  const result = ExtensionSpecSchema.safeParse(input);
  if (!result.success) {
    throw new Error(
      `Invalid ExtensionSpec: ${result.error.issues.map((i) => i.message).join(', ')}`,
    );
  }
  return result.data;
}

// ==============================================
// Extension Generator Prompt 模板 (FR-19.2)
// ==============================================

/**
 * FR-19.2: 系統 prompt 給 pi agent 用
 * 對應 spike §4.1
 */
export const EXTENSION_GENERATOR_SYSTEM_PROMPT = `你是 extension generator。根據 admin 的需求, 在 extensions/<name>/ 目錄下生成以下 8 個檔案:

1. \`manifest.json\`: 參考 \`extensions/todo/manifest.json\` 結構
2. \`<name>-spec.json\`: 參考 \`extensions/todo/todo-spec.json\` 結構, 包含 models (fields 為 admin 指定的 fields)
3. \`hooks/beforeCreate.ts\`: 簡單預設值設定
4. \`actions/complete.ts\`: 簡單狀態切換 (若 model 有 completed field)
5. \`computed/remainingDays.ts\`: 計算剩餘天數 (若 model 有 dueDate field)
6. \`workflow/<name>-workflow.ts\`: 簡單狀態機 (draft → published)
7. \`examples/list-and-filter.ts\`: 簡單 API 呼叫範例
8. \`README.md\`: 簡單 markdown 說明

限制:
- 只能寫入 \`extensions/<name>/\` 目錄 (path 防護)
- 不能修改其他檔案
- 每個檔案必須符合 extension-loader schema
- 使用 \`write_file(path, content)\` tool call 寫檔

回應格式: 每個檔案一個 tool call, 寫完所有檔案後回傳 success 訊息。`;

/**
 * FR-19.2: User prompt 模板 (admin 輸入 → AI 處理)
 */
export interface ExtensionGeneratorInput {
  name: string;
  fields?: string[]; // e.g. ['name', 'price', 'stock']
  force?: boolean; // 允許覆寫既有
}

export function buildExtensionGeneratorPrompt(
  input: ExtensionGeneratorInput,
): string {
  const fieldsList = input.fields?.join(', ') ?? 'title, description';
  return `請建立一個 extension:
- 名稱: ${input.name}
- 欄位: ${fieldsList}
${input.force ? '- 允許覆寫既有 extension' : ''}

請生成 8 個檔案到 \`extensions/${input.name}/\` 目錄。`;
}

// ==============================================
// Slash Command 解析 (FR-19.3)
// ==============================================

/**
 * FR-19.3: 解析 /extension create <name> [--fields=f1,f2,...] [--force]
 */
export interface ParsedExtensionCommand {
  action: 'create' | 'help';
  name?: string;
  fields?: string[];
  force?: boolean;
}

export function parseExtensionCommand(input: string): ParsedExtensionCommand {
  const trimmed = input.trim();

  // 必須是 /extension 開頭
  if (!trimmed.startsWith('/extension')) {
    throw new Error('Not an extension command');
  }

  const parts = trimmed.split(/\s+/);
  // parts[0] = '/extension'
  if (parts.length < 2) {
    return { action: 'help' };
  }

  const action = parts[1] as 'create' | 'help';
  if (action !== 'create') {
    throw new Error(`Unknown action: ${action}. Supported: create`);
  }

  // parts[2] = name
  if (!parts[2]) {
    throw new Error('Extension name required: /extension create <name>');
  }
  const name = parts[2];

  // 解析 flags
  let fields: string[] | undefined;
  let force = false;
  for (const part of parts.slice(3)) {
    if (part.startsWith('--fields=')) {
      fields = part.slice('--fields='.length).split(',').map((s) => s.trim());
    } else if (part === '--force') {
      force = true;
    }
  }

  return { action: 'create', name, fields, force };
}

/**
 * FR-19.3: 判斷是否為 extension command
 */
export function isExtensionCommand(input: string): boolean {
  return input.trim().startsWith('/extension');
}