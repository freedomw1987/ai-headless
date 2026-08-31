/**
 * Sprint 47 Commit 2 (Stage 47-1) — Message 元件整合 ReasoningSection + SourcesList E2E
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.2 (FR-2.5, FR-2.6)
 *
 * 直接 render Message 元件包 ReasoningSection + SourcesList，
 * 驗證元件在 conversation list 中的位置、條件渲染、可展開行為。
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { ReasoningSection } from '@/components/ai-elements/reasoning-section';
import { SourcesList } from '@/components/ai-elements/sources-list';

describe('Message + ReasoningSection + SourcesList — Sprint 47-1 E2E', () => {
  it('assistant 訊息含 reasoning 時, ReasoningSection 出現且可展開', () => {
    render(
      <Message from="assistant">
        <ReasoningSection reasoning="思考過程 A" />
        <MessageContent>回答內容</MessageContent>
      </Message>,
    );

    const reasoningButton = screen.getByRole('button', { name: /思考過程/ });
    expect(reasoningButton).toBeInTheDocument();

    // 預設收合
    expect(screen.queryByText('思考過程 A')).not.toBeInTheDocument();

    // 展開
    fireEvent.click(reasoningButton);
    expect(screen.getByText('思考過程 A')).toBeInTheDocument();
    // 內容也應在 DOM
    expect(screen.getByText('回答內容')).toBeInTheDocument();
  });

  it('assistant 訊息含 attachments 時, SourcesList 出現且可展開', () => {
    render(
      <Message from="assistant">
        <MessageContent>已讀取附件</MessageContent>
        <SourcesList
          attachments={[
            { id: 'f1', filename: 'data.csv', size: 2048 },
            { id: 'f2', filename: 'meta.json', size: 512 },
          ]}
        />
      </Message>,
    );

    const sourcesButton = screen.getByRole('button', { name: /2 個附件/ });
    expect(sourcesButton).toBeInTheDocument();

    // 預設收合
    expect(screen.queryByText('data.csv')).not.toBeInTheDocument();

    // 展開
    fireEvent.click(sourcesButton);
    expect(screen.getByText('data.csv')).toBeInTheDocument();
    expect(screen.getByText('meta.json')).toBeInTheDocument();
  });

  it('assistant 訊息同時含 reasoning + attachments 時, 兩元件都顯示', () => {
    render(
      <Message from="assistant">
        <ReasoningSection reasoning="先思考" />
        <MessageContent>回應</MessageContent>
        <SourcesList
          attachments={[{ id: 'f1', filename: 'doc.pdf', size: 1024 }]}
        />
      </Message>,
    );

    expect(screen.getByRole('button', { name: /思考過程/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /1 個附件/ })).toBeInTheDocument();

    // 都可展開
    fireEvent.click(screen.getByRole('button', { name: /思考過程/ }));
    fireEvent.click(screen.getByRole('button', { name: /1 個附件/ }));
    expect(screen.getByText('先思考')).toBeInTheDocument();
    expect(screen.getByText('doc.pdf')).toBeInTheDocument();
  });

  it('無 reasoning / 無 attachments 時, 兩元件都不渲染', () => {
    render(
      <Message from="assistant">
        <ReasoningSection reasoning={undefined} />
        <MessageContent>簡短回答</MessageContent>
        <SourcesList attachments={undefined} />
      </Message>,
    );

    expect(screen.queryByRole('button', { name: /思考過程/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /個附件/ })).not.toBeInTheDocument();
  });
});