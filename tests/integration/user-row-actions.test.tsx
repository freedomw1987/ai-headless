/**
 * Sprint 28 — UserRowActions 測試
 *
 * Gate 1 TDD：先寫失敗測試 → 實作 → 通過
 *
 * 測試重點：
 * - 點擊 trigger 打開 dropdown
 * - 編輯連結到 /admin/users/:id/edit
 * - 點擊停用 → confirm + DELETE /api/users/:id
 * - 確認後 router.refresh()
 * - 失敗時顯示錯誤
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserRowActions } from '@/app/admin/users/user-row-actions';

// Mock next/navigation
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock window.confirm
const mockConfirm = vi.fn();
global.confirm = mockConfirm;

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch as never;

beforeEach(() => {
  mockRefresh.mockClear();
  mockConfirm.mockClear();
  mockFetch.mockClear();
});

describe('UserRowActions', () => {
  it('點擊 trigger 打開 dropdown 顯示「編輯」「停用」', async () => {
    const user = userEvent.setup();
    render(<UserRowActions userId="user-1" />);

    await user.click(screen.getByTestId('user-row-actions-user-1'));

    expect(screen.getByText('編輯')).toBeTruthy();
    expect(screen.getByText('停用')).toBeTruthy();
  });

  it('編輯連結指向 /admin/users/:id/edit', async () => {
    const user = userEvent.setup();
    render(<UserRowActions userId="user-1" />);

    await user.click(screen.getByTestId('user-row-actions-user-1'));
    const editLink = screen.getByText('編輯').closest('a');
    expect(editLink?.getAttribute('href')).toBe('/admin/users/user-1/edit');
  });

  it('點擊停用 → confirm + DELETE /api/users/:id', async () => {
    const user = userEvent.setup();
    mockConfirm.mockReturnValue(true);
    mockFetch.mockResolvedValueOnce({ ok: true });

    render(<UserRowActions userId="user-1" />);
    await user.click(screen.getByTestId('user-row-actions-user-1'));
    await user.click(screen.getByTestId('user-row-disable-user-1'));

    expect(mockConfirm).toHaveBeenCalledWith('確定要停用這個帳號？');
    expect(mockFetch).toHaveBeenCalledWith('/api/users/user-1', { method: 'DELETE' });
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('confirm 取消時不呼叫 API', async () => {
    const user = userEvent.setup();
    mockConfirm.mockReturnValue(false);

    render(<UserRowActions userId="user-1" />);
    await user.click(screen.getByTestId('user-row-actions-user-1'));
    await user.click(screen.getByTestId('user-row-disable-user-1'));

    expect(mockConfirm).toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('API 回傳錯誤時不 refresh', async () => {
    const user = userEvent.setup();
    mockConfirm.mockReturnValue(true);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: '不能停用自己' }),
    });

    render(<UserRowActions userId="user-1" />);
    await user.click(screen.getByTestId('user-row-actions-user-1'));
    await user.click(screen.getByTestId('user-row-disable-user-1'));

    expect(mockRefresh).not.toHaveBeenCalled();
  });
});