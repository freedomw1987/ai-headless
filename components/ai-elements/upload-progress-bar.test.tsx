/**
 * Sprint 47 Commit 4 (Stage 47-3) — UploadProgressBar 元件單元測試
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.4 (FR-4.5)
 *
 * 驗證:
 * - 顯示百分比 (0-100%)
 * - 不同狀態 (uploading / done / error) 顯示不同文字
 * - progress < 0 / > 100 自動 clamp
 * - a11y: role="progressbar" + aria-valuenow/min/max
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UploadProgressBar } from './upload-progress-bar';

describe('UploadProgressBar — Sprint 47-3 FR-4.5', () => {
  it('顯示上傳中百分比 (uploading 狀態)', () => {
    render(<UploadProgressBar progress={45} status="uploading" />);
    expect(screen.getByText(/上傳中 45%/)).toBeInTheDocument();
  });

  it('done 狀態顯示完成訊息', () => {
    render(<UploadProgressBar progress={100} status="done" />);
    expect(screen.getByText(/上傳完成/)).toBeInTheDocument();
  });

  it('error 狀態顯示錯誤訊息', () => {
    render(<UploadProgressBar progress={45} status="error" errorMessage="檔案過大" />);
    expect(screen.getByText(/檔案過大/)).toBeInTheDocument();
  });

  it('progress < 0 自動 clamp 到 0', () => {
    render(<UploadProgressBar progress={-5} status="uploading" />);
    expect(screen.getByText(/上傳中 0%/)).toBeInTheDocument();
  });

  it('progress > 100 自動 clamp 到 100', () => {
    render(<UploadProgressBar progress={150} status="uploading" />);
    expect(screen.getByText(/上傳中 100%/)).toBeInTheDocument();
  });

  it('a11y: role + aria-valuenow 隨 progress 更新', () => {
    const { rerender } = render(<UploadProgressBar progress={20} status="uploading" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '20');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');

    rerender(<UploadProgressBar progress={75} status="uploading" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75');
  });
});