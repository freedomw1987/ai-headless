/**
 * Blog List Page
 */

import Link from 'next/link';
import { listBlogPosts } from '@/extensions/blog/workflow/blog-workflow';
import { CreateBlogDialog } from './components/create-blog-dialog';
import { BlogStatusBadge } from './components/blog-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function BlogPage() {
  const posts = await listBlogPosts();
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">部落格</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Blog Extension — 完整混合模式 demo（Hook + Action + Computed + Workflow）
          </p>
        </div>
        <CreateBlogDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>文章列表（{posts.length} 篇）</CardTitle>
          <CardDescription>點擊任一文章查看詳情 + 切換狀態</CardDescription>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">尚無文章，點擊右上「寫文章」開始</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">標題</th>
                    <th className="text-right py-2 px-2">閱讀時間</th>
                    <th className="text-left py-2 px-2">狀態</th>
                    <th className="text-left py-2 px-2">更新時間</th>
                    <th className="text-right py-2 px-2">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-2 font-medium">{post.title}</td>
                      <td className="py-2 px-2 text-right text-sm">{post.readingTime} 分鐘</td>
                      <td className="py-2 px-2"><BlogStatusBadge status={post.status} /></td>
                      <td className="py-2 px-2 text-sm text-muted-foreground">
                        {new Date(post.updatedAt).toLocaleString('zh-TW')}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <Link href={`/admin/blog/${post.id}`}>
                          <Button variant="outline" size="sm">詳情</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}