/**
 * US-102 — 用戶管理整合 smoke test
 *
 * 守護：
 * 1. 完整密碼 hash 流程（hash + verify）
 * 2. 預設 admin 帳號存在（admin@ai-headless.local）
 * 3. User model 必要欄位存在
 * 4. RBAC 矩陣正確（admin / editor / viewer）
 */

import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
// Sprint 25: hasPermission 純函式已刪除
// import { hasPermission } from '@/lib/auth/auth';
import { db } from '@/lib/db';

describe('US-102 整合 smoke test', () => {
  describe('密碼 hash + verify', () => {
    it('完整流程：hash → verify 正確密碼', async () => {
      const hash = await hashPassword('testPassword123');
      expect(await verifyPassword('testPassword123', hash)).toBe(true);
    });

    it('完整流程：hash → verify 錯誤密碼', async () => {
      const hash = await hashPassword('testPassword123');
      expect(await verifyPassword('wrongPassword', hash)).toBe(false);
    });
  });

  describe('預設 admin 帳號存在', () => {
    it('admin@ai-headless.local 在 DB 中（seed 過）', async () => {
      const admin = await db.user.findUnique({
        where: { email: 'admin@ai-headless.local' },
      });
      expect(admin).not.toBeNull();
      expect(admin?.role).toBe('admin');
      expect(admin?.isActive).toBe(true);
      expect(admin?.passwordHash).not.toBeNull();
    });

    it('admin 帳號的密碼可以 verify', async () => {
      const admin = await db.user.findUnique({
        where: { email: 'admin@ai-headless.local' },
      });
      expect(admin?.passwordHash).toBeDefined();
      const valid = await verifyPassword('admin123', admin!.passwordHash!);
      expect(valid).toBe(true);
    });

    it('editor / viewer demo 帳號也在', async () => {
      const editor = await db.user.findUnique({
        where: { email: 'editor@ai-headless.local' },
      });
      const viewer = await db.user.findUnique({
        where: { email: 'viewer@ai-headless.local' },
      });
      expect(editor?.role).toBe('editor');
      expect(viewer?.role).toBe('viewer');
    });
  });

  // Sprint 25: RBAC 矩陣測試已刪除 (hasPermission 純函式被移除)
  // 動態版矩陣測試見 tests/integration/auth-dynamic.test.ts
});