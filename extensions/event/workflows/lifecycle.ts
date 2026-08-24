/**
 * Event Workflow: lifecycle
 *
 * 活動狀態機：upcoming → ongoing → past / cancelled
 *
 * 透過時間或手動觸發：
 * - upcoming --START--> ongoing  (startAt 過期)
 * - ongoing --END--> past       (endAt 過期)
 * - upcoming/ongoing --CANCEL--> cancelled
 */

import type { Workflow } from '@/lib/workflows/workflow-engine';

const eventLifecycle: Workflow = {
  name: 'event.lifecycle',
  initialState: 'upcoming',
  states: {
    upcoming: {
      label: '即將開始',
      description: '活動尚未開始',
      allowedActions: ['START', 'CANCEL'],
    },
    ongoing: {
      label: '進行中',
      description: '活動進行中',
      allowedActions: ['END', 'CANCEL'],
    },
    past: {
      label: '已結束',
      description: '活動已結束',
      allowedActions: [],
    },
    cancelled: {
      label: '已取消',
      description: '活動已取消',
      allowedActions: [],
    },
  },
  transitions: [
    { from: 'upcoming', to: 'ongoing', effect: 'sendStartNotification' },
    { from: 'ongoing', to: 'past', effect: 'sendEndNotification' },
    { from: 'upcoming', to: 'cancelled', effect: 'sendCancellationNotification' },
    { from: 'ongoing', to: 'cancelled', effect: 'sendCancellationNotification' },
  ],
};

export default eventLifecycle;
export { eventLifecycle };