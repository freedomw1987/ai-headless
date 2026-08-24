'use client';

/**
 * Toast 系統 — TD-403
 *
 * 簡單實作（不引入 sonner 等第三方依賴）：
 * - ToastProvider 提供 context
 * - useToast() hook 提供 show()
 * - 預設 5 秒後自動消失
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

type ToastVariant = 'default' | 'success' | 'error';

type ToastInput = {
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type Toast = ToastInput & { id: string };

type ToastContextValue = {
  show: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((toast: ToastInput) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const duration = toast.durationMs ?? 5000;

    setToasts((prev) => [...prev, { ...toast, id }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
        data-testid="toast-container"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            data-testid="toast"
            className={cn(
              'min-w-[200px] max-w-md rounded-md px-4 py-2 text-sm shadow-md',
              'animate-in slide-in-from-bottom-5',
              toast.variant === 'error' && 'border border-red-300 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100',
              toast.variant === 'success' && 'border border-green-300 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100',
              (!toast.variant || toast.variant === 'default') && 'border bg-background text-foreground',
            )}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}