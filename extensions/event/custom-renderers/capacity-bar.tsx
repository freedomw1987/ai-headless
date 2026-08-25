// Sprint 15 TECH-038 — Event customRenderer 範例
// 顯示「已報名 / 容量」進度條

'use client';

import type { CustomRendererComponent } from '@/lib/runtime/extension-loaders';

const renderCapacityBar: CustomRendererComponent = ({ record }) => {
  const capacity = Number(record?.capacity ?? 0);
  const registered = Number(record?.availableSeats !== undefined
    ? capacity - Number(record.availableSeats)
    : 0);

  if (capacity === 0) {
    return <span className="text-gray-400">無上限</span>;
  }

  const percent = Math.min(100, Math.round((registered / capacity) * 100));
  const isFull = registered >= capacity;

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
        <div
          className={isFull ? 'h-full bg-red-500' : 'h-full bg-blue-500'}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs text-gray-600 whitespace-nowrap">
        {registered}/{capacity}
      </span>
    </div>
  );
};

export default renderCapacityBar;
