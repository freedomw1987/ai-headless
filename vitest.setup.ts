/**
 * Vitest global setup — 載入 @testing-library/jest-dom 自訂 matchers
 * 提供 toBeInTheDocument, toHaveClass 等 DOM 友善 matcher
 *
 * Polyfill jsdom 未提供的 Web API:
 * - ResizeObserver (use-stick-to-bottom / AI Elements 需要)
 * - localStorage / sessionStorage — jsdom 30 在某些環境下不暴露
 *   （預期 _storageQuota 行為改變），我們用 in-memory Map 實作 polyfill
 */
import '@testing-library/jest-dom/vitest';

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never;
}

if (typeof globalThis.localStorage === 'undefined' && typeof globalThis.window !== 'undefined') {
  const createStorage = (): Storage => {
    const map = new Map<string, string>();
    const storage: Storage = {
      get length() {
        return map.size;
      },
      clear() {
        map.clear();
      },
      getItem(key: string) {
        return map.has(key) ? (map.get(key) as string) : null;
      },
      key(index: number) {
        return Array.from(map.keys())[index] ?? null;
      },
      removeItem(key: string) {
        map.delete(key);
      },
      setItem(key: string, value: string) {
        map.set(key, String(value));
      },
    };
    return storage;
  };
  const localStore = createStorage();
  const sessionStore = createStorage();
  globalThis.localStorage = localStore;
  globalThis.sessionStorage = sessionStore;
  if (globalThis.window) {
    Object.defineProperty(globalThis.window, 'localStorage', {
      configurable: true,
      get: () => localStore,
    });
    Object.defineProperty(globalThis.window, 'sessionStorage', {
      configurable: true,
      get: () => sessionStore,
    });
  }
}