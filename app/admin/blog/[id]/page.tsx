/**
 * Blog Detail Page
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBlogPost } from '@/extensions/blog/workflow/blog-workflow';
import { guardExtensionOrRedirect } from '@/app/admin/_components/extension-page-guard';
import { BlogStatusBadge } from '../components/blog-status-badge';
import { BlogTransitionButtons } from '../components/blog-transition-buttons';
import { EditBlogDialog } from '../components/edit-blog-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Params = { params: Promise<{ id: string }> };

export default async function BlogDetailPage({ params }: Params) {
  await guardExtensionOrRedirect('blog');
  const { id } = await params;
  let post;
  try { post = await getBlogPost(id); } catch { notFound(); }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link href="/admin/blog" className="text-sm text-muted-foreground hover:underline">
          ← 返回部落格列表
        </Link>
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-3xl font-bold">{post.title}</h1>
          <div className="flex items-center gap-2">
            <EditBlogDialog
              postId={post.id}
              initialTitle={post.title}
              initialContent={post.content ?? ''}
              initialExcerpt={post.excerpt}
            />
            <BlogStatusBadge status={post.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>文章資訊</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Slug：</span><span className="font-mono text-xs">{post.slug}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">閱讀時間：</span><span>{post.readingTime} 分鐘</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">發布時間：</span><span>{post.publishedAt ? new Date(post.publishedAt).toLocaleString('zh-TW') : '尚未發布'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">建立時間：</span><span>{new Date(post.createdAt).toLocaleString('zh-TW')}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>狀態機</CardTitle></CardHeader>
          <CardContent>
            <BlogTransitionButtons postId={post.id} currentStatus={post.status} />
          </CardContent>
        </Card>
      </div>

      {post.excerpt && (
        <Card>
          <CardHeader><CardTitle>摘要</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{post.excerpt}</p></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>內容</CardTitle></CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap text-sm">{post.content || '（尚無內容）'}</pre>
        </CardContent>
      </Card>
    </div>
  );
}