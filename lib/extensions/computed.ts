/**
 * ==============================================
 *  Extension Runtime — Computed Entry
 * ==============================================
 *
 * 對應：docs/specs/extension-spec.md §4.5
 */

export {
  invokeComputed,
  registerComputed,
  hasComputed,
  clearComputedCache,
  resetComputed,
  resolveComputedName,
  hasDependencies,
} from '@/lib/computed/computed-sdk';

export type {
  ComputedField,
  ComputedContext,
  ComputeFunction,
  ComputedRegistry,
} from '@/lib/computed/computed-sdk';