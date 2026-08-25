// Event Extension 使用範例
//
// 展示活動管理（US-202）
// 包含簡單狀態管理（upcoming/ongoing/past/cancelled）
//
// 注意：Event 的 workflow 是「自動 computed 欄位」而非 state machine
// `EventStatus` 根據 startDate/endDate 自動計算，不需手動 transition

import {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  cancelEvent,
  deleteEvent,
} from '../workflow/event-workflow';

export async function exampleCreateEvent() {
  return await createEvent({
    title: 'AI 工作坊',
    description: '深入探討 LLM 應用',
    startAt: new Date('2026-09-15T10:00:00'),
    endAt: new Date('2026-09-15T17:00:00'),
    location: '台北市信義區',
    capacity: 30,
  });
}

export async function exampleListUpcoming() {
  const events = await listEvents();
  const now = new Date();
  return events.filter((e) => {
    const status = e.status; // 自動計算的欄位
    return status === 'upcoming' || status === 'ongoing';
  });
}

export async function exampleCancelAndRestore(eventId: string) {
  // 取消（軟標記 cancelled status）
  await cancelEvent(eventId);

  // 恢復（直接 update status）
  await updateEvent(eventId, {
    // EventStatus 由 computed 計算，但 update 可覆蓋
    // 或重新設置 startAt 讓它回到 upcoming
    startAt: new Date('2027-01-01'),
  });
}

export async function exampleDelete(eventId: string) {
  // 硬刪除（注意：cancelled 活動通常用軟刪除而非硬刪）
  await deleteEvent(eventId);
}