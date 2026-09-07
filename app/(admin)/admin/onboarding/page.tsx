/**
 * Onboarding Page (Sprint 58 P0-7)
 */

import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { OnboardingWizard } from '@/components/admin/onboarding-wizard';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/admin/login');
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingStep: true, name: true },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <OnboardingWizard
        initialStep={user?.onboardingStep ?? 0}
        userName={user?.name ?? null}
      />
    </div>
  );
}