'use client';

// Sprint 14 TECH-034 — Dynamic Form Client
//
// 動態組裝新增 / 編輯表單。
// 接收 FormUIConfig，自動產生對應 input。

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { FormUIConfig } from '@/lib/runtime/ui-config';

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
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">{config.title}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {config.fields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {renderInput(field, values[field.name], (v) => handleChange(field.name, v))}
          </div>
        ))}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? '提交中…' : mode === 'create' ? '建立' : '儲存'}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/admin/crud/${specName}`)}
            className="px-4 py-2 border rounded"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}

function renderInput(
  field: { name: string; inputType: string; required: boolean; options?: string[] },
  value: unknown,
  onChange: (v: unknown) => void,
) {
  const v = value ?? '';

  switch (field.inputType) {
    case 'textarea':
      return (
        <textarea
          name={field.name}
          value={String(v)}
          required={field.required}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border rounded p-2"
        />
      );
    case 'number':
      return (
        <input
          type="number"
          name={field.name}
          value={String(v)}
          required={field.required}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
          className="w-full border rounded p-2"
        />
      );
    case 'checkbox':
      return (
        <input
          type="checkbox"
          name={field.name}
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4"
        />
      );
    case 'select':
      return (
        <select
          name={field.name}
          value={String(v)}
          required={field.required}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border rounded p-2"
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
        <input
          type="date"
          name={field.name}
          value={v instanceof Date ? v.toISOString().slice(0, 10) : String(v)}
          required={field.required}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border rounded p-2"
        />
      );
    default:
      return (
        <input
          type="text"
          name={field.name}
          value={String(v)}
          required={field.required}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border rounded p-2"
        />
      );
  }
}