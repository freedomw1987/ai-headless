/**
 * ReasoningSection — Sprint 47 Commit 2 (Stage 47-1)
 *
 * 顯示 AI 思考過程的可折疊區塊。
 * 對應 PRD §2.2 FR-2.5: ReasoningSection 預設收合，點擊展開
 *
 * Props:
 * - reasoning: 思考字串（空/undefined 時不渲染）
 * - autoCollapseMs?: 展開後自動收合的毫秒數（預設 undefined 不自動收合）
 *
 * A11y:
 * - role="button" + aria-expanded
 * - 鍵盤可達 (Enter / Space 切換)
 */

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { BrainIcon, ChevronRightIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ReasoningSectionProps = {
  reasoning?: string;
  autoCollapseMs?: number;
  className?: string;
};

export const ReasoningSection = ({
  reasoning,
  autoCollapseMs,
  className,
}: ReasoningSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 自動收合
  useEffect(() => {
    if (isExpanded && autoCollapseMs && timerRef.current === null) {
      timerRef.current = setTimeout(() => {
        setIsExpanded(false);
        timerRef.current = null;
      }, autoCollapseMs);
    }
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isExpanded, autoCollapseMs]);

  if (!reasoning || reasoning.trim().length === 0) return null;

  const toggle = () => setIsExpanded((prev) => !prev);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <div
      className={cn(
        'rounded-md border border-dashed border-muted-foreground/30 bg-muted/30 text-xs',
        className,
      )}
    >
      <button
        type="button"
        role="button"
        aria-expanded={isExpanded}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-muted-foreground hover:bg-muted/50"
      >
        <ChevronRightIcon
          className={cn(
            'size-3 transition-transform',
            isExpanded && 'rotate-90',
          )}
        />
        <BrainIcon className="size-3" />
        <span>思考過程</span>
      </button>
      {isExpanded && (
        <div
          role="region"
          aria-label="AI 思考過程"
          className="border-t border-dashed border-muted-foreground/30 px-3 py-2 text-foreground/80 whitespace-pre-wrap"
        >
          {reasoning}
        </div>
      )}
    </div>
  );
};