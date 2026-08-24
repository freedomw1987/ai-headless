'use client';

/**
 * useSidebarToggle — TD-501 抽出
 *
 * RWD: 手機版 sidebar 抽屜開關。
 * 桌面版(< 768px 以下)是手機版)使用 desktopMode flag 控制 ChatSidebar 是否顯示 close 按鈕。
 */

import { useCallback, useState } from 'react';

export type UseSidebarToggle = {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
  /** 包裝 onSelect,選擇後自動關閉抽屜(手機版體驗) */
  selectAndClose: (id: string, onSelect: (id: string) => void) => void;
};

export function useSidebarToggle(): UseSidebarToggle {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((v) => !v), []);

  const selectAndClose = useCallback(
    (id: string, onSelect: (id: string) => void) => {
      onSelect(id);
      setOpen(false);
    },
    [],
  );

  return { open, setOpen, toggle, selectAndClose };
}