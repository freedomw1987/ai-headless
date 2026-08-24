import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="container flex min-h-screen flex-col items-center justify-center gap-8 py-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-5xl font-bold tracking-tight">ai-headless</h1>
        <p className="max-w-2xl text-balance text-lg text-muted-foreground">
          AI Headless CRUD Framework
          <br />
          JSON 規範 + Extension Code（混合模式）→ AI 生成完整系統
        </p>
      </div>

      <div className="flex gap-4">
        <Link href="/admin">
          <Button size="lg">進入後台</Button>
        </Link>
        <Link href="/docs/specs/json-spec">
          <Button size="lg" variant="outline">
            查看 JSON 規範
          </Button>
        </Link>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
        <FeatureCard
          title="混合模式"
          description="JSON 處理標準 CRUD，Extension Code 處理複雜業務邏輯"
        />
        <FeatureCard
          title="AI 驅動"
          description="由 pi agent 驅動的 8-Stage Pipeline，從需求到代碼全自動化"
        />
        <FeatureCard
          title="可擴展"
          description="WordPress 風格的 Extension 機制，無限擴展可能性"
        />
      </div>
    </main>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
