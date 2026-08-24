/**
 * ==============================================
 *  Workflow Engine — 狀態機 / 審批流程
 * ==============================================
 *
 * 對應：
 * - docs/specs/json-spec.md §3.8 (Workflows)
 * - docs/prd/08-workflow.md (M1-WS)
 *
 * Workflow 是 Extension / JSON 規範定義的狀態機：
 * - 訂單：draft → pending_payment → paid → shipped → completed
 * - 審批：draft → pending_review → approved / rejected
 * - 文件：draft → review → published → archived
 *
 * 設計重點：
 * 1. Workflow 定義與執行分離（Definition = JSON，Runtime = TS）
 * 2. Guard / Effect / onEnter / onExit 透過 registry 解析（與 Hook SDK 同模式）
 * 3. StateMachine 是純函數（無副作用），副作用由 caller 提供 effectRegistry
 * 4. 所有轉換都記錄 TransitionLog（不可變審計追蹤）
 */

import { resolveHookName } from '@/lib/hooks/hook-sdk';

// ==============================================
// 1. Workflow Definition Types
// ==============================================

export type StateBadge = 'default' | 'success' | 'warning' | 'danger';

export type StateConfig = {
  /** 顯示文字 */
  label: string;
  /** 描述 */
  description?: string;
  /** 徽章顏色 */
  badge?: StateBadge;
  /** 此狀態下可用的 action 名稱 */
  allowedActions?: string[];
  /** 進入此狀態時執行的 hook */
  onEnter?: string;
  /** 離開此狀態時執行的 hook */
  onExit?: string;
};

export type Transition = {
  /** 源狀態（單個或多個） */
  from: string | string[];
  /** 目標狀態 */
  to: string;
  /** 條件檢查（返回 boolean） */
  guard?: string;
  /** 轉換後執行 */
  effect?: string;
  /** 需要的權限 */
  requires?: {
    permission?: string;
  };
};

export type Workflow = {
  /** 唯一名稱 */
  name: string;
  /** 初始狀態 */
  initialState: string;
  /** 所有狀態定義 */
  states: Record<string, StateConfig>;
  /** 所有轉換定義 */
  transitions: Transition[];
};

// ==============================================
// 2. Transition Log
// ==============================================

export type TransitionLog = {
  /** 唯一 ID（可選，DB 持久化時填入） */
  id?: string;
  /** 所屬 entity */
  entityType: string;
  entityId: string;
  /** 源狀態 */
  fromState: string;
  /** 目標狀態 */
  toState: string;
  /** 觸發者 */
  triggeredBy?: string;
  /** 觸發時間 */
  timestamp: Date;
  /** 額外 metadata */
  metadata?: Record<string, unknown>;
};

// ==============================================
// 3. Transition Context
// ==============================================

export type TransitionContext = {
  /** 當前 entity ID */
  entityId: string;
  /** 當前 entity type */
  entityType?: string;
  /** 觸發者 */
  triggeredBy?: string;
  /** 額外 metadata */
  metadata?: Record<string, unknown>;
  /** Guard / Effect / onEnter / onExit 函數 registry */
  effectRegistry?: Record<string, (ctx: EffectContext) => unknown | Promise<unknown>>;
};

export type EffectContext = {
  fromState: string;
  toState: string;
  entityId: string;
  entityType: string;
  triggeredBy?: string;
  metadata?: Record<string, unknown>;
};

// ==============================================
// 4. Transition Result
// ==============================================

export type TransitionResult =
  | {
      success: true;
      fromState: string;
      toState: string;
      log: TransitionLog;
    }
  | {
      success: false;
      reason: string;
      code: 'INVALID_TRANSITION' | 'GUARD_FAILED' | 'EFFECT_ERROR' | 'UNKNOWN';
    };

// ==============================================
// 5. StateMachine 實例
// ==============================================

export type StateMachine = {
  readonly name: string;
  readonly initialState: string;
  readonly states: Record<string, StateConfig>;
  readonly transitions: Transition[];

  canTransition(fromState: string, toState: string): boolean;
  transition(fromState: string, toState: string, ctx: TransitionContext): Promise<TransitionResult>;
  getAvailableTransitions(fromState: string): Transition[];
  getStateConfig(state: string): StateConfig | null;
};

export function createStateMachine(workflow: Workflow): StateMachine {
  // 驗證 initialState
  if (!(workflow.initialState in workflow.states)) {
    throw new Error(
      `Workflow '${workflow.name}': initialState '${workflow.initialState}' not found in states`,
    );
  }

  // 驗證所有 transition 的 from / to 都存在
  for (const t of workflow.transitions) {
    const fromStates = Array.isArray(t.from) ? t.from : [t.from];
    for (const from of fromStates) {
      if (!(from in workflow.states)) {
        throw new Error(
          `Workflow '${workflow.name}': transition from state '${from}' not found in states`,
        );
      }
    }
    if (!(t.to in workflow.states)) {
      throw new Error(
        `Workflow '${workflow.name}': transition to state '${t.to}' not found in states`,
      );
    }
  }

  function findTransition(fromState: string, toState: string): Transition | null {
    return (
      workflow.transitions.find((t) => {
        const froms = Array.isArray(t.from) ? t.from : [t.from];
        return froms.includes(fromState) && t.to === toState;
      }) ?? null
    );
  }

  return {
    name: workflow.name,
    initialState: workflow.initialState,
    states: workflow.states,
    transitions: workflow.transitions,

    canTransition(fromState: string, toState: string): boolean {
      if (!(toState in workflow.states)) return false;
      return findTransition(fromState, toState) !== null;
    },

    async transition(
      fromState: string,
      toState: string,
      ctx: TransitionContext,
    ): Promise<TransitionResult> {
      const transition = findTransition(fromState, toState);

      if (!transition) {
        return {
          success: false,
          reason: `Cannot transition from '${fromState}' to '${toState}'`,
          code: 'INVALID_TRANSITION',
        };
      }

      const registry = ctx.effectRegistry ?? {};
      const effectCtx: EffectContext = {
        fromState,
        toState,
        entityId: ctx.entityId,
        entityType: ctx.entityType ?? 'unknown',
        triggeredBy: ctx.triggeredBy,
        metadata: ctx.metadata,
      };

      // 1. Guard 檢查
      if (transition.guard) {
        const guardFn = registry[resolveHookName(transition.guard) ?? ''];
        if (guardFn) {
          const guardResult = await guardFn(effectCtx);
          if (!guardResult) {
            return {
              success: false,
              reason: `Guard '${transition.guard}' returned false`,
              code: 'GUARD_FAILED',
            };
          }
        }
      }

      // 2. onExit（from state）
      const fromStateConfig = workflow.states[fromState];
      if (fromStateConfig?.onExit) {
        const fnName = resolveHookName(fromStateConfig.onExit);
        if (fnName && registry[fnName]) {
          await registry[fnName](effectCtx);
        }
      }

      // 3. onEnter（to state）
      const toStateConfig = workflow.states[toState];
      if (toStateConfig?.onEnter) {
        const fnName = resolveHookName(toStateConfig.onEnter);
        if (fnName && registry[fnName]) {
          await registry[fnName](effectCtx);
        }
      }

      // 4. Effect（transition 後）
      if (transition.effect) {
        const fnName = resolveHookName(transition.effect);
        if (fnName && registry[fnName]) {
          await registry[fnName](effectCtx);
        }
      }

      // 5. 建 TransitionLog
      const log: TransitionLog = {
        entityType: ctx.entityType ?? 'unknown',
        entityId: ctx.entityId,
        fromState,
        toState,
        triggeredBy: ctx.triggeredBy,
        timestamp: new Date(),
        metadata: ctx.metadata,
      };

      return {
        success: true,
        fromState,
        toState,
        log,
      };
    },

    getAvailableTransitions(fromState: string): Transition[] {
      return workflow.transitions.filter((t) => {
        const froms = Array.isArray(t.from) ? t.from : [t.from];
        return froms.includes(fromState);
      });
    },

    getStateConfig(state: string): StateConfig | null {
      return workflow.states[state] ?? null;
    },
  };
}

// ==============================================
// 6. Global StateMachine Registry
// ==============================================

let _stateMachines = new Map<string, StateMachine>();

export function registerStateMachine(sm: StateMachine): void {
  _stateMachines.set(sm.name, sm);
}

export function getStateMachine(name: string): StateMachine | null {
  return _stateMachines.get(name) ?? null;
}

export function listStateMachines(): string[] {
  return Array.from(_stateMachines.keys());
}

export function resetWorkflows(): void {
  _stateMachines = new Map();
}