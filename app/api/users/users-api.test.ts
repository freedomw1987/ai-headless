/**
 * TDD Gate 1 — US-102 /api/users API 整合測試
 *
 * 守護：
 * 1. GET /api/users — 列表（admin/editor 可看）
 * 2. POST /api/users — 新增（僅 admin）
 * 3. PATCH /api/users/[id] — 更新（僅 admin）
 * 4. DELETE /api/users/[id] — 軟刪除（設 isActive=false）（僅 admin）
 * 5. viewer 無法寫入
 * 6. 未登入 → 401
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ==============================================
// Mock auth（讓測試可控）
// ==============================================

let mockSession: { user: { id: string; role: 'admin' | 'editor' | 'viewer' } } | null = null;

vi.mock('@/lib/auth/auth', () => ({
  getCurrentUser: vi.fn(() => Promise.resolve(mockSession?.user ?? null)),
  requireUser: vi.fn(() => {
    if (!mockSession) throw new Error('Unauthorized');
    return Promise.resolve(mockSession.user);
  }),
  requirePermission: vi.fn((perm: string) => {
    if (!mockSession) throw new Error('Unauthorized');
    if (perm === 'user.manage' && mockSession.user.role !== 'admin') {
      throw new Error('Forbidden');
    }
    return Promise.resolve(mockSession);
  }),
  hasPermission: vi.fn((role: string, perm: string) => {
    if (role === 'admin') return true;
    if (perm === 'user.manage') return false;
    return true;
  }),
}));

// Mock prisma
let mockUsers: Array<{
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
}> = [];

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findMany: vi.fn(({ where }: { where?: { isActive?: boolean } } = {}) => {
        let result = mockUsers;
        if (where?.isActive !== undefined) {
          result = result.filter((u) => u.isActive === where.isActive);
        }
        return Promise.resolve(result);
      }),
      count: vi.fn(() => Promise.resolve(mockUsers.length)),
      findUnique: vi.fn(({ where }: { where: { id?: string; email?: string } }) => {
        return Promise.resolve(
          mockUsers.find((u) =>
            (where.id && u.id === where.id) || (where.email && u.email === where.email),
          ) ?? null,
        );
      }),
      create: vi.fn(({ data }: { data: typeof mockUsers[number] }) => {
        const newUser = { ...data, createdAt: new Date(), id: `u-${Date.now()}-${Math.random()}` };
        mockUsers.push(newUser);
        return Promise.resolve(newUser);
      }),
      update: vi.fn(({ where, data }: { where: { id: string }; data: Partial<typeof mockUsers[number]> }) => {
        const u = mockUsers.find((x) => x.id === where.id);
        if (!u) throw new Error('Not found');
        Object.assign(u, data);
        return Promise.resolve(u);
      }),
    },
  },
}));

// 在 mock 設定後才 import route handler
const { GET, POST } = await import('./route');
const { GET: GET_ONE, PATCH, DELETE } = await import('./[id]/route');

// ==============================================
// 1. 認證守衛
// ==============================================

describe('US-102 /api/users > 認證守衛', () => {
  beforeEach(() => {
    mockUsers = [];
    mockSession = null;
  });

  it('未登入 GET → 401', async () => {
    const req = new Request('http://localhost/api/users');
    await expect(GET(req as never)).rejects.toThrow(/Unauthorized/);
  });

  it('未登入 POST → 401', async () => {
    const req = new Request('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.com', password: 'pw' }),
    });
    await expect(POST(req as never)).rejects.toThrow(/Unauthorized/);
  });
});

// ==============================================
// 2. GET /api/users
// ==============================================

describe('US-102 GET /api/users', () => {
  beforeEach(() => {
    mockUsers = [
      { id: 'u1', email: 'a@b.com', name: 'Alice', role: 'admin', isActive: true, createdAt: new Date() },
      { id: 'u2', email: 'c@d.com', name: 'Carol', role: 'viewer', isActive: true, createdAt: new Date() },
    ];
  });

  it('admin 可看所有用戶', async () => {
    mockSession = { user: { id: 'me', role: 'admin' } };
    const req = new Request('http://localhost/api/users');
    const res = await GET(req as never);
    const data = await res.json();
    expect(data.users.length).toBe(2);
    expect(data.total).toBe(2);
  });

  it('viewer 可看列表（read 權限）', async () => {
    mockSession = { user: { id: 'me', role: 'viewer' } };
    const req = new Request('http://localhost/api/users');
    const res = await GET(req as never);
    expect(res.status).toBe(200);
  });
});

// ==============================================
// 3. POST /api/users（僅 admin）
// ==============================================

describe('US-102 POST /api/users', () => {
  beforeEach(() => {
    mockUsers = [];
  });

  it('admin 新增用戶', async () => {
    mockSession = { user: { id: 'me', role: 'admin' } };
    const req = new Request('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({
        email: 'new@b.com',
        name: 'New User',
        password: 'pw1234',
        role: 'editor',
      }),
    });
    const res = await POST(req as never);
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.user.email).toBe('new@b.com');
    expect(data.user.role).toBe('editor');
    expect(mockUsers.length).toBe(1);
  });

  it('editor 新增用戶 → 403', async () => {
    mockSession = { user: { id: 'me', role: 'editor' } };
    const req = new Request('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({ email: 'new@b.com', password: 'pw' }),
    });
    await expect(POST(req as never)).rejects.toThrow(/Forbidden/);
  });

  it('viewer 新增用戶 → 403', async () => {
    mockSession = { user: { id: 'me', role: 'viewer' } };
    const req = new Request('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({ email: 'new@b.com', password: 'pw' }),
    });
    await expect(POST(req as never)).rejects.toThrow(/Forbidden/);
  });

  it('缺少密碼 → 400', async () => {
    mockSession = { user: { id: 'me', role: 'admin' } };
    const req = new Request('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({ email: 'new@b.com' }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it('email 已存在 → 400', async () => {
    mockSession = { user: { id: 'me', role: 'admin' } };
    mockUsers.push({
      id: 'existing',
      email: 'dup@b.com',
      name: null,
      role: 'viewer',
      isActive: true,
      createdAt: new Date(),
    });
    const req = new Request('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({ email: 'dup@b.com', password: 'pw123' }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });
});

// ==============================================
// 4. PATCH /api/users/[id]（僅 admin）
// ==============================================

describe('US-102 PATCH /api/users/[id]', () => {
  beforeEach(() => {
    mockUsers = [
      { id: 'u1', email: 'a@b.com', name: 'Alice', role: 'admin', isActive: true, createdAt: new Date() },
    ];
  });

  it('admin 修改 role', async () => {
    mockSession = { user: { id: 'me', role: 'admin' } };
    const req = new Request('http://localhost/api/users/u1', {
      method: 'PATCH',
      body: JSON.stringify({ role: 'editor' }),
    });
    const res = await PATCH(req as never, { params: Promise.resolve({ id: 'u1' }) });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.user.role).toBe('editor');
  });

  it('editor 修改 role → 403', async () => {
    mockSession = { user: { id: 'me', role: 'editor' } };
    const req = new Request('http://localhost/api/users/u1', {
      method: 'PATCH',
      body: JSON.stringify({ role: 'viewer' }),
    });
    await expect(
      PATCH(req as never, { params: Promise.resolve({ id: 'u1' }) }),
    ).rejects.toThrow(/Forbidden/);
  });

  it('不存在 id → 404', async () => {
    mockSession = { user: { id: 'me', role: 'admin' } };
    const req = new Request('http://localhost/api/users/nonexistent', {
      method: 'PATCH',
      body: JSON.stringify({ role: 'viewer' }),
    });
    const res = await PATCH(req as never, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);
  });
});

// ==============================================
// 5. DELETE /api/users/[id]（僅 admin，軟刪除）
// ==============================================

describe('US-102 DELETE /api/users/[id]', () => {
  beforeEach(() => {
    mockUsers = [
      { id: 'u1', email: 'a@b.com', name: 'Alice', role: 'admin', isActive: true, createdAt: new Date() },
      { id: 'u2', email: 'b@b.com', name: 'Bob', role: 'editor', isActive: true, createdAt: new Date() },
    ];
  });

  it('admin 軟刪除（設 isActive=false）', async () => {
    mockSession = { user: { id: 'me', role: 'admin' } };
    const req = new Request('http://localhost/api/users/u2', { method: 'DELETE' });
    const res = await DELETE(req as never, { params: Promise.resolve({ id: 'u2' }) });
    expect(res.status).toBe(200);
    expect(mockUsers.find((u) => u.id === 'u2')?.isActive).toBe(false);
  });

  it('admin 不能刪除自己', async () => {
    mockSession = { user: { id: 'me', role: 'admin' } };
    mockUsers.push({
      id: 'me',
      email: 'me@b.com',
      name: null,
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
    });
    const req = new Request('http://localhost/api/users/me', { method: 'DELETE' });
    const res = await DELETE(req as never, { params: Promise.resolve({ id: 'me' }) });
    expect(res.status).toBe(400);
  });

  it('editor 刪除 → 403', async () => {
    mockSession = { user: { id: 'me', role: 'editor' } };
    const req = new Request('http://localhost/api/users/u2', { method: 'DELETE' });
    await expect(
      DELETE(req as never, { params: Promise.resolve({ id: 'u2' }) }),
    ).rejects.toThrow(/Forbidden/);
  });
});

// ==============================================
// 6. GET /api/users/[id]
// ==============================================

describe('US-102 GET /api/users/[id]', () => {
  beforeEach(() => {
    mockUsers = [
      { id: 'u1', email: 'a@b.com', name: 'Alice', role: 'admin', isActive: true, createdAt: new Date() },
    ];
  });

  it('admin 看單一用戶', async () => {
    mockSession = { user: { id: 'me', role: 'admin' } };
    const req = new Request('http://localhost/api/users/u1');
    const res = await GET_ONE(req as never, { params: Promise.resolve({ id: 'u1' }) });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.user.id).toBe('u1');
  });

  it('不存在 id → 404', async () => {
    mockSession = { user: { id: 'me', role: 'admin' } };
    const req = new Request('http://localhost/api/users/nonexistent');
    const res = await GET_ONE(req as never, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);
  });
});