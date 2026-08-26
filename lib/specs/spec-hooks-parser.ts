/**
 * Spec hooks parser (TD-404)
 *
 * 對應 PRD: docs/specs/json-spec.md
 * 對應 Backlog: TD-404
 *
 * 問題:
 * - 舊 regex /"hooks"\s*:\s*\{([^{}]*)\}/g 不支援嵌套 JSON
 * - 因為 [^{}]* 不允許 { } 字元
 * - 例: "hooks": { "beforeCreate": { "data": "..." } } 匹配失敗
 *
 * 修正:
 * - extractSpecHookReferences: 解析 spec JSON,提取所有 {{fn:...}} 引用
 * - 實作: 用 brace-balanced matching 找到 "hooks": { ... } 區塊,再找 {{fn:...}}
 *
 * 設計:
 * - 純函數,無外部依賴 (不引入 JSON.parse 避免 strict mode 拋錯)
 * - 容錯: 解析失敗回空陣列
 */

/**
 * 從 spec JSON 內容提取所有 {{fn:...}} hook 引用
 *
 * @param content - spec JSON 檔案內容 (string)
 * @returns unique hook 名稱陣列 (deduplicated)
 */
export function extractSpecHookReferences(content: string): string[] {
  const hooksBlock = findHooksBlock(content);
  if (!hooksBlock) return [];

  const inner = hooksBlock;
  const refs = new Set<string>();
  const fnMatches = inner.matchAll(/\{\{\s*fn\s*:\s*([^}]+?)\s*\}\}/g);
  for (const m of fnMatches) {
    const fnName = m[1]?.trim();
    if (fnName) refs.add(fnName);
  }
  return Array.from(refs);
}

/**
 * 找到 "hooks": { ... } 區塊的 inner content (處理嵌套 braces)
 *
 * 使用 brace-counting 演算法:
 * - 從 "hooks": 開始
 * - 找到第一個 { ,brace count +1
 * - 每個 { +1,每個 } -1
 * - count 回到 0 時結束
 */
function findHooksBlock(content: string): string | null {
  // 找 "hooks" 關鍵字位置
  const hooksKeyMatch = content.match(/"hooks"\s*:\s*\{/);
  if (!hooksKeyMatch || hooksKeyMatch.index === undefined) return null;

  // 從 { 開始 scan
  const startIdx = hooksKeyMatch.index + hooksKeyMatch[0].length - 1; // { 位置
  let depth = 0;
  let endIdx = -1;

  for (let i = startIdx; i < content.length; i++) {
    const ch = content[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
  }

  if (endIdx === -1) return null;
  return content.slice(startIdx + 1, endIdx);
}