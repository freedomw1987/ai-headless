'use client';

// Sprint 14 TECH-034 — Dynamic Detail Client
//
// 動態組裝詳情頁 + workflow transitions。
//
// Sprint 15 TECH-038：formatter 在 server side（detail page）已套用，client 只接 formattedValues map
// 不再傳函數（Server Component 不能傳函數給 Client Component）

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { DetailUIConfig } from '@/lib/runtime/ui-config';

type Props = {
  config: DetailUIConfig;
  specName: string;
  id: string;
  /** Sprint 15 TECH-038：server side 預先 fetch 的 item，避免 client 二次 fetch */
  initialItem?: Record<string, unknown> | null;
  /** Sprint 15 TECH-038：server side 預先套用 formatter 後的 value map（fieldName → formatted string）*/
  formattedValues?: Record<string, string>;
};

export function DynamicDetailClient({
  config,
  specName,
  id,
  initialItem = null,
  formattedValues = {},
}: Props) {
  const router = useRouter();
  const [item, setItem] = useState<Record<string, unknown> | null>(initialItem);
  const [loading, setLoading] = useState(initialItem === null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialItem !== null) return; // 已有 initial，跳過 fetch
    let cancelled = false;
    setLoading(true);
    fetch(`/api/crud/${specName}?id=${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json.error) {
          setError(json.error);
        } else {
          setItem(json);
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
  }, [specName, id, initialItem]);

  const handleTransition = async (event: string) => {
    setError(null);
    const res = await fetch(
      `/api/crud/${specName}?id=${id}&event=${encodeURIComponent(event)}`,
    );
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? 'Transition 失敗');
    } else {
      setItem(json);
      router.refresh();
    }
  };

  const handleDelete = async () => {
    if (!confirm('確認刪除？')) return;
    const res = await fetch(`/api/crud/${specName}?id=${id}`, { method: 'DELETE' });
    if (res.status === 204) {
      router.push(`/admin/crud/${specName}`);
    } else {
      const json = await res.json();
      setError(json.error ?? '刪除失敗');
    }
  };

  if (loading) return <div className="p-6">載入中…</div>;
  if (!item) return <div className="p-6">載入失敗：{error ?? 'Not found'}</div>;

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">{config.title}</h1>
        <div className="flex gap-2">
          <Link
            href={`/admin/crud/${specName}`}
            className="px-3 py-1 border rounded hover:bg-gray-50"
          >
            ← 返回列表
          </Link>
          <button
            onClick={handleDelete}
            className="px-3 py-1 border border-red-200 text-red-600 rounded hover:bg-red-50"
          >
            刪除
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded text-sm">
          {error}
        </div>
      )}

      <dl className="space-y-3">
        {config.fields.map((field) => (
          <div key={field.name} className="flex border-b pb-2">
            <dt className="w-40 text-gray-600">{field.label}</dt>
            <dd className="flex-1">
              {formattedValues[field.name] ?? formatValue(item[field.name])}
            </dd>
          </div>
        ))}
      </dl>

      {config.transitions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-medium mb-3">Workflow Transitions</h2>
          <div className="flex gap-2 flex-wrap">
            {config.transitions.map((t) => (
              <button
                key={t.to}
                onClick={() => handleTransition(t.event)}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                data-testid={`transition-${t.to}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toLocaleString('zh-TW');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}