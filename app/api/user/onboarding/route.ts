/**
 * ==============================================
 *  User Onboarding API (Sprint 58 P0-7)
 * ==============================================
 *
 * POST /api/user/onboarding
 *   body: { step: number, action: 'advance' | 'skip' }
 *
 * 對應 docs/sprint58-plan-gate.md §2
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth/config';
import { logger } from '@/lib/log';

const OnboardingSchema = z.object({
  step: z.number().int().min(0).max(99),
  action: z.enum(['advance', 'skip', 'complete']),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parseResult = OnboardingSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  const { step, action } = parseResult.data;

  let newStep: number;
  if (action === 'skip') {
    newStep = 99; // 跳過標記為完成
  } else if (action === 'complete') {
    newStep = 99;
  } else {
    // advance
    newStep = step + 1;
  }

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: { onboardingStep: newStep },
    });
  } catch (error) {
    logger.error('onboarding update failed', {
      userId: session.user.id,
      error: String(error),
    });
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  return NextResponse.json({ onboardingStep: newStep });
}
