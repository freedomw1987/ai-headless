'use client';

/**
 * useSidebarToggle — TD-501 抽出
 *
 * RWD: 手機版 sidebar 抽屜開關。
 * 桌面版 始終顯示 sidebar,不使用此 hook；手機版才需要 toggle/selectAndClose。
 */

import { useCallback, useState } from 'react';

export type UseSidebarToggle = {
  open: boolean;
  setOpen: (v: boolean) => void;
  /** 包裝 onSelect,選擇後自動關閉抽屜(手機版體驗) */
  selectAndClose: (id: string, onSelect: (id: string) => void) => void;
};

export function useSidebarToggle(): UseSidebarToggle {
  const [open, setOpen] = useState(false);

  const selectAndClose = useCallback(
    (id: string, onSelect: (id: string) => void) => {
      onSelect(id);
      setOpen(false);
    },
    [],
  );

  return { open, setOpen, selectAndClose };
}