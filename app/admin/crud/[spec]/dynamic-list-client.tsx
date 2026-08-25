'use client';

// Sprint 14 TECH-034 — Dynamic List Client Component
//
// 從 UIConfig 動態渲染列表 + 新增按鈕。
// 不依賴任何手寫 spec 邏輯。

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ListUIConfig } from '@/lib/runtime/ui-config';

type Props = {
  config: ListUIConfig;
  specName: string;
};

export function DynamicListClient({ config, specName }: Props) {
  const [items, setItems] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(config.apiEndpoint)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json.error) {
          setError(json.error);
        } else {
          setItems((json.items as unknown[]) ?? []);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [config.apiEndpoint]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">{config.title}</h1>
        <Link
          href={config.createLink}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          data-testid="create-link"
        >
          + 新增
        </Link>
      </div>

      {error && (
        <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded">
          載入失敗：{error}
        </div>
      )}

      {loading ? (
        <div>載入中…</div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center text-gray-500">目前沒有資料</div>
      ) : (
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-50">
              {config.fields.map((f) => (
                <th key={f.name} className="border p-2 text-left">
                  {f.label}
                </th>
              ))}
              <th className="border p-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((raw, idx) => {
              const item = raw as Record<string, unknown>;
              return (
                <tr key={(item.id as string) ?? idx}>
                  {config.fields.map((f) => (
                    <td key={f.name} className="border p-2">
                      {renderCellValue(item[f.name], f.inputType)}
                    </td>
                  ))}
                  <td className="border p-2">
                    <Link
                      href={`/admin/crud/${specName}/${item.id as string}`}
                      className="text-blue-600 hover:underline"
                    >
                      檢視
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function renderCellValue(value: unknown, inputType: string): string {
  if (value === null || value === undefined) return '';
  switch (inputType) {
    case 'checkbox':
      return value ? '✓' : '';
    case 'date':
      return value ? new Date(value as string).toLocaleDateString('zh-TW') : '';
    default:
      return String(value);
  }
}