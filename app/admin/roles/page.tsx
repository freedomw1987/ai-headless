/**
 * /admin/roles — Role 列表頁 (Server Component)
 *
 * Sprint 21 Task 8 — FR-1
 * 對應 PRD：docs/prd/09-rbac.md §5.3
 *
 * 顯示所有 role（內建 + 自定義）並提供入口到矩陣頁
 */

import { RolesPageClient } from './roles-page-client';

export default function RolesPage() {
  return <RolesPageClient />;
}