// Sprint 43 v2.0 (S43-D Commit D): AI Config Form Client Component
//
// UI 區塊:
// - Provider type radio: 4 種 (openai / claude / openai-compatible / anthropic-compatible)
// - Custom URL input (僅 compatible 顯示)
// - API Key (password type) + model 輸入
// - 「測試連線」按鈕: 呼叫 testEndpoint API
// - 提交: PUT /api/admin/ai-config

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

type AIProviderType = 'openai' | 'claude' | 'openai-compatible' | 'anthropic-compatible';

const PROVIDER_OPTIONS: { value: AIProviderType; label: string; description: string }[] = [
  { value: 'openai', label: 'OpenAI', description: '官方 OpenAI (api.openai.com)' },
  { value: 'claude', label: 'Claude', description: '官方 Anthropic (api.anthropic.com)' },
  { value: 'openai-compatible', label: 'OpenAI Custom URL', description: 'OpenRouter / Azure / Groq / Ollama / 自架 proxy' },
  { value: 'anthropic-compatible', label: 'Anthropic Custom URL', description: '任意 Anthropic-compatible endpoint' },
];

const DEFAULT_MODELS: Record<AIProviderType, string> = {
  openai: 'gpt-4o',
  claude: 'claude-3-5-sonnet-20241022',
  'openai-compatible': '',
  'anthropic-compatible': '',
};

export function AIConfigForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<AIProviderType>('openai');
  const [endpointUrl, setEndpointUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(DEFAULT_MODELS.openai);

  // 測試連線 state
  const [testResult, setTestResult] = useState<
    | { success: true; latencyMs: number; models?: string[] }
    | { success: false; error: string; statusCode?: number }
    | null
  >(null);
  const [isTesting, setIsTesting] = useState(false);

  const isCompatible = type === 'openai-compatible' || type === 'anthropic-compatible';

  function handleTypeChange(newType: AIProviderType) {
    setType(newType);
    setModel(DEFAULT_MODELS[newType]);
    setTestResult(null);
  }

  async function handleTestConnection() {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/ai-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          endpointUrl: isCompatible ? endpointUrl : undefined,
          apiKey,
        }),
      });
      const json = await res.json();
      setTestResult(json);
    } catch (err) {
      setTestResult({
        success: false,
        error: err instanceof Error ? err.message : '測試失敗',
      });
    } finally {
      setIsTesting(false);
    }
  }

  async function handleSave() {
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/ai-config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            endpointUrl: isCompatible ? endpointUrl : null,
            apiKey,
            model,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          toast.error(json.error ?? '儲存失敗');
          return;
        }
        toast.success('AI 配置已儲存');
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : '儲存失敗');
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Provider 設定</CardTitle>
        <CardDescription>
          選擇 AI Provider 類型。若選 Custom URL, 請填入 endpoint URL 與 API Key。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 4-type radio */}
        <div className="space-y-2">
          <Label>Provider 類型</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PROVIDER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                data-testid={`radio-${opt.value}`}
                onClick={() => handleTypeChange(opt.value)}
                className={cn(
                  'p-3 border rounded text-left transition-colors',
                  type === opt.value
                    ? 'border-primary bg-primary/5 ring-2 ring-primary'
                    : 'border-border hover:bg-muted',
                )}
              >
                <div className="font-medium">{opt.label}</div>
                <div className="text-xs text-muted-foreground">{opt.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom URL (僅 compatible) */}
        {isCompatible && (
          <div className="space-y-2">
            <Label htmlFor="endpointUrl">Custom URL</Label>
            <Input
              id="endpointUrl"
              name="endpointUrl"
              type="url"
              placeholder="https://api.example.com/v1"
              value={endpointUrl}
              onChange={(e) => setEndpointUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              例: https://openrouter.ai/api (OpenRouter) / https://your-proxy.com/v1 (自架)
            </p>
          </div>
        )}

        {/* API Key */}
        <div className="space-y-2">
          <Label htmlFor="apiKey">API Key</Label>
          <Input
            id="apiKey"
            name="apiKey"
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>

        {/* Model */}
        <div className="space-y-2">
          <Label htmlFor="model">模型名稱</Label>
          <Input
            id="model"
            name="model"
            type="text"
            placeholder={DEFAULT_MODELS[type]}
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
        </div>

        {/* 測試連線結果 */}
        {testResult && (
          <div
            data-testid="test-result"
            className={cn(
              'p-3 rounded text-sm',
              testResult.success
                ? 'bg-green-50 text-green-900 border border-green-200'
                : 'bg-red-50 text-red-900 border border-red-200',
            )}
          >
            {testResult.success ? (
              <>
                ✅ 連線成功（延遲 {testResult.latencyMs}ms）
                {testResult.models && testResult.models.length > 0 && (
                  <div className="mt-1 text-xs">可用模型: {testResult.models.join(', ')}</div>
                )}
              </>
            ) : (
              <>❌ 連線失敗: {testResult.error}</>
            )}
          </div>
        )}

        {/* 按鈕群 */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleTestConnection}
            disabled={isTesting || !apiKey || (isCompatible && !endpointUrl)}
            data-testid="test-connection-btn"
          >
            {isTesting ? '測試中...' : '測試連線'}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isPending || !apiKey || !model || (isCompatible && !endpointUrl)}
            data-testid="save-btn"
          >
            {isPending ? '儲存中...' : '儲存設定'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}