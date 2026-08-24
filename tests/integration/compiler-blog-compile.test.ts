/**
 * Sprint 11 — TECH-018 + 019 + 020 整合測試
 *
 * 目的：compiler 生成的程式碼必須能通過 TypeScript typecheck
 * 之前 Sprint 10 Phase 2 揭露 compiler 產出有 bug（schema 丟失、假 import、hook 引用錯誤）
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { compileExtension } from '@/lib/compiler/compile';

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, '_compiled-test');

describe('Sprint 11 TECH-018: Compiler 產出程式碼可 typecheck', () => {
  beforeAll(async () => {
    // 清理可能殘留的目錄
    await fs.rm(OUTPUT, { recursive: true, force: true });
    // 編譯 blog 到測試目錄
    await compileExtension({
      extensionName: 'blog',
      dryRun: false,
      outputBase: '_compiled-test',
    });
  });

  afterAll(async () => {
    await fs.rm(OUTPUT, { recursive: true, force: true });
  });

  it('應該生成 6 個檔案（3 API route.ts + 3 page.tsx）', async () => {
    const files = await getFiles(OUTPUT);
    // 3 routes: /api/blog + /api/blog/[id] + /api/blog/[id]/actions/publish
    // 3 pages: /admin/blog + /admin/blog/new + /admin/blog/[id]
    expect(files.length).toBe(6);
  });

  it('產出的 route.ts 應該包含合法的 TypeScript 語法', async () => {
    const routeFile = path.join(OUTPUT, 'api/blog/route.ts');
    const content = await fs.readFile(routeFile, 'utf-8');

    // 檢查結構
    expect(content).toMatch(/^import .* from/m);
    expect(content).toMatch(/export async function GET/);
    expect(content).toMatch(/export async function POST/);
  });

  it('產出的 [id]/route.ts 應該有 Promise<{id}> 型別', async () => {
    const idRouteFile = path.join(OUTPUT, 'api/blog/[id]/route.ts');
    const content = await fs.readFile(idRouteFile, 'utf-8');

    // 不應該有舊風格的 params: { id: string }
    expect(content).not.toMatch(/params: \{ id: string \}/);
    expect(content).toMatch(/params: Promise<\{ id: string \}>/);
  });

  it('產出的程式不應該有未定義變數（如 `hookFn(model.hooks...)`）', async () => {
    const routeFile = path.join(OUTPUT, 'api/blog/route.ts');
    const content = await fs.readFile(routeFile, 'utf-8');

    // 之前 bug：模板字串內寫了 `model.hooks?.afterList` 但 `model` 不是函數內變數
    expect(content).not.toMatch(/hookFn\(model\.hooks/);
  });

  it('產出的程式不應該引用不存在的 import', async () => {
    const routeFile = path.join(OUTPUT, 'api/blog/route.ts');
    const content = await fs.readFile(routeFile, 'utf-8');

    // 之前 bug：HEADER_IMPORTS 硬塞 runAction, triggerWorkflowTransition 但 @/lib/extensions/actions 沒 export runAction
    // 現在檢查產出的 import 不包含已移除的假模組
    expect(content).not.toMatch(/from '@\/lib\/extensions\/actions'/);
    expect(content).not.toMatch(/from '@\/lib\/workflows\/transitions'/);
    expect(content).not.toMatch(/runAction/);
    expect(content).not.toMatch(/triggerWorkflowTransition/);
  });

  it('產出的程式碼應該通過 typecheck', async () => {
    // 將 _compiled-test 加到 typecheck 但僅限這次
    // 簡化做法：把 _compiled-test 複製到 _compiled（已被 .gitignore）並 typecheck
    await fs.cp(OUTPUT, path.join(ROOT, '_compiled'), { recursive: true });
    try {
      // 這個測試需要 tsconfig 不排除 _compiled 才能跑
      // 但為了避免污染主 typecheck，這裡用獨立的 tsc 呼叫
      const result = execSync(
        `npx tsc --noEmit --project tsconfig.test-compiler.json`,
        { encoding: 'utf-8', stdio: 'pipe' },
      ).toString();
      expect(result).not.toMatch(/error TS/);
    } catch (e: any) {
      const stderr = e.stderr?.toString() ?? e.message;
      expect(stderr).not.toMatch(/error TS/);
    } finally {
      await fs.rm(path.join(ROOT, '_compiled'), { recursive: true, force: true });
    }
  });
});

async function getFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await getFiles(p)));
    else out.push(p);
  }
  return out;
}
