/**
 * Reset Password Page (Sprint 56 P0-2)
 */

import { ResetPasswordForm } from './reset-password-form';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token ?? '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <ResetPasswordForm token={token} />
    </div>
  );
}
