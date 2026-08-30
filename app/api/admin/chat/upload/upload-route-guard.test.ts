/**
 * Sprint 46 Commit 2 (Stage 46-A) — Upload Route 守護測試
 *
 * 設計 (Sprint 46 Plan Gate, PRD 10-chat-attachments.md §2.1 + §5):
 * - POST /api/admin/chat/upload 接收 multipart/form-data
 * - RBAC 雙層守衛: middleware (requireUser) + handler (isAdmin)
 * - MIME 白名單 (FR-1.3):
 *   - 純文字: .txt/.md/.json/.csv/.log/.html/.xml/.svg
 *   - Office: .pdf/.docx/.xlsx/.pptx
 *   - 圖片: png/jpeg/webp/gif
 * - 大小上限 10 MB (FR-1.4) — multipart parser 階段拒收
 * - 多檔上限 10 個 (FR-1.5)
 * - 儲存: ./uploads/<sessionId>/<uuid>.<ext> (FR-1.6)
 * - 回傳格式: { attachments: [{ id, filename, mimeType, size, uploadedAt }] } (FR-1.7)
 *
 * 對應 PRD: docs/prd/10-chat-attachments.md §2.1 / §5.1
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';

describe('S46-A — /api/admin/chat/upload Route 守護', () => {
  // ============== A. 檔案結構守護 ==============

  it('應有 /api/admin/chat/upload/route.ts 檔案', () => {
    expect(
      existsSync('app/api/admin/chat/upload/route.ts'),
      '/api/admin/chat/upload route 不存在',
    ).toBe(true);
  });

  it('應有 mime-validator 模組', () => {
    expect(
      existsSync('lib/ai/chat/mime-validator.ts'),
      'lib/ai/chat/mime-validator.ts 不存在',
    ).toBe(true);
  });

  it('應有 mime-validator 單元測試', () => {
    expect(
      existsSync('lib/ai/chat/mime-validator.test.ts'),
      'mime-validator 單元測試不存在',
    ).toBe(true);
  });

  // ============== B. Route Handler 結構守護 ==============

  it('route 應 export POST handler', () => {
    const source = readFileSync('app/api/admin/chat/upload/route.ts', 'utf-8');
    expect(source, '應有 export async function POST').toMatch(
      /export\s+(async\s+)?function\s+POST/,
    );
  });

  // ============== C. RBAC 雙層守護 (FR-1.2) ==============

  it('route 應 requireUser (未登入 → 401)', () => {
    const source = readFileSync('app/api/admin/chat/upload/route.ts', 'utf-8');
    expect(source, '應 requireUser').toMatch(/requireUser/);
  });

  it('route 應 isAdmin (非 admin → 403)', () => {
    const source = readFileSync('app/api/admin/chat/upload/route.ts', 'utf-8');
    expect(source, '應 isAdmin').toMatch(/isAdmin/);
  });

  // ============== D. Multipart 解析守護 (FR-1.1) ==============

  it('route 應使用 formData() 解析 multipart', () => {
    const source = readFileSync('app/api/admin/chat/upload/route.ts', 'utf-8');
    expect(source, '應 req.formData()').toMatch(/\.formData\(\)/);
  });

  it('route 應接收 sessionId 欄位', () => {
    const source = readFileSync('app/api/admin/chat/upload/route.ts', 'utf-8');
    expect(source, '應讀取 sessionId').toMatch(/sessionId/);
  });

  it('route 應接收 files[] 欄位', () => {
    const source = readFileSync('app/api/admin/chat/upload/route.ts', 'utf-8');
    expect(source, '應讀取 files[]').toMatch(/files/);
  });

  // ============== E. MIME 白名單守護 (FR-1.3) ==============

  it('route 應呼叫 mime-validator 模組', () => {
    const source = readFileSync('app/api/admin/chat/upload/route.ts', 'utf-8');
    expect(source, '應 import mime-validator').toMatch(
      /from\s+['"]@?\/lib\/ai\/chat\/mime-validator['"]/,
    );
  });

  it('mime-validator 應含白名單常數', () => {
    const source = readFileSync('lib/ai/chat/mime-validator.ts', 'utf-8');
    expect(source, '應定義 ALLOWED_MIME_TYPES').toMatch(
      /ALLOWED_MIME_TYPES|allowedMimeTypes/i,
    );
  });

  it('mime-validator 應支援純文字類型', () => {
    const source = readFileSync('lib/ai/chat/mime-validator.ts', 'utf-8');
    expect(source, '應有 text/plain').toMatch(/text\/plain/);
    expect(source, '應有 text/markdown').toMatch(/text\/markdown/);
    expect(source, '應有 application/json').toMatch(/application\/json/);
    expect(source, '應有 text/csv').toMatch(/text\/csv/);
  });

  it('mime-validator 應支援 Office 類型', () => {
    const source = readFileSync('lib/ai/chat/mime-validator.ts', 'utf-8');
    expect(source, '應有 application/pdf').toMatch(/application\/pdf/);
    // docx / pptx 是 zip-based, content-type 為 application/zip 或 application/octet-stream
    // 用 .docx/.pptx 副檔名判斷
    expect(source, '應有 docx 判斷').toMatch(/docx/i);
    expect(source, '應有 pptx 判斷').toMatch(/pptx/i);
    expect(source, '應有 xlsx 判斷').toMatch(/xlsx/i);
  });

  it('mime-validator 應支援圖片類型', () => {
    const source = readFileSync('lib/ai/chat/mime-validator.ts', 'utf-8');
    expect(source, '應有 image/png').toMatch(/image\/png/);
    expect(source, '應有 image/jpeg').toMatch(/image\/jpeg/);
    expect(source, '應有 image/webp').toMatch(/image\/webp/);
    expect(source, '應有 image/gif').toMatch(/image\/gif/);
  });

  // ============== F. 大小上限守護 (FR-1.4) ==============

  it('mime-validator 應有 10 MB 常數', () => {
    const source = readFileSync('lib/ai/chat/mime-validator.ts', 'utf-8');
    expect(source, '應有 MAX_FILE_SIZE').toMatch(
      /MAX_FILE_SIZE|maxFileSize.*10\s*\*\s*1024\s*\*\s*1024|10\s*\*\s*1024\s*\*\s*1024/i,
    );
  });

  it('route 應檢查檔案大小', () => {
    const source = readFileSync('app/api/admin/chat/upload/route.ts', 'utf-8');
    expect(source, '應有 size 檢查').toMatch(/size/);
  });

  // ============== G. 多檔上限守護 (FR-1.5) ==============

  it('mime-validator 應有 10 個檔案上限常數', () => {
    const source = readFileSync('lib/ai/chat/mime-validator.ts', 'utf-8');
    expect(source, '應有 MAX_FILES_COUNT = 10').toMatch(/MAX_FILES_COUNT|maxFilesCount.*10|10/i);
  });

  // ============== H. 儲存守護 (FR-1.6) ==============

  it('route 應寫入 ./uploads/ 目錄', () => {
    const source = readFileSync('app/api/admin/chat/upload/route.ts', 'utf-8');
    expect(source, '應有 uploads/ 路徑').toMatch(/uploads\//);
  });

  it('route 應用 sessionId 建立子目錄', () => {
    const source = readFileSync('app/api/admin/chat/upload/route.ts', 'utf-8');
    expect(source, '應用 sessionId 作為子目錄').toMatch(/sessionId/);
  });

  it('route 應用 uuid 或 randomId 命名檔案', () => {
    const source = readFileSync('app/api/admin/chat/upload/route.ts', 'utf-8');
    expect(source, '應有 uuid 或 randomUUID 命名').toMatch(
      /randomUUID|uuid|crypto\.randomUUID/,
    );
  });

  // ============== I. DB 寫入守護 (FR-6.1) ==============

  it('route 應寫入 Attachment table', () => {
    const source = readFileSync('app/api/admin/chat/upload/route.ts', 'utf-8');
    expect(source, '應有 db.attachment.create').toMatch(/db\.attachment\.create/);
  });

  it('route 應 import db', () => {
    const source = readFileSync('app/api/admin/chat/upload/route.ts', 'utf-8');
    expect(source, '應 import db').toMatch(/import.*db.*from/);
  });

  // ============== J. 回應格式守護 (FR-1.7) ==============

  it('route 應回傳 { attachments: [...] }', () => {
    const source = readFileSync('app/api/admin/chat/upload/route.ts', 'utf-8');
    expect(source, '應有 attachments 欄位').toMatch(/attachments/);
  });

  it('route 應回傳 NextResponse.json', () => {
    const source = readFileSync('app/api/admin/chat/upload/route.ts', 'utf-8');
    expect(source, '應用 NextResponse.json').toMatch(/NextResponse\.json/);
  });

  // ============== K. 錯誤處理守護 (FR-1.4 + Plan Gate Q10) ==============

  it('route 應回 400 (MIME 不符 / 大小超限)', () => {
    const source = readFileSync('app/api/admin/chat/upload/route.ts', 'utf-8');
    expect(source, '應有 status: 400').toMatch(/status:\s*400/);
  });

  it('route 應回 401 (未登入)', () => {
    const source = readFileSync('app/api/admin/chat/upload/route.ts', 'utf-8');
    expect(source, '應有 status: 401').toMatch(/status:\s*401/);
  });

  it('route 應回 403 (非 admin)', () => {
    const source = readFileSync('app/api/admin/chat/upload/route.ts', 'utf-8');
    expect(source, '應有 status: 403').toMatch(/status:\s*403/);
  });

  // ============== L. 動態設定守護 ==============

  it('route 應標記 force-dynamic', () => {
    const source = readFileSync('app/api/admin/chat/upload/route.ts', 'utf-8');
    expect(source, '應有 dynamic = "force-dynamic"').toMatch(
      /export\s+const\s+dynamic\s*=\s*["']force-dynamic["']/,
    );
  });
});
