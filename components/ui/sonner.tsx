'use client';

import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from 'next-themes';

/**
 * Sprint 20 Stage 4 — Sonner Toaster 統一包裝
 *
 * 設計決策：
 * - 用 Sonner（無頭 toast 庫）取代自製 ToastProvider
 * - 集中設定 theme 從 next-themes 讀取（自動跟隨 ThemeProvider 切換）
 * - position="top-right"（與原本預設一致）
 * - richColors：success/error 用顏色區分
 *
 * Sprint 20 Stage 4 Reviewer P1：
 * - 必須傳 theme prop，否則 dark mode 使用者看見淺色 toast
 * - theme="system" 只聽 OS，不聽 next-themes 加到 <html> 的 .dark class
 * - 改用 `useTheme().theme` 動態注入
 */
export function Toaster() {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      theme={(theme ?? 'system') as 'light' | 'dark' | 'system'}
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        duration: 4000,
      }}
    />
  );
}