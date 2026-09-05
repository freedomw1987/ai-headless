import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Database,
  Zap,
  Lock,
  GitBranch,
  Workflow,
  Terminal,
  ArrowRight,
} from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Hero */}
      <section className="container mx-auto px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="mr-1 h-3 w-3" />
            v0.1 — 2026 Sprint 55
          </Badge>
          <h1 className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-6xl">
            AI Headless
            <br />
            CRUD Framework
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground sm:text-xl">
            30 秒用自然語言生成完整 CRUD 系統。
            <br className="hidden sm:block" />
            <span className="font-semibold text-foreground">AI 對話</span> →{' '}
            <span className="font-semibold text-foreground">JSON 規範</span> →{' '}
            <span className="font-semibold text-foreground">可運行系統</span>。
          </p>

          {/* Demo command preview */}
          <div className="mx-auto mt-8 max-w-2xl rounded-lg border bg-card p-4 text-left shadow-sm">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Terminal className="h-3 w-3" />
              <span>Admin Chat</span>
            </div>
            <pre className="mt-2 overflow-x-auto font-mono text-sm">
              <code>
                <span className="text-blue-500">/extension</span> create product{' '}
                <span className="text-muted-foreground">--fields=</span>
                name,price,stock
              </code>
            </pre>
            <div className="mt-2 text-xs text-muted-foreground">
              → 30 秒後 <code className="rounded bg-muted px-1">extensions/product/</code>{' '}
              出現完整 8 個檔案
            </div>
          </div>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link href="/admin" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto">
                進入後台 Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link
              href="https://github.com/freedomw1987/ai-headless"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto"
            >
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                GitHub
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            MIT License · TypeScript · Next.js 15 · React 19
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              核心特性
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              不是另一個 CRUD framework — 唯一用自然語言生成的
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <Sparkles className="h-8 w-8 text-primary" />
                <CardTitle>AI Pipeline</CardTitle>
                <CardDescription>
                  自然語言 → JsonSpec → Schema/API/UI/RBAC 自動生成
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                在 admin chat 對話框描述需求, AI 生成完整 extension 程式碼。
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Database className="h-8 w-8 text-primary" />
                <CardTitle>Schema-Driven</CardTitle>
                <CardDescription>
                  單一 JSON 同時約束前端 / 後端 / 資料庫
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Type-safe runtime + Zod validation + 自動 CRUD API。
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 text-primary" />
                <CardTitle>30 秒 Demo</CardTitle>
                <CardDescription>
                  一行指令產生完整 CRUD 系統
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <code className="rounded bg-muted px-1 text-xs">
                  /extension create product --fields=name,price
                </code>{' '}
                立即產出。
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <GitBranch className="h-8 w-8 text-primary" />
                <CardTitle>Extension 機制</CardTitle>
                <CardDescription>
                  Hooks + Actions + Computed + Workflows
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                WordPress 風格的可擴展架構, 4 種範例 extension 開箱即用。
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Lock className="h-8 w-8 text-primary" />
                <CardTitle>Auth.js + RBAC</CardTitle>
                <CardDescription>
                  內建身份驗證與角色權限
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Credentials Provider + bcrypt + 動態權限矩陣。
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Workflow className="h-8 w-8 text-primary" />
                <CardTitle>Workflow 引擎</CardTitle>
                <CardDescription>
                  內建狀態機 + 多階段流程
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                draft → published 自動驗證 + 自動轉換。
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 4 Extensions Showcase */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              內建 4 個 Extensions
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              開箱即用的範例 — 全部 MIT 授權, 可直接用於生產
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <Badge variant="outline">todo</Badge>
                <CardTitle className="mt-2 text-base">待辦事項</CardTitle>
                <CardDescription>
                  4 種 view (table / todo-list / kanban / calendar)
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Badge variant="outline">blog</Badge>
                <CardTitle className="mt-2 text-base">部落格</CardTitle>
                <CardDescription>
                  Tiptap 富文本 + slug + 自動 meta
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Badge variant="outline">event</Badge>
                <CardTitle className="mt-2 text-base">活動管理</CardTitle>
                <CardDescription>
                  時間區段 + 報名 + 工作流
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Badge variant="outline">order</Badge>
                <CardTitle className="mt-2 text-base">訂單系統</CardTitle>
                <CardDescription>
                  狀態機 + 計算欄位 + 自動編號
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl rounded-2xl border bg-card p-8 text-center shadow-lg sm:p-12">
          <h2 className="text-3xl font-bold tracking-tight">30 秒試試看</h2>
          <p className="mt-4 text-muted-foreground">
            在 admin chat 輸入:
            <br />
            <code className="mt-2 inline-block rounded bg-muted px-2 py-1 text-sm">
              /extension create demo --fields=title,description,isDone
            </code>
          </p>
          <div className="mt-6">
            <Link href="/admin">
              <Button size="lg">
                開始 Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            需要 admin 帳號 — 見 docs/INSTALL.md
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>
            MIT License · © 2026 freedomw1987 ·{' '}
            <Link
              href="https://github.com/freedomw1987/ai-headless"
              className="underline hover:text-foreground"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </Link>
          </p>
        </div>
      </footer>
    </main>
  );
}