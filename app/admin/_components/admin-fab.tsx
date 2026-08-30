'use client';

/**
 * AdminFab — Admin AI Chat FAB (Sprint 44 Commit D)
 *
 * 功能:
 * - 浮動按鈕 (右下角預設)
 * - 可拖動 (pointer event)
 * - 鬆手自動 snap 到離螢幕邊緣最近的位置 (S44-D 範圍)
 * - 點擊開啟 chat dialog (S44-E 整合)
 *
 * admin-only: 只對 role=admin 的 user 顯示 (S44 Plan Gate 確認)
 */

import { useState, useRef, useCallback, PointerEvent as ReactPointerEvent } from 'react';
import { MessageSquare } from 'lucide-react';
import type { AuthUser } from '@/lib/auth/auth';

const FAB_SIZE = 56; // px (Tailwind h-14 w-14)


/** Snap 到離螢幕邊緣最近的位置 (S44-D: snap 邏輯) */
export function snapToEdge(
  x: number,
  y: number,
  viewportWidth: number,
  viewportHeight: number,
  fabSize: number = FAB_SIZE
): { x: number; y: number } {
  // x: snap 到 0 或 viewportWidth - fabSize (取離中心線較近者)
  const xCenter = viewportWidth / 2;
  const xSnapped = x < xCenter ? 0 : viewportWidth - fabSize;

  // y: snap 到 0 或 viewportHeight - fabSize (取離中心線較近者)
  const yCenter = viewportHeight / 2;
  const ySnapped = y < yCenter ? 0 : viewportHeight - fabSize;

  return { x: xSnapped, y: ySnapped };
}

export function AdminFab({ user, onClick }: { user: AuthUser; onClick?: () => void }) {
  // admin-only 限制 (S44 Plan Gate 確認)
  if (user.role !== 'admin') return null;

  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; pointerX: number; pointerY: number } | null>(
    null,
  );
  const movedRef = useRef(false);

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      // 只用主要按鈕 (滑鼠左鍵 / touch)
      if (e.button !== 0 && e.pointerType === 'mouse') return;

      // 計算 FAB 當前位置 (default 是右下角)
      const rect = e.currentTarget.getBoundingClientRect();
      const currentX = rect.left;
      const currentY = rect.top;

      dragStartRef.current = {
        x: currentX,
        y: currentY,
        pointerX: e.clientX,
        pointerY: e.clientY,
      };
      movedRef.current = false;
      setIsDragging(true);
    },
    [],
  );

  const handlePointerMove = useCallback((e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragStartRef.current) return;
    e.preventDefault();

    const dx = e.clientX - dragStartRef.current.pointerX;
    const dy = e.clientY - dragStartRef.current.pointerY;

    // 判定是否真的在拖動 (避免誤觸 click)
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      movedRef.current = true;
    }

    // 限制在 viewport 內
    const newX = Math.max(0, Math.min(window.innerWidth - FAB_SIZE, dragStartRef.current.x + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - FAB_SIZE, dragStartRef.current.y + dy));

    setPosition({ x: newX, y: newY });
  }, []);

  const handlePointerUp = useCallback(() => {
    if (!dragStartRef.current) {
      setIsDragging(false);
      return;
    }

    // snap 到離邊緣最近的位置
    if (position) {
      const snapped = snapToEdge(position.x, position.y, window.innerWidth, window.innerHeight);
      setPosition(snapped);
    }

    setIsDragging(false);
    dragStartRef.current = null;
  }, [position]);

  const handleClick = useCallback(() => {
    // 拖動過不觸發 click
    if (movedRef.current) return;
    onClick?.();
  }, [onClick]);

  // 預設右下角 (CSS 用 bottom-6 right-6)
  // 拖動後用 inline style 覆蓋
  const style: React.CSSProperties = position
    ? {
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transition: isDragging ? 'none' : 'all 0.2s ease-out',
        zIndex: 50,
      }
    : {
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 50,
      };

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleClick}
      style={style}
      className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95 transition-transform cursor-grab active:cursor-grabbing"
      aria-label="開啟 AI 對話"
      data-testid="admin-fab"
    >
      <MessageSquare className="h-6 w-6 mx-auto" />
    </button>
  );
}