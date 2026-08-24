/**
 * Event List Page
 */

import { listEvents } from '@/extensions/event/workflow/event-workflow';
import { CreateEventDialog } from './components/create-event-dialog';
import { EventStatusBadge } from './components/event-status-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function EventsPage() {
  const events = await listEvents();
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">活動管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Event Extension — 狀態自動依時間推算
          </p>
        </div>
        <CreateEventDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>活動列表（{events.length} 個）</CardTitle>
          <CardDescription>按開始時間排序</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">尚無活動</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">標題</th>
                    <th className="text-left py-2 px-2">時間</th>
                    <th className="text-left py-2 px-2">地點</th>
                    <th className="text-right py-2 px-2">容量</th>
                    <th className="text-left py-2 px-2">狀態</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-2 font-medium">{event.title}</td>
                      <td className="py-2 px-2 text-sm">
                        {new Date(event.startAt).toLocaleString('zh-TW')}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          ~ {new Date(event.endAt).toLocaleString('zh-TW')}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-sm">{event.location || '—'}</td>
                      <td className="py-2 px-2 text-right text-sm">{event.capacity}</td>
                      <td className="py-2 px-2"><EventStatusBadge status={event.status} /></td>
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