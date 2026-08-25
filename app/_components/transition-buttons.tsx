// Sprint 12 TECH-024 — TransitionButtons 共用元件
//
// 給 ui-generator 產生的 edit page 用。
// 從 workflow schema 計算可用 events，按下按鈕 → POST transition endpoint。

'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createStateMachine, type StateMachineSchema } from '@/lib/state-machine/state-machine';

export function TransitionButtons({
  schema,
  currentStatus,
  resourceId,
  endpoint,
  onSuccess,
}: {
  schema: StateMachineSchema;
  currentStatus: string;
  resourceId: string;
  endpoint: string;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const sm = createStateMachine(schema);
  try {
    sm.setState(currentStatus);
  } catch {
    return (
      <div className="text-sm text-muted-foreground">
        未知狀態：{currentStatus}
      </div>
    );
  }

  const availableStates = Object.keys(sm.getAvailableEvents() ?? {});

  // 從 schema.states[currentState].on 拿目標 states
  const currentStateConfig = schema.states[currentStatus];
  const targetStates = Object.keys((currentStateConfig as { on?: Record<string, string> })?.on ?? {});

  if (targetStates.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        已封存（終態）
      </div>
    );
  }

  async function handleTransition(toState: string) {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(endpoint.replace('{id}', resourceId), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: toState }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message ?? '操作失敗');
        }
        onSuccess();
        router.refresh();
      } catch (e) {
        setError(String(e instanceof Error ? e.message : e));
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {targetStates.map((toState) => {
          const stateLabel = (schema.states[toState] as { label?: string })?.label ?? toState;
          return (
            <Button
              key={toState}
              variant="default"
              onClick={() => handleTransition(toState)}
              disabled={isPending}
              size="sm"
            >
              {isPending ? '...' : `→ ${stateLabel}`}
            </Button>
          );
        })}
      </div>
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>
      )}
    </div>
  );
}