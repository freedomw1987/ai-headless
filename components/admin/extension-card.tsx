'use client';

/**
 * ExtensionCard — 顯示單個 Extension（含啟用/停用切換 + TD-403 Toast）
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export type ExtensionCardData = {
  name: string;
  version: string;
  label?: string;
  description?: string;
  author?: string;
  hooks?: string[];
  actions?: string[];
  computed?: string[];
  workflows?: string[];
  isEnabled: boolean;
};

type Props = {
  extension: ExtensionCardData;
  onToggle?: (name: string, newEnabled: boolean) => void;
};

export function ExtensionCard({ extension, onToggle }: Props) {
  const [enabled, setEnabled] = useState(extension.isEnabled);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/extensions/${extension.name}/toggle`, {
        method: 'POST',
      });
      const json = await res.json();

      if (res.ok && json.data) {
        setEnabled(json.data.enabled);
        onToggle?.(extension.name, json.data.enabled);
        toast.success(`${extension.label ?? extension.name} 已${json.data.enabled ? '啟用' : '停用'}`);
      } else {
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
    } catch (err) {
      console.error('Toggle failed:', err);
      toast.error(`操作失敗：${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-5 shadow-sm transition-all',
        !enabled && 'opacity-60',
      )}
      data-testid={`extension-card-${extension.name}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">
              {extension.label ?? extension.name}
            </h3>
            <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
              v{extension.version}
            </span>
            {enabled ? (
              <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                ✓ 已啟用
              </span>
            ) : (
              <span className="rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                ✗ 已停用
              </span>
            )}
          </div>

          {extension.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {extension.description}
            </p>
          )}

          {extension.author && (
            <p className="mt-1 text-xs text-muted-foreground">
              by {extension.author}
            </p>
          )}
        </div>

        <Button
          onClick={handleToggle}
          disabled={loading}
          variant={enabled ? 'outline' : 'default'}
          size="sm"
          data-testid={`toggle-${extension.name}`}
        >
          {loading ? '...' : enabled ? '停用' : '啟用'}
        </Button>
      </div>

      {/* Counts badges */}
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {(extension.hooks?.length ?? 0) > 0 && (
          <span className="rounded bg-blue-100 px-2 py-1 font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            🪝 {extension.hooks?.length} hooks
          </span>
        )}
        {(extension.actions?.length ?? 0) > 0 && (
          <span className="rounded bg-purple-100 px-2 py-1 font-medium text-purple-700 dark:bg-purple-950 dark:text-purple-300">
            ⚡ {extension.actions?.length} actions
          </span>
        )}
        {(extension.computed?.length ?? 0) > 0 && (
          <span className="rounded bg-orange-100 px-2 py-1 font-medium text-orange-700 dark:bg-orange-950 dark:text-orange-300">
            🧮 {extension.computed?.length} computed
          </span>
        )}
        {(extension.workflows?.length ?? 0) > 0 && (
          <span className="rounded bg-pink-100 px-2 py-1 font-medium text-pink-700 dark:bg-pink-950 dark:text-pink-300">
            🔄 {extension.workflows?.length} workflows
          </span>
        )}
      </div>
    </div>
  );
}