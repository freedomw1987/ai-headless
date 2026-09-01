/**
 * Sprint 52 Stage 52-2 (FR-19.5) — Extension Validator
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.14 (FR-19.5)
 * 對應 Plan Gate: docs/sprint52-plan-gate.md
 *
 * 設計:
 * - pathGuard: 確保 AI 只能寫入 extensions/<name>/ 目錄
 * - overwriteGuard: 預設拒絕覆寫, --force 才允許
 * - 三層驗證: loader test + manifest schema + tsc
 *
 * 不實際執行 AI 生成 (由 admin chat + pi agent 執行),
 * 本檔提供驗證函式供 server-side 攔截 tool call 時呼叫
 */

import { existsSync, statSync, mkdirSync, copyFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { validateExtensionSpec, type ExtensionSpec } from './extension-generator';
import { validateExtensionManifest } from '@/lib/extensions/extension-loader';

// ==============================================
// 1. 路徑防護 (Path Guard)
// ==============================================

/**
 * FR-19.5.1: 確保 AI 寫入路徑在 extensions/<name>/ 內
 *
 * @param targetPath - AI 想寫入的路徑
 * @param extensionName - extension 名稱
 * @returns 是否允許寫入
 */
export function isPathAllowed(
  targetPath: string,
  extensionName: string,
): boolean {
  // 路徑必須以 extensions/<name>/ 開頭
  const normalized = targetPath.replace(/\\/g, '/');
  const expectedPrefix = `extensions/${extensionName}/`;
  return normalized.startsWith(expectedPrefix);
}

// ==============================================
// 2. 覆寫保護 (Overwrite Guard)
// ==============================================

export type OverwriteCheckResult =
  | { allowed: true }
  | { allowed: false; reason: 'exists'; message: string };

/**
 * FR-19.5.2: 檢查是否可以覆寫既有 extension
 *
 * @param extensionName - extension 名稱
 * @param force - 是否帶 --force flag
 * @returns 是否允許寫入
 */
export function checkOverwrite(
  extensionName: string,
  force: boolean,
): OverwriteCheckResult {
  const extensionDir = join('extensions', extensionName);
  if (!existsSync(extensionDir)) {
    return { allowed: true };
  }
  if (force) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: 'exists',
    message: `Extension '${extensionName}' already exists. Use --force to overwrite.`,
  };
}

/**
 * FR-19.5.3: --force 模式下備份既有 extension
 *
 * @param extensionName - extension 名稱
 * @returns 備份目錄路徑
 */
export function backupExtension(extensionName: string): string {
  const timestamp = Date.now();
  const backupDir = join('extensions-backup', `${extensionName}-${timestamp}`);
  const sourceDir = join('extensions', extensionName);

  if (!existsSync(sourceDir)) {
    throw new Error(`Extension directory does not exist: ${sourceDir}`);
  }

  mkdirSync(backupDir, { recursive: true });
  copyDir(sourceDir, backupDir);

  return backupDir;
}

function copyDir(src: string, dest: string) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const stat = statSync(srcPath);
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

// ==============================================
// 3. 三層驗證 (Three-Layer Validation)
// ==============================================

export type ValidationLayer = 'manifest' | 'spec' | 'tsc';

export type ValidationResult =
  | { layer: ValidationLayer; passed: true }
  | { layer: ValidationLayer; passed: false; error: string };

/**
 * FR-19.5.4: 驗證 spec.json (Layer 1)
 */
export function validateSpecLayer(specJson: unknown): ValidationResult {
  try {
    validateExtensionSpec(specJson);
    return { layer: 'spec', passed: true };
  } catch (err) {
    return {
      layer: 'spec',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * FR-19.5.4: 驗證 manifest.json (Layer 1, 沿用 extension-loader)
 */
export function validateManifestLayer(
  manifestJson: unknown,
): ValidationResult {
  try {
    validateExtensionManifest(manifestJson);
    return { layer: 'manifest', passed: true };
  } catch (err) {
    return {
      layer: 'manifest',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * FR-19.5.5: 驗證生成的所有檔案 (含 8 個檔案結構檢查)
 *
 * @param files - AI 生成的所有檔案內容 (path → content)
 * @param expectedExtensionName - extension 名稱
 * @returns 驗證結果
 */
export interface ExtensionFile {
  path: string;
  content: string;
}

export interface ExtensionFilesValidationResult {
  passed: boolean;
  errors: string[];
}

const EXPECTED_FILES = [
  'manifest.json',
  'spec.json', // 將在 runtime rename 為 <name>-spec.json
  'hooks/beforeCreate.ts',
  'actions/complete.ts',
  'computed/remainingDays.ts',
  'workflow/workflow.ts',
  'examples/example.ts',
  'README.md',
];

export function validateExtensionFiles(
  files: ExtensionFile[],
  expectedExtensionName: string,
): ExtensionFilesValidationResult {
  const errors: string[] = [];

  // 1. 必須有 8 個檔案
  if (files.length !== 8) {
    errors.push(
      `Expected 8 files, got ${files.length}. Missing: ${EXPECTED_FILES.filter(
        (f) => !files.some((file) => file.path.endsWith(f)),
      ).join(', ')}`,
    );
  }

  // 2. 所有檔案路徑必須在 extensions/<name>/ 內
  for (const file of files) {
    if (!isPathAllowed(file.path, expectedExtensionName)) {
      errors.push(`Path not allowed: ${file.path}`);
    }
  }

  // 3. manifest.json 必須符合 schema
  const manifestFile = files.find((f) => f.path.endsWith('manifest.json'));
  if (manifestFile) {
    try {
      const manifest = JSON.parse(manifestFile.content);
      const result = validateManifestLayer(manifest);
      if (!result.passed) {
        errors.push(`manifest.json invalid: ${result.error}`);
      }
    } catch (err) {
      errors.push(
        `manifest.json parse error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // 4. spec.json 必須符合 schema
  const specFile = files.find((f) => f.path.endsWith('spec.json'));
  if (specFile) {
    try {
      const spec = JSON.parse(specFile.content);
      const result = validateSpecLayer(spec);
      if (!result.passed) {
        errors.push(`spec.json invalid: ${result.error}`);
      }
    } catch (err) {
      errors.push(
        `spec.json parse error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return {
    passed: errors.length === 0,
    errors,
  };
}

/**
 * FR-19.5.6: 生成 spec type alias (供 Sprint 52-2 整合使用)
 */
export type { ExtensionSpec };