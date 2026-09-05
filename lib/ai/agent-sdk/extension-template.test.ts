/**
 * Sprint 55 — ExtensionTemplate 單元測試
 */

import { describe, it, expect } from 'vitest';
import {
  generateExtensionTemplate,
  inferFieldType,
  inferFields,
} from './extension-template';
import { validateExtensionFiles } from './extension-validator';

describe('inferFieldType', () => {
  it('應推斷 datetime (*Date)', () => {
    expect(inferFieldType('dueDate')).toBe('datetime');
    expect(inferFieldType('startDate')).toBe('datetime');
    expect(inferFieldType('publishedAt')).toBe('datetime');
  });

  it('應推斷 boolean (is*, has*, *Completed)', () => {
    expect(inferFieldType('isActive')).toBe('boolean');
    expect(inferFieldType('hasChildren')).toBe('boolean');
    expect(inferFieldType('isCompleted')).toBe('boolean');
  });

  it('應推斷 number (price, stock, count)', () => {
    expect(inferFieldType('price')).toBe('number');
    expect(inferFieldType('stock')).toBe('number');
    expect(inferFieldType('quantity')).toBe('number');
    expect(inferFieldType('viewCount')).toBe('number');
  });

  it('應推斷 text (description, content)', () => {
    expect(inferFieldType('description')).toBe('text');
    expect(inferFieldType('content')).toBe('text');
    expect(inferFieldType('notes')).toBe('text');
  });

  it('應 default 到 string', () => {
    expect(inferFieldType('name')).toBe('string');
    expect(inferFieldType('title')).toBe('string');
    expect(inferFieldType('email')).toBe('string');
  });
});

describe('inferFields', () => {
  it('應產 FieldSpec[] 含 name/type/label', () => {
    const fields = inferFields(['name', 'price']);
    expect(fields).toEqual([
      { name: 'name', type: 'string', label: 'Name' },
      { name: 'price', type: 'number', label: 'Price' },
    ]);
  });

  it('應處理 camelCase label', () => {
    const fields = inferFields(['firstName']);
    expect(fields[0]?.label).toBe('First Name');
  });
});

describe('generateExtensionTemplate', () => {
  it('應產 8 個檔案', () => {
    const { files } = generateExtensionTemplate({
      name: 'product',
      fields: ['name', 'price'],
    });
    expect(files).toHaveLength(8);
  });

  it('所有檔案路徑應以 extensions/<name>/ 開頭', () => {
    const { files } = generateExtensionTemplate({
      name: 'product',
      fields: ['name'],
    });
    for (const f of files) {
      expect(f.path).toMatch(/^extensions\/product\//);
    }
  });

  it('manifest.json 應符合 schema', () => {
    const { files } = generateExtensionTemplate({
      name: 'product',
      fields: ['name', 'price'],
    });
    const manifestFile = files.find((f) => f.path.endsWith('manifest.json'));
    expect(manifestFile).toBeDefined();
    expect(() => JSON.parse(manifestFile!.content)).not.toThrow();
  });

  it('spec.json 應含 model + fields + auto createdAt/updatedAt', () => {
    const { files } = generateExtensionTemplate({
      name: 'product',
      fields: ['name', 'price'],
    });
    const specFile = files.find((f) => f.path.endsWith('spec.json'));
    expect(specFile).toBeDefined();
    const spec = JSON.parse(specFile!.content);
    expect(spec.models).toHaveLength(1);
    expect(spec.models[0]?.name).toBe('Product');
    const fieldNames = spec.models[0].fields.map((f: { name: string }) => f.name);
    expect(fieldNames).toContain('name');
    expect(fieldNames).toContain('price');
    expect(fieldNames).toContain('createdAt');
    expect(fieldNames).toContain('updatedAt');
  });

  it('有 boolean field 應生成 complete action (含 toggling)', () => {
    const { files } = generateExtensionTemplate({
      name: 'product',
      fields: ['name', 'isActive'],
    });
    const completeFile = files.find((f) => f.path.endsWith('actions/complete.ts'));
    expect(completeFile).toBeDefined();
    expect(completeFile!.content).toContain('!item.completed');
  });

  it('有 *Date field 應生成 remainingDays computed', () => {
    const { files } = generateExtensionTemplate({
      name: 'product',
      fields: ['name', 'dueDate'],
    });
    const computedFile = files.find(
      (f) => f.path.endsWith('computed/remaining-days.ts'),
    );
    expect(computedFile).toBeDefined();
    expect(computedFile!.content).toContain('remainingDays');
    expect(computedFile!.content).toContain('item.dueDate');
  });

  it('workflow 應有 draft → published 狀態機', () => {
    const { files } = generateExtensionTemplate({
      name: 'product',
      fields: ['name'],
    });
    const workflowFile = files.find(
      (f) => f.path.endsWith('product-workflow.ts'),
    );
    expect(workflowFile).toBeDefined();
    expect(workflowFile!.content).toContain("'draft'");
    expect(workflowFile!.content).toContain("'published'");
  });

  it('README 應含 8 個段落標題', () => {
    const { files } = generateExtensionTemplate({
      name: 'product',
      fields: ['name'],
    });
    const readme = files.find((f) => f.path.endsWith('README.md'));
    expect(readme).toBeDefined();
    expect(readme!.content).toContain('# Product Extension');
    expect(readme!.content).toContain('## 欄位');
    expect(readme!.content).toContain('## API');
  });

  it('應通過三層驗證 (validateExtensionFiles)', () => {
    const { files } = generateExtensionTemplate({
      name: 'product',
      fields: ['name', 'price', 'isActive'],
    });
    const result = validateExtensionFiles(files, 'product');
    expect(result.passed, `Errors: ${result.errors.join(', ')}`).toBe(true);
  });

  it('無 fields 也應產 8 檔案 (空 model)', () => {
    const { files } = generateExtensionTemplate({
      name: 'minimal',
      fields: [],
    });
    expect(files).toHaveLength(8);
    const spec = JSON.parse(files.find((f) => f.path.endsWith('spec.json'))!.content);
    // 至少有 auto createdAt/updatedAt
    expect(spec.models[0].fields.length).toBeGreaterThanOrEqual(2);
  });
});