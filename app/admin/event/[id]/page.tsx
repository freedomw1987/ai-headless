/**
 * Event Detail Page
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEvent } from '@/extensions/event/workflow/event-workflow';
import { guardExtensionOrRedirect } from '@/app/admin/_components/extension-page-guard';
import { EventStatusBadge } from '../components/event-status-badge';
import { EditEventDialog } from '../components/edit-event-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Params = { params: Promise<{ id: string }> };

export default async function EventDetailPage({ params }: Params) {
  await guardExtensionOrRedirect('event');
  const { id } = await params;
  let event;
  try { event = await getEvent(id); } catch { notFound(); }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link href="/admin/event" className="text-sm text-muted-foreground hover:underline">
          ← 返回活動列表
        </Link>
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-3xl font-bold">{event.title}</h1>
          <div className="flex items-center gap-2">
            <EditEventDialog
              eventId={event.id}
              initialTitle={event.title}
              initialDescription={event.description ?? ''}
              initialLocation={event.location ?? ''}
              initialStartAt={event.startAt.toISOString().slice(0, 16)}
              initialEndAt={event.endAt.toISOString().slice(0, 16)}
              initialCapacity={event.capacity}
            />
            <EventStatusBadge status={event.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>活動資訊</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">開始：</span><span>{new Date(event.startAt).toLocaleString('zh-TW')}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">結束：</span><span>{new Date(event.endAt).toLocaleString('zh-TW')}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">地點：</span><span>{event.location || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">容量：</span><span>{event.capacity}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">建立時間：</span><span>{new Date(event.createdAt).toLocaleString('zh-TW')}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>描述</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{event.description || '（無描述）'}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}