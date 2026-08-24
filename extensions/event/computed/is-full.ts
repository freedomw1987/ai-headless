/**
 * Event Computed: isFull
 */

export function isFull(record: {
  capacity?: number;
  status?: string;
  registeredCount?: number;
}): boolean {
  if (record.status === 'cancelled' || record.status === 'past') return false;
  if (!record.capacity || record.capacity === 0) return false; // 不限
  return (record.registeredCount ?? 0) >= record.capacity;
}