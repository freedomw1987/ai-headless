/**
 * ==============================================
 *  Role Validation Schema (Sprint 21 Task 5)
 * ==============================================
 *
 * 對應 PRD：docs/prd/09-rbac.md §5.3 / FR-3 / Q2 命名規則
 *
 * 命名規則:
 *   ^[a-z][a-z0-9_]{0,31}$  (小寫 + 數字/底線, 1-32 字)
 *
 * 保留字: admin / editor / viewer (Phase 1 內建3 個)
 *
 * 用法:
 *   import { createRoleSchema, updateRoleSchema } from '@/lib/auth/role-schema';
 *
 *   const result = createRoleSchema.safeParse(input);
 *   if (!result.success) return Response.json({ error: result.error.issues }, { status: 400 });
 */

import { z } from 'zod';

// ==============================================
// 1. 命名規則
// ==============================================

const NAME_REGEX = /^[a-z][a-z0-9_]{0,31}$/;

export const RESERVED_ROLE_NAMES = ['admin', 'editor', 'viewer'] as const;

// ==============================================
// 2. 基礎欄位
// ==============================================

const baseFields = {
  displayName: z.string().min(1, 'displayName 不可為空').max(64),
  description: z.string().max(256).optional(),
};

// ==============================================
// 3. Create schema（含 name + 保留字檢查）
// ==============================================

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(1, 'name 不可為空')
    .max(32, 'name 最長 32 字')
    .regex(NAME_REGEX, 'name 須符合 ^[a-z][a-z0-9_]{0,31}$')
    .refine(
      (name) => !RESERVED_ROLE_NAMES.includes(name as typeof RESERVED_ROLE_NAMES[number]),
      `name 不可為保留字 (${RESERVED_ROLE_NAMES.join(', ')})`,
    ),
  ...baseFields,
});

// ==============================================
// 4. Update schema（name 不可改,isSystem 不可改）
// ==============================================

export const updateRoleSchema = z
  .object(baseFields)
  .strict() // 不接受額外欄位（含 name, isSystem）
  .refine(
    (data) => Object.keys(data).length > 0,
    '至少要提供一個可更新欄位',
  );

// ==============================================
// 5. Type exports
// ==============================================

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;