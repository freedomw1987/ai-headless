/**
 * ==============================================
 *  Extension Loader + Registry
 * ==============================================
 *
 * 對應：docs/prd/07-extension-system.md
 *
 * Extension Manifest = extensions/<name>/schema.json
 * - name（kebab-case）
 * - version（semver）
 * - hooks / actions / computed / workflows
 * - permissions
 */

import { z } from 'zod';

// ==============================================
// Manifest Schema
// ==============================================

const SemVerRegex = /^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/;
const KebabCaseRegex = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

const ExtensionManifestSchema = z.object({
  name: z
    .string()
    .regex(KebabCaseRegex, 'Extension name must be kebab-case'),
  version: z
    .string()
    .regex(SemVerRegex, 'Version must be semver (e.g. 1.0.0)'),
  label: z.string().optional(),
  description: z.string().optional(),
  author: z.string().optional(),
  hooks: z.array(z.string()).optional(),
  actions: z.array(z.string()).optional(),
  computed: z.array(z.string()).optional(),
  workflows: z.array(z.string()).optional(),
  permissions: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional(),
});

export type ExtensionManifest = z.infer<typeof ExtensionManifestSchema>;

// ==============================================
// Manifest Parser & Validator
// ==============================================

export function parseExtensionManifest(json: string): ExtensionManifest {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (err) {
    throw new Error(`Invalid JSON: ${err instanceof Error ? err.message : String(err)}`);
  }

  return validateExtensionManifest(parsed);
}

export function validateExtensionManifest(input: unknown): ExtensionManifest {
  const result = ExtensionManifestSchema.safeParse(input);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid ExtensionManifest: ${issues}`);
  }
  return result.data;
}

// ==============================================
// Extension Registry（in-memory）
// ==============================================

export class ExtensionRegistry {
  private extensions = new Map<string, ExtensionManifest>();

  register(manifest: ExtensionManifest): void {
    if (this.extensions.has(manifest.name)) {
      throw new Error(`Extension '${manifest.name}' already registered`);
    }
    this.extensions.set(manifest.name, manifest);
  }

  unregister(name: string): boolean {
    return this.extensions.delete(name);
  }

  getByName(name: string): ExtensionManifest | undefined {
    return this.extensions.get(name);
  }

  list(): ExtensionManifest[] {
    return Array.from(this.extensions.values());
  }

  count(): number {
    return this.extensions.size;
  }

  clear(): void {
    this.extensions.clear();
  }

  /** 取得所有 hooks（攤平所有 extensions 的 hooks） */
  getHooks(): string[] {
    const all = new Set<string>();
    for (const ext of this.extensions.values()) {
      for (const hook of ext.hooks ?? []) {
        all.add(hook);
      }
    }
    return Array.from(all);
  }

  /** 取得所有 actions */
  getActions(): string[] {
    const all = new Set<string>();
    for (const ext of this.extensions.values()) {
      for (const action of ext.actions ?? []) {
        all.add(action);
      }
    }
    return Array.from(all);
  }

  /** 取得所有 computed */
  getComputed(): string[] {
    const all = new Set<string>();
    for (const ext of this.extensions.values()) {
      for (const c of ext.computed ?? []) {
        all.add(c);
      }
    }
    return Array.from(all);
  }

  /** 取得所有 workflows */
  getWorkflows(): string[] {
    const all = new Set<string>();
    for (const ext of this.extensions.values()) {
      for (const w of ext.workflows ?? []) {
        all.add(w);
      }
    }
    return Array.from(all);
  }

  /** 取得所有 permissions */
  getPermissions(): string[] {
    const all = new Set<string>();
    for (const ext of this.extensions.values()) {
      for (const p of ext.permissions ?? []) {
        all.add(p);
      }
    }
    return Array.from(all);
  }
}

// ==============================================
// Extension Loader
// ==============================================

export class ExtensionLoader {
  readonly registry: ExtensionRegistry;

  constructor(registry?: ExtensionRegistry) {
    this.registry = registry ?? new ExtensionRegistry();
  }

  /**
   * 從 JSON 字串載入單一 Extension
   */
  async loadFromJson(json: string): Promise<ExtensionManifest> {
    const manifest = parseExtensionManifest(json);
    this.registry.register(manifest);
    return manifest;
  }

  /**
   * 批次載入多個 JSON 字串
   */
  async loadBatch(jsonStrings: string[]): Promise<ExtensionManifest[]> {
    const loaded: ExtensionManifest[] = [];
    const errors: { name: string; error: string }[] = [];

    for (const json of jsonStrings) {
      try {
        const manifest = await this.loadFromJson(json);
        loaded.push(manifest);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push({ name: 'unknown', error: message });
      }
    }

    if (loaded.length === 0 && errors.length > 0) {
      throw new Error(`All extensions failed to load: ${errors.map((e) => e.error).join('; ')}`);
    }

    return loaded;
  }

  /**
   * 檢查 Extension 是否已載入
   */
  isLoaded(name: string): boolean {
    return this.registry.getByName(name) !== undefined;
  }

  /**
   * 卸載 Extension
   */
  unload(name: string): boolean {
    return this.registry.unregister(name);
  }

  /**
   * 列出所有已載入的 Extension
   */
  list(): ExtensionManifest[] {
    return this.registry.list();
  }
}

// ==============================================
// Singleton for app-wide usage
// ==============================================

let _loader: ExtensionLoader | null = null;

export function getExtensionLoader(): ExtensionLoader {
  if (!_loader) {
    _loader = new ExtensionLoader();
  }
  return _loader;
}

export function resetExtensionLoader(): void {
  _loader = null;
}