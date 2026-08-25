'use client';

// Sprint 17 Stage 2 — Dynamic Renderer Cell
//
// 動態載入 extensions/<specName>/custom-renderers/<rendererName> 元件並渲染。
//
// 設計：
// - list page Server Component 看到 customRenderer field → 渲染這個 client component
// - 用 next/dynamic（ssr: false）確保 client only + lazy load
// - 載入完成前顯示 skeleton placeholder
// - 載入失敗顯示 fallback message
//
// 路徑約定：
// - 預設從 extensions/<specName>/custom-renderers/<kebab-case-rendererName> 載入
// - 例如：specName=event, rendererName=capacityBar → extensions/event/custom-renderers/capacity-bar
//
// Sprint 17 揭露的限制：
// - Next.js client 不能 require() .tsx（SyntaxError）
// - 用 webpack 的 dynamic import 機制 → TSX 在 build time 被 swc 編譯成 .js
// - 路徑必須 webpack 可分析（用 kebab-case rendererName）

import dynamic from 'next/dynamic';
import { memo, useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import type { CustomRendererComponent } from '@/lib/runtime/extension-loaders';

type Props = {
  specName: string;
  rendererName: string;
  record: Record<string, unknown>;
};

/**
 * 動態載入 customRenderer component
 *
 * 用 next/dynamic + ssr: false 確保 client only + lazy load。
 * webpack 會掃描所有 extensions/<specName>/custom-renderers/*.tsx 打包。
 */
function DynamicRendererCellInner({ specName, rendererName, record }: Props) {
  // 駝峰 → kebab-case：renderCapacityBar → render-capacity-bar → capacity-bar
  const candidates = useMemo(() => {
    const kebab = rendererName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    // Sprint 17：可能 rendererName 有 renderXxx 前缀，檔名可能是 xxx
    // 例如 renderCapacityBar → render-capacity-bar（kebab） → capacity-bar（去掉 render prefix）
    const noRenderPrefix = kebab.replace(/^render-/, '');
    return [kebab, noRenderPrefix];
  }, [rendererName]);

  const Renderer = useMemo(() => {
    return dynamic(
      () => {
        // 嘗試多個候選路徑（kebab with/without render prefix）
        return tryImportCandidates(specName, candidates).catch((err) => {
          console.error(
            `[DynamicRendererCell] Failed to load ${specName}/custom-renderers/[${candidates.join(', ')}]:`,
            err,
          );
          return { default: FallbackRenderer as unknown as CustomRendererComponent };
        });
      },
      {
        ssr: false,
        loading: () => <Placeholder message={`載入 ${rendererName}...`} />,
      },
    );
  }, [specName, rendererName, candidates]) as unknown as CustomRendererComponent;

  return <Renderer record={record} value={record[rendererName]} />;
}

/**
 * 嘗試多個候選路徑（webpack 動態 import）
 *
 * 用首個成功的 import，否則 throw 讓 outer .catch 接管
 */
async function tryImportCandidates(specName: string, candidates: string[]) {
  let lastError: unknown = null;
  for (const name of candidates) {
    try {
      const mod = await import(
        /* webpackInclude: /\.tsx?$/ */
        `@/extensions/${specName}/custom-renderers/${name}`
      );
      return mod;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error(`No candidate matched for ${specName}/${candidates.join(', ')}`);
}

function Placeholder({ message }: { message: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground italic">
      <span className="h-2 w-2 rounded-full bg-muted animate-pulse" />
      {message}
    </span>
  );
}

function FallbackRenderer({ value }: { value: unknown; record: Record<string, unknown> }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs text-muted-foreground italic"
      title="customRenderer 載入失敗"
    >
      <AlertCircle className="h-3 w-3" />
      {String(value ?? '')}
    </span>
  );
}

// Memo 避免 re-render 時重建 dynamic component
export const DynamicRendererCell = memo(DynamicRendererCellInner);