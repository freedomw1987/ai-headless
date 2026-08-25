'use client';

// Sprint 14 TECH-034 — Dynamic List Client Component
//
// 從 UIConfig 動態渲染列表 + 新增按鈕。
// 不依賴任何手寫 spec 邏輯。
//
// Sprint 15 TECH-038（partial）：
// - list page 暫不套用 formatter（server 不能傳函數給 client）
//   → 完整 list formatter 機制留 Sprint 16（架構上改為 server-side 預渲染 HTML）
// - customRenderer React component 渲染留 Sprint 16（client bundle 限制）
// - detail page 已完整實作 formatter（見 dynamic-detail-client.tsx）

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
    fetch(`/api/crud/${specName}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json.error) {
          setError(json.error);
        } else {
          setItems(json.items ?? json);
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
  }, [specName]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">{config.title}</h1>
        <Link
          href={`/admin/crud/${specName}/new`}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          新增
        </Link>
      </div>

      {error && (
        <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div>載入中…</div>
      ) : items.length === 0 ? (
        <div className="text-gray-500">尚無資料</div>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              {config.fields.map((f) => (
                <th key={f.name} className="border p-2 text-left text-sm font-medium">
                  {f.label}
                </th>
              ))}
              <th className="border p-2 text-left text-sm font-medium">操作</th>
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