/**
 * TECH-006 StateMachine — Runtime 核心
 *
 * 設計：State Machine Library 模式
 * - State transitions 由 JSON schema 定義
 * - Runtime 讀 schema 執行
 * - 符合框架「JSON 驅動」定位
 *
 * 公開 API：
 * - createStateMachine(schema) → StateMachine 實例
 * - sm.getState()               → 當前狀態
 * - sm.canTransition(event)     → boolean
 * - sm.getAvailableEvents()     → string[]
 * - sm.transition(event|opts)   → next state
 * - sm.getContext()             → 當前 context
 */

// ==============================================
// 類型定義
// ==============================================

export type TransitionDef =
  | string // 簡單寫法：直接是目標狀態名
  | {
      target: string;
      guard?: string;
      actions?: string[];
    };

export type StateDef = {
  on?: Record<string, TransitionDef>;
  meta?: Record<string, unknown>;
};

export type StateMachineSchema = {
  id: string;
  initial: string;
  states: Record<string, StateDef>;
  context?: Record<string, unknown>;
};

export type TransitionInput =
  | string // event 名
  | { event: string; payload?: Record<string, unknown> };

export interface StateMachineInstance {
  getState(): string;
  canTransition(event: string): boolean;
  getAvailableEvents(): string[];
  transition(input: TransitionInput): string;
  getContext(): Record<string, unknown>;
}

// ==============================================
// 錯誤
// ==============================================

export class InvalidTransitionError extends Error {
  readonly machineId: string;
  readonly currentState: string;
  readonly event: string;

  constructor(machineId: string, currentState: string, event: string) {
    super(
      `StateMachine "${machineId}" 拒絕 event "${event}"（current state: "${currentState}"）`,
    );
    this.name = 'InvalidTransitionError';
    this.machineId = machineId;
    this.currentState = currentState;
    this.event = event;
  }
}

// ==============================================
// Helper：解析 TransitionDef → target state
// ==============================================

function resolveTarget(def: TransitionDef): string {
  return typeof def === 'string' ? def : def.target;
}

// ==============================================
// 工廠函式
// ==============================================

export function createStateMachine(
  schema: StateMachineSchema,
): StateMachineInstance {
  // 驗證 schema 基本完整性
  if (!schema.id) throw new Error('StateMachine: id 必填');
  if (!schema.initial) throw new Error('StateMachine: initial 必填');
  if (!schema.states || typeof schema.states !== 'object') {
    throw new Error('StateMachine: states 必填');
  }
  if (!schema.states[schema.initial]) {
    throw new Error(
      `StateMachine: initial state "${schema.initial}" 不存在於 states`,
    );
  }

  let currentState: string = schema.initial;
  let context: Record<string, unknown> = { ...(schema.context ?? {}) };

  return {
    getState() {
      return currentState;
    },

    canTransition(event: string): boolean {
      const stateDef = schema.states[currentState];
      return Boolean(stateDef?.on?.[event]);
    },

    getAvailableEvents(): string[] {
      const stateDef = schema.states[currentState];
      if (!stateDef?.on) return [];
      return Object.keys(stateDef.on);
    },

    transition(input: TransitionInput): string {
      const event = typeof input === 'string' ? input : input.event;
      const payload = typeof input === 'string' ? undefined : input.payload;

      const stateDef = schema.states[currentState];
      const transitionDef = stateDef?.on?.[event];

      if (!transitionDef) {
        throw new InvalidTransitionError(schema.id, currentState, event);
      }

      const nextState = resolveTarget(transitionDef);

      // 確保 target state 存在於 schema
      if (!schema.states[nextState]) {
        throw new Error(
          `StateMachine "${schema.id}": transition target "${nextState}" 不存在於 states`,
        );
      }

      currentState = nextState;

      // 若有 payload，merge 到 context
      if (payload) {
        context = { ...context, ...payload };
      }

      return currentState;
    },

    getContext() {
      return { ...context };
    },
  };
}