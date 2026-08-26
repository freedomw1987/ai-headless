import { db } from '@/lib/db';
import { requireDynamicPermission } from '@/lib/auth/dynamic-permission';
import { PermissionCode } from '@/lib/auth/permissions';
import { UserForm } from '../../user-form';

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Server Component: throw 讓 Next.js error boundary 處理 (會重導 /admin)
  await requireDynamicPermission(PermissionCode.USERS_ASSIGN);
  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!user) {
    return <div className="p-8">找不到用戶</div>;
  }
  return (
    <UserForm
      initial={{
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as 'admin' | 'editor' | 'viewer',
      }}
    />
  );
}