// Sprint 15 TECH-038 — Event formatter 範例
// 把 datetime 格式化成「2026/08/26 10:00」風格

import type { FormatterFn } from '@/lib/runtime/extension-loaders';

const formatEventTime: FormatterFn = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value as string);
  if (isNaN(date.getTime())) return String(value);

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');

  return `${yyyy}/${mm}/${dd} ${hh}:${mi}`;
};

export default formatEventTime;
