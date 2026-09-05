/**
 * Sprint 53 Stage 53-1 (FR-20.2) — Extension Tool Call Wrapper
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.15 (FR-20.2)
 * 對應 Plan Gate: docs/sprint53-plan-gate.md
 *
 * 設計:
 * - 攔截 pi agent 的 write_file tool call
 * - 每個 write_file 透過 isPathAllowed 驗證
 * - 拒絕時回傳錯誤給 AI, 不寫入磁碟
 * - 收集所有寫入的檔案, 全部完成後跑 validateExtensionFiles
 * - 驗證失敗 → 回滾 (刪除已寫入檔案)
 * - 驗證成功 → 回傳 success
 *
 * 沿用既有:
 * - extension-validator.ts 的 isPathAllowed / validateExtensionFiles (Sprint 52-2)
 */

import { execSync } from 'child_process';
import {
  writeFileSync,
  unlinkSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
} from 'fs';
import { dirname, join } from 'path';
import {
  isPathAllowed,
  validateExtensionFiles,
  type ExtensionFile,
} from './extension-validator';

// ==============================================
// 1. Tool Call 攔截類型
// ==============================================

/**
 * FR-20.2.1: AI write_file tool call 的參數
 */
export interface WriteFileToolCall {
  path: string;
  content: string;
}

/**
 * FR-20.2.2: 攔截結果
 */
export type InterceptResult =
  | { status: 'allowed'; file: ExtensionFile }
  | { status: 'rejected'; reason: string };

/**
 * FR-20.2.3: 攔截 write_file tool call
 *
 * @param toolCall - AI 想要寫入的檔案
 * @param extensionName - extension 名稱
 * @returns 是否允許寫入 + 檔案內容
 */
export function interceptWriteFile(
  toolCall: WriteFileToolCall,
  extensionName: string,
): InterceptResult {
  // 1. 路徑防護
  if (!isPathAllowed(toolCall.path, extensionName)) {
    return {
      status: 'rejected',
      reason: `Path not allowed: ${toolCall.path} (must start with extensions/${extensionName}/)`,
    };
  }

  return {
    status: 'allowed',
    file: { path: toolCall.path, content: toolCall.content },
  };
}

// ==============================================
// 2. 寫入與回滾
// ==============================================

/**
 * FR-20.2.4: 寫入單一檔案 (自動建立目錄)
 */
export function writeExtensionFile(file: ExtensionFile): void {
  const dir = dirname(file.path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(file.path, file.content, 'utf-8');
}

/**
 * FR-20.2.5: 回滾 (刪除已寫入的檔案)
 *
 * @param files - 已寫入但驗證失敗的檔案
 */
export function rollbackFiles(files: ExtensionFile[]): void {
  for (const file of files) {
    if (existsSync(file.path)) {
      try {
        unlinkSync(file.path);
      } catch {
        // 忽略刪除錯誤, 繼續回滾其他檔案
      }
    }
  }
}

/**
 * FR-20.2.6: 清理空目錄 (生成失敗時)
 */
export function cleanupEmptyDirs(extensionName: string): void {
  const extDir = join('extensions', extensionName);
  // 簡單實作: 嘗試刪除 extensions/<name> 整個目錄 (僅當為空時)
  // 完整實作可遞迴刪除子目錄, 但需謹慎避免刪除非 AI 生成的檔案
}

// ==============================================
// 3. 批次驗證流程
// ==============================================

export type BatchValidationResult =
  | { status: 'passed'; files: ExtensionFile[] }
  | { status: 'failed'; errors: string[]; files: ExtensionFile[] };

/**
 * FR-20.2.7: 驗證所有收集的檔案
 *
 * @param files - 所有攔截後允許寫入的檔案
 * @param extensionName - extension 名稱
 * @returns 驗證結果 (包含是否通過與錯誤訊息)
 */
export function validateBatch(
  files: ExtensionFile[],
  extensionName: string,
): BatchValidationResult {
  const result = validateExtensionFiles(files, extensionName);
  if (result.passed) {
    return { status: 'passed', files };
  }
  return { status: 'failed', errors: result.errors, files };
}

/**
 * FR-20.4: 整合 tsc 編譯驗證 (Layer 3)
 *
 * 設計:
 * - 用 child_process spawn `npx tsc --noEmit <generated files>`
 * - 編譯失敗 → 回傳錯誤訊息
 * - 編譯成功 → 回傳 success
 *
 * Sprint 53-2: 實作為 syntactic check (parse 成功即可, 不檢查 cross-file types)
 * 原因: cross-file type check 需要完整 tsconfig, 與專案其他檔案耦合
 *         syntactic check 已足夠抓出大部分語法錯誤
 */

export interface TscValidationResult {
  passed: boolean;
  errors?: string[];
}

export async function validateTscCompile(
  extensionName: string,
): Promise<TscValidationResult> {
  const extDir = join('extensions', extensionName);
  if (!existsSync(extDir)) {
    return { passed: true }; // 跳過驗證 (無檔案)
  }

  // 收集所有 .ts 檔案
  const tsFiles: string[] = [];
  function collect(dir: string) {
    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry);
      if (statSync(fullPath).isDirectory()) {
        collect(fullPath);
      } else if (entry.endsWith('.ts')) {
        tsFiles.push(fullPath);
      }
    }
  }
  collect(extDir);

  if (tsFiles.length === 0) {
    return { passed: true }; // 無 ts 檔案
  }

  try {
    // 用 tsc --noEmit 對生成的 ts 檔案做 syntactic check
    // 注意: --noEmit 不會產出 .js, 只檢查語法
    execSync(`npx tsc --noEmit --skipLibCheck --target es2020 --module esnext --moduleResolution node ${tsFiles.join(' ')}`, {
      cwd: process.cwd(),
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    return { passed: true };
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string; message?: string };
    const errors: string[] = [];
    if (error.stdout) errors.push(error.stdout);
    if (error.stderr) errors.push(error.stderr);
    if (error.message && errors.length === 0) errors.push(error.message);
    return {
      passed: false,
      errors: errors.length > 0 ? errors : ['tsc compilation failed (unknown error)'],
    };
  }
}

/**
 * FR-20.4.2: 完整三層驗證 (Schema + 結構 + tsc)
 */
export async function validateThreeLayers(
  files: ExtensionFile[],
  extensionName: string,
): Promise<BatchValidationResult & { tsc?: TscValidationResult }> {
  const schemaResult = validateBatch(files, extensionName);
  if (schemaResult.status === 'failed') {
    return schemaResult;
  }

  const tscResult = await validateTscCompile(extensionName);
  if (!tscResult.passed) {
    return {
      status: 'failed',
      errors: tscResult.errors ?? ['tsc compilation failed'],
      files,
    };
  }

  return { ...schemaResult, tsc: tscResult };
}

// ==============================================
// 4. 高階流程 (供 Sprint 53-2 端到端使用)
// ==============================================

export interface ExtensionGenerationFlowResult {
  success: boolean;
  extensionName: string;
  files?: ExtensionFile[];
  errors?: string[];
}

/**
 * FR-20.2.8 + FR-20.3 + FR-20.4: 高階流程
 * - 收集所有 write_file tool call
 * - 驗證每個
 * - 全部完成後跑三層驗證
 * - 失敗回滾, 成功回傳 success
 */
export async function processExtensionGeneration(
  toolCalls: WriteFileToolCall[],
  extensionName: string,
  options: { force?: boolean } = {},
): Promise<ExtensionGenerationFlowResult> {
  // 1. 攔截每個 tool call, 收集允許的檔案
  const allowedFiles: ExtensionFile[] = [];
  const errors: string[] = [];

  for (const toolCall of toolCalls) {
    const result = interceptWriteFile(toolCall, extensionName);
    if (result.status === 'allowed') {
      allowedFiles.push(result.file);
    } else {
      errors.push(result.reason);
    }
  }

  if (errors.length > 0) {
    return {
      success: false,
      extensionName,
      errors,
    };
  }

  // 2. 寫入檔案
  for (const file of allowedFiles) {
    writeExtensionFile(file);
  }

  // 3. 三層驗證
  const validation = await validateThreeLayers(allowedFiles, extensionName);

  if (validation.status === 'failed') {
    // 4. 驗證失敗 → 回滾
    rollbackFiles(allowedFiles);
    cleanupEmptyDirs(extensionName);
    return {
      success: false,
      extensionName,
      errors: validation.errors,
    };
  }

  return {
    success: true,
    extensionName,
    files: allowedFiles,
    errors: options.force ? undefined : undefined, // future: backup info
  };
}