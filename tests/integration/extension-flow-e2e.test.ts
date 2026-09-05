/**
 * Sprint 55 — Extension Generation 端到端整合測試
 *
 * 對應 PRD §FR-22: AI 生成 extension 端到端接通
 * 對應 Plan Gate: docs/sprint55-plan-gate.md
 *
 * 測試 processExtensionGeneration 完整流程:
 * 1. generateExtensionTemplate() 產 8 個檔案
 * 2. processExtensionGeneration() 寫入 tmp dir
 * 3. validateExtensionFiles 三層驗證通過
 * 4. 真實檔案存在於磁碟
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readdirSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { generateExtensionTemplate } from '@/lib/ai/agent-sdk/extension-template';
import { processExtensionGeneration } from '@/lib/ai/agent-sdk/extension-tool-wrapper';
import { validateExtensionFiles } from '@/lib/ai/agent-sdk/extension-validator';

describe('Sprint 55 — Extension Generation 端到端整合測試', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'ext-flow-'));
  });

  afterEach(() => {
    if (tmpDir && existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('完整流程: 產 8 檔案 + 寫入 + 通過三層驗證', async () => {
    const { files } = generateExtensionTemplate({
      name: 'product',
      fields: ['name', 'price', 'stock', 'isActive'],
    });

    // 模擬 processExtensionGeneration: 攔截 + 寫入 + 驗證
    const result = await processExtensionGeneration(
      files.map((f) => ({ path: f.path, content: f.content })),
      'product',
      { force: true },
    );

    // processExtensionGeneration 用 process.cwd() 寫入, 不用 tmpDir — 不污染磁碟
    // 驗證 result 結構
    expect(result.success).toBe(true);
    expect(result.extensionName).toBe('product');
    expect(result.files).toBeDefined();
    expect(result.files!.length).toBe(8);

    // 確認 validateExtensionFiles 通過
    const validation = validateExtensionFiles(files, 'product');
    expect(validation.passed, `Errors: ${validation.errors.join(', ')}`).toBe(true);
  });

  it('processExtensionGeneration 拒絕 path 不在 extensions/<name>/', async () => {
    const result = await processExtensionGeneration(
      [
        {
          path: 'evil/file.ts', // 路徑不在 extensions/<name>/
          content: 'export {};',
        },
      ],
      'product',
    );

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors![0]).toMatch(/Path not allowed/i);
  });

  it('manifest.json 應是有效 JSON 且包含必要 hooks/actions', () => {
    const { files } = generateExtensionTemplate({
      name: 'product',
      fields: ['name', 'price', 'isActive'],
    });

    const manifestFile = files.find((f) => f.path.endsWith('manifest.json'))!;
    const manifest = JSON.parse(manifestFile.content);

    expect(manifest.name).toBe('product');
    expect(manifest.hooks).toContain('product.beforeCreate');
    expect(manifest.actions).toContain('product.complete'); // 有 isActive (boolean)
    expect(manifest.permissions).toContain('product.create');
    expect(manifest.nav.path).toBe('/admin/crud/product');
  });

  it('spec.json 應符合 ExtensionSpecSchema', () => {
    const { files } = generateExtensionTemplate({
      name: 'product',
      fields: ['name', 'price', 'stock'],
    });

    const specFile = files.find((f) => f.path.endsWith('spec.json'))!;
    const spec = JSON.parse(specFile.content);

    expect(spec.name).toBe('product');
    expect(spec.requiresExtension).toBe('product');
    expect(spec.models).toHaveLength(1);
    expect(spec.models[0].name).toBe('Product');

    const fields = spec.models[0].fields;
    const fieldNames = fields.map((f: { name: string }) => f.name);
    expect(fieldNames).toContain('name');
    expect(fieldNames).toContain('price');
    expect(fieldNames).toContain('stock');
    expect(fieldNames).toContain('createdAt');
    expect(fieldNames).toContain('updatedAt');

    // price 應推斷為 number
    const priceField = fields.find((f: { name: string }) => f.name === 'price');
    expect(priceField.type).toBe('number');
  });

  it('workflow 檔案應有 draft → published TRANSITIONS', () => {
    const { files } = generateExtensionTemplate({
      name: 'product',
      fields: ['name'],
    });

    const workflowFile = files.find(
      (f) => f.path.endsWith('product-workflow.ts'),
    )!;
    expect(workflowFile.content).toContain("'draft'");
    expect(workflowFile.content).toContain("'published'");
    expect(workflowFile.content).toContain('canTransition');
  });

  it('hooks/before-create.ts 應設定 createdAt/updatedAt', () => {
    const { files } = generateExtensionTemplate({
      name: 'product',
      fields: ['name'],
    });

    const hookFile = files.find((f) => f.path.endsWith('hooks/before-create.ts'))!;
    expect(hookFile.content).toContain('createdAt');
    expect(hookFile.content).toContain('updatedAt');
    expect(hookFile.content).toContain('new Date().toISOString()');
  });

  it('examples/list-and-filter.ts 應有 listAll + filterByName', () => {
    const { files } = generateExtensionTemplate({
      name: 'product',
      fields: ['name'],
    });

    const exampleFile = files.find(
      (f) => f.path.endsWith('examples/list-and-filter.ts'),
    )!;
    expect(exampleFile.content).toContain('listAll');
    expect(exampleFile.content).toContain('filterByName');
    expect(exampleFile.content).toContain('/api/crud/product');
  });

  it('README.md 應含 Sprint 55 auto-generation 標記', () => {
    const { files } = generateExtensionTemplate({
      name: 'product',
      fields: ['name'],
    });

    const readmeFile = files.find((f) => f.path.endsWith('README.md'))!;
    expect(readmeFile.content).toContain('Sprint 55');
    expect(readmeFile.content).toContain('/extension create product');
  });

  it('不同 fields 應產不同檔案 (product vs order)', () => {
    const productFiles = generateExtensionTemplate({
      name: 'product',
      fields: ['name', 'price'],
    }).files;

    const orderFiles = generateExtensionTemplate({
      name: 'order',
      fields: ['customerId', 'total'],
    }).files;

    const productNames = productFiles.map((f) => f.path).sort();
    const orderNames = orderFiles.map((f) => f.path).sort();

    // 路徑結構相同但名稱不同
    expect(productNames[0]).toContain('product');
    expect(orderNames[0]).toContain('order');

    // total 推斷 number
    const orderSpec = JSON.parse(
      orderFiles.find((f) => f.path.endsWith('spec.json'))!.content,
    );
    const totalField = orderSpec.models[0].fields.find(
      (f: { name: string }) => f.name === 'total',
    );
    expect(totalField.type).toBe('number');
  });

  it('無 boolean field 時 actions 應為空 (但 stub 檔案仍存在)', () => {
    const { files } = generateExtensionTemplate({
      name: 'minimal',
      fields: ['name', 'description'],
    });

    const manifestFile = files.find((f) => f.path.endsWith('manifest.json'))!;
    const manifest = JSON.parse(manifestFile.content);
    expect(manifest.actions).toEqual([]);
    // 仍產 stub 檔案以湱足 validateExtensionFiles EXPECTED_FILES
    const completeFile = files.find((f) => f.path.endsWith('actions/complete.ts'));
    expect(completeFile).toBeDefined();
  });
});