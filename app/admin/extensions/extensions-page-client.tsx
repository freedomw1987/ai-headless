'use client';

/**
 * ExtensionsPage — Extension 管理後台（TD-402 RWD + TD-403 Toast）
 */

import { useEffect, useState } from 'react';
import { ExtensionCard, type ExtensionCardData } from '@/components/admin/extension-card';
import { ToastProvider } from '@/components/ui/toast';

export function ExtensionsPageClient() {
  return (
    <ToastProvider>
      <ExtensionsContent />
    </ToastProvider>
  );
}

function ExtensionsContent() {
  const [extensions, setExtensions] = useState<ExtensionCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadExtensions = async () => {
    try {
      const res = await fetch('/api/extensions');
      const json = await res.json();

      if (res.ok && json.data) {
        setExtensions(json.data);
        setError(null);
      } else {
        setError(json.error ?? '載入失敗');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExtensions();
  }, []);

  const handleToggle = (name: string, newEnabled: boolean) => {
    setExtensions((prev) =>
      prev.map((e) => (e.name === name ? { ...e, isEnabled: newEnabled } : e)),
    );
  };

  return (
    <div className="container mx-auto py-8" data-testid="extensions-page">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Extensions 管理</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          管理已安裝的 Extensions（啟用 / 停用）
        </p>
      </header>

      {loading && (
        <p className="text-sm text-muted-foreground">載入中…</p>
      )}

      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          錯誤：{error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            共 <strong>{extensions.length}</strong> 個 Extensions
            （{extensions.filter((e) => e.isEnabled).length} 啟用 /{' '}
            {extensions.filter((e) => !e.isEnabled).length} 停用）
          </div>

          {/* TD-402: grid-cols-1 sm:grid-cols-2（<640px 單欄） */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {extensions.map((ext) => (
              <ExtensionCard
                key={ext.name}
                extension={ext}
                onToggle={handleToggle}
              />
            ))}
          </div>

          {extensions.length === 0 && (
            <p className="rounded border border-dashed p-8 text-center text-sm text-muted-foreground">
              還沒有安裝任何 Extensions
            </p>
          )}
        </>
      )}
    </div>
  );
}