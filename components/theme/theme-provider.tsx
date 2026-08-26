'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ComponentProps } from 'react';

/**
 * Sprint 20 Stage 3 — ThemeProvider（全站包）
 *
 * 設計決策：
 * - attribute="class"：配合 tailwind.config.ts 的 `darkMode: ['class']`
 * - defaultTheme="system"：尊重使用者作業系統偏好
 * - enableSystem：啟用 system 模式（會自動監聽 OS 切換）
 * - disableTransitionOnChange：避免切換時 CSS 過渡動畫造成閃爍
 */
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}