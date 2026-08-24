/**
 * ==============================================
 *  AI Pipeline Runner — Stage-based Orchestrator
 * ==============================================
 *
 * 對應：docs/prd/01-framework-core.md §4 + docs/prd/06-ai-chat.md
 *
 * Pipeline = 一連串有序的 Stage
 * - 每個 Stage 接受上一個的輸出，產出下一個的輸入
 * - 支援 dry-run（不執行副作用）
 * - 錯誤時中斷，保留 history
 * - 預設 5 Stage：AI Spec → Schema → API → UI → RBAC
 */

import { generatePrismaSchema } from '@/lib/compiler/schema-generator';
import { generateRouteHandlers } from '@/lib/compiler/api-generator';
import { generateUIPages } from '@/lib/compiler/ui-generator';
import {
  generateRBACConfig,
  generateCheckPermissionSource,
} from '@/lib/compiler/permission-generator';
import type { JsonSpec } from '@/lib/specs/json-spec.types';
import { mergeRelationsInSpec } from '@/lib/specs/relation-merge';

// ==============================================
// 公開類型
// ==============================================

export type PipelineState = Record<string, unknown>;

export type PipelineContext = {
  /** 用戶 ID */
  userId?: string;
  /** 是否 dry-run（不執行寫檔等副作用） */
  dryRun?: boolean;
  /** 工作目錄（預設 process.cwd()） */
  cwd?: string;
  /** 累積狀態（Stage 間共享） */
  state: PipelineState;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PipelineStage<TIn = any, TOut = any> = {
  /** Stage 名稱（用於 log / error） */
  name: string;
  /** 執行邏輯 */
  run: (input: TIn, ctx: PipelineContext) => Promise<TOut>;
  /** 是否跳過（返回 true 時不執行 run） */
  shouldSkip?: (input: TIn, ctx: PipelineContext) => boolean;
};

export type PipelineHistoryEntry = {
  stage: string;
  value: unknown;
  timestamp: number;
  skipped?: boolean;
};

export type PipelineResult<TFinal = unknown> = {
  /** 最終輸出（成功時） */
  value: TFinal | null;
  /** 每個 Stage 的歷史記錄 */
  history: PipelineHistoryEntry[];
  /** 錯誤（失敗時） */
  error?: {
    stage: string;
    message: string;
    cause?: Error;
  };
};

export type Pipeline<TSteps extends ReadonlyArray<PipelineStage> = ReadonlyArray<PipelineStage>> = {
  stages: TSteps;
};

// ==============================================
// Pipeline Builder
// ==============================================

/**
 * 將多個 Stage 鏈接成 Pipeline
 *
 * 透過 variadic tuple types 強制 type chain：
 * stage[N+1].TIn === stage[N].TOut
 *
 * 不匹配時 type error。
 */
export function createPipeline<TStages extends ReadonlyArray<PipelineStage>>(
  ...stages: TStages
): Pipeline<TStages> {
  return { stages };
}

// ==============================================
// Pipeline Runner
// ==============================================

export async function runPipeline<TIn = unknown, TFinal = unknown>(
  pipeline: Pipeline,
  initialInput: TIn,
  ctxInit: Partial<Omit<PipelineContext, 'state'>> = {},
): Promise<PipelineResult<TFinal>> {
  const ctx: PipelineContext = {
    ...ctxInit,
    state: {},
  };

  const history: PipelineHistoryEntry[] = [];
  let current: unknown = initialInput;

  for (const stage of pipeline.stages) {
    try {
      // 檢查是否跳過
      const shouldSkip = stage.shouldSkip?.(current as never, ctx) ?? false;

      if (shouldSkip) {
        history.push({
          stage: stage.name,
          value: current,
          timestamp: Date.now(),
          skipped: true,
        });
        continue;
      }

      // 執行
      const output = await stage.run(current as never, ctx);

      history.push({
        stage: stage.name,
        value: output,
        timestamp: Date.now(),
      });

      current = output;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      return {
        value: null,
        history,
        error: {
          stage: stage.name,
          message: error.message,
          cause: error,
        },
      };
    }
  }

  return {
    value: current as TFinal,
    history,
  };
}

// ==============================================
// Helpers
// ==============================================

function isJsonSpec(v: unknown): v is JsonSpec {
  return typeof v === 'object' && v !== null && 'models' in v;
}

// ==============================================
// 預設 Stage 工廠
// ==============================================

/**
 * Stage 1: AI 生成 JsonSpec
 *
 * @param getSpec 自然語言 → JsonSpec 的函式（通常呼叫 OpenAI / Anthropic）
 */
export function aiSpecStage(getSpec: (input: string) => Promise<JsonSpec> | JsonSpec): PipelineStage {
  return {
    name: 'ai-spec',
    run: async (input) => {
      const spec = await getSpec(String(input));
      // TD-305: 統一 field.relation / model.relations 二元性
      return mergeRelationsInSpec(spec);
    },
  };
}

/**
 * Stage 2: Schema Generator（JsonSpec → Prisma Schema）
 */
export function schemaStage(): PipelineStage {
  return {
    name: 'schema',
    run: async (input: unknown) => {
      if (!isJsonSpec(input)) throw new Error('schemaStage: input is not a JsonSpec');
      return {
        spec: input,
        prismaSchema: generatePrismaSchema(input),
      };
    },
  };
}

/**
 * Stage 3: API Generator（JsonSpec → REST routes）
 */
export function apiStage(): PipelineStage {
  return {
    name: 'api',
    run: async (input: unknown) => {
      const obj = input as { spec: JsonSpec; prismaSchema: string };
      if (!obj?.spec) throw new Error('apiStage: input invalid');
      return {
        ...obj,
        apiRoutes: generateRouteHandlers(obj.spec),
      };
    },
  };
}

/**
 * Stage 4: UI Generator（JsonSpec → CRUD pages）
 */
export function uiStage(): PipelineStage {
  return {
    name: 'ui',
    run: async (input: unknown) => {
      const obj = input as { spec: JsonSpec; prismaSchema: string; apiRoutes: unknown[] };
      if (!obj?.spec) throw new Error('uiStage: input invalid');
      return {
        ...obj,
        uiPages: generateUIPages(obj.spec),
      };
    },
  };
}

/**
 * Stage 5: RBAC Generator（JsonSpec → RBAC config + checkPermission source）
 */
export function rbacStage(): PipelineStage {
  return {
    name: 'rbac',
    run: async (input: unknown) => {
      const obj = input as { spec: JsonSpec };
      if (!obj?.spec) throw new Error('rbacStage: input invalid');
      const rbac = generateRBACConfig(obj.spec);
      const rbacSource = generateCheckPermissionSource(obj.spec);
      return {
        ...obj,
        rbac,
        rbacSource,
      };
    },
  };
}

/**
 * 預設完整 pipeline（自然語言 → 完整編譯產物）
 */
export function createDefaultPipeline(getSpec: (input: string) => Promise<JsonSpec> | JsonSpec) {
  return createPipeline(
    aiSpecStage(getSpec),
    schemaStage(),
    apiStage(),
    uiStage(),
    rbacStage(),
  );
}