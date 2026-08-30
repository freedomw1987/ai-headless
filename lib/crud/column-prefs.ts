// Sprint C1 (CRUD 列表頁增強 v1.1) — Column Prefs LocalStorage Helper
//
// 儲存使用者對 CRUD 列表頁「顯示欄位」的偏好到 localStorage。
//
// 設計重點:
// - SSR 安全: 無 window 時回傳 null / noop
// - 容錯: localStorage 損壞/不可用/JSON 解析失敗 → 都不 throw，回傳 null
// - Key prefix: 'crud-list-columns:<specName>' 避免跟其他 localStorage 衝突
// - 只存「可見欄位名稱」陣列 (而不是每個欄位的 show/hide 物件)
//
// Gate 1 TDD: 見 tests/integration/column-prefs.test.ts

const KEY_PREFIX = 'crud-list-columns:';

function hasLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function getKey(specName: string): string {
  return `${KEY_PREFIX}${specName}`;
}

/**
 * 從 localStorage 讀指定 spec 的欄位偏好
 *
 * @returns 欄位名稱陣列 / null (無偏好或讀取失敗)
 */
export function loadColumnPrefs(specName: string): string[] | null {
  if (!hasLocalStorage()) return null;
  try {
    const raw = window.localStorage.getItem(getKey(specName));
    if (raw === null) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    // 只保留 string 元素（防止舊版存了其他格式）
    return parsed.filter((x): x is string => typeof x === 'string');
  } catch {
    return null;
  }
}

/**
 * 存欄位偏好到 localStorage
 *
 * 容錯: localStorage 不可用時 silently noop
 */
export function saveColumnPrefs(specName: string, columns: string[]): void {
  if (!hasLocalStorage()) return;
  try {
    window.localStorage.setItem(getKey(specName), JSON.stringify(columns));
  } catch {
    // localStorage disabled (private mode / quota exceeded / SecurityError)
    // Silently ignore — 偏好設定是 best-effort
  }
}

/**
 * 清除指定 spec 的欄位偏好
 */
export function clearColumnPrefs(specName: string): void {
  if (!hasLocalStorage()) return;
  try {
    window.localStorage.removeItem(getKey(specName));
  } catch {
    // ignore
  }
}
