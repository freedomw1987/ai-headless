/**
 * Sprint 14 TECH-036b — 4 spec 全切換到 Dynamic CRUD
 *
 * 守護：
 * 1. spec.uiBase/apiBase 已不再需要（Sprint 14 dynamic route 統一）
 * 2. 舊手寫 route (`/api/blog`、`/api/order` 等) 已刪除
 * 3. 4 個 spec 都能透過 `/api/crud/<spec>` 路由（list/create/get/update/delete）
 * 4. Sidebar nav 連結指向 `/admin/crud/<spec>`
 * 5. 舊 `/admin/blog` 等 page 已刪除（讓位給 dynamic page）
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = process.cwd();

describe('TECH-036b — Dynamic CRUD cutover', () => {
  it('4 個 spec.json 不再使用 uiBase/apiBase（dynamic route 統一處理）', () => {
    for (const specName of ['blog', 'order', 'event', 'todo']) {
      const raw = fs.readFileSync(
        path.join(ROOT, `extensions/${specName}/${specName}-spec.json`),
        'utf-8',
      );
      const spec = JSON.parse(raw);
      expect(spec.apiBase, `${specName} 不應有 apiBase`).toBeUndefined();
      expect(spec.uiBase, `${specName} 不應有 uiBase`).toBeUndefined();
    }
  });

  it('舊手寫 API route 已刪除', () => {
    for (const dir of ['blog', 'order', 'event', 'todo']) {
      const apiPath = path.join(ROOT, `app/api/${dir}`);
      expect(fs.existsSync(apiPath), `舊 ${dir}/route.ts 應已刪除`).toBe(false);
    }
  });

  it('舊手寫 admin page 已刪除', () => {
    for (const dir of ['blog', 'orders', 'event', 'todo']) {
      const pagePath = path.join(ROOT, `app/admin/${dir}/page.tsx`);
      expect(fs.existsSync(pagePath), `舊 ${dir}/page.tsx 應已刪除`).toBe(false);
    }
  });

  it('4 個 manifest nav.path 改指向 /admin/crud/<spec>', () => {
    for (const specName of ['blog', 'order', 'event', 'todo']) {
      const raw = fs.readFileSync(
        path.join(ROOT, `extensions/${specName}/manifest.json`),
        'utf-8',
      );
      const manifest = JSON.parse(raw);
      expect(manifest.nav.path, `${specName} nav.path 應為 /admin/crud/${specName}`).toBe(
        `/admin/crud/${specName}`,
      );
    }
  });
});