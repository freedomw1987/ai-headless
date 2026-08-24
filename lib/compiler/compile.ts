/**
 * ==============================================
 *  Compiler Orchestrator — Sprint 10
 * ==============================================
 *
 * 將 JsonSpec 寫進磁碟，產生可運行的 Next.js App Router 檔案。
 *
 * 對應：docs/system-design.md §13（混合模式架構）
 *      docs/specs/json-spec.md（JSON 規範）
 *
 * 輸入：extensions/<name>/<name>-spec.json（單一 extension）
 * 輸出：
 *   - app/api/<name>/route.ts（GET 列表 / POST 建立）
 *   - app/api/<name>/[id]/route.ts（GET / PUT / DELETE 單筆）
 *   - app/admin/<name>/page.tsx（列表頁 Server Component）
 *   - app/admin/<name>/components/list-table.tsx（DataTable）
 *   - app/admin/<name>/components/create-dialog.tsx
 *   - app/admin/<name>/components/edit-dialog.tsx
 *
 * 注意：
 * - Sprint 9 的手寫檔案可由這個 pipeline 自動生成
 * - 但 workflow（狀態機）不在這版範圍（屬 L3 業務邏輯，仍放 Extension Code）
 * - Hook / Action / Computed 同樣放 Extension Code（透過 {{fn:...}} 引用）
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { generateRouteHandlers, type GeneratedRoute } from './api-generator';
import { generateUIPages, type GeneratedPage } from './ui-generator';
import { generatePrismaSchema } from './schema-generator';
import type { JsonSpec } from '@/lib/specs/json-spec.types';

export type CompileResult = {
  extension: string;
  routes: GeneratedRoute[];
  pages: GeneratedPage[];
  schemaCode: string;
  writtenFiles: string[];
};

export type CompileOptions = {
  /** Extension 名稱（對應 extensions/<name>/ 目錄） */
  extensionName: string;
  /** 是否真的寫入磁碟（預設 true；false 只回傳結果不寫檔） */
  dryRun?: boolean;
  /** Schema spec 檔案路徑（預設 extensions/<name>/<name>-spec.json） */
  specPath?: string;
  /** 專案根目錄（預設 process.cwd()） */
  projectRoot?: string;
  /**
   * 寫入根目錄（預設 'app'）。
   * 可以改 '_compiled' 或 'test-output' 等實現隔離。
   * Sprint 10 Phase 2：傳入 '_compiled' 比對差異
   * Sprint 10 Phase 3：預設 'app' 直接覆蓋手寫檔
   */
  outputBase?: string;
};

/**
 * 編譯單一 extension
 */
export async function compileExtension(opts: CompileOptions): Promise<CompileResult> {
  const root = opts.projectRoot ?? process.cwd();
  const outputBase = opts.outputBase ?? 'app';
  const specPath =
    opts.specPath ?? path.join(root, 'extensions', opts.extensionName, `${opts.extensionName}-spec.json`);

  // 1. 讀 JSON spec
  const specRaw = await fs.readFile(specPath, 'utf-8');
  const spec: JsonSpec = JSON.parse(specRaw);

  // 2. 呼叫 3 個 generator（permission 生成另譭 permission-generator.ts）
  const routes = generateRouteHandlers(spec);
  const pages = generateUIPages(spec);
  const schemaCode = generatePrismaSchema(spec);

  const writtenFiles: string[] = [];

  if (opts.dryRun) {
    return {
      extension: opts.extensionName,
      routes,
      pages,
      schemaCode,
      writtenFiles,
    };
  }

  // 3. 寫 API routes（合併同 path 的多個 method code）
  // 依路徑分組（Next.js route.ts 是一檔多 export）
  const routesByPath = new Map<string, { method: string; code: string }[]>();
  for (const route of routes) {
    if (!routesByPath.has(route.path)) {
      routesByPath.set(route.path, []);
    }
    routesByPath.get(route.path)!.push({ method: route.method, code: route.code });
  }

  for (const [routePath, handlers] of routesByPath) {
    const filePath = path.join(root, outputBase, routePath, 'route.ts');

    // 合併：保留第一個 handler 的 import + header，其他只保留 export async function
    const mergedCode = mergeHandlerCodes(handlers);

    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, mergedCode, 'utf-8');
    writtenFiles.push(filePath);
  }

  // 4. 寫 UI pages（page.path 是完整目錄路徑如 /admin/blog/[id]，實際檔案是 /admin/blog/[id]/page.tsx）
  for (const page of pages) {
    const filePath = path.join(root, outputBase, page.path, 'page.tsx');
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, page.code, 'utf-8');
    writtenFiles.push(filePath);
  }

  // 5. 寫 Prisma schema（可選，本 Sprint 跳過，改手動整合到 schema.prisma）
  // Sprint 10 範圍先不寫 schema，先驗證 API + UI 生成正確

  return {
    extension: opts.extensionName,
    routes,
    pages,
    schemaCode,
    writtenFiles,
  };
}

/**
 * 合併多個 handler code 到單一 route.ts 檔案
 *
 * 規則：
 * - 保留每個 handler 的完整 code（含 schema 定義）
 * - 只在檔頭加一次 import（從所有 handler 的 imports 合併去重）
 * - 每個 handler 之間用空白行分隔
 */
function mergeHandlerCodes(handlers: { method: string; code: string }[]): string {
  if (handlers.length === 0) return '';
  if (handlers.length === 1) return handlers[0]!.code;

  const allImports = new Set<string>();
  const bodies: string[] = [];

  for (const h of handlers) {
    const { header, body } = splitHandlerCode(h.code);
    header.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('import ')) {
        allImports.add(trimmed);
      }
    });
    bodies.push(body);
  }

  return [...allImports].join('\n') + '\n\n' + bodies.join('\n\n');
}

/**
 * 將 handler code 分成「header（imports）」+「body」
 */
function splitHandlerCode(code: string): { header: string; body: string } {
  const lines = code.split('\n');
  const importLines: string[] = [];
  let bodyStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.trim();
    if (trimmed.startsWith('import ') || trimmed.startsWith('// ')) {
      importLines.push(line);
      bodyStart = i + 1;
    } else if (trimmed === '') {
      continue;
    } else {
      break;
    }
  }

  return {
    header: importLines.join('\n'),
    body: lines.slice(bodyStart).join('\n'),
  };
}

/**
 * 列出所有可編譯的 extensions（讀 extensions/ 目錄）
 */
export async function listAvailableExtensions(projectRoot?: string): Promise<string[]> {
  const root = projectRoot ?? process.cwd();
  const extDir = path.join(root, 'extensions');
  const entries = await fs.readdir(extDir, { withFileTypes: true });
  const result: string[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const specFile = path.join(extDir, entry.name, `${entry.name}-spec.json`);
    try {
      await fs.access(specFile);
      result.push(entry.name);
    } catch {
      // 沒有 spec.json，跳過
    }
  }

  return result;
}
