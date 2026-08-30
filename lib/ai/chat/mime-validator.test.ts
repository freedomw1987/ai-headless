/**
 * Sprint 46 Commit 2 — mime-validator 單元測試
 *
 * 對應 PRD 10-chat-attachments.md §2.1 (FR-1.3) + §5.1:
 * - 純文字: text/plain, text/markdown, application/json, text/csv, text/html, application/xml, image/svg+xml
 * - Office: application/pdf, .docx/.pptx/.xlsx (透過副檔名 + magic bytes)
 * - 圖片: image/png, image/jpeg, image/webp, image/gif
 * - 大小上限 10 MB (FR-1.4)
 * - 多檔上限 10 個 (FR-1.5)
 */

import { describe, it, expect } from 'vitest';
import {
  isAllowedMimeType,
  isAllowedExtension,
  MAX_FILE_SIZE,
  MAX_FILES_COUNT,
  validateFileCount,
  getExtensionFromFilename,
  validateMimeAndExtension,
} from './mime-validator';

describe('mime-validator', () => {
  describe('isAllowedMimeType', () => {
    it('text/plain 應允許', () => {
      expect(isAllowedMimeType('text/plain')).toBe(true);
    });

    it('text/markdown 應允許', () => {
      expect(isAllowedMimeType('text/markdown')).toBe(true);
    });

    it('application/json 應允許', () => {
      expect(isAllowedMimeType('application/json')).toBe(true);
    });

    it('text/csv 應允許', () => {
      expect(isAllowedMimeType('text/csv')).toBe(true);
    });

    it('text/html 應允許', () => {
      expect(isAllowedMimeType('text/html')).toBe(true);
    });

    it('application/xml 應允許', () => {
      expect(isAllowedMimeType('application/xml')).toBe(true);
    });

    it('image/svg+xml 應允許', () => {
      expect(isAllowedMimeType('image/svg+xml')).toBe(true);
    });

    it('application/pdf 應允許', () => {
      expect(isAllowedMimeType('application/pdf')).toBe(true);
    });

    it('image/png 應允許', () => {
      expect(isAllowedMimeType('image/png')).toBe(true);
    });

    it('image/jpeg 應允許', () => {
      expect(isAllowedMimeType('image/jpeg')).toBe(true);
    });

    it('image/webp 應允許', () => {
      expect(isAllowedMimeType('image/webp')).toBe(true);
    });

    it('image/gif 應允許', () => {
      expect(isAllowedMimeType('image/gif')).toBe(true);
    });

    it('application/zip 應不允許 (Office 是 zip-based 但用副檔名判斷)', () => {
      // zip 本身不允許，但 .docx/.pptx/.xlsx (zip-based) 透過副檔名允許
      expect(isAllowedMimeType('application/zip')).toBe(false);
    });

    it('application/x-msdownload (exe) 應不允許', () => {
      expect(isAllowedMimeType('application/x-msdownload')).toBe(false);
    });

    it('text/javascript 應不允許', () => {
      expect(isAllowedMimeType('text/javascript')).toBe(false);
    });

    it('application/octet-stream 應不允許 (除非副檔名白名單)', () => {
      // octet-stream 透過副檔名判斷, 純 mime 不允許
      expect(isAllowedMimeType('application/octet-stream')).toBe(false);
    });
  });

  describe('isAllowedExtension', () => {
    it('.txt 應允許', () => {
      expect(isAllowedExtension('notes.txt')).toBe(true);
    });

    it('.md 應允許', () => {
      expect(isAllowedExtension('README.md')).toBe(true);
    });

    it('.json 應允許', () => {
      expect(isAllowedExtension('package.json')).toBe(true);
    });

    it('.csv 應允許', () => {
      expect(isAllowedExtension('data.csv')).toBe(true);
    });

    it('.log 應允許', () => {
      expect(isAllowedExtension('app.log')).toBe(true);
    });

    it('.html 應允許', () => {
      expect(isAllowedExtension('page.html')).toBe(true);
    });

    it('.xml 應允許', () => {
      expect(isAllowedExtension('config.xml')).toBe(true);
    });

    it('.svg 應允許', () => {
      expect(isAllowedExtension('icon.svg')).toBe(true);
    });

    it('.pdf 應允許', () => {
      expect(isAllowedExtension('report.pdf')).toBe(true);
    });

    it('.docx 應允許', () => {
      expect(isAllowedExtension('report.docx')).toBe(true);
    });

    it('.xlsx 應允許', () => {
      expect(isAllowedExtension('data.xlsx')).toBe(true);
    });

    it('.pptx 應允許', () => {
      expect(isAllowedExtension('slides.pptx')).toBe(true);
    });

    it('.png 應允許', () => {
      expect(isAllowedExtension('photo.png')).toBe(true);
    });

    it('.jpg 應允許', () => {
      expect(isAllowedExtension('photo.jpg')).toBe(true);
    });

    it('.jpeg 應允許', () => {
      expect(isAllowedExtension('photo.jpeg')).toBe(true);
    });

    it('.webp 應允許', () => {
      expect(isAllowedExtension('photo.webp')).toBe(true);
    });

    it('.gif 應允許', () => {
      expect(isAllowedExtension('photo.gif')).toBe(true);
    });

    it('.exe 應不允許', () => {
      expect(isAllowedExtension('malware.exe')).toBe(false);
    });

    it('.sh 應不允許 (代碼源檔不在 Sprint 46 範圍)', () => {
      expect(isAllowedExtension('script.sh')).toBe(false);
    });

    it('.ts 應不允許 (代碼源檔不在 Sprint 46 範圍)', () => {
      expect(isAllowedExtension('app.ts')).toBe(false);
    });

    it('.js 應不允許 (代碼源檔不在 Sprint 46 範圍)', () => {
      expect(isAllowedExtension('app.js')).toBe(false);
    });

    it('大小寫不敏感 (.PDF 應允許)', () => {
      expect(isAllowedExtension('REPORT.PDF')).toBe(true);
    });

    it('無副檔名應不允許', () => {
      expect(isAllowedExtension('README')).toBe(false);
    });
  });

  describe('常數', () => {
    it('MAX_FILE_SIZE 應為 10 MB (10485760 bytes)', () => {
      expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
    });

    it('MAX_FILES_COUNT 應為 10', () => {
      expect(MAX_FILES_COUNT).toBe(10);
    });
  });

  describe('validateFileCount', () => {
    it('10 個檔案應允許', () => {
      expect(validateFileCount(10)).toBe(true);
    });

    it('1 個檔案應允許', () => {
      expect(validateFileCount(1)).toBe(true);
    });

    it('11 個檔案應不允許', () => {
      expect(validateFileCount(11)).toBe(false);
    });

    it('0 個檔案應不允許', () => {
      expect(validateFileCount(0)).toBe(false);
    });

    it('負數應不允許', () => {
      expect(validateFileCount(-1)).toBe(false);
    });
  });

  describe('getExtensionFromFilename', () => {
    it('應回傳小寫副檔名 (不含 dot)', () => {
      expect(getExtensionFromFilename('Report.PDF')).toBe('pdf');
    });

    it('應處理無副檔名', () => {
      expect(getExtensionFromFilename('README')).toBe('');
    });

    it('應處理多個 dot (取最後一個)', () => {
      expect(getExtensionFromFilename('archive.tar.gz')).toBe('gz');
    });

    it('應處理隱藏檔 (.gitignore 應無副檔名)', () => {
      expect(getExtensionFromFilename('.gitignore')).toBe('');
    });
  });

  describe('validateMimeAndExtension', () => {
    it('PDF (mime + 副檔名都符合) 應通過', () => {
      expect(validateMimeAndExtension('application/pdf', 'report.pdf')).toBe(true);
    });

    it('PNG 圖片 (mime + 副檔名都符合) 應通過', () => {
      expect(validateMimeAndExtension('image/png', 'photo.png')).toBe(true);
    });

    it('docx (mime 為 octet-stream 但副檔名符合) 應通過', () => {
      expect(
        validateMimeAndExtension('application/octet-stream', 'report.docx'),
      ).toBe(true);
    });

    it('docx (mime 為 zip 但副檔名符合) 應通過', () => {
      expect(
        validateMimeAndExtension('application/zip', 'report.docx'),
      ).toBe(true);
    });

    it('docx (正確 mime wordprocessingml) 應通過', () => {
      expect(
        validateMimeAndExtension(
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'report.docx',
        ),
      ).toBe(true);
    });

    it('MIME 符合但副檔名不符 (MIME 偽造) 應不允許', () => {
      // 聲稱是 PDF 但副檔名是 .exe
      expect(validateMimeAndExtension('application/pdf', 'malware.exe')).toBe(false);
    });

    it('副檔名符合但 MIME 不符 (MIME 偽造) 應不允許', () => {
      // 副檔名 .pdf 但 MIME 是 exe
      expect(
        validateMimeAndExtension('application/x-msdownload', 'report.pdf'),
      ).toBe(false);
    });
  });
});
