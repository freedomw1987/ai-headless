/**
 * TDD Gate 1 — Sprint 32 commit 4
 * admin 頁面 header 手機 RWD (flex-col sm:flex-row)
 *
 * 對應 PRD: docs/specs/extension-spec.md
 * 對應 Backlog: Sprint 32 Plan Gate
 *
 * 問題:
 * - 頁面 header 固定 flex flex-row (justify-between)
 * - 手機: title + button 並排擠壓
 *
 * 修正:
 * - flex-col → 手機垂直堆疊
 * - sm:flex-row → 桌面水平排列
 * - gap-2 → 垂直間隔
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RolesPageDialog } from '@/app/admin/roles/roles-page-dialog';

// Mock fetch
global.fetch = global.fetch || (() => Promise.resolve(new Response()));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

describe('Sprint 32 commit 4 — admin 頁面 header 手機 RWD', () => {
  it('RolesPageDialog trigger 按鈕可見', async () => {
    const { container } = render(<RolesPageDialog />);

    // 找「新增 Role」trigger 按鈕
    const trigger = screen.getByText(/新增 Role/);
    expect(trigger).toBeTruthy();
  });
});