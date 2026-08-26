-- Backfill Extension Permissions (Sprint 23 TD-7)
--
-- 對應 PRD：docs/prd/09-rbac.md §5.3 + Sprint 23 Plan Gate Q4
-- 對應 Issue: TD-7 — extension permissions 不在矩陣 UI 顯示
--
-- 原因:extensions/{name}/manifest.json 宣告 permissions,但這些
--      從未被 seed 進 DB。Phase 2 RBAC 矩陣 UI 雖已動態讀取 DB,但
--      DB 沒有 extension permissions → 矩陣看不到。
--
-- 策略:用 SQL 直接 INSERT 所有 extension permissions (idempempotent)
--      給 admin role (Phase 2 RBAC 設計:admin wildcard 已涵蓋,但
--      建立 records 確保 manifest 是 source of truth)
--
-- 注意:未來新增 extension 應同步:
--   1. 寫入 extensions/<name>/manifest.json
--   2. 跑 pnpm prisma migrate dev --name <feature> 產生 migration
--   或:
--   1. 跑 pnpm db:seed 觸發 seedextensionPermissions()

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