/**
 * ==============================================
 *  Extension Runtime — Workflow Transition Entry
 * ==============================================
 *
 * 對應：docs/specs/extension-spec.md §4.6
 */

export {
  createStateMachine,
  registerStateMachine,
  getStateMachine,
  listStateMachines,
  resetWorkflows,
} from '@/lib/workflows/workflow-engine';

export type {
  Workflow,
  StateConfig,
  Transition,
  StateBadge,
  TransitionContext,
  TransitionLog,
  TransitionResult,
  StateMachine,
  EffectContext,
} from '@/lib/workflows/workflow-engine';