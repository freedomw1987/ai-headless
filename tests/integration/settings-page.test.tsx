/**
 * Sprint 29-3 — Settings Page TDD
 *
 * 設計：
 * - /admin/settings (Server Component)
 * - 顯示當前用戶的 name, image, email (唯讀), role (唯讀)
 * - Form: 編輯 name, image URL
 * - Change password section: currentPassword + newPassword
 * - 提交後 fetch /api/profile/me
 * - 成功 → toast 通知 + router.refresh()
 *
 * Gate 1 TDD：先寫失敗測試 → 實作 → 通過
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsForm } from '@/app/admin/settings/settings-form';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockFetch = vi.fn();
global.fetch = mockFetch as never;

beforeEach(() => {
  mockFetch.mockClear();
});

const baseUser = {
  id: 'user-1',
  email: 'admin@example.com',
  name: 'Admin',
  image: null as string | null,
  role: 'admin' as const,
};

describe('SettingsForm — Profile 區', () => {
  it('顯示當前用戶 name（可編輯）', () => {
    render(<SettingsForm user={baseUser} />);
    const nameInput = screen.getByTestId('settings-name-input');
    expect(nameInput).toBeTruthy();
    expect((nameInput as HTMLInputElement).value).toBe('Admin');
  });

  it('顯示當前用戶 image URL（可編輯）', () => {
    render(<SettingsForm user={{ ...baseUser, image: 'https://example.com/a.jpg' }} />);
    const imageInput = screen.getByTestId('settings-image-input');
    expect((imageInput as HTMLInputElement).value).toBe('https://example.com/a.jpg');
  });

it('顯示 email 為唯讀', () => {
    render(<SettingsForm user={baseUser} />);
    const emailInput = screen.getByTestId('settings-email-display') as HTMLInputElement;
    expect(emailInput.value).toBe('admin@example.com');
    // email 應該 disabled
    expect(emailInput.disabled).toBe(true);
  });

  it('顯示 role 為唯讀', () => {
    render(<SettingsForm user={baseUser} />);
    expect(screen.getByTestId('settings-role-display').textContent).toContain('admin');
  });

  it('提交 Profile 區 → 呼叫 PATCH /api/profile/me with name', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ user: { ...baseUser, name: 'New Name' } }),
    });
    const user = userEvent.setup();
    render(<SettingsForm user={baseUser} />);

    const nameInput = screen.getByTestId('settings-name-input');
    await user.clear(nameInput);
    await user.type(nameInput, 'New Name');

    await user.click(screen.getByTestId('settings-profile-save'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/profile/me', expect.objectContaining({
        method: 'PATCH',
        body: expect.stringContaining('"name":"New Name"'),
      }));
    });
  });
});

describe('SettingsForm — Change Password 區', () => {
  it('顯示 currentPassword + newPassword 輸入', () => {
    render(<SettingsForm user={baseUser} />);
    expect(screen.getByTestId('settings-current-password-input')).toBeTruthy();
    expect(screen.getByTestId('settings-new-password-input')).toBeTruthy();
  });

  it('輸入都是 password type (遮罩)', () => {
    render(<SettingsForm user={baseUser} />);
    expect((screen.getByTestId('settings-current-password-input') as HTMLInputElement).type).toBe('password');
    expect((screen.getByTestId('settings-new-password-input') as HTMLInputElement).type).toBe('password');
  });

  it('提交 Change Password → PATCH with currentPassword + newPassword', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ user: baseUser }),
    });
    const user = userEvent.setup();
    render(<SettingsForm user={baseUser} />);

    await user.type(screen.getByTestId('settings-current-password-input'), 'oldPass');
    await user.type(screen.getByTestId('settings-new-password-input'), 'newSecret123');
    await user.click(screen.getByTestId('settings-password-save'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/profile/me', expect.objectContaining({
        method: 'PATCH',
        body: expect.stringContaining('"currentPassword":"oldPass"'),
      }));
    });
  });
});

describe('SettingsForm — 錯誤處理', () => {
  it('API 回傳 error → 顯示錯誤訊息', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'currentPassword 錯誤' }),
    });
    const user = userEvent.setup();
    render(<SettingsForm user={baseUser} />);

    await user.type(screen.getByTestId('settings-current-password-input'), 'wrong');
    await user.type(screen.getByTestId('settings-new-password-input'), 'newSecret123');
    await user.click(screen.getByTestId('settings-password-save'));

    await waitFor(() => {
      expect(screen.getByTestId('settings-error-message').textContent).toMatch(/currentPassword 錯誤/);
    });
  });

  it('成功 → 顯示 toast.success', async () => {
    const { toast } = await import('sonner');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ user: baseUser }),
    });
    const user = userEvent.setup();
    render(<SettingsForm user={baseUser} />);

    await user.type(screen.getByTestId('settings-current-password-input'), 'oldPass');
    await user.type(screen.getByTestId('settings-new-password-input'), 'newSecret123');
    await user.click(screen.getByTestId('settings-password-save'));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });
});