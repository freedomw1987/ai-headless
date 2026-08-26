'use client';

/**
 * RoleSelect — 動態讀取 roles 列表的下拉元件 (Sprint 21 Task 11)
 *
 * 對應 PRD：docs/prd/09-rbac.md §5.3 FR-6.2 + FR-6.3
 *
 * 功能:
 * - 從 /api/admin/roles 動態讀取
 * - 根據當前用戶權限過濾可選 role（editor 看不到 admin）
 * - 載入狀態 + 錯誤處理
 */

import { useEffect, useState } from 'react';

type Role = {
  id: string;
  name: string;
  displayName: string;
  isSystem: boolean;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  currentUserRole?: 'admin' | 'editor' | 'viewer';
  disabled?: boolean;
  id?: string;
};

export function RoleSelect({
  value,
  onChange,
  currentUserRole = 'admin',
  disabled,
  id = 'role',
}: Props) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/roles');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setRoles(data.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : '載入失敗');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  // 過濾：editor 不可指派 admin role（FR-6.3）
  const visibleRoles = roles.filter((r) => {
    if (currentUserRole === 'editor' && r.name === 'admin') return false;
    return true;
  });

  if (loading) {
    return (
      <select
        id={id}
        disabled
        className="w-full rounded border px-3 py-2 bg-background opacity-50"
      >
        <option>載入中…</option>
      </select>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive">
        載入 role 失敗:{error}
      </div>
    );
  }

  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full rounded border px-3 py-2 bg-background"
    >
      {visibleRoles.map((r) => (
        <option key={r.id} value={r.name}>
          {r.displayName} ({r.name}){r.isSystem ? ' [系統]' : ''}
        </option>
      ))}
    </select>
  );
}