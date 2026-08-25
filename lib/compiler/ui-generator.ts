/**
 * ==============================================
 *  UI Generator — JSON → Next.js CRUD Pages
 * ==============================================
 *
 * 將 JsonSpec 轉換為 Next.js App Router 的 React page 代碼
 * 對應：docs/prd/01-framework-core.md §2.3 FR-2.3
 *
 * 生成的頁面：
 * - /admin/[model]            List page
 * - /admin/[model]/new        Create page
 * - /admin/[model]/[id]       Edit page
 *
 * 每頁：
 * - 'use client'（需要 hooks）
 * - 自動 RBAC
 * - 自動整合 shadcn/ui
 * - 自動根據 FieldType 生成對應 component
 */

import type { JsonSpec, Model, Field } from '@/lib/specs/json-spec.types';

// ==============================================
// 公開類型
// ==============================================

export type GeneratedPage = {
  path: string;
  name: string;
  code: string;
  model: string;
  kind: 'list' | 'create' | 'edit';
};

// ==============================================
// 輔助：model 名稱轉換
// ==============================================

function modelToKebab(modelName: string): string {
  return modelName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function _modelToTableName(modelName: string): string {
  return modelName.charAt(0).toLowerCase() + modelName.slice(1);
}

function uiBasePath(spec: JsonSpec, modelName: string): string {
  // 設計選擇：
  // - 沒設 uiBase → /admin/[model-kebab]（預設·一 spec 多 model）
  // - 有設 uiBase → 直接用 uiBase 作為 base（單一 model / Extension 風格）
  if (spec.uiBase) return spec.uiBase;
  return `/admin/${modelToKebab(modelName)}`;
}

// ==============================================
// Common imports & utilities
// ==============================================

const COMMON_HEADER = `'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
`;

// ==============================================
// Field → Component Mapping
// ==============================================

function fieldToInputComponent(
  field: Field,
): { tag: string; props: string; imports: string[]; items?: string } {
  const t = field.type;
  const fieldName = field.name;

  switch (t) {
    case 'string':
      return {
        tag: 'Input',
        props: `id="${fieldName}" name="${fieldName}" value={form.${fieldName} ?? ''} onChange={handleChange} placeholder="${fieldName}"`,
        imports: [],
      };
    case 'text':
      return {
        tag: 'Textarea',
        props: `id="${fieldName}" name="${fieldName}" value={form.${fieldName} ?? ''} onChange={handleChange} placeholder="${fieldName}" rows={4}`,
        imports: ['Textarea'],
      };
    case 'number':
    case 'decimal':
      return {
        tag: 'Input',
        props: `id="${fieldName}" name="${fieldName}" type="number" value={form.${fieldName} ?? ''} onChange={handleChange}`,
        imports: [],
      };
    case 'integer':
      return {
        tag: 'Input',
        props: `id="${fieldName}" name="${fieldName}" type="number" step="1" value={form.${fieldName} ?? ''} onChange={handleChange}`,
        imports: [],
      };
    case 'boolean':
      return {
        tag: 'Switch',
        props: `id="${fieldName}" checked={form.${fieldName} ?? false} onCheckedChange={(checked) => handleBooleanChange('${fieldName}', checked)}`,
        imports: ['Switch'],
      };
    case 'date':
      return {
        tag: 'Input',
        props: `id="${fieldName}" name="${fieldName}" type="date" value={form.${fieldName}?.slice(0, 10) ?? ''} onChange={handleChange}`,
        imports: [],
      };
    case 'datetime':
      return {
        tag: 'Input',
        props: `id="${fieldName}" name="${fieldName}" type="datetime-local" value={form.${fieldName}?.slice(0, 16) ?? ''} onChange={handleChange}`,
        imports: [],
      };
    case 'time':
      return {
        tag: 'Input',
        props: `id="${fieldName}" name="${fieldName}" type="time" value={form.${fieldName} ?? ''} onChange={handleChange}`,
        imports: [],
      };
    case 'enum': {
      const values = (field.validation?.enum ?? []) as string[];
      const items = values
        .map((v) => `                <SelectItem value="${v}">${v}</SelectItem>`)
        .join('\n');
      return {
        tag: 'Select',
        props: `value={form.${fieldName} ?? ''} onValueChange={(value) => handleSelectChange('${fieldName}', value)}`,
        imports: ['Select'],
        items, // extra content
      };
    }
    case 'reference': {
      // relation 外鍵欄位 — 使用 RelationSelect 自動從 API 載入選項
      const relatedModel = field.name.replace(/Id$/, '');
      return {
        tag: 'RelationSelect',
        props: `model="${relatedModel}" value={form.${fieldName} ?? ''} onChange={(value) => handleSelectChange('${fieldName}', value)}`,
        imports: ['RelationSelect'],
        items: '',
      };
    }
    case 'richText':
      return {
        tag: 'RichTextEditor',
        props: `value={form.${fieldName} ?? ''} onChange={(v) => handleFieldChange('${fieldName}', v)} placeholder="請輸入 ${field.name}..."`,
        imports: ['RichTextEditor'],
        items: '',
      };
    case 'file':
    case 'json':
    default:
      return {
        tag: 'Input',
        props: `id="${fieldName}" name="${fieldName}" value={form.${fieldName} ?? ''} onChange={handleChange}`,
        imports: [],
      };
  }
}

// ==============================================
// List Page
// ==============================================

function generateListPage(spec: JsonSpec, model: Model): GeneratedPage {
  const kebabName = modelToKebab(model.name);
  const label = model.label ?? model.name;
  const listableFields = model.fields.filter(
    (f) => !f.ui?.hidden && f.ui?.listable !== false,
  );
  const searchableFields = model.fields.filter((f) => f.ui?.searchable);

  // 表格列
  const headerCells = listableFields
    .map((f) => `              <TableHead>${f.label ?? f.name}</TableHead>`)
    .join('\n');

  const rowCells = listableFields
    .map(
      (f) =>
        `                <TableCell>{item.${f.name}}</TableCell>`,
    )
    .join('\n');

  // Action 按鈕
  const actionButtons = (model.actions ?? [])
    .map(
      (a) => `
                <Button variant="outline" size="sm" onClick={() => handleAction(item.id, '${a.name}')}>
                  ${a.label ?? a.name}
                </Button>`,
    )
    .join('');

  // 搜尋框
  const searchBox =
    searchableFields.length > 0
      ? `
            <Input
              placeholder="搜尋 ${searchableFields.map((f) => f.name).join(', ')}..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />`
      : '';

  const code = `${COMMON_HEADER}

interface ${model.name} {
  id: string;
  [key: string]: unknown;
}

export default function ${model.name}ListPage() {
  const router = useRouter();
  const [items, setItems] = useState<${model.name}[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(search && { search }),
      });
      const res = await fetch(\`/api/crud/${kebabName}?\${params}\`);
      const json = await res.json();
      setItems(json.items ?? []);
      setTotal(json.total ?? 0);
    } catch (err) {
      toast({ title: '載入失敗', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, toast]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleDelete = async (id: string) => {
    if (!confirm('確定刪除？')) return;
    await fetch(\`/api/crud/${kebabName}/\${id}\`, { method: 'DELETE' });
    toast({ title: '已刪除' });
    loadItems();
  };

  const handleAction = async (id: string, actionName: string) => {
    const res = await fetch(\`/api/crud/${kebabName}/\${id}/actions/\${actionName}\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const result = await res.json();
    toast({ title: \`Action: \${actionName}\`, description: JSON.stringify(result) });
    loadItems();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">${label}</h1>
        <Button asChild>
          <Link href="${uiBasePath(spec, model.name)}/new">新增</Link>
        </Button>
      </div>
      ${searchBox}
      <Card className="mt-4">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
${headerCells}
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
${rowCells}
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={\`${uiBasePath(spec, model.name)}/\${item.id}\`}>編輯</Link>
                    </Button>${actionButtons}
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                      刪除
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="flex items-center justify-between mt-4">
        <div>共 {total} 筆</div>
        <div className="space-x-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一頁</Button>
          <Button variant="outline" disabled={page * pageSize >= total} onClick={() => setPage(page + 1)}>下一頁</Button>
        </div>
      </div>
    </div>
  );
}
`;

  return {
    path: uiBasePath(spec, model.name),
    name: `${model.name}ListPage`,
    code,
    model: model.name,
    kind: 'list',
  };
}

// ==============================================
// Create Page
// ==============================================

function generateCreatePage(spec: JsonSpec, model: Model): GeneratedPage {
  const kebabName = modelToKebab(model.name);
  const label = model.label ?? model.name;
  const editableFields = model.fields.filter(
    (f) => !f.ui?.hidden && f.ui?.editable !== false && !f.ui?.readonly,
  );

  // 收集需要的 imports
  const requiredImports = new Set<string>(['Input']);
  for (const field of editableFields) {
    const info = fieldToInputComponent(field);
    if (info.tag === 'Switch' || info.tag === 'Select') {
      requiredImports.add(info.tag);
    }
    for (const imp of info.imports) {
      requiredImports.add(imp);
    }
  }

  // 生成表單欄位
  // 生成 relation 欄位（belongsTo）— 使用 RelationSelect 自動從 API 載入選項
  const relationFields = (model.relations ?? [])
    .filter((r) => r.type === 'belongsTo')
    .map((rel) => {
      const fk = rel.foreignKey ?? `${rel.model.charAt(0).toLowerCase() + rel.model.slice(1)}Id`;
      return `
          <div>
            <Label htmlFor="${fk}">${rel.model}</Label>
            <RelationSelect model="${rel.model}" value={form.${fk} ?? ''} onChange={(value) => handleSelectChange('${fk}', value)} placeholder="選擇${rel.model}" />
          </div>`;
    })
    .join('\n');

  const formFields = editableFields
    .map((field) => {
      const info = fieldToInputComponent(field);
      const label = field.label ?? field.name;
      const requiredMark = field.validation?.required ? ' *' : '';

      if (info.tag === 'Switch') {
        return `
          <div className="flex items-center justify-between">
            <Label htmlFor="${field.name}">${label}${requiredMark}</Label>
            <${info.tag} ${info.props} />
          </div>`;
      }

      if (info.tag === 'Select') {
        const items = info.items ?? '';
        return `
          <div>
            <Label htmlFor="${field.name}">${label}${requiredMark}</Label>
            <${info.tag} ${info.props}>
              <SelectTrigger>
                <SelectValue placeholder="選擇${label}" />
              </SelectTrigger>
              <SelectContent>
${items}
              </SelectContent>
            </${info.tag}>
          </div>`;
      }

      if (info.tag === 'div') {
        // richText 等特殊
        return `
          <div>
            <Label htmlFor="${field.name}">${label}${requiredMark}</Label>
            <${info.tag} ${info.props} />
          </div>`;
      }

      return `
          <div>
            <Label htmlFor="${field.name}">${label}${requiredMark}</Label>
            <${info.tag} ${info.props} />
          </div>`;
    })
    .join('\n');

  const code = `${COMMON_HEADER}

interface ${model.name}Form {
  [key: string]: unknown;
}

export default function ${model.name}CreatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState<${model.name}Form>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
  };

  const handleBooleanChange = (name: string, checked: boolean) => {
    setForm((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/crud/${kebabName}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Create failed');
      toast({ title: '已建立' });
      router.push('${uiBasePath(spec, model.name)}');
    } catch (err) {
      toast({ title: '建立失敗', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">新增 ${label}</h1>
      <form onSubmit={onSubmit} className="space-y-4">${relationFields}${formFields}
        <div className="flex space-x-2">
          <Button type="submit" disabled={submitting}>{submitting ? '處理中...' : '建立'}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>取消</Button>
        </div>
      </form>
    </div>
  );
}
`;

  return {
    path: `${uiBasePath(spec, model.name)}/new`,
    name: `${model.name}CreatePage`,
    code,
    model: model.name,
    kind: 'create',
  };
}

// ==============================================
// Edit Page
// ==============================================

// ==============================================
// Sprint 12 TECH-024 — Workflow Transition Buttons
// ==============================================
/**
 * 從 JsonSpec.workflow（或 model.workflows）生 transition buttons 區塊
 */
function generateTransitionButtonsCode(
  model: Model,
  workflow: import('@/lib/specs/json-spec.types').Workflow,
  kebabName: string,
): string {
  const stateSchema = {
    id: workflow.name,
    initial: workflow.initialState,
    states: Object.fromEntries(
      Object.entries(workflow.states).map(([key, sc]) => [
        key,
        {
          on: Object.fromEntries(
            workflow.transitions
              .filter((t) => (Array.isArray(t.from) ? t.from.includes(key) : t.from === key))
              .map((t) => [t.to, t.to]),
          ),
        },
      ]),
    ),
  };

  const schemaCode = JSON.stringify(stateSchema, null, 2);

  return `
      {form.status && (
        <div className="mt-8 p-4 border rounded-lg bg-muted/30">
          <h3 className="text-sm font-medium mb-3">狀態轉換</h3>
          <TransitionButtons
            schema={${schemaCode}}
            currentStatus={String(form.status)}
            resourceId={params.id}
            endpoint="/api/crud/${kebabName}/{id}/transition"
            onSuccess={() => router.refresh()}
          />
        </div>
      )}`;
}

export function generateEditPage(spec: JsonSpec, model: Model): GeneratedPage {
  const kebabName = modelToKebab(model.name);
  const label = model.label ?? model.name;
  const editableFields = model.fields.filter(
    (f) => !f.ui?.hidden && f.ui?.editable !== false && !f.ui?.readonly,
  );

  // Sprint 12 TECH-024: workflow transition buttons
  // 取 model 第一個 workflow（或其他關聯）；沒或沒 transitions 則跳過
  const workflow = (model.workflows ?? spec.workflows ?? [])[0];
  const transitionButtons =
    workflow && workflow.transitions.length > 0
      ? generateTransitionButtonsCode(model, workflow, kebabName)
      : '';

  // 生成 relation 欄位（belongsTo）— 使用 RelationSelect 自動從 API 載入選項
  const relationFields = (model.relations ?? [])
    .filter((r) => r.type === 'belongsTo')
    .map((rel) => {
      const fk = rel.foreignKey ?? `${rel.model.charAt(0).toLowerCase() + rel.model.slice(1)}Id`;
      return `
          <div>
            <Label htmlFor="${fk}">${rel.model}</Label>
            <RelationSelect model="${rel.model}" value={form.${fk} ?? ''} onChange={(value) => handleSelectChange('${fk}', value)} placeholder="選擇${rel.model}" />
          </div>`;
    })
    .join('\n');

  const formFields = editableFields
    .map((field) => {
      const info = fieldToInputComponent(field);
      const label = field.label ?? field.name;
      const requiredMark = field.validation?.required ? ' *' : '';

      if (info.tag === 'Switch') {
        return `
          <div className="flex items-center justify-between">
            <Label htmlFor="${field.name}">${label}${requiredMark}</Label>
            <${info.tag} ${info.props} />
          </div>`;
      }

      if (info.tag === 'Select') {
        const items = info.items ?? '';
        return `
          <div>
            <Label htmlFor="${field.name}">${label}${requiredMark}</Label>
            <${info.tag} ${info.props}>
              <SelectTrigger>
                <SelectValue placeholder="選擇${label}" />
              </SelectTrigger>
              <SelectContent>
${items}
              </SelectContent>
            </${info.tag}>
          </div>`;
      }

      if (info.tag === 'div') {
        return `
          <div>
            <Label htmlFor="${field.name}">${label}${requiredMark}</Label>
            <${info.tag} ${info.props} />
          </div>`;
      }

      return `
          <div>
            <Label htmlFor="${field.name}">${label}${requiredMark}</Label>
            <${info.tag} ${info.props} />
          </div>`;
    })
    .join('');

  const code = `${COMMON_HEADER}

interface ${model.name}Form {
  [key: string]: unknown;
}

export default function ${model.name}EditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const [form, setForm] = useState<${model.name}Form>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(\`/api/crud/${kebabName}/\${params.id}\`)
      .then((res) => res.json())
      .then((data) => {
        setForm(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
  };

  const handleBooleanChange = (name: string, checked: boolean) => {
    setForm((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(\`/api/crud/${kebabName}/\${params.id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Update failed');
      toast({ title: '已更新' });
      router.push('${uiBasePath(spec, model.name)}');
    } catch (err) {
      toast({ title: '更新失敗', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">載入中...</div>;

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">編輯 ${label}</h1>
      <form onSubmit={onSubmit} className="space-y-4">${relationFields}${formFields}
        <div className="flex space-x-2">
          <Button type="submit" disabled={submitting}>{submitting ? '處理中...' : '儲存'}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>取消</Button>
        </div>
      </form>${transitionButtons}
    </div>
  );
}
`;

  return {
    path: `${uiBasePath(spec, model.name)}/[id]`,
    name: `${model.name}EditPage`,
    code,
    model: model.name,
    kind: 'edit',
  };
}

// ==============================================
// Main: JsonSpec → GeneratedPage[]
// ==============================================

export function generateUIPages(spec: JsonSpec): GeneratedPage[] {
  const pages: GeneratedPage[] = [];

  for (const model of spec.models) {
    pages.push(generateListPage(spec, model));
    pages.push(generateCreatePage(spec, model));
    pages.push(generateEditPage(spec, model));
  }

  return pages;
}