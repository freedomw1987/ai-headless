/**
 * Event Computed: availableSeats
 *
 * 計算剩餘名額：
 * - capacity = 0：不限 → 返回 -1
 * - 已取消/過期：返回 0
 * - 否則：capacity - registeredCount
 */

export function availableSeats(record: {
  capacity?: number;
  status?: string;
  registeredCount?: number;
}): number {
  if (record.status === 'cancelled' || record.status === 'past') return 0;
  if (!record.capacity || record.capacity === 0) return -1; // 不限
  return Math.max(0, record.capacity - (record.registeredCount ?? 0));
}