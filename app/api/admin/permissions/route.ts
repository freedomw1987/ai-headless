/**
 * GET /api/admin/permissions
 *
 * Sprint 22 TD-6 — 列出所有已被任何 role 使用的 permission codes
 * 用於矩陣 UI（自動包含 extension permissions）
 *
 * 對應 PRD：docs/prd/09-rbac.md §5.3
 *
 * 回傳: [{ code, resource, label }]
 * - code: 完整 permission code (e.g. "blog:write")
 * - resource: 由 code 解析的群組 (e.g. "Blog")
 * - label: 人類可讀標籤 (e.g. "Write")
 *
 * 權限: admin only (requireDynamicPermission ROLES_WRITE)
 */

import { db } from '@/lib/db';
import { requireDynamicPermission } from '@/lib/auth/dynamic-permission';
import { PermissionCode } from '@/lib/auth/permissions';

type PermissionItem = {
  code: string;
  resource: string;
  label: string;
};

/**
 * 由 code 解析 resource (e.g. "blog:write" 或 "blog.write" → "Blog")
 * 支援兩種命名風格:
 *   - Sprint 21 設計: "users:read" (colon 風格, 內建)
 *   - Extension manifest: "blog.create" (dot 風格, Phase 1 既有)
 */
function parseResource(code: string): string {
  // 優先用 colon 切 (Sprint 21 內建), fallback dot (extension)
  const parts = code.includes(':') ? code.split(':') : code.split('.');
  const resource = parts[0];
  if (!resource) return 'Other';
  return resource.charAt(0).toUpperCase() + resource.slice(1);
}

/**
 * 由 code 解析 label (e.g. "blog.write" → "Write")
 */
function parseLabel(code: string): string {
  const parts = code.includes(':') ? code.split(':') : code.split('.');
  const action = parts[1];
  if (!action) return code;
  return action.charAt(0).toUpperCase() + action.slice(1);
}

/**
 * 載入所有 permission codes (distinct)
 */
async function loadPermissionCodes(): Promise<string[]> {
  const records = await db.permission.findMany({
    select: { code: true },
  });
  // distinct
  const codesSet = new Set(records.map((r) => r.code));
  // 排序: 內建 permissions 優先, 然後 extension 依字母
  const builtinOrder: string[] = [
    PermissionCode.USERS_READ,
    PermissionCode.USERS_WRITE,
    PermissionCode.USERS_ASSIGN,
    PermissionCode.ROLES_READ,
    PermissionCode.ROLES_WRITE,
    PermissionCode.ADMIN_WILDCARD,
  ];
  const sorted = Array.from(codesSet).sort((a, b) => {
    const aBuiltin = builtinOrder.indexOf(a as PermissionCode);
    const bBuiltin = builtinOrder.indexOf(b as PermissionCode);
    if (aBuiltin !== -1 && bBuiltin !== -1) return aBuiltin - bBuiltin;
    if (aBuiltin !== -1) return -1;
    if (bBuiltin !== -1) return 1;
    return a.localeCompare(b);
  });
  return sorted;
}

export async function GET() {
  // 1. Auth + Permission
  const auth = await import('@/lib/auth/config');
  const session = await auth.auth();
  if (!session?.user?.id) {
    return Response.json(
      { status: 401, error: 'Unauthorized' },
      { status: 401 },
    );
  }
  try {
    await requireDynamicPermission(PermissionCode.ROLES_WRITE);
  } catch {
    return Response.json(
      { status: 403, error: 'Forbidden: 需要 admin 權限' },
      { status: 403 },
    );
  }

  // 2. 載入所有 permission codes
  const codes = await loadPermissionCodes();
  const data: PermissionItem[] = codes.map((code) => ({
    code,
    resource: parseResource(code),
    label: parseLabel(code),
  }));

  return Response.json({
    status: 200,
    data,
  });
}