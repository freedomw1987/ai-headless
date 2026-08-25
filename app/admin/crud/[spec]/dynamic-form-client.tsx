'use client';

// Sprint 14 TECH-034 — Dynamic Form Client
// Sprint 17 Stage 1.3 — form page UI 改進（用 shadcn/ui 元件）
//
// 動態組裝新增 / 編輯表單。
// 接收 FormUIConfig，自動產生對應 input（全部用 shadcn Input/Textarea/Label/Button）。

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import type { FormUIConfig } from '@/lib/runtime/ui-config';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type Props = {
  config: FormUIConfig;
  specName: string;
  mode: 'create' | 'edit';
  initialData?: Record<string, unknown>;
};

export function DynamicFormClient({ config, specName, mode, initialData }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, unknown>>(initialData ?? {});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const url =
        mode === 'edit' && initialData?.id
          ? `${config.submitUrl}?id=${initialData.id}`
          : config.submitUrl;
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? '提交失敗');
      } else {
        router.push(`/admin/crud/${specName}`);
        router.refresh();
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 標題區（Card） */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">{config.title}</CardTitle>
              <CardDescription>
                {mode === 'create' ? '新增一筆資料' : '編輯資料內容'}
              </CardDescription>
            </div>
            <Button asChild variant="outline">
              <Link href={`/admin/crud/${specName}`}>
                <ArrowLeft />
                返回列表
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* 錯誤訊息（destructive Card） */}
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

      {/* 表單（Card） */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {config.fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {renderInput(field, values[field.name], (v) => handleChange(field.name, v))}
              </div>
            ))}

            <div className="flex gap-2 pt-4 border-t">
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="animate-spin" />}
                {submitting ? '提交中…' : mode === 'create' ? '建立' : '儲存'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/admin/crud/${specName}`)}
              >
                取消
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function renderInput(
  field: { name: string; inputType: string; required: boolean; options?: string[]; placeholder?: string },
  value: unknown,
  onChange: (v: unknown) => void,
) {
  const v = value ?? '';

  switch (field.inputType) {
    case 'textarea':
      return (
        <Textarea
          id={field.name}
          name={field.name}
          value={String(v)}
          required={field.required}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
        />
      );
    case 'number':
      return (
        <Input
          id={field.name}
          type="number"
          name={field.name}
          value={String(v)}
          required={field.required}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
        />
      );
    case 'checkbox':
      return (
        <div className="flex items-center gap-2">
          <input
            id={field.name}
            type="checkbox"
            name={field.name}
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
          />
          <span className="text-sm text-muted-foreground">啟用</span>
        </div>
      );
    case 'select':
      return (
        <select
          id={field.name}
          name={field.name}
          value={String(v)}
          required={field.required}
          onChange={(e) => onChange(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">請選擇</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    case 'date':
      return (
        <Input
          id={field.name}
          type="date"
          name={field.name}
          value={v instanceof Date ? v.toISOString().slice(0, 10) : String(v)}
          required={field.required}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    default:
      return (
        <Input
          id={field.name}
          type="text"
          name={field.name}
          value={String(v)}
          required={field.required}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}