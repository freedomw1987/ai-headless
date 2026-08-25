'use client';

// Sprint 14 TECH-034 — Dynamic Detail Client
// Sprint 17 Stage 1.2 — detail page UI 改進（用 shadcn/ui 元件）
//
// 動態組裝詳情頁 + workflow transitions。
//
// Sprint 15 TECH-038：formatter 在 server side（detail page）已套用，client 只接 formattedValues map

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, Play, AlertCircle } from 'lucide-react';
import type { DetailUIConfig } from '@/lib/runtime/ui-config';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
    if (initialItem !== null) return;
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

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            載入中…
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium">載入失敗</p>
                <p className="text-sm text-muted-foreground">{error ?? 'Not found'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 標題 + 操作區（Card） */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">{config.title}</CardTitle>
              <CardDescription>
                {specName} · ID {id}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href={`/admin/crud/${specName}`}>
                  <ArrowLeft />
                  返回列表
                </Link>
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 />
                刪除
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 錯誤訊息 */}
      {error && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 欄位列表（Card 包裝） */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">詳細資料</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {config.fields.map((field) => {
              const rawValue = item[field.name];
              const display = formattedValues[field.name] ?? formatValue(rawValue);
              return (
                <div
                  key={field.name}
                  className="grid grid-cols-3 gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <dt className="text-sm font-medium text-muted-foreground">
                    {field.label}
                  </dt>
                  <dd className="col-span-2 text-sm">
                    {field.inputType === 'checkbox' ? (
                      rawValue ? <Badge>✓</Badge> : <Badge variant="secondary">—</Badge>
                    ) : (
                      display
                    )}
                  </dd>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Workflow Transitions */}
      {config.transitions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Workflow Transitions</CardTitle>
            <CardDescription>變更此資料的狀態</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {config.transitions.map((t) => (
                <Button
                  key={t.to}
                  onClick={() => handleTransition(t.event)}
                  data-testid={`transition-${t.to}`}
                >
                  <Play />
                  {t.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
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