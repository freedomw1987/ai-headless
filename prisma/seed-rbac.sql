-- ============================================================
-- RBAC Seed SQL (Standalone, Idempotent)
-- ============================================================
--
-- 用途：
--   - 整合 prisma/migrations/20260826120100_seed_baseline_rbac
--   - 整合 prisma/migrations/20260826120200_backfill_user_role_id
--   - 整合 prisma/migrations/20260826130000_backfill_extension_permissions
--   - 給獨立場景使用（fresh dev DB without running migrations）
--
-- 用法：
--   psql "$DATABASE_URL" -f prisma/seed-rbac.sql
--
-- Idempotent：
--   - 全部 INSERT 用 ON CONFLICT DO NOTHING
--   - 全部 UPDATE 有 WHERE 條件 (避免覆蓋)
--   - 可重複執行不會產生副作用
--
-- 注意：
--   - 這檔不替代 migrate deploy；正常 deployment 仍用 prisma migrate deploy
--   - 給「想跳過 migration 但仍要 RBAC seed」的人使用
--   - 對應 PRD: docs/prd/09-rbac.md §5.3

-- ============================================================
-- 1. Roles (3 system roles)
-- ============================================================
INSERT INTO "roles" ("id", "name", "displayName", "description", "isSystem", "createdAt", "updatedAt")
VALUES
  ('sys_role_admin', 'admin', '管理員', '擁有所有權限,可管理 roles 與 users', true, NOW(), NOW()),
  ('sys_role_editor', 'editor', '編輯者', '可讀 users,不可改 roles', true, NOW(), NOW()),
  ('sys_role_viewer', 'viewer', '訪客', '唯讀', true, NOW(), NOW())
ON CONFLICT ("name") DO NOTHING;

-- ============================================================
-- 2. Baseline Permissions (8 - 含 admin wildcard)
-- ============================================================
INSERT INTO "permissions" ("id", "roleId", "code")
VALUES
  ('sys_perm_admin_ur', 'sys_role_admin', 'users:read'),
  ('sys_perm_admin_uw', 'sys_role_admin', 'users:write'),
  ('sys_perm_admin_ua', 'sys_role_admin', 'users:assign'),
  ('sys_perm_admin_rr', 'sys_role_admin', 'roles:read'),
  ('sys_perm_admin_rw', 'sys_role_admin', 'roles:write'),
  ('sys_perm_admin_wc', 'sys_role_admin', '*'),
  ('sys_perm_editor_ur', 'sys_role_editor', 'users:read'),
  ('sys_perm_viewer_ur', 'sys_role_viewer', 'users:read')
ON CONFLICT ("roleId", "code") DO NOTHING;

-- ============================================================
-- 3. Extension Permissions (18 - 對應 4 extensions)
-- ============================================================
INSERT INTO "permissions" ("id", "roleId", "code")
VALUES
  -- blog extension (4)
  ('seed_perm_blog_c', 'sys_role_admin', 'blog.create'),
  ('seed_perm_blog_r', 'sys_role_admin', 'blog.read'),
  ('seed_perm_blog_u', 'sys_role_admin', 'blog.update'),
  ('seed_perm_blog_d', 'sys_role_admin', 'blog.delete'),
  -- event extension (6)
  ('seed_perm_event_c', 'sys_role_admin', 'event.create'),
  ('seed_perm_event_r', 'sys_role_admin', 'event.read'),
  ('seed_perm_event_u', 'sys_role_admin', 'event.update'),
  ('seed_perm_event_d', 'sys_role_admin', 'event.delete'),
  ('seed_perm_event_reg', 'sys_role_admin', 'event.register'),
  ('seed_perm_event_cancel', 'sys_role_admin', 'event.cancel'),
  -- todo extension (4)
  ('seed_perm_todo_c', 'sys_role_admin', 'todo.create'),
  ('seed_perm_todo_r', 'sys_role_admin', 'todo.read'),
  ('seed_perm_todo_u', 'sys_role_admin', 'todo.update'),
  ('seed_perm_todo_d', 'sys_role_admin', 'todo.delete'),
  -- order extension (4)
  ('seed_perm_order_c', 'sys_role_admin', 'order.create'),
  ('seed_perm_order_r', 'sys_role_admin', 'order.read'),
  ('seed_perm_order_u', 'sys_role_admin', 'order.update'),
  ('seed_perm_order_d', 'sys_role_admin', 'order.delete')
ON CONFLICT ("roleId", "code") DO NOTHING;

-- ============================================================
-- 4. Backfill User.roleId from User.role string
-- ============================================================
UPDATE "users" u
SET "roleId" = r.id
FROM "roles" r
WHERE r.name = u.role
  AND r."isSystem" = true
  AND (u."roleId" IS NULL OR u."roleId" != r.id);
