/**
 * Sprint 43 防呆 Guard: Prisma schema 改完後 dev/build 前必須 prisma generate
 *
 * 問題揭露 (用戶實測):
 * - Commit A 改 prisma/schema.prisma 加 AIProviderType enum + type 欄位
 * - 跑 prisma generate 後 dev server 還在用舊 client (cache in memory)
 * - PUT /api/admin/ai-config 500 'Unknown argument `type`'
 *
 * 解決:
 * 1. package.json scripts 加 predev / prebuild / postinstall 都自動 prisma generate
 * 2. 此 guard 確認 package.json 有這些 hooks
 * 3. 此 guard 確認 Prisma client 生成的 .d.ts 有 type 欄位 (runtime check)
 *
 * 注意:
 * - 此 guard 是 source-code pattern + filesystem check
 * - runtime 行為驗證交給 e2e (Sprint 44 必修)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

describe('S43 — Prisma generate 防呆 (schema 改完 dev/build 必須 regenerate)', () => {
  it('package.json 應有 predev hook (自動 prisma generate)', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
    expect(
      pkg.scripts?.predev,
      'package.json scripts.predev 應設定為 prisma generate'
    ).toMatch(/prisma\s+generate/);
  });

  it('package.json 應有 prebuild hook (build 前自動 prisma generate)', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
    expect(
      pkg.scripts?.prebuild,
      'package.json scripts.prebuild 應設定為 prisma generate'
    ).toMatch(/prisma\s+generate/);
  });

  it('package.json 應有 postinstall hook (npm install 後自動 prisma generate)', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
    expect(
      pkg.scripts?.postinstall,
      'package.json scripts.postinstall 應設定為 prisma generate'
    ).toMatch(/prisma\s+generate/);
  });

  it('package.json 應有 db:migrate script (讓人工跑 migrate 用)', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
    expect(
      pkg.scripts?.['db:migrate'],
      'package.json 缺 db:migrate script (改 schema 後需手動跑)'
    ).toMatch(/prisma\s+migrate/);
  });

  it('package.json 應有 db:deploy script (生產環境 deploy migration)', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
    expect(
      pkg.scripts?.['db:deploy'],
      'package.json 缺 db:deploy script (生產 deploy 需要)'
    ).toMatch(/prisma\s+migrate\s+deploy/);
  });

  it('生成的 Prisma client 應有 AIProviderType enum (證明 generate 成功)', () => {
    // 找 prisma client index.d.ts (可能在 .prisma/client/ 或 pnpm symlink)
    const candidates = [
      'node_modules/.prisma/client/index.d.ts',
      'node_modules/@prisma/client/index.d.ts',
    ];
    // 動態尋找所有可能位置 (含 pnpm)
    try {
      const findResult = execSync(
        "find node_modules -name 'index.d.ts' -path '*prisma*client*' 2>/dev/null | head -5",
        { encoding: 'utf-8' }
      ).trim();
      if (findResult) {
        candidates.push(...findResult.split('\n').filter(Boolean));
      }
    } catch {
      // ignore
    }
    let found = false;
    for (const path of candidates) {
      if (!existsSync(path)) continue;
      const content = readFileSync(path, 'utf-8');
      // 可能是 re-export 檔, 看內容或讀 default.d.ts
      if (content.includes('AIProviderType')) {
        found = true;
        break;
      }
      // 試讀 default.d.ts (prisma 6 常用)
      const defaultPath = path.replace('index.d.ts', 'default.d.ts');
      if (existsSync(defaultPath)) {
        const defaultContent = readFileSync(defaultPath, 'utf-8');
        if (defaultContent.includes('AIProviderType')) {
          found = true;
          break;
        }
      }
    }
    expect(
      found,
      `Prisma client 缺 AIProviderType enum。檢查路徑：${candidates.join(', ')}。請跑 pnpm db:generate`
    ).toBe(true);
  });
});
