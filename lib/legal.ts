/**
 * ==============================================
 *  Legal Documents Loader (Sprint 58 P0-8)
 * ==============================================
 *
 * 對應 docs/sprint58-plan-gate.md §3
 *
 * 載入 /content/legal/ 下的 markdown 文件 + meta
 * 註冊時用版本號做 audit
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

export type SupportedLocale = 'zh-TW' | 'en';

export type LegalDoc = {
  title: string;
  version: string;
  effectiveDate: string;
  content: string; // markdown body
};

export type LegalMeta = {
  version: string;
  lastUpdated: string;
  terms: Record<SupportedLocale, { file: string; version: string; effectiveDate: string }>;
  privacy: Record<SupportedLocale, { file: string; version: string; effectiveDate: string }>;
};

const CONTENT_ROOT = join(process.cwd(), 'content', 'legal');

/**
 * 讀 _meta.json
 */
export function loadLegalMeta(): LegalMeta {
  const metaPath = join(CONTENT_ROOT, '_meta.json');
  if (!existsSync(metaPath)) {
    throw new Error(`Legal meta not found: ${metaPath}`);
  }
  return JSON.parse(readFileSync(metaPath, 'utf-8')) as LegalMeta;
}

/**
 * 讀特定法律文件
 */
export function loadLegalDoc(
  type: 'terms' | 'privacy',
  locale: SupportedLocale,
): LegalDoc {
  const meta = loadLegalMeta();
  const entry = meta[type][locale];
  if (!entry) {
    throw new Error(`Legal doc not found in meta: ${type}.${locale}`);
  }

  const filePath = join(CONTENT_ROOT, entry.file);
  if (!existsSync(filePath)) {
    throw new Error(`Legal doc file not found: ${filePath}`);
  }

  const raw = readFileSync(filePath, 'utf-8');
  const parsed = matter(raw);

  return {
    title: (parsed.data.title as string) ?? entry.file,
    version: (parsed.data.version as string) ?? entry.version,
    effectiveDate:
      (parsed.data.effectiveDate as string) ?? entry.effectiveDate,
    content: parsed.content,
  };
}

/**
 * 拿 ToS/Privacy 當前版本字串（給註冊 API 用）
 */
export function getCurrentLegalVersions(): {
  terms: string;
  privacy: string;
} {
  const meta = loadLegalMeta();
  return {
    terms: meta.terms['zh-TW'].version, // 用 zh-TW 作為預設 reference
    privacy: meta.privacy['zh-TW'].version,
  };
}
