/**
 * TDD Gate 1 — S5.3 TD-405 Extension State 改用 Prisma
 *
 * 涵蓋：
 * 1. 列出 Extensions（filesystem scan + Prisma 查 enabled 狀態）
 * 2. 切換啟用/停用（Prisma upsert）
 * 3. 取得單個 Extension 詳細（filesystem + Prisma）
 * 4. isExtensionEnabled 預設 true（DB 無 row）
 * 5. 多實例一致性（DB 是唯一 source of truth）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

vi.mock('@/lib/db', () => ({
  db: {
    extension: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import {
  listInstalledExtensions,
  getExtensionDetail,
  toggleExtension,
  isExtensionEnabled,
} from './extension-manager';
import { db } from '@/lib/db';

const mockDb = db as unknown as {
  extension: {
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
  };
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ==============================================
// 1. listInstalledExtensions
// ==============================================

describe('TD-405 listInstalledExtensions', () => {
  it('列出 extensions/ 目錄下所有 manifest.json', async () => {
    mockDb.extension.findMany.mockResolvedValueOnce([]);

    const list = await listInstalledExtensions();

    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(list.find((e) => e.name === 'todo')).toBeDefined();
    expect(list.find((e) => e.name === 'event')).toBeDefined();
  });

  it('每個 Extension 含完整 manifest 字段', async () => {
    mockDb.extension.findMany.mockResolvedValueOnce([]);

    const list = await listInstalledExtensions();
    const todo = list.find((e) => e.name === 'todo')!;

    expect(todo.name).toBe('todo');
    expect(todo.version).toBeTruthy();
    expect(todo.hooks).toBeDefined();
    expect(todo.actions).toBeDefined();
    expect(todo.computed).toBeDefined();
  });

  it('DB 沒有 row 時 isEnabled 預設 true', async () => {
    mockDb.extension.findMany.mockResolvedValueOnce([]);

    const list = await listInstalledExtensions();

    for (const ext of list) {
      expect(ext.isEnabled).toBe(true);
    }
  });

  it('DB 有 row 時套用 Prisma 的 isEnabled', async () => {
    mockDb.extension.findMany.mockResolvedValueOnce([
      { name: 'todo', isEnabled: false },
      { name: 'event', isEnabled: true },
    ]);

    const list = await listInstalledExtensions();
    const todo = list.find((e) => e.name === 'todo')!;
    const event = list.find((e) => e.name === 'event')!;

    expect(todo.isEnabled).toBe(false);
    expect(event.isEnabled).toBe(true);
  });

  it('用 Prisma findMany 一次性查所有 extensions（避免 N+1）', async () => {
    mockDb.extension.findMany.mockResolvedValueOnce([]);

    await listInstalledExtensions();

    expect(mockDb.extension.findMany).toHaveBeenCalledTimes(1);
  });

  it('無 manifest.json 的目錄會被跳過', async () => {
    mockDb.extension.findMany.mockResolvedValueOnce([]);

    const list = await listInstalledExtensions();
    const names = list.map((e) => e.name);

    expect(names).not.toContain('_internal');
    expect(names).not.toContain('node_modules');
  });
});

// ==============================================
// 2. getExtensionDetail
// ==============================================

describe('TD-405 getExtensionDetail', () => {
  beforeEach(() => {
    mockDb.extension.findUnique.mockReset();
  });

  it('取得 Extension 詳細資訊（含 Prisma isEnabled）', async () => {
    mockDb.extension.findUnique.mockResolvedValueOnce({ isEnabled: true });

    const detail = await getExtensionDetail('todo');

    expect(detail).not.toBeNull();
    expect(detail!.manifest.name).toBe('todo');
    expect(detail!.counts.hooks).toBeGreaterThan(0);
    expect(detail!.counts.actions).toBeGreaterThan(0);
    expect(detail!.counts.computed).toBeGreaterThan(0);
    expect(detail!.manifest.isEnabled).toBe(true);
  });

  it('DB 標記 disabled 時 manifest 反映', async () => {
    mockDb.extension.findUnique.mockResolvedValueOnce({ isEnabled: false });

    const detail = await getExtensionDetail('todo');

    expect(detail!.manifest.isEnabled).toBe(false);
  });

  it('不存在的 Extension 返回 null', async () => {
    expect(await getExtensionDetail('not-exist')).toBeNull();
    expect(mockDb.extension.findUnique).not.toHaveBeenCalled();
  });

  it('含 README 路徑', async () => {
    mockDb.extension.findUnique.mockResolvedValueOnce({ isEnabled: true });

    const detail = await getExtensionDetail('todo');

    expect(detail!.readmePath).toBeTruthy();
    expect(detail!.readmePath).toContain('README.md');
  });
});

// ==============================================
// 3. toggleExtension
// ==============================================

describe('TD-405 toggleExtension', () => {
  beforeEach(() => {
    mockDb.extension.findUnique.mockReset();
    mockDb.extension.upsert.mockReset();
  });

  it('DB 無 row 時從 true 翻轉到 false', async () => {
    mockDb.extension.findUnique.mockResolvedValueOnce(null);
    mockDb.extension.upsert.mockResolvedValueOnce({ isEnabled: false });

    const after = await toggleExtension('todo');

    expect(after).toBe(false);
    expect(mockDb.extension.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { name: 'todo' },
        update: { isEnabled: false },
      }),
    );
  });

  it('DB 有 enabled=true 時翻轉到 false', async () => {
    mockDb.extension.findUnique.mockResolvedValueOnce({ isEnabled: true });
    mockDb.extension.upsert.mockResolvedValueOnce({ isEnabled: false });

    const after = await toggleExtension('todo');

    expect(after).toBe(false);
  });

  it('DB 有 enabled=false 時翻轉到 true', async () => {
    mockDb.extension.findUnique.mockResolvedValueOnce({ isEnabled: false });
    mockDb.extension.upsert.mockResolvedValueOnce({ isEnabled: true });

    const after = await toggleExtension('todo');

    expect(after).toBe(true);
  });

  it('不存在的 Extension 返回 null', async () => {
    const after = await toggleExtension('not-exist');

    expect(after).toBeNull();
    expect(mockDb.extension.findUnique).not.toHaveBeenCalled();
    expect(mockDb.extension.upsert).not.toHaveBeenCalled();
  });

  it('upsert 失敗時拋出錯誤（不靜默失敗）', async () => {
    mockDb.extension.findUnique.mockResolvedValueOnce({ isEnabled: true });
    mockDb.extension.upsert.mockRejectedValueOnce(new Error('DB down'));

    await expect(toggleExtension('todo')).rejects.toThrow('DB down');
  });
});

// ==============================================
// 4. isExtensionEnabled
// ==============================================

describe('TD-405 isExtensionEnabled', () => {
  beforeEach(() => {
    mockDb.extension.findUnique.mockReset();
  });

  it('DB 有 row 時返回 row.isEnabled', async () => {
    mockDb.extension.findUnique.mockResolvedValueOnce({ isEnabled: false });

    expect(await isExtensionEnabled('todo')).toBe(false);
  });

  it('DB 無 row 時預設 true（未明確停用 = 啟用）', async () => {
    mockDb.extension.findUnique.mockResolvedValueOnce(null);

    expect(await isExtensionEnabled('todo')).toBe(true);
  });

  it('不存在的 Extension（無 manifest.json）返回 false', async () => {
    expect(await isExtensionEnabled('not-exist')).toBe(false);
    expect(mockDb.extension.findUnique).not.toHaveBeenCalled();
  });
});

// ==============================================
// 5. 多實例一致性（DB 是唯一 source of truth）
// ==============================================

describe('TD-405 多實例一致性', () => {
  it('不寫 .extension-state.json（filesystem 不再是 source of truth）', async () => {
    mockDb.extension.findUnique.mockResolvedValueOnce({ isEnabled: true });
    mockDb.extension.upsert.mockResolvedValueOnce({ isEnabled: false });

    await toggleExtension('todo');

    expect(fs.existsSync(path.join(process.cwd(), '.extension-state.json'))).toBe(false);
  });
});
