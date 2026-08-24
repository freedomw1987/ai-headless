/**
 * Todo Computed: remainingDays
 *
 * 計算到截止日的剩餘天數：
 * - 已完成：永遠 0
 * - 無 dueDate：null
 * - 過期：負數
 */

export function remainingDays(record: {
  completed?: boolean;
  dueDate?: string | Date | null;
}): number | null {
  if (record.completed) return 0;
  if (!record.dueDate) return null;

  const due = new Date(record.dueDate).getTime();
  const now = Date.now();
  const diffMs = due - now;
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return days;
}