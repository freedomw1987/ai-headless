/**
 * ==============================================
 *  Extension API — REST endpoints for Extension Management
 * ==============================================
 *
 * 對應：docs/prd/07-extension-system.md §3
 *
 * API 端點：
 * - GET    /api/extensions           列出所有
 * - GET    /api/extensions/[name]    查詢
 * - POST   /api/extensions           安裝
 * - DELETE /api/extensions/[name]    卸載
 * - POST   /api/extensions/[name]/enable
 * - POST   /api/extensions/[name]/disable
 */

import {
  ExtensionLoader,
  validateExtensionManifest,
  type ExtensionManifest,
} from './extension-loader';

// ==============================================
// Response 類型（標準化 API 回傳）
// ==============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExtensionAPIResponse<T = any> = {
  status: number;
  data?: T;
  error?: string;
  message?: string;
};

// ==============================================
// Extension Status
// ==============================================

export type ExtensionStatus = {
  name: string;
  version: string;
  enabled: boolean;
  installedAt: number;
};

// ==============================================
// Extension API
// ==============================================

export function createExtensionAPI(loader?: ExtensionLoader) {
  const extLoader = loader ?? new ExtensionLoader();
  const enabledSet = new Set<string>();
  const installedAt = new Map<string, number>();

  return {
    loader: extLoader,

    /**
     * 列出所有 extensions（含 enabled 狀態）
     */
    async list(): Promise<ExtensionAPIResponse<{ items: ExtensionStatus[] }>> {
      const items: ExtensionStatus[] = extLoader.list().map((ext) => ({
        name: ext.name,
        version: ext.version,
        enabled: enabledSet.has(ext.name),
        installedAt: installedAt.get(ext.name) ?? 0,
      }));

      return { status: 200, data: { items } };
    },

    /**
     * 查詢單一 extension
     */
    async get(name: string): Promise<ExtensionAPIResponse<ExtensionManifest>> {
      const ext = extLoader.registry.getByName(name);
      if (!ext) {
        return { status: 404, error: `Extension '${name}' not found` };
      }
      return { status: 200, data: ext };
    },

    /**
     * 安裝 Extension
     */
    async install(input: unknown): Promise<ExtensionAPIResponse<ExtensionManifest>> {
      try {
        const manifest = validateExtensionManifest(input);

        if (extLoader.isLoaded(manifest.name)) {
          return { status: 409, error: `Extension '${manifest.name}' already installed` };
        }

        extLoader.registry.register(manifest);
        installedAt.set(manifest.name, Date.now());

        return { status: 201, data: manifest, message: 'Extension installed' };
      } catch (err) {
        return {
          status: 400,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    },

    /**
     * 卸載 Extension
     */
    async uninstall(name: string): Promise<ExtensionAPIResponse<{ success: boolean }>> {
      if (!extLoader.isLoaded(name)) {
        return { status: 404, error: `Extension '${name}' not found` };
      }
      extLoader.unload(name);
      enabledSet.delete(name);
      installedAt.delete(name);
      return { status: 200, data: { success: true } };
    },

    /**
     * 啟用 Extension
     */
    async enable(name: string): Promise<ExtensionAPIResponse<{ enabled: boolean }>> {
      if (!extLoader.isLoaded(name)) {
        return { status: 404, error: `Extension '${name}' not found` };
      }
      enabledSet.add(name);
      return { status: 200, data: { enabled: true } };
    },

    /**
     * 停用 Extension
     */
    async disable(name: string): Promise<ExtensionAPIResponse<{ enabled: boolean }>> {
      if (!extLoader.isLoaded(name)) {
        return { status: 404, error: `Extension '${name}' not found` };
      }
      enabledSet.delete(name);
      return { status: 200, data: { enabled: false } };
    },
  };
}