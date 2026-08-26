-- Backfill User.roleId from User.role string (Sprint 21 TD-1 修正)
--
-- 對應 PRD：docs/prd/09-rbac.md §5.3 + Sprint 21 reflection TD-1
--
-- 原因：Phase 2 動態 RBAC (commit 1) 加了 User.roleId FK,但既有 demo 用戶
--       是 Sprint 8 seed-users.ts 建立的,當時沒有 roleId 欄位。
--       沒有 roleId → hasDynamicPermission 找不到 permissions → admin 變成無權限
--
-- 策略：以現有 User.role 字串 (admin / editor / viewer) 對應到 baseline 的
--       sys_role_* ID,UPDATE 寫回 users.roleId
--
-- ON CONFLICT 處理: UNIQUE 約束不存在於 roleId (nullable),不需要
-- 但若 roleId 已被填且不符,仍 UPDATE 修正

UPDATE "users" u
SET "roleId" = r.id
FROM "roles" r
WHERE r.name = u.role
  AND r."isSystem" = true
  AND (u."roleId" IS NULL OR u."roleId" != r.id);