/**
 * Event Computed: isUpcoming
 */

export function isUpcoming(record: {
  status?: string;
  startAt?: string | Date | null;
}): boolean {
  if (record.status === 'cancelled' || record.status === 'past') return false;
  if (!record.startAt) return false;
  return new Date(record.startAt).getTime() > Date.now();
}