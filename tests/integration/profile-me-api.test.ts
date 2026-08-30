/**
 * Sprint 29-3 — /api/profile/me API 測試
 *
 * 設計：
 * - PATCH /api/profile/me：更新當前登入用戶的 profile
 * - 可更新：name, image URL
 * - 變更密碼：需提供 currentPassword 驗證 + newPassword（≥6字）
 * - 不能改 email（避免帳號混淆）+ 不能改 role（權限管理由 admin 處理）
 *
 * Gate 1 TDD：先寫失敗測試 → 實作 → 通過
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH } from '@/app/api/profile/me/route';

// Mock requireUser
const mockSessionUser = {
  id: 'user-1',
  email: 'admin@example.com',
  name: 'Admin',
  role: 'admin' as const,
};

vi.mock('@/lib/auth/auth', () => ({
  requireUser: vi.fn(async () => mockSessionUser),
}));

// Mock db
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock password helpers
vi.mock('@/lib/auth/password', () => ({
  hashPassword: vi.fn(async (pw: string) => `hashed-${pw}`),
  verifyPassword: vi.fn(async (plain: string, hash: string) => {
    // 測試規則：傳入 'wrong' 的 password 視為錯誤
    return plain !== 'wrong' && hash === `hashed-${plain}`;
  }),
}));

import { db } from '@/lib/db';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PATCH /api/profile/me', () => {
  it('未登入 → 401', async () => {
    const { requireUser } = await import('@/lib/auth/auth');
    vi.mocked(requireUser).mockResolvedValueOnce(null as never);

    const req = new Request('http://test/api/profile/me', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'New' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });

  it('更新 name → 成功', async () => {
    vi.mocked(db.user.update).mockResolvedValueOnce({
      id: 'user-1',
      email: 'admin@example.com',
      name: 'New Name',
      image: null,
    } as never);

    const req = new Request('http://test/api/profile/me', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'New Name' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.user.name).toBe('New Name');
  });

  it('更新 image URL → 成功', async () => {
    vi.mocked(db.user.update).mockResolvedValueOnce({
      id: 'user-1',
      email: 'admin@example.com',
      name: 'Admin',
      image: 'https://example.com/avatar.jpg',
    } as never);

    const req = new Request('http://test/api/profile/me', {
      method: 'PATCH',
      body: JSON.stringify({ image: 'https://example.com/avatar.jpg' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
  });

  it('name 是空字串 → 視為清空（name = null）', async () => {
    vi.mocked(db.user.update).mockResolvedValueOnce({
      id: 'user-1',
      email: 'admin@example.com',
      name: null,
      image: null,
    } as never);

    const req = new Request('http://test/api/profile/me', {
      method: 'PATCH',
      body: JSON.stringify({ name: '' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);

    const updateArg = vi.mocked(db.user.update).mock.calls[0]?.[0] as { data: { name?: string | null } };
    expect(updateArg.data.name).toBeNull();
  });

  it('變更密碼需要 currentPassword', async () => {
    const req = new Request('http://test/api/profile/me', {
      method: 'PATCH',
      body: JSON.stringify({ newPassword: 'newsecret' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/currentPassword/);
  });

  it('currentPassword 錯誤 → 401', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({
      id: 'user-1',
      passwordHash: 'hashed-wrong', // 任何非正確 hash
    } as never);

    const req = new Request('http://test/api/profile/me', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword: 'wrong', newPassword: 'newsecret' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });

  it('currentPassword 正確 + newPassword 有效 → 變更成功', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({
      id: 'user-1',
      passwordHash: 'hashed-oldPass',
    } as never);
    vi.mocked(db.user.update).mockResolvedValueOnce({
      id: 'user-1',
    } as never);

    const req = new Request('http://test/api/profile/me', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword: 'oldPass', newPassword: 'newSecret123' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
  });

  it('newPassword < 6 字 → 400', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({
      id: 'user-1',
      passwordHash: 'hashed-oldPass',
    } as never);

    const req = new Request('http://test/api/profile/me', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword: 'oldPass', newPassword: '123' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/至少 6 字/);
  });

  it('嘗試改 email → 400', async () => {
    const req = new Request('http://test/api/profile/me', {
      method: 'PATCH',
      body: JSON.stringify({ email: 'hacked@evil.com' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });

  it('嘗試改 role → 400', async () => {
    const req = new Request('http://test/api/profile/me', {
      method: 'PATCH',
      body: JSON.stringify({ role: 'superadmin' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });
});