/**
 * Sprint 28 — RoleRowActions 測試
 *
 * Gate 1 TDD：先寫失敗測試 → 實作 → 通過
 *
 * 測試重點：
 * - 點擊 trigger 打開 dropdown
 * - 矩陣連結到 /admin/roles/:id/permissions
 * - isSystem=true 時不顯示刪除
 * - isSystem=false 時點擊刪除 → confirm + DELETE API
 * - 有 user 時 confirm 警告包含用戶數
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoleRowActions } from '@/app/admin/roles/role-row-actions';

const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockConfirm = vi.fn();
const mockAlert = vi.fn();
global.confirm = mockConfirm;
global.alert = mockAlert;

const mockFetch = vi.fn();
global.fetch = mockFetch as never;

beforeEach(() => {
  mockRefresh.mockClear();
  mockConfirm.mockClear();
  mockAlert.mockClear();
  mockFetch.mockClear();
});

describe('RoleRowActions', () => {
  it('點擊 trigger 打開 dropdown 顯示「矩陣」', async () => {
    const user = userEvent.setup();
    render(<RoleRowActions roleId="r1" displayName="管理員" isSystem={false} userCount={0} />);

    await user.click(screen.getByTestId('role-row-actions-r1'));
    expect(screen.getByText('矩陣')).toBeTruthy();
  });

  it('矩陣連結指向 /admin/roles/:id/permissions', async () => {
    const user = userEvent.setup();
    render(<RoleRowActions roleId="r1" displayName="管理員" isSystem={false} userCount={0} />);

    await user.click(screen.getByTestId('role-row-actions-r1'));
    const link = screen.getByTestId('role-row-matrix-r1').closest('a');
    expect(link?.getAttribute('href')).toBe('/admin/roles/r1/permissions');
  });

  it('isSystem=true 時不顯示刪除', async () => {
    const user = userEvent.setup();
    render(<RoleRowActions roleId="r1" displayName="admin" isSystem={true} userCount={0} />);

    await user.click(screen.getByTestId('role-row-actions-r1'));
    expect(screen.queryByTestId('role-row-delete-r1')).toBeFalsy();
  });

  it('isSystem=false 時顯示刪除', async () => {
    const user = userEvent.setup();
    render(<RoleRowActions roleId="r1" displayName="custom" isSystem={false} userCount={0} />);

    await user.click(screen.getByTestId('role-row-actions-r1'));
    expect(screen.getByTestId('role-row-delete-r1')).toBeTruthy();
  });

  it('點擊刪除 → confirm 包含 role name + DELETE API', async () => {
    const user = userEvent.setup();
    mockConfirm.mockReturnValue(true);
    mockFetch.mockResolvedValueOnce({ ok: true });

    render(<RoleRowActions roleId="r1" displayName="自定義" isSystem={false} userCount={0} />);

    await user.click(screen.getByTestId('role-row-actions-r1'));
    await user.click(screen.getByTestId('role-row-delete-r1'));

    expect(mockConfirm).toHaveBeenCalledWith("確定要刪除 role '自定義'?");
    expect(mockFetch).toHaveBeenCalledWith('/api/admin/roles/r1', { method: 'DELETE' });
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('confirm 取消時不呼叫 API', async () => {
    const user = userEvent.setup();
    mockConfirm.mockReturnValue(false);

    render(<RoleRowActions roleId="r1" displayName="x" isSystem={false} userCount={0} />);
    await user.click(screen.getByTestId('role-row-actions-r1'));
    await user.click(screen.getByTestId('role-row-delete-r1'));

    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('有 user 時 confirm 警告包含用戶數', async () => {
    const user = userEvent.setup();
    mockConfirm.mockReturnValue(true);
    mockFetch.mockResolvedValueOnce({ ok: true });

    render(<RoleRowActions roleId="r1" displayName="x" isSystem={false} userCount={5} />);
    await user.click(screen.getByTestId('role-row-actions-r1'));
    await user.click(screen.getByTestId('role-row-delete-r1'));

    expect(mockConfirm).toHaveBeenCalledWith(expect.stringContaining('5 個用戶指派'));
  });
});