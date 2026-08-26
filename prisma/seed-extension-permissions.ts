// Extension Permission Seeder (Sprint 23 Task 3)
//
// Purpose: scan extensions/*/manifest.json and create permission records in DB
//          for the admin role (idempotent upsert)
//
// Usage:   await seedExtensionPermissions(db);
//          (called from prisma/seed.ts after seedRBAC)

import fs from 'node:fs';
import path from 'node:path';
import type { PrismaClient } from '@prisma/client';
import { getExtensionLoader } from '../lib/extensions/extension-loader';

const EXTENSIONS_DIR = path.join(process.cwd(), 'extensions');
const ADMIN_ROLE_NAME = 'admin';

export type ExtensionManifestSummary = {
  name: string;
  permissions: string[];
};

export function loadExtensionManifestsFromFilesystem(
  extensionsDir: string = EXTENSIONS_DIR,
): ExtensionManifestSummary[] {
  if (!fs.existsSync(extensionsDir)) {
    return [];
  }

  const dirs = fs
    .readdirSync(extensionsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const results: ExtensionManifestSummary[] = [];

  for (const dir of dirs) {
    const manifestPath = path.join(extensionsDir, dir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) continue;

    try {
      const content = fs.readFileSync(manifestPath, 'utf-8');
      const manifest = JSON.parse(content);
      if (manifest.name && Array.isArray(manifest.permissions)) {
        results.push({
          name: manifest.name,
          permissions: manifest.permissions,
        });
      }
    } catch (err) {
      console.warn(
        `[seed-extension-permissions] Failed to read ${manifestPath}:`,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  return results;
}

export async function seedExtensionPermissions(
  db: PrismaClient,
): Promise<void> {
  const manifests = loadExtensionManifestsFromFilesystem();

  if (manifests.length === 0) {
    console.log('[seed-extension-permissions] No extensions found, skipping');
    return;
  }

  const allPermissions = new Set<string>();
  for (const m of manifests) {
    for (const p of m.permissions) {
      allPermissions.add(p);
    }
  }

  const adminRole = await db.role.findUnique({
    where: { name: ADMIN_ROLE_NAME },
  });
  if (!adminRole) {
    console.warn(
      '[seed-extension-permissions] Admin role not found, skipping (run seedRBAC first)',
    );
    return;
  }

  let createdCount = 0;

  for (const code of allPermissions) {
    try {
      await db.permission.upsert({
        where: {
          roleId_code: { roleId: adminRole.id, code },
        },
        update: {},
        create: {
          roleId: adminRole.id,
          code,
        },
      });
      createdCount++;
    } catch {
      // ignore duplicate or constraint errors
    }
  }

  console.log(
    `[seed-extension-permissions] Created ${ createdCount } permissions for admin role from ${ manifests.length } extensions`,
  );
}

export async function syncExtensionPermissionsFromRegistry(
  db: PrismaClient,
): Promise<void> {
  const loader = getExtensionLoader();
  const extensions = loader.list();

  const allPermissions = new Set<string>();
  for (const ext of extensions) {
    for (const p of ext.permissions ?? []) {
      allPermissions.add(p);
    }
  }

  const adminRole = await db.role.findUnique({
    where: { name: ADMIN_ROLE_NAME },
  });
  if (!adminRole) return;

  for (const code of allPermissions) {
    await db.permission.upsert({
      where: {
        roleId_code: { roleId: adminRole.id, code },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        code,
      },
    });
  }
}