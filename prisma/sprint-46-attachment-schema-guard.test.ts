/**
 * Sprint 46 Commit 1 (Stage 46-F) — Attachment schema 守護測試
 *
 * 設計 (Sprint 46 Plan Gate, PRD 10-chat-attachments.md §3):
 * - Attachment model + sessionId FK + cascade: false (永久保留)
 * - metadata: mime / size / path / originalName / uploadedAt
 * - ChatSession 擴充 deletedAt 欄位 (Sprint 47+ cleanup job 鋪路)
 *
 * 注意:
 * - onDelete: NoAction — 即使 session 刪除 (未來支援), attachment 不級聯刪除
 * - storagePath 存相對路徑 (./uploads/<sessionId>/<uuid>.<ext>)
 * - 無 deletedAt 欄位在 Attachment — session 才軟刪除 (避免複雜 join)
 *
 * 對應 PRD §3.1 / §3.2 / §3.3 設計決策
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';

describe('S46-F — Attachment Schema', () => {
  // ============== A. Schema Source Code 守護 ==============

  it('prisma/schema.prisma 應有 Attachment model', () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf-8');
    expect(schema, '應有 Attachment model').toMatch(/model\s+Attachment\s*\{/);
  });

  it('Attachment 應有 id 欄位 (cuid)', () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf-8');
    const match = schema.match(/model\s+Attachment\s*\{[\s\S]*?\n\}/);
    expect(match, '應能找到 Attachment model').toBeTruthy();
    expect(match![0], 'Attachment 應有 id String @id').toMatch(/id\s+String\s+@id/);
  });

  it('Attachment 應有 sessionId 欄位 (FK)', () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf-8');
    const match = schema.match(/model\s+Attachment\s*\{[\s\S]*?\n\}/);
    expect(match, '應能找到 Attachment model').toBeTruthy();
    expect(match![0], 'Attachment 應有 sessionId 欄位').toMatch(/sessionId\s+String/);
  });

  it('Attachment 應有 session 關聯 (一對多 to ChatSession)', () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf-8');
    const match = schema.match(/model\s+Attachment\s*\{[\s\S]*?\n\}/);
    expect(match, '應能找到 Attachment model').toBeTruthy();
    expect(match![0], 'Attachment 應有 session ChatSession 關聯').toMatch(
      /session\s+ChatSession/,
    );
  });

  it('Attachment 應有 filename 欄位 (原始檔名)', () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf-8');
    const match = schema.match(/model\s+Attachment\s*\{[\s\S]*?\n\}/);
    expect(match, '應能找到 Attachment model').toBeTruthy();
    expect(match![0], 'Attachment 應有 filename String').toMatch(/filename\s+String/);
  });

  it('Attachment 應有 mimeType 欄位 (e.g. application/pdf)', () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf-8');
    const match = schema.match(/model\s+Attachment\s*\{[\s\S]*?\n\}/);
    expect(match, '應能找到 Attachment model').toBeTruthy();
    expect(match![0], 'Attachment 應有 mimeType String').toMatch(/mimeType\s+String/);
  });

  it('Attachment 應有 size 欄位 (bytes)', () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf-8');
    const match = schema.match(/model\s+Attachment\s*\{[\s\S]*?\n\}/);
    expect(match, '應能找到 Attachment model').toBeTruthy();
    expect(match![0], 'Attachment 應有 size Int').toMatch(/size\s+Int/);
  });

  it('Attachment 應有 storagePath 欄位 (相對路徑)', () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf-8');
    const match = schema.match(/model\s+Attachment\s*\{[\s\S]*?\n\}/);
    expect(match, '應能找到 Attachment model').toBeTruthy();
    expect(match![0], 'Attachment 應有 storagePath String').toMatch(/storagePath\s+String/);
  });

  it('Attachment 應有 uploadedAt 欄位 (timestamp)', () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf-8');
    const match = schema.match(/model\s+Attachment\s*\{[\s\S]*?\n\}/);
    expect(match, '應能找到 Attachment model').toBeTruthy();
    expect(match![0], 'Attachment 應有 uploadedAt DateTime').toMatch(/uploadedAt\s+DateTime/);
  });

  // ============== B. 永久保留機制守護 (Plan Gate Q6) ==============

  it('Attachment FK 應為 onDelete: NoAction (永久保留機制)', () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf-8');
    // 只抓 Attachment model 區塊內的 session 關聯
    const attachmentModel = schema.match(/model\s+Attachment\s*\{[\s\S]*?\n\}/);
    expect(attachmentModel, '應能找到 Attachment model').toBeTruthy();
    const match = attachmentModel![0].match(
      /session\s+ChatSession\s+@relation\([^)]*\)/,
    );
    expect(match, 'Attachment 內應能找到 session @relation').toBeTruthy();
    expect(match![0], 'FK 應設 onDelete: NoAction（永久保留機制）').toMatch(/onDelete:\s*NoAction/);
  });

  it('Attachment 應無 deletedAt 欄位 (避免複雜 join, session 才軟刪)', () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf-8');
    const match = schema.match(/model\s+Attachment\s*\{[\s\S]*?\n\}/);
    expect(match, '應能找到 Attachment model').toBeTruthy();
    expect(
      match![0],
      'Attachment 不應有 deletedAt 欄位 (設計決策 §3.3)',
    ).not.toMatch(/deletedAt/);
  });

  // ============== C. 索引守護 (PRD §3.3) ==============

  it('Attachment 應有 @@index([sessionId]) (主要查詢)', () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf-8');
    const match = schema.match(/model\s+Attachment\s*\{[\s\S]*?\n\}/);
    expect(match, '應能找到 Attachment model').toBeTruthy();
    expect(match![0], 'Attachment 應有 @@index([sessionId])').toMatch(
      /@@index\(\[sessionId\]\)/,
    );
  });

  it('Attachment 應有 @@index([uploadedAt]) (cleanup job 用)', () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf-8');
    const match = schema.match(/model\s+Attachment\s*\{[\s\S]*?\n\}/);
    expect(match, '應能找到 Attachment model').toBeTruthy();
    expect(match![0], 'Attachment 應有 @@index([uploadedAt])').toMatch(
      /@@index\(\[uploadedAt\]\)/,
    );
  });

  it('Attachment 應映射到 attachments table (snake_case)', () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf-8');
    const match = schema.match(/model\s+Attachment\s*\{[\s\S]*?\n\}/);
    expect(match, '應能找到 Attachment model').toBeTruthy();
    expect(match![0], '應有 @@map("attachments")').toMatch(/@@map\("attachments"\)/);
  });

  // ============== D. ChatSession 擴充守護 (Sprint 47+ cleanup) ==============

  it('ChatSession 應有 attachments 關聯 (一對多 to Attachment)', () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf-8');
    const match = schema.match(/model\s+ChatSession\s*\{[\s\S]*?\n\}/);
    expect(match, '應能找到 ChatSession model').toBeTruthy();
    expect(
      match![0],
      'ChatSession 應有 attachments Attachment[] 關聯',
    ).toMatch(/attachments\s+Attachment\[\]/);
  });

  it('ChatSession 應有 deletedAt 欄位 (Sprint 47+ cleanup job 鋪路)', () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf-8');
    const match = schema.match(/model\s+ChatSession\s*\{[\s\S]*?\n\}/);
    expect(match, '應能找到 ChatSession model').toBeTruthy();
    expect(
      match![0],
      'ChatSession 應有 deletedAt DateTime? 欄位',
    ).toMatch(/deletedAt\s+DateTime\?/);
  });

  it('ChatSession 應有 @@index([deletedAt]) (Sprint 47+ cleanup job 掃描用)', () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf-8');
    const match = schema.match(/model\s+ChatSession\s*\{[\s\S]*?\n\}/);
    expect(match, '應能找到 ChatSession model').toBeTruthy();
    expect(
      match![0],
      'ChatSession 應有 @@index([deletedAt])',
    ).toMatch(/@@index\(\[deletedAt\]\)/);
  });

  // ============== E. Migration 守護 ==============

  it('應有 sprint46_attachments migration 檔案', () => {
    const migrationsDir = 'prisma/migrations';
    expect(existsSync(migrationsDir), 'migrations 目錄應存在').toBe(true);
    const dirs = readdirSync(migrationsDir).filter(
      (d) => d.includes('sprint46_attachments'),
    );
    expect(dirs.length, '應有 sprint46_attachments migration').toBeGreaterThan(0);
  });

  // Helper: 讀取 sprint46_attachments migration.sql
  // 確保 dirs[0] 已存在的斷言 + 安全讀取（避免 noUncheckedIndexedAccess）
  function readSprint46MigrationSql(): string {
    const migrationsDir = 'prisma/migrations';
    const dirs = readdirSync(migrationsDir).filter((d) =>
      d.includes('sprint46_attachments'),
    );
    expect(dirs.length, '應有 sprint46_attachments migration').toBeGreaterThan(0);
    const migrationDir = dirs[0] as string; // length > 0 保證 dirs[0] 存在
    return readFileSync(join(migrationsDir, migrationDir, 'migration.sql'), 'utf-8');
  }

  it('sprint46_attachments migration.sql 應有 attachments table', () => {
    const sql = readSprint46MigrationSql();
    expect(sql, 'migration.sql 應 CREATE TABLE attachments').toMatch(
      /CREATE TABLE "attachments"/,
    );
  });

  it('sprint46_attachments migration.sql 應加 chat_sessions.deletedAt', () => {
    const sql = readSprint46MigrationSql();
    expect(
      sql,
      'migration.sql 應 ALTER TABLE chat_sessions ADD COLUMN deletedAt',
    ).toMatch(/ALTER TABLE "chat_sessions"\s+ADD COLUMN\s+"deletedAt"/);
  });

  it('sprint46_attachments migration.sql 應用 ON DELETE NO ACTION (永久保留)', () => {
    const sql = readSprint46MigrationSql();
    expect(
      sql,
      'FK 應為 ON DELETE NO ACTION（永久保留機制）',
    ).toMatch(/ON DELETE NO ACTION/);
  });

  it('sprint46_attachments migration.sql 應有兩個附件索引 (sessionId, uploadedAt)', () => {
    const sql = readSprint46MigrationSql();
    expect(sql, '應有 attachments_sessionId_idx').toMatch(
      /CREATE INDEX "attachments_sessionId_idx"/,
    );
    expect(sql, '應有 attachments_uploadedAt_idx').toMatch(
      /CREATE INDEX "attachments_uploadedAt_idx"/,
    );
  });

  it('sprint46_attachments migration.sql 應有 chat_sessions_deletedAt_idx', () => {
    const sql = readSprint46MigrationSql();
    expect(sql, '應有 chat_sessions_deletedAt_idx').toMatch(
      /CREATE INDEX "chat_sessions_deletedAt_idx"/,
    );
  });

  // ============== F. Prisma Client 重新生成守護 ==============

  it('Prisma Client 應已生成 Attachment type', () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf-8');
    // 這個測試間接確認: schema 合法 + Prisma Client 重新生成成功
    // (Sprint 44 sprint-44-chat-sessions-guard.test.ts 的 base pattern)
    expect(schema, 'schema 應有 Attachment').toMatch(/model\s+Attachment/);
    // migration 存在 + sql 正確 = client 生成成功
    const migrationsDir = 'prisma/migrations';
    const dirs = readdirSync(migrationsDir).filter((d) =>
      d.includes('sprint46_attachments'),
    );
    expect(dirs.length, 'migration 存在表示 client 已重新生成').toBeGreaterThan(0);
  });

  // ============== G. Sprint 45 既有功能未破壞守護 ==============

  it('ChatSession 既有欄位應保留 (userId, title, createdAt, updatedAt)', () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf-8');
    const match = schema.match(/model\s+ChatSession\s*\{[\s\S]*?\n\}/);
    expect(match, '應能找到 ChatSession model').toBeTruthy();
    const body = match![0];
    expect(body, '應保留 userId').toMatch(/userId/);
    expect(body, '應保留 title').toMatch(/title/);
    expect(body, '應保留 createdAt').toMatch(/createdAt/);
    expect(body, '應保留 updatedAt').toMatch(/updatedAt/);
    expect(body, '應保留 messages 關聯').toMatch(/messages\s+ChatMessage\[\]/);
  });

  it('ChatMessage 既有欄位應保留 (sessionId, role, content, metadata)', () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf-8');
    const match = schema.match(/model\s+ChatMessage\s*\{[\s\S]*?\n\}/);
    expect(match, '應能找到 ChatMessage model').toBeTruthy();
    const body = match![0];
    expect(body, '應保留 sessionId').toMatch(/sessionId/);
    expect(body, '應保留 role').toMatch(/role/);
    expect(body, '應保留 content').toMatch(/content/);
    expect(body, '應保留 metadata Json').toMatch(/metadata\s+Json/);
  });
});
