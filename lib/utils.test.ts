import { describe, it, expect } from 'vitest';
import { cn, formatDate, safeJsonParse, generateId } from './utils';

describe('cn (className merge)', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conflicts with tailwind-merge', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });
});

describe('formatDate', () => {
  it('formats ISO string', () => {
    const result = formatDate('2026-01-01T10:30:00Z');
    expect(result).toMatch(/2026/);
  });

  it('formats Date object', () => {
    const result = formatDate(new Date('2026-01-01'));
    expect(result).toContain('2026');
  });
});

describe('safeJsonParse', () => {
  it('parses valid JSON', () => {
    expect(safeJsonParse<{ a: number }>('{"a":1}', { a: 0 })).toEqual({ a: 1 });
  });

  it('returns fallback for invalid JSON', () => {
    expect(safeJsonParse('not json', { a: 0 })).toEqual({ a: 0 });
  });
});

describe('generateId', () => {
  it('generates unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('respects prefix', () => {
    const id = generateId('post-');
    expect(id.startsWith('post-')).toBe(true);
  });
});
