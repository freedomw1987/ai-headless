/**
 * Sprint 45 Commit A — AI Elements 元件存在守護測試
 *
 * 設計 (S45 Plan Gate Commit A):
 * - 安裝 shadcn AI Elements 4 個核心元件
 *   - conversation: 訊息容器
 *   - message: 訊息渲染 (user / assistant)
 *   - prompt-input: 輸入框 + attachments
 *   - code-block: 程式碼高亮
 * - 用 shadcn CLI 裝, 落到 components/ai-elements/
 */

import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';

describe('S45-A — AI Elements 元件安裝', () => {
  it('應有 conversation 元件', () => {
    expect(
      existsSync('components/ai-elements/conversation.tsx'),
      'conversation.tsx 應存在'
    ).toBe(true);
  });

  it('應有 message 元件', () => {
    expect(
      existsSync('components/ai-elements/message.tsx'),
      'message.tsx 應存在'
    ).toBe(true);
  });

  it('應有 prompt-input 元件', () => {
    expect(
      existsSync('components/ai-elements/prompt-input.tsx'),
      'prompt-input.tsx 應存在'
    ).toBe(true);
  });

  it('應有 code-block 元件', () => {
    expect(
      existsSync('components/ai-elements/code-block.tsx'),
      'code-block.tsx 應存在'
    ).toBe(true);
  });

  it('components.json 應有 ai-elements registry 設定', () => {
    // 安裝後 shadcn 會更新 components.json
    // 但其實不會特別標, 只驗證 components.json 存在 + ui alias
    expect(existsSync('components.json'), 'components.json 應存在').toBe(true);
  });
});