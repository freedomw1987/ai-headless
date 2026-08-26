/**
 * /admin/roles/[id]/permissions — Permission 矩陣頁 (Server Component)
 *
 * Sprint 21 Task 9 — FR-2
 * 對應 PRD：docs/prd/09-rbac.md §5.3
 */

import { MatrixPageClient } from './matrix-page-client';

export default async function MatrixPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MatrixPageClient roleId={id} />;
}