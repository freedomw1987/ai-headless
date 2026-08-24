'use client';

import { ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';

export type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function SearchBar({ value, onChange, placeholder = '搜尋...', className }: SearchBarProps) {
  return (
    <Input
      type="search"
      value={value}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className ?? 'max-w-sm'}
      aria-label="搜尋"
    />
  );
}