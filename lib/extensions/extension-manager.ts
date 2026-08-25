/**
 * ==============================================
 *  Extension Manager — TD-405 Prisma 持久化
 * ==============================================
 *
 * 對應：docs/prd/07-extension-system.md
 *
 * 提供：
 * 1. 列出已安裝的 Extensions（filesystem scan manifest + Prisma 查 isEnabled）
 * 2. 取得 Extension 詳細資訊（filesystem + Prisma）
 * 3. 切換啟用/停用狀態（Prisma upsert）
 *
 * 設計：
 * - Extension 「安裝」= 存在於 extensions/ 目錄（filesystem 是 source of truth）
 * - Extension 「啟用」= Prisma Extension.isEnabled（DB 是 source of truth）
 * - 多實例一致性：所有實例共享同一個 Postgres，狀態自動同步
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { db } from '@/lib/db';

const EXTENSIONS_DIR = path.join(process.cwd(), 'extensions');

// ==============================================
// 類型
// ==============================================

export type ExtensionManifestView = {
  name: string;
  version: string;
  label?: string;
  description?: string;
  author?: string;
  hooks?: string[];
  actions?: string[];
  computed?: string[];
  workflows?: string[];
  permissions?: string[];
  dependencies?: string[];
  nav?: {
    path: string;       // Sidebar 連結路徑，如 '/admin/blog'
    label: string;      // Sidebar 顯示名，如 '部落格'
    order?: number;     // 排序（未設則按 manifest 讀取順序）
  };
  isEnabled: boolean;
};

export type ExtensionDetail = {
  manifest: ExtensionManifestView;
  counts: {
    hooks: number;
    actions: number;
    computed: number;
    workflows: number;
  };
  readmePath?: string;
  specPath?: string;
};

// ==============================================
// 內部工具
// ==============================================

function readManifest(
  name: string,
): Omit<ExtensionManifestView, 'isEnabled'> | null {
  const manifestPath = path.join(EXTENSIONS_DIR, name, 'manifest.json');
  if (!fs.existsSync(manifestPath)) return null;
  try {
    return JSON.parse(
      fs.readFileSync(manifestPath, 'utf-8'),
    ) as Omit<ExtensionManifestView, 'isEnabled'>;
  } catch {
    return null;
  }
}

function countFiles(dir: string): number {
  return fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => f.endsWith('.ts')).length
    : 0;
}

// ==============================================
// 1. 列出 Extensions
// ==============================================

export async function listInstalledExtensions(): Promise<ExtensionManifestView[]> {
  if (!fs.existsSync(EXTENSIONS_DIR)) return [];

  const entries = fs.readdirSync(EXTENSIONS_DIR, { withFileTypes: true });
  const manifests: Omit<ExtensionManifestView, 'isEnabled'>[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('_') || entry.name === 'node_modules') continue;
    const m = readManifest(entry.name);
    if (m) manifests.push(m);
  }

  if (manifests.length === 0) return [];

  // 一次性 batch 查 Prisma 拿所有 enabled 狀態
  const names = manifests.map((m) => m.name);
  const rows = await db.extension.findMany({
    where: { name: { in: names } },
    select: { name: true, isEnabled: true },
  });
  const enabledMap = new Map(rows.map((r) => [r.name, r.isEnabled]));

  return manifests
    .map((manifest) => ({
      ...manifest,
      isEnabled: enabledMap.get(manifest.name) ?? true,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// ==============================================
// 2. Extension 詳細資訊
// ==============================================

export async function getExtensionDetail(
  name: string,
): Promise<ExtensionDetail | null> {
  const extDir = path.join(EXTENSIONS_DIR, name);
  const manifest = readManifest(name);
  if (!manifest) return null;

  try {
    const row = await db.extension.findUnique({
      where: { name },
      select: { isEnabled: true },
    });

    const readmePath = path.join(extDir, 'README.md');
    const specPath = path.join(extDir, `${name}-spec.json`);

    return {
      manifest: { ...manifest, isEnabled: row?.isEnabled ?? true },
      counts: {
        hooks: countFiles(path.join(extDir, 'hooks')),
        actions: countFiles(path.join(extDir, 'actions')),
        computed: countFiles(path.join(extDir, 'computed')),
        workflows: countFiles(path.join(extDir, 'workflows')),
      },
      readmePath: fs.existsSync(readmePath) ? readmePath : undefined,
      specPath: fs.existsSync(specPath) ? specPath : undefined,
    };
  } catch {
    return null;
  }
}

// ==============================================
// 3. 啟用/停用切換
// ==============================================

export async function isExtensionEnabled(name: string): Promise<boolean> {
  // Extension 不存在 → false（filesystem 是安裝的唯一 source of truth）
  const manifest = readManifest(name);
  if (!manifest) return false;

  const row = await db.extension.findUnique({
    where: { name },
    select: { isEnabled: true },
  });
  // 預設啟用（未明確停用 = 啟用）
  return row?.isEnabled ?? true;
}

export async function toggleExtension(
  name: string,
): Promise<boolean | null> {
  // 確認 Extension 存在於 filesystem
  const manifest = readManifest(name);
  if (!manifest) return null;

  const existing = await db.extension.findUnique({
    where: { name },
    select: { isEnabled: true },
  });
  const newEnabled = !(existing?.isEnabled ?? true);

  await db.extension.upsert({
    where: { name },
    create: {
      name,
      version: manifest.version ?? '0.0.0',
      manifest: manifest as object,
      isEnabled: newEnabled,
      isBuiltIn: true,
    },
    update: { isEnabled: newEnabled },
  });

  return newEnabled;
}
