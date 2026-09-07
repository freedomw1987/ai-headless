/**
 * Privacy Policy Page (Sprint 58 P0-8)
 */

import Link from 'next/link';
import { loadLegalDoc } from '@/lib/legal';

export const dynamic = 'force-dynamic';

export default async function PrivacyPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const params = await searchParams;
  const locale = params.lang === 'en' ? 'en' : 'zh-TW';
  const doc = loadLegalDoc('privacy', locale);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-12">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/admin/login" className="text-sm text-muted-foreground hover:underline">
            ← 返回登入
          </Link>
          <div className="flex gap-2 text-sm">
            <Link
              href="/legal/privacy"
              className={locale === 'zh-TW' ? 'font-semibold' : 'text-muted-foreground hover:underline'}
            >
              繁體中文
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link
              href="/legal/privacy?lang=en"
              className={locale === 'en' ? 'font-semibold' : 'text-muted-foreground hover:underline'}
            >
              English
            </Link>
          </div>
        </div>

        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <div className="mb-6 text-sm text-muted-foreground">
            版本 {doc.version} · 生效 {doc.effectiveDate}
          </div>
          <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed">
            {doc.content}
          </pre>
        </article>
      </div>
    </div>
  );
}
