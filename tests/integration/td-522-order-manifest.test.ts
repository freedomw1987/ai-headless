/**
 * Sprint 11 — TD-522 Order Extension manifest 缺失修補
 *
 * 揭露：extensions/order/ 沒有 manifest.json，導致
 * extension-manager filesystem scan 漏掉，/api/extensions 看不到 order
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

describe('TD-522: Order Extension manifest 修補', () => {
  it('extensions/order/manifest.json 應該存在', () => {
    const manifestPath = path.join(ROOT, 'extensions/order/manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);
  });

  it('manifest.json 應該包含必要欄位', () => {
    const manifestPath = path.join(ROOT, 'extensions/order/manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    expect(manifest.name).toBe('order');
    expect(manifest.version).toBeDefined();
    expect(manifest.label).toBeDefined();
    expect(manifest.permissions).toBeInstanceOf(Array);
    expect(manifest.permissions.length).toBeGreaterThan(0);
  });
});
