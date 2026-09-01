/**
 * Sprint 51 Commit 1 (Stage 51-0) — 自訂 UIMessage Part 型別 (FR-18.1)
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.13 (FR-18)
 * 對應 Plan Gate: docs/sprint51-plan-gate.md
 *
 * 自訂型別切斷 AI SDK 'ai' 依賴 (Sprint 48-2 ChatStatus / Sprint 49-2 UIMessage 模式延續)
 *
 * 設計:
 * - 對齊 AI SDK 'ai' 7.0 FileUIPart + SourceDocumentUIPart 欄位
 *   (從 node_modules/.pnpm/ai@7.0.85_zod@3.24.1/node_modules/ai/dist/index.d.ts 1934-1965 行讀取)
 * - 不 export SDK 型別, 而是 export 局部型別
 * - 將來若 SDK 升級, 需手動對齊 (Sprint 49-2 reflection 揭露的風險)
 *
 * 與 chat-utils.ts 的分工:
 * - chat-utils.ts: ChatMessage, ChatStatus, ChatMessageRole 等 chat 流程型別
 * - ui-message-parts.ts: UIMessage 的各 part 型別 (FileUIPart, SourceDocumentUIPart 等)
 */

/**
 * FR-18.1: 自訂 FileUIPart
 *
 * 對齊 AI SDK 'ai' FileUIPart:
 * - type: 'file' (literal)
 * - mediaType: IANA media type (full 或 top-level)
 * - filename?: optional
 * - url: file URL
 * - providerMetadata?: optional
 */
export type FileUIPart = {
  type: 'file';
  mediaType: string;
  filename?: string;
  url: string;
  providerMetadata?: Record<string, unknown>;
};

/**
 * FR-18.1: 自訂 SourceDocumentUIPart
 *
 * 對齊 AI SDK 'ai' SourceDocumentUIPart:
 * - type: 'source-document' (literal)
 * - sourceId: string
 * - mediaType: string
 * - title: string
 * - filename?: optional
 * - providerMetadata?: optional
 */
export type SourceDocumentUIPart = {
  type: 'source-document';
  sourceId: string;
  mediaType: string;
  title: string;
  filename?: string;
  providerMetadata?: Record<string, unknown>;
};