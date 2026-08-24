/**
 * Sprint 9 補完 — Disable Guard Helper 測試
 *
 * 對應：lib/extensions/extension-enabled.ts + lib/extensions/api-guard.ts
 *
 * 涵蓋：
 * 1. isExtensionEnabledByName()：DB 有記錄 enabled / disabled / 沒記錄 → 預設啟用
 * 2. listEnabledExtensions()：返回 DB 標記 enabled 的 extensions
 * 3. guardExtensionApi()：disabled → 403，enabled → null（pass）
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isExtensionEnabledByName,
  listEnabledExtensions,
} from '@/lib/extensions/extension-enabled';
import { guardExtensionApi } from '@/lib/extensions/api-guard';

vi.mock('@/lib/db', () => ({
  db: {
    extension: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { db } from '@/lib/db';

describe('Disable Guard — isExtensionEnabledByName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('DB 有記錄且 isEnabled=true → 返回 true', async () => {
    vi.mocked(db.extension.findUnique).mockResolvedValue({
      isEnabled: true,
    } as never);

    const result = await isExtensionEnabledByName('blog');
    expect(result).toBe(true);
    expect(db.extension.findUnique).toHaveBeenCalledWith({
      where: { name: 'blog' },
      select: { isEnabled: true },
    });
  });

  it('DB 有記錄且 isEnabled=false → 返回 false（disabled）', async () => {
    vi.mocked(db.extension.findUnique).mockResolvedValue({
      isEnabled: false,
    } as never);

    const result = await isExtensionEnabledByName('blog');
    expect(result).toBe(false);
  });

  it('DB 沒記錄 → 預設啟用（返回 true）', async () => {
    vi.mocked(db.extension.findUnique).mockResolvedValue(null);

    const result = await isExtensionEnabledByName('blog');
    expect(result).toBe(true);
  });
});

describe('Disable Guard — listEnabledExtensions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('DB 有標記 enabled 的 extensions 出現在結果', async () => {
    vi.mocked(db.extension.findMany).mockResolvedValue([
      { name: 'blog', isEnabled: true },
      { name: 'event', isEnabled: true },
      { name: 'todo', isEnabled: false }, // disabled
    ] as never);

    const result = await listEnabledExtensions();
    expect(result).toEqual(expect.arrayContaining(['blog', 'event']));
    expect(result).not.toContain('todo'); // disabled 被過濾
  });

  it('DB 沒有任何記錄 → 返回空陣列（沒安裝任何 extension）', async () => {
    vi.mocked(db.extension.findMany).mockResolvedValue([] as never);

    const result = await listEnabledExtensions();
    expect(result).toEqual([]);
  });

  it('全部 disabled → 返回空陣列（Sidebar 完全隱藏）', async () => {
    vi.mocked(db.extension.findMany).mockResolvedValue([
      { name: 'blog', isEnabled: false },
      { name: 'event', isEnabled: false },
      { name: 'todo', isEnabled: false },
      { name: 'order', isEnabled: false },
    ] as never);

    const result = await listEnabledExtensions();
    expect(result).toEqual([]);
  });

  it('部分 disabled → 只返回 enabled 的（mixed 場景）', async () => {
    // blog 啟用、event disabled、todo disabled、order 沒記錄（不返回）
    vi.mocked(db.extension.findMany).mockResolvedValue([
      { name: 'blog', isEnabled: true },
      { name: 'event', isEnabled: false },
      { name: 'todo', isEnabled: false },
    ] as never);

    const result = await listEnabledExtensions();
    expect(result).toEqual(['blog']); // 只有 blog
  });
});

describe('Disable Guard — guardExtensionApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('extension enabled → 返回 null（允許繼續）', async () => {
    vi.mocked(db.extension.findUnique).mockResolvedValue({
      isEnabled: true,
    } as never);

    const result = await guardExtensionApi('blog');
    expect(result).toBeNull();
  });

  it('extension disabled → 返回 403 NextResponse', async () => {
    vi.mocked(db.extension.findUnique).mockResolvedValue({
      isEnabled: false,
    } as never);

    const result = await guardExtensionApi('blog');
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);

    const body = await result!.json();
    expect(body).toMatchObject({
      error: 'ExtensionDisabled',
      extension: 'blog',
    });
    expect(body.message).toContain('已停用');
  });

  it('extension 不存在於 DB → 視為啟用（返回 null）', async () => {
    vi.mocked(db.extension.findUnique).mockResolvedValue(null);

    const result = await guardExtensionApi('new-extension');
    expect(result).toBeNull();
  });

  it('不同 extension name 會查對應 name', async () => {
    vi.mocked(db.extension.findUnique).mockResolvedValue(null);

    await guardExtensionApi('event');
    expect(db.extension.findUnique).toHaveBeenCalledWith({
      where: { name: 'event' },
      select: { isEnabled: true },
    });
  });
});

describe('Disable Guard — 防呆與錯誤訊息', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('disabled response 包含中文錯誤訊息', async () => {
    vi.mocked(db.extension.findUnique).mockResolvedValue({
      isEnabled: false,
    } as never);

    const result = await guardExtensionApi('todo');
    const body = await result!.json();
    expect(body.message).toContain('todo');
  });

  it('disabled response status 正確設為 403（不是 400 或 500）', async () => {
    vi.mocked(db.extension.findUnique).mockResolvedValue({
      isEnabled: false,
    } as never);

    const result = await guardExtensionApi('order');
    expect(result!.status).toBe(403);
    expect([400, 401, 500]).not.toContain(result!.status);
  });
});