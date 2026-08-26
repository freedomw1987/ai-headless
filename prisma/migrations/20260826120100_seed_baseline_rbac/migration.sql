-- Baseline RBAC Seed Migration
--
-- 對應 PRD：docs/prd/09-rbac.md §5.3
--
-- 建立內建 3 個 role + 8 個 permissions (含 admin wildcard '*')
--
-- 用 fixed IDs (sys_* 前缀) 而非 cuid,確保 migration 可重複執行 (idempotent via ON CONFLICT)
-- 注意:僅 baseline seed,後續 role/permission 變更應用 runtime seedRBAC() 函式

-- === Roles (idempotent via ON CONFLICT) ===
INSERT INTO "roles" ("id", "name", "displayName", "description", "isSystem", "createdAt", "updatedAt")
VALUES
  ('sys_role_admin', 'admin', '管理員', '擁有所有權限,可管理 roles 與 users', true, NOW(), NOW()),
  ('sys_role_editor', 'editor', '編輯者', '可讀 users,不可改 roles', true, NOW(), NOW()),
  ('sys_role_viewer', 'viewer', '訪客', '唯讀', true, NOW(), NOW())
ON CONFLICT ("name") DO NOTHING;

-- === Permissions (idempotent via ON CONFLICT) ===
-- Admin: 6 個 permissions (含萬能 wildcard '*')
INSERT INTO "permissions" ("id", "roleId", "code")
VALUES
  ('sys_perm_admin_ur', 'sys_role_admin', 'users:read'),
  ('sys_perm_admin_uw', 'sys_role_admin', 'users:write'),
  ('sys_perm_admin_ua', 'sys_role_admin', 'users:assign'),
  ('sys_perm_admin_rr', 'sys_role_admin', 'roles:read'),
  ('sys_perm_admin_rw', 'sys_role_admin', 'roles:write'),
  ('sys_perm_admin_wc', 'sys_role_admin', '*')
ON CONFLICT ("roleId", "code") DO NOTHING;

-- Editor: 1 個 permission
INSERT INTO "permissions" ("id", "roleId", "code")
VALUES
  ('sys_perm_editor_ur', 'sys_role_editor', 'users:read')
ON CONFLICT ("roleId", "code") DO NOTHING;

-- Viewer: 1 個 permission
INSERT INTO "permissions" ("id", "roleId", "code")
VALUES
  ('sys_perm_viewer_ur', 'sys_role_viewer', 'users:read')
ON CONFLICT ("roleId", "code") DO NOTHING;