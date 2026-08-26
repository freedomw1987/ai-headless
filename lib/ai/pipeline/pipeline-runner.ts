/**
 * ==============================================
 *  AI Pipeline Runner — Sprint 14 Runtime 版
 * ==============================================
 *
 * 對應：docs/prd/01-framework-core.md §4 + docs/prd/06-ai-chat.md
 *
 * Pipeline = 一連串有序的 Stage
 * - 每個 Stage 接受上一個的輸出，產出下一個的輸入
 * - 支援 dry-run（不執行副作用）
 * - 錯誤時中斷，保留 history
 *
 * Sprint 14 改造：
 * - 移除 lib/compiler/ 依賴
 * - 各 stage 改為「指向 runtime」而非「產生 source code」
 * - runtime handler 已就緒 → pipeline 記錄就緒狀態
 *
 * Stage 流程：
 *   ai-spec → schema → api → ui → rbac
 */

import type { JsonSpec, Model } from '@/lib/specs/json-spec.types';
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

export type PipelineStage<TIn = unknown, TOut = unknown> = {
  name: string;
  run: (input: TIn, ctx: PipelineContext) => Promise<TOut>;
  /** 條件跳過（返回 true 時整個 stage 不執行） */
  shouldSkip?: (input: unknown, ctx: PipelineContext) => boolean;
};

export type StageHistoryEntry = {
  stage: string;
  input: unknown;
  output?: unknown;
  value?: unknown; // alias for output (向後兼容)
  error?: Error;
};

export type PipelineResult<T> = {
  value?: T;
  error?: PipelineStageError;
  history: StageHistoryEntry[];
};

/** Pipeline stage 錯誤（附 stage 名稱） */
export class PipelineStageError extends Error {
  readonly stage: string;
  constructor(stage: string, cause: unknown) {
    const message = cause instanceof Error ? cause.message : String(cause);
    super(message);
    this.name = 'PipelineStageError';
    this.stage = stage;
  }
}

// ==============================================
// Pipeline 引擎
// ==============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createPipeline(...stages: Array<PipelineStage<any, any>>): PipelineStage[] {
  return stages as PipelineStage[];
}

export async function runPipeline<TInitial, TFinal>(
  pipeline: PipelineStage[],
  initialInput: TInitial,
  ctx?: Omit<PipelineContext, 'state'> & { state?: PipelineState },
): Promise<PipelineResult<TFinal>> {
  const fullCtx: PipelineContext = {
    dryRun: ctx?.dryRun ?? false,
    state: ctx?.state ?? {},
    userId: ctx?.userId,
    cwd: ctx?.cwd,
  };
  const history: StageHistoryEntry[] = [];
  let currentInput: unknown = initialInput;

  for (const stage of pipeline) {
    if (stage.shouldSkip?.(currentInput, fullCtx)) {
      history.push({
        stage: stage.name,
        input: currentInput,
        output: currentInput, // skip 時 output = input
        value: currentInput,
      });
      continue;
    }
    try {
      const output = await stage.run(currentInput, fullCtx);
      history.push({
        stage: stage.name,
        input: currentInput,
        output,
        value: output,
      });
      currentInput = output;
    } catch (e) {
      const err = new PipelineStageError(stage.name, e);
      // 不 push error entry — history 只記錄已成功的 stage
      return { value: null as unknown as TFinal, error: err, history };
    }
  }

  return { value: currentInput as TFinal, history };
}

// ==============================================
// Stage 1: AI Spec（自然語言 → JsonSpec）
// ==============================================

export function aiSpecStage(
  getSpec: (input: string) => Promise<JsonSpec> | JsonSpec,
): PipelineStage<string, { spec: JsonSpec }> {
  return {
    name: 'ai-spec',
    run: async (input: string) => {
      const spec = await getSpec(input);
      // 合併 relations（內部處理，spec 對外是完整的）
      const merged = mergeRelationsInSpec(spec);
      return { spec: merged };
    },
  };
}

// ==============================================
// Stage 2: Schema（Runtime 不再產 Prisma schema）
// ==============================================

export function schemaStage(): PipelineStage<{ spec: JsonSpec }, { spec: JsonSpec; message: string }> {
  return {
    name: 'schema',
    run: async (input: { spec: JsonSpec }) => {
      if (!input?.spec) throw new Error('schemaStage: input is not a JsonSpec');
      return {
        spec: input.spec,
        message:
          `Sprint 14: Prisma schema 由 prisma/schema.prisma 手動維護，runtime dynamic CRUD 直接讀 model。`,
      };
    },
  };
}

// ==============================================
// Stage 3: API（指向 runtime handler）
// ==============================================

export type ApiStageOutput = {
  spec: JsonSpec;
  endpoint: string;
  runtimeReady: true;
};

export function apiStage(): PipelineStage<{ spec: JsonSpec }, ApiStageOutput> {
  return {
    name: 'api',
    run: async (input: { spec: JsonSpec }) => {
      if (!input?.spec) throw new Error('apiStage: input invalid');
      return {
        spec: input.spec,
        endpoint: `/api/crud/${input.spec.name}`,
        runtimeReady: true,
      };
    },
  };
}

// ==============================================
// Stage 4: UI（指向 runtime dynamic page）
// ==============================================

export type UiStageOutput = {
  spec: JsonSpec;
  path: string;
  runtimeReady: true;
};

export function uiStage(): PipelineStage<ApiStageOutput, UiStageOutput> {
  return {
    name: 'ui',
    run: async (input: ApiStageOutput) => {
      if (!input?.spec) throw new Error('uiStage: input invalid');
      return {
        spec: input.spec,
        path: `/admin/crud/${input.spec.name}`,
        runtimeReady: true,
      };
    },
  };
}

// ==============================================
// Stage 5: RBAC（用 RBAC matrix 推導權限）
// ==============================================

export type RbacStageOutput = {
  spec: JsonSpec;
  permissions: string[];
  runtimeReady: true;
};

export function rbacStage(): PipelineStage<UiStageOutput, RbacStageOutput> {
  return {
    name: 'rbac',
    run: async (input: UiStageOutput) => {
      if (!input?.spec) throw new Error('rbacStage: input invalid');
      return {
        spec: input.spec,
        permissions: derivePermissions(input.spec),
        runtimeReady: true,
      };
    },
  };
}

// ==============================================
// Internal：RBAC 推導
// ==============================================

function derivePermissions(spec: JsonSpec): string[] {
  const permissions: string[] = [];
  for (const _model of spec.models) {
    permissions.push(`${spec.name}.create`);
    permissions.push(`${spec.name}.read`);
    permissions.push(`${spec.name}.update`);
    permissions.push(`${spec.name}.delete`);
  }
  return permissions;
}

// ==============================================
// 預設完整 pipeline
// ==============================================

export function createDefaultPipeline(getSpec: (input: string) => Promise<JsonSpec> | JsonSpec) {
  return createPipeline(
    aiSpecStage(getSpec),
    schemaStage(),
    apiStage(),
    uiStage(),
    rbacStage(),
  );
}

// Helper for type guard
function _isModel(m: unknown): m is Model {
  return typeof m === 'object' && m !== null && 'fields' in m;
}
void _isModel;