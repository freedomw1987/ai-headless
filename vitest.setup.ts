/**
 * Vitest global setup — 載入 @testing-library/jest-dom 自訂 matchers
 * 提供 toBeInTheDocument, toHaveClass 等 DOM 友善 matcher
 *
 * Polyfill jsdom 未提供的 Web API:
 * - ResizeObserver (use-stick-to-bottom / AI Elements 需要)
 */
import '@testing-library/jest-dom/vitest';

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never;
}