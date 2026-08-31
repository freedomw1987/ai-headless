/**
 * Sprint 47 Commit 2 (Stage 47-1) — SourcesList 元件單元測試
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.2 (FR-2.6)
 * Plan Gate Q1: Sources 改「附件引用折疊區」（降階方案）
 *
 * 驗證:
 * - 預設收合，點擊展開看附件列表
 * - attachments 為空時不渲染
 * - 顯示檔名 + 大小（humanize bytes）
 * - 鍵盤可達
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SourcesList } from './sources-list';

describe('SourcesList — Sprint 47-1', () => {
  it('預設收合，點擊展開看附件', () => {
    render(
      <SourcesList
        attachments={[
          { id: 'a1', filename: 'report.pdf', size: 2048 },
          { id: 'a2', filename: 'data.csv', size: 5_242_880 },
        ]}
      />,
    );

    // 預設不顯示檔名
    expect(screen.queryByText('report.pdf')).not.toBeInTheDocument();
    expect(screen.queryByText('data.csv')).not.toBeInTheDocument();

    // 點擊展開
    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText('report.pdf')).toBeInTheDocument();
    expect(screen.getByText('data.csv')).toBeInTheDocument();
  });

  it('attachments 為空陣列時不渲染', () => {
    const { container } = render(<SourcesList attachments={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('attachments undefined 時不渲染', () => {
    const { container } = render(<SourcesList attachments={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('顯示檔名 + 格式化大小（KB/MB）', () => {
    render(
      <SourcesList
        attachments={[
          { id: 'a1', filename: 'tiny.txt', size: 512 }, // 512 B
          { id: 'a2', filename: 'mid.log', size: 2048 }, // 2.0 KB
          { id: 'a3', filename: 'big.bin', size: 5_242_880 }, // 5.0 MB
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText('tiny.txt')).toBeInTheDocument();
    expect(screen.getByText(/512\s*B/)).toBeInTheDocument();
    expect(screen.getByText(/2\.0\s*KB/)).toBeInTheDocument();
    expect(screen.getByText(/5\.0\s*MB/)).toBeInTheDocument();
  });

  it('size 缺失時不顯示大小', () => {
    render(
      <SourcesList
        attachments={[{ id: 'a1', filename: 'no-size.pdf' }]}
      />,
    );
    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText('no-size.pdf')).toBeInTheDocument();
    // 不應顯示任何帶 B/KB/MB 的內容
    expect(screen.queryByText(/[KMG]?B/)).not.toBeInTheDocument();
  });

  it('鍵盤 Enter 觸發展開', () => {
    render(
      <SourcesList
        attachments={[{ id: 'a1', filename: 'kb.pdf', size: 1024 }]}
      />,
    );
    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(screen.getByText('kb.pdf')).toBeInTheDocument();
  });
});