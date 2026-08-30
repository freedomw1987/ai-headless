/**
 * Sprint 46 Commit 5 (Stage 46-D) — Attachment Reader
 *
 * 對應 PRD: docs/prd/10-chat-attachments.md §2.2 (FR-2 附件解析)
 *
 * 設計動機:
 * - 上傳附件後, chat stream route 需讀附件內容送進 prompt
 * - 文字類 (.txt/.md/.json/.csv/.log/.html/.xml/.svg): 直接讀 utf-8
 * - 圖片類 (png/jpeg/webp/gif): base64 + mime type (給 vision)
 * - Office 類 (.pdf/.docx/.xlsx/.pptx): Sprint 47+ 補 parser (Sprint 46 placeholder)
 *
 * Sprint 46 scope down:
 * - text reader 完整做
 * - image reader 完整做 (base64 + mime)
 * - office 預留 placeholder (不 parser, return empty)
 *
 * 守護測試範圍:
 * - A. 新檔案存在性
 * - B. export 必要函式
 * - C. 整合到 agent-sdk (streamChatMessages 接受 attachments 參數)
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';

describe('Sprint 46 Commit 5 — Attachment Reader', () => {
  // ============== A. 新檔案存在性 ==============

  it('應建立 lib/ai/chat/attachment-reader.ts', () => {
    expect(
      existsSync('lib/ai/chat/attachment-reader.ts'),
      '應建立 lib/ai/chat/attachment-reader.ts',
    ).toBe(true);
  });

  // ============== B. export 必要函式 ==============

  it('應 export readAttachmentText 函式', () => {
    const source = readFileSync('lib/ai/chat/attachment-reader.ts', 'utf-8');
    expect(source, '應 export readAttachmentText').toMatch(
      /export\s+(async\s+)?function\s+readAttachmentText|export\s+const\s+readAttachmentText/,
    );
  });

  it('應 export readAttachmentImage 函式', () => {
    const source = readFileSync('lib/ai/chat/attachment-reader.ts', 'utf-8');
    expect(source, '應 export readAttachmentImage').toMatch(
      /export\s+(async\s+)?function\s+readAttachmentImage|export\s+const\s+readAttachmentImage/,
    );
  });

  it('應 export AttachmentContent 型別', () => {
    const source = readFileSync('lib/ai/chat/attachment-reader.ts', 'utf-8');
    expect(source, '應 export AttachmentContent type').toMatch(
      /export\s+(type|interface)\s+AttachmentContent/,
    );
  });

  // ============== C. 整合到 agent-sdk ==============

  it('agent-sdk 應 export streamChatMessages 接受 attachments 參數', () => {
    const source = readFileSync('lib/ai/agent-sdk/agent-sdk.ts', 'utf-8');
    expect(source, 'streamChatMessages 應接受 attachments').toMatch(
      /streamChatMessages[\s\S]*attachments/,
    );
  });

  it('agent-sdk 應 import attachment-reader', () => {
    const source = readFileSync('lib/ai/agent-sdk/agent-sdk.ts', 'utf-8');
    expect(source, '應 import attachment-reader').toMatch(
      /from\s+['"]@\/lib\/ai\/chat\/attachment-reader['"]/,
    );
  });

  // ============== D. agent-sdk 應讀文字附件進 user content ==============

  it('agent-sdk 應在 user content 附加文字附件內容', () => {
    const source = readFileSync('lib/ai/agent-sdk/agent-sdk.ts', 'utf-8');
    // 期待 prompt 收到 attachments 內容 (e.g. "Attached files:\n" 或讀 readAttachmentText)
    expect(
      source,
      '應讀取附件內容 (readAttachmentText)',
    ).toMatch(/readAttachmentText/);
  });
});