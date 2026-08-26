/**
 * Sprint 20 P3.5（user 報新 bug）— Hook 註冊 + Prisma/Hook Error 處理
 *
 * 涵蓋兩個 bug：
 * - Bug A：dynamic-handler create/update/delete/transition 沒 try/catch 包 hook + Prisma，
 *          hook throw 或 Prisma 拋錯誤 → 500（應該 400/422 + 訊息）
 * - Bug B：Hook 完全沒被 runtime 註冊（hooks-registry.ts 缺失）
 *          spec 內 `{{fn:beforeCreateEvent}}` 永遠找不到函數，業務驗證失效
 *
 * 修法：
 * - Bug A：dynamic-handler 各 handler 包 try/catch
 * - Bug B：建立 hooks-registry.ts 中央映射表 + registerAllExtensions() 函數
 *          route.ts setup() 內呼叫（idempotent）
 *
 * 守護測試（靜態分析）：
 * - P3.5-A：dynamic-handler create / update / delete / transition handler 都含 try/catch 包 hook + Prisma 區塊
 * - P3.5-B：hooks-registry.ts 存在 + 註冊 beforeCreateEvent + beforeCreateBlogPost + beforeRegister
 * - P3.5-C：route.ts setup() 呼叫 registerAllExtensions()
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { extractSpecHookReferences } from '@/lib/specs/spec-hooks-parser';

const ROOT = process.cwd();
const HANDLER_PATH = resolve(ROOT, 'lib/runtime/dynamic-handler.ts');
const HOOKS_REGISTRY_PATH = resolve(ROOT, 'lib/extensions/hooks-registry.ts');
const ROUTE_PATH = resolve(ROOT, 'app/api/crud/[spec]/route.ts');

function extractFnBlock(content: string, fnName: string): string {
  // 找 `const create: DynamicHandlers['create']` 風格的定義
  const start = content.indexOf(`const ${fnName}:`);
  if (start === -1) return '';
  const nextFn = content.indexOf('\n  const ', start + 30);
  return content.slice(start, nextFn);
}

describe('Sprint 20 P3.5 — Hook 註冊 + Prisma/Hook Error 處理', () => {
  describe('P3.5-A — Bug A：dynamic-handler handler 包 try/catch', () => {
    it('create handler 含 try/catch 包 hook + Prisma 區塊', () => {
      const content = readFileSync(HANDLER_PATH, 'utf-8');
      const createBlock = extractFnBlock(content, 'create');
      expect(createBlock).toMatch(/try\s*\{/);
      expect(createBlock).toMatch(/catch\s*\(/);
      // catch 內應回傳 400 結構（不是直接 rethrow 500）
      expect(createBlock).toMatch(/status:\s*400\b/);
    });

    it('update handler 含 try/catch 包 hook + Prisma 區塊', () => {
      const content = readFileSync(HANDLER_PATH, 'utf-8');
      const updateBlock = extractFnBlock(content, 'update');
      expect(updateBlock).toMatch(/try\s*\{/);
      expect(updateBlock).toMatch(/catch\s*\(/);
      expect(updateBlock).toMatch(/status:\s*400\b/);
    });

    it('delete (del) handler 含 try/catch', () => {
      const content = readFileSync(HANDLER_PATH, 'utf-8');
      // delete 在 dynamic-handler 是 del 變數
      const delBlock = extractFnBlock(content, 'del');
      expect(delBlock).toMatch(/try\s*\{/);
      expect(delBlock).toMatch(/catch\s*\(/);
      expect(delBlock).toMatch(/status:\s*400\b/);
    });

    it('transition handler 含 try/catch（P2 — Reviewer 提各 handler 都應包）', () => {
      const content = readFileSync(HANDLER_PATH, 'utf-8');
      // transition 在 dynamic-handler 是 transition 變數，但只 in workflow || extTransition 才存在
      // 取 transition 整個 arrow function（含外層 try）
      const transStart = content.indexOf('transition = async');
      expect(transStart).toBeGreaterThan(-1);
      // 取到下一個 `};` 結束
      const transEnd = content.indexOf('\n    };', transStart);
      expect(transEnd).toBeGreaterThan(transStart);
      const transBlock = content.slice(transStart, transEnd);
      expect(transBlock).toMatch(/try\s*\{/);
      expect(transBlock).toMatch(/catch\s*\(/);
      expect(transBlock).toMatch(/status:\s*400\b/);
    });
  });

  describe('P3.5-B — Bug B：hooks-registry.ts 存在並註冊關鍵 hooks', () => {
    it('hooks-registry.ts 存在', () => {
      const content = readFileSync(HOOKS_REGISTRY_PATH, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });

    it('hooks-registry 註冊 beforeCreateEvent (event hook)', () => {
      const content = readFileSync(HOOKS_REGISTRY_PATH, 'utf-8');
      expect(content).toMatch(/(?:safeRegister|registerHook)\(\s*['"]beforeCreateEvent['"]/);
    });

    it('hooks-registry 註冊 beforeCreateBlogPost (blog hook)', () => {
      const content = readFileSync(HOOKS_REGISTRY_PATH, 'utf-8');
      expect(content).toMatch(/(?:safeRegister|registerHook)\(\s*['"]beforeCreateBlogPost['"]/);
    });

    it('hooks-registry 註冊 beforeRegister (event Registration hook)', () => {
      const content = readFileSync(HOOKS_REGISTRY_PATH, 'utf-8');
      expect(content).toMatch(/(?:safeRegister|registerHook)\(\s*['"]beforeRegister['"]/);
    });

    it('hooks-registry 註冊 beforeCreateTodo (todo hook) — P1 #1 防漏註冊', () => {
      const content = readFileSync(HOOKS_REGISTRY_PATH, 'utf-8');
      expect(content).toMatch(/(?:safeRegister|registerHook)\(\s*['"]beforeCreateTodo['"]/);
    });

    it('hooks-registry 從 extensions/.../hooks/before-create.ts import 函數', () => {
      const content = readFileSync(HOOKS_REGISTRY_PATH, 'utf-8');
      expect(content).toMatch(/from\s+['"]@\/extensions\/event\/hooks\/before-create['"]/);
      expect(content).toMatch(/from\s+['"]@\/extensions\/blog\/hooks\/before-create['"]/);
      expect(content).toMatch(/from\s+['"]@\/extensions\/event\/hooks\/before-register['"]/);
      expect(content).toMatch(/from\s+['"]@\/extensions\/todo\/hooks\/before-create['"]/);
    });

    // P2 — 完整性檢查：所有 spec `hooks.*` 內 {{fn:...}} 引用都有對應 register
    it('所有 spec `hooks.*` 內 {{fn:...}} 引用都有對應 register（registry completeness guard）', () => {
      const fs = require('node:fs') as typeof import('node:fs');
      const path = require('node:path') as typeof import('node:path');

      const specDir = resolve(ROOT, 'extensions');
      const registryContent = readFileSync(HOOKS_REGISTRY_PATH, 'utf-8');

      // 找所有 spec 內 {{fn:xxx}} 引用（但只關心 `hooks` 物件內的）
      const specFiles = fs.readdirSync(specDir)
        .map((ext: string) => resolve(specDir, ext, `${ext}-spec.json`))
        .filter((p: string) => fs.existsSync(p));

      const referencedHookFns = new Set<string>();
      // TD-404: 用 brace-balanced parser 取代舊 regex (支援嵌套 JSON)
      for (const file of specFiles) {
        const content = readFileSync(file, 'utf-8');
        const refs = extractSpecHookReferences(content);
        for (const fn of refs) {
          referencedHookFns.add(fn);
        }
      }

      // 對每個引用，檢查 registry 是否有 register
      const missing: string[] = [];
      for (const fn of referencedHookFns) {
        const re = new RegExp(`(?:safeRegister|registerHook)\\(\\s*['"]${fn}['"]`);
        if (!re.test(registryContent)) {
          missing.push(fn);
        }
      }

      // 若有 missing，拋錯列出（哪個 hook 漏註冊）
      expect(missing).toEqual([]);
    });
  });

  describe('P3.5-C — route.ts setup() 內呼叫 registerAllExtensions()', () => {
    it('route.ts import registerAllExtensions', () => {
      const content = readFileSync(ROUTE_PATH, 'utf-8');
      expect(content).toMatch(/import\s*\{[^}]*registerAllExtensions[^}]*\}\s*from\s+['"]@\/lib\/extensions\/hooks-registry['"]/);
    });

    it('route.ts setup() 內呼叫 registerAllExtensions()', () => {
      const content = readFileSync(ROUTE_PATH, 'utf-8');
      // setup() 區塊
      const setupStart = content.indexOf('async function setup(');
      expect(setupStart).toBeGreaterThan(-1);
      const setupEnd = content.indexOf('\n}\n', setupStart);
      const setupBlock = content.slice(setupStart, setupEnd);
      expect(setupBlock).toMatch(/registerAllExtensions\s*\(\s*\)/);
    });
  });
});