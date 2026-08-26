'use client';

/**
 * /admin/roles/[id]/permissions — Client Component (Task 9)
 *
 * 功能:
 * - 顯示 role 詳細資訊 + permissions 矩陣
 * - checkbox 變更立即自動儲存 (debounce + 樂觀更新)
 * - 內建 role 矩陣唯讀
 */

import { useEffect, useState, useTransition, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2 } from 'lucide-react';

// ==============================================
// 內建 permission codes（與 seed-rbac 一致）
// ==============================================

const ALL_PERMISSIONS = [
  { code: 'users:read', label: '讀取用戶', resource: 'Users' },
  { code: 'users:write', label: '編輯用戶', resource: 'Users' },
  { code: 'users:assign', label: '指派角色', resource: 'Users' },
  { code: 'roles:read', label: '讀取角色', resource: 'Roles' },
  { code: 'roles:write', label: '編輯角色', resource: 'Roles' },
] as const;

type Role = {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isSystem: boolean;
  permissions: { id: string; code: string }[];
};

type Props = {
  roleId: string;
};

export function MatrixPageClient({ roleId }: Props) {
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ==============================================
  // 載入 role
  // ==============================================
  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/roles/${roleId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRole(data.data);
      setSelectedCodes(new Set(data.data.permissions.map((p: { code: string }) => p.code)));
    } catch (e) {
      setError(e instanceof Error ? e.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // load() 依賴多個 state,但這些是「一次拉取」語意
  }, [roleId]);

  // ==============================================
  // 自動儲存（debounce 500ms）
  // ==============================================
  const saveMatrix = useCallback(
    async (codes: Set<string>) => {
      setSaving(true);
      try {
        const res = await fetch(`/api/admin/roles/${roleId}/permissions`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permissions: Array.from(codes) }),
        });
        if (!res.ok) {
          const data = await res.json();
          alert(data.error ?? '儲存失敗');
          // rollback
          await load();
          return;
        }
        setLastSavedAt(new Date());
      } catch (err) {
        alert(err instanceof Error ? err.message : '儲存失敗');
        await load();
      } finally {
        setSaving(false);
      }
    },
    [roleId],
  );

  function togglePermission(code: string, checked: boolean) {
    if (!role || role.isSystem) return;

    const newSet = new Set(selectedCodes);
    if (checked) {
      newSet.add(code);
    } else {
      newSet.delete(code);
    }
    setSelectedCodes(newSet);

    // debounce 儲存
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startTransition(() => {
        void saveMatrix(newSet);
      });
    }, 500);
  }

  // ==============================================
  // 渲染
  // ==============================================

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">載入中…</div>
    );
  }

  if (error || !role) {
    return (
      <Card>
        <CardContent className="p-4 text-destructive">
          錯誤:{error ?? 'Role 不存在'}
        </CardContent>
      </Card>
    );
  }

  // 按 resource 分組
  const grouped = ALL_PERMISSIONS.reduce<Record<string, typeof ALL_PERMISSIONS[number][]>>(
    (acc, p) => {
      if (!acc[p.resource]) acc[p.resource] = [];
      acc[p.resource]!.push(p);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/roles">
              <ArrowLeft className="mr-1 h-3 w-3" />
              返回 Roles
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{role.displayName}</h1>
            {role.isSystem && <Badge variant="secondary">系統</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-mono">{role.name}</span>
            {role.description && ` · ${role.description}`}
          </p>
        </div>

        <div className="text-sm text-muted-foreground flex items-center gap-2">
          {saving ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              儲存中…
            </>
          ) : lastSavedAt ? (
            <>已儲存於 {lastSavedAt.toLocaleTimeString('zh-TW')}</>
          ) : (
            '尚未修改'
          )}
        </div>
      </div>

      {role.isSystem && (
        <Card>
          <CardContent className="p-4 text-sm text-amber-600">
            ⚠️ 系統內建 role 的 permissions 矩陣為唯讀（admin 已預設為萬能）
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {Object.entries(grouped).map(([resource, perms]) => (
          <Card key={resource}>
            <CardHeader>
              <CardTitle>{resource}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {perms.map((p) => {
                const checked = selectedCodes.has(p.code);
                return (
                  <label
                    key={p.code}
                    className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={role.isSystem}
                      onChange={(e) => togglePermission(p.code, e.target.checked)}
                      className="h-4 w-4"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{p.label}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {p.code}
                      </div>
                    </div>
                  </label>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}