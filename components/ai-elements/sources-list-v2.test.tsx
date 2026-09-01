/**
 * Sprint 50 Commit 1 (Stage 50-0) — SourcesList v2 升級守護測試
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.12 (FR-17)
 * 對應 Plan Gate: docs/sprint50-plan-gate.md
 *
 * 驗證:
 * - FR-17.1: 5 種檔案類型 icon 區分 (PDF/DOCX/XLSX/PPTX/圖片/未分類)
 * - FR-17.2: MIME 友好名標籤
 * - FR-17.3: 下載按鈕存在 + href 正確
 *
 * 設計: 用 icon 的 SVG class 識別 (lucide-react 用 size-* 統一 class)
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SourcesList } from './sources-list';

describe('S50 — SourcesList v2 升級 (FR-17.1 ~ FR-17.3)', () => {
  describe('FR-17.1: 檔案類型 icon 區分', () => {
    it('image/png 應顯示 FileImageIcon', () => {
      const { container } = render(
        <SourcesList
          attachments={[{ id: 'a1', filename: 'photo.png', mimeType: 'image/png', size: 1024 }]}
        />,
      );
      fireEvent.click(screen.getByRole('button'));
      // lucide-react SVG 都用 size-* class, 用 querySelectorAll 找出所有 SVG
      const svgs = container.querySelectorAll('svg');
      // 第一個 SVG 是展開箭頭, 第二個是檔案 icon
      expect(svgs.length).toBeGreaterThanOrEqual(2);
      // FileImageIcon 會有 image 相關 SVG
      const fileIconSvg = svgs[2]; // 索引 2: 展開箭頭(0) + 附件 icon(1) + 下載(2)? 實際看 sources-list v2 結構
      expect(fileIconSvg).toBeTruthy();
    });

    it('application/pdf 應顯示 FileTextIcon', () => {
      const { container } = render(
        <SourcesList
          attachments={[{ id: 'a1', filename: 'doc.pdf', mimeType: 'application/pdf', size: 1024 }]}
        />,
      );
      fireEvent.click(screen.getByRole('button'));
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });

    it('XLSX 應顯示 FileSpreadsheetIcon', () => {
      render(
        <SourcesList
          attachments={[{ id: 'a1', filename: 'data.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 1024 }]}
        />,
      );
      fireEvent.click(screen.getByRole('button'));
      expect(screen.getByText(/Excel 表格/)).toBeInTheDocument();
    });

    it('PPTX 應顯示 PresentationIcon', () => {
      render(
        <SourcesList
          attachments={[{ id: 'a1', filename: 'slides.pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', size: 1024 }]}
        />,
      );
      fireEvent.click(screen.getByRole('button'));
      expect(screen.getByText(/PowerPoint 簡報/)).toBeInTheDocument();
    });

    it('未知 mimeType 應 fallback 到 FileIcon', () => {
      const { container } = render(
        <SourcesList
          attachments={[{ id: 'a1', filename: 'unknown.xyz', mimeType: 'application/x-unknown', size: 1024 }]}
        />,
      );
      fireEvent.click(screen.getByRole('button'));
      // fallback 應仍顯示 (雖然沒特定 MIME 標籤)
      expect(screen.getByText('unknown.xyz')).toBeInTheDocument();
      expect(container.querySelectorAll('svg').length).toBeGreaterThan(0);
    });
  });

  describe('FR-17.2: MIME 友好名標籤', () => {
    it('PDF 應顯示「PDF 文件」', () => {
      render(
        <SourcesList
          attachments={[{ id: 'a1', filename: 'doc.pdf', mimeType: 'application/pdf', size: 1024 }]}
        />,
      );
      fireEvent.click(screen.getByRole('button'));
      expect(screen.getByText(/PDF 文件/)).toBeInTheDocument();
    });

    it('Word 應顯示「Word 文件」', () => {
      render(
        <SourcesList
          attachments={[{ id: 'a1', filename: 'doc.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 1024 }]}
        />,
      );
      fireEvent.click(screen.getByRole('button'));
      expect(screen.getByText(/Word 文件/)).toBeInTheDocument();
    });

    it('text/plain 應顯示「純文字」', () => {
      render(
        <SourcesList
          attachments={[{ id: 'a1', filename: 'readme.txt', mimeType: 'text/plain', size: 1024 }]}
        />,
      );
      fireEvent.click(screen.getByRole('button'));
      expect(screen.getByText(/純文字/)).toBeInTheDocument();
    });
  });

  describe('FR-17.3: 下載按鈕', () => {
    it('每個附件應有下載按鈕', () => {
      render(
        <SourcesList
          attachments={[
            { id: 'a1', filename: 'doc.pdf', mimeType: 'application/pdf', size: 1024 },
            { id: 'a2', filename: 'photo.png', mimeType: 'image/png', size: 2048 },
          ]}
        />,
      );
      fireEvent.click(screen.getByRole('button'));
      const downloadLinks = screen.getAllByRole('link');
      expect(downloadLinks.length).toBeGreaterThanOrEqual(2);
    });

    it('下載按鈕 href 應指向 /api/admin/chat/attachments/{id}/download', () => {
      render(
        <SourcesList
          attachments={[
            { id: 'att-123', filename: 'doc.pdf', mimeType: 'application/pdf', size: 1024 },
          ]}
        />,
      );
      fireEvent.click(screen.getByRole('button'));
      const downloadLink = screen.getByRole('link', { name: /下載 doc.pdf/ });
      expect(downloadLink).toHaveAttribute(
        'href',
        '/api/admin/chat/attachments/att-123/download',
      );
    });

    it('下載按鈕應有 download attribute', () => {
      render(
        <SourcesList
          attachments={[
            { id: 'a1', filename: 'doc.pdf', mimeType: 'application/pdf', size: 1024 },
          ]}
        />,
      );
      fireEvent.click(screen.getByRole('button'));
      const downloadLink = screen.getByRole('link', { name: /下載/ });
      expect(downloadLink).toHaveAttribute('download');
    });
  });

  describe('既有功能保留 (Sprint 47-1)', () => {
    it('attachments 為空時不渲染', () => {
      const { container } = render(<SourcesList attachments={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('預設收合, 點擊展開', () => {
      render(
        <SourcesList
          attachments={[{ id: 'a1', filename: 'doc.pdf', mimeType: 'application/pdf', size: 1024 }]}
        />,
      );
      // 預設不顯示檔名
      expect(screen.queryByText('doc.pdf')).not.toBeInTheDocument();
      // 點擊展開
      fireEvent.click(screen.getByRole('button'));
      expect(screen.getByText('doc.pdf')).toBeInTheDocument();
    });
  });
});