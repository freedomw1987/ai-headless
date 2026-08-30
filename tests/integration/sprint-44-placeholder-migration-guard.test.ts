/**
 * Sprint 44 Commit A — §4.2 既有 data migration 守護
 *
 * 問題揭露 (Sprint 43 reflection §4.2):
 * - Commit C / E 把 placeholder (string reverse) 換成 AES-GCM
 * - 既有 db 資料解密會 throw (格式完全不相容)
 * - 用戶實測 dev DB 有 1 筆 placeholder: apiKeyEnc 只有 2 段
 *
 * 解決:
 * 1. Migration SQL 偵測 placeholder 格式 (split ':' != 3 或任一段非 hex) → 清空 apiKeyEnc
 * 2. Migration 跑完既有資料解密不再 throw
 *
 * 注意:
 * - 此 guard 是 file-existence + pattern check
 * - 真實 migration 驗證交給跑 prisma migrate dev / deploy
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import * as dbModule from '@/lib/db';

describe('S44-A — §4.2 既有 data migration 守護', () => {
  it('應有 Sprint 44 migration 目錄', () => {
    const exists = existsSync('prisma/migrations');
    expect(exists, 'prisma/migrations 不存在').toBe(true);
  });

  it('migration 檔應含 placeholder 格式偵測邏輯', () => {
    // 找最新 sprint-44 migration
    const fs = require('fs');
    const path = require('path');
    const migrationsDir = 'prisma/migrations';
    const dirs = fs.readdirSync(migrationsDir)
      .filter((d: string) => d.startsWith('202') && d.includes('sprint44'))
      .sort();
    expect(dirs.length, '找不到 sprint44 migration').toBeGreaterThan(0);

    const migrationFile = path.join(migrationsDir, dirs[dirs.length - 1], 'migration.sql');
    const sql = readFileSync(migrationFile, 'utf-8');

    // 應有 UPDATE 語句清空 placeholder
    expect(sql, 'migration 應有 UPDATE 語句').toMatch(/UPDATE\s+"?ai_configs"?/i);
    // 應有 apiKeyEnc = NULL 設值 (PostgreSQL quoted identifier)
    expect(sql, 'migration 應清空 apiKeyEnc (設為 NULL)').toMatch(/"apiKeyEnc"\s*=\s*NULL/i);
  });

  it('migration 應有偵測 placeholder 格式的 WHERE 條件', () => {
    const fs = require('fs');
    const path = require('path');
    const migrationsDir = 'prisma/migrations';
    const dirs = fs.readdirSync(migrationsDir)
      .filter((d: string) => d.startsWith('202') && d.includes('sprint44'))
      .sort();
    const migrationFile = path.join(migrationsDir, dirs[dirs.length - 1], 'migration.sql');
    const sql = readFileSync(migrationFile, 'utf-8');

    // 應有 WHERE 條件過濾 placeholder 格式
    // AES-GCM: 3 段 (iv:ciphertext:authTag), placeholder: < 3 段
    const hasSplitCondition = /split_part|split\(|string_to_array|array_length/i.test(sql);
    expect(hasSplitCondition, 'migration 應用 split_part / string_to_array 偵測段數').toBe(true);
  });

  it('migration 應有安全檢查: WHERE apiKeyEnc IS NOT NULL', () => {
    const fs = require('fs');
    const path = require('path');
    const migrationsDir = 'prisma/migrations';
    const dirs = fs.readdirSync(migrationsDir)
      .filter((d: string) => d.startsWith('202') && d.includes('sprint44'))
      .sort();
    const migrationFile = path.join(migrationsDir, dirs[dirs.length - 1], 'migration.sql');
    const sql = readFileSync(migrationFile, 'utf-8');

    expect(sql, 'migration 應有 WHERE apiKeyEnc IS NOT NULL 安全檢查').toMatch(/"apiKeyEnc"\s+IS\s+NOT\s+NULL/i);
  });

  it('dev DB 應無 placeholder 格式 apiKeyEnc (3 段 hex 是合法 AES-GCM)', async () => {
    // 接 dev DB 驗證資料合規
    const db = (dbModule as any).db || (dbModule as any).default?.db || (dbModule as any).default;
    if (!db) {
      console.warn('無法取得 db，跳過驗證');
      return;
    }
    const configs = await db.aIConfig.findMany({ select: { apiKeyEnc: true } });
    const invalid: { idx: number; reason: string }[] = [];
    configs.forEach((c: { apiKeyEnc: string | null }, idx: number) => {
      if (!c.apiKeyEnc) return;
      const segments = c.apiKeyEnc.split(':');
      if (segments.length !== 3) {
        invalid.push({ idx, reason: `段數 = ${segments.length} (不是 3)` });
        return;
      }
      const allHex = segments.every((s: string) => /^[0-9a-fA-F]+$/.test(s));
      if (!allHex) invalid.push({ idx, reason: '任一段不是 hex' });
    });
    expect(
      invalid,
      `dev DB 有 ${invalid.length} 筆 placeholder 格式資料 (需跑 migration 清空): ${JSON.stringify(invalid)}`
    ).toEqual([]);
  });
});